import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { JobModel } from '../model/job.model';
import { CustomerModel } from '../../customer/model/customer.model';
import { UserModel } from '../../user/model/user.model';
import { JobService } from '../services/job.service';
import { JOB_STATUS, PAYMENT_TYPE, ROLES } from '../../../common/constants';

let mongoServer: MongoMemoryServer;

// ── Shared seed data ──────────────────────────────────────────────────────
let masterAdminId: Types.ObjectId;
let franchiseUserId: Types.ObjectId;
let existingCustomerId: Types.ObjectId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    // Seed a franchise user (role 2)
    const franchiseUser = await UserModel.create({
        name: 'Test Franchise',
        email: 'franchise@test.com',
        password: 'hashedPassword123',
        role: ROLES.FRANCHISE_ADMIN,
        isFranchise: true,
    });
    franchiseUserId = franchiseUser._id as Types.ObjectId;

    // Seed a master-admin user (role 1)
    const masterAdmin = await UserModel.create({
        name: 'Master Admin',
        email: 'admin@test.com',
        password: 'hashedPassword123',
        role: ROLES.MASTER_ADMIN,
    });
    masterAdminId = masterAdmin._id as Types.ObjectId;

    // Seed an existing customer that belongs to the franchise
    const existingCustomer = await CustomerModel.create({
        name: 'Existing Customer',
        email: 'customer@test.com',
        phone: '1234567890',
        address: '123 Customer Street',
        franchiseId: franchiseUserId,
    });
    existingCustomerId = existingCustomer._id as Types.ObjectId;
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await JobModel.deleteMany({});
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 1: Existing Customer – franchiseId auto-populated
// ═══════════════════════════════════════════════════════════════════════════
describe('Job Creation – Existing Customer', () => {
    it('should auto-set franchiseId from customer when franchiseId is NOT provided', async () => {
        // Simulates: Master Admin picks a customer from dropdown but does NOT
        // explicitly select a franchise.
        const payload = {
            customerId: existingCustomerId.toString(),
            jobDate: new Date(),
            amount: 100,
            paymentType: PAYMENT_TYPE.CASH,
            items: [{ name: 'Lawn Mowing', price: 100, quantity: 1, unitPrice: 100 }],
            // franchiseId is intentionally MISSING
        };

        const job = await JobService.createJob(payload);

        expect(job).toBeDefined();
        expect(job.franchiseId).toBeDefined();
        expect(job.franchiseId!.toString()).toBe(franchiseUserId.toString());
        expect(job.customerId!.toString()).toBe(existingCustomerId.toString());
    });

    it('should use the explicitly provided franchiseId (not override from customer)', async () => {
        // Simulates: Master Admin picks a customer AND explicitly selects a
        // different franchise from the dropdown.
        const anotherFranchise = await UserModel.create({
            name: 'Another Franchise',
            email: 'another@test.com',
            password: 'hashedPassword123',
            role: ROLES.FRANCHISE_ADMIN,
            isFranchise: true,
        });

        const payload = {
            customerId: existingCustomerId.toString(),
            franchiseId: anotherFranchise._id as Types.ObjectId,
            jobDate: new Date(),
            amount: 200,
            paymentType: PAYMENT_TYPE.CASH,
            items: [{ name: 'Hedge Trimming', price: 200, quantity: 1, unitPrice: 200 }],
        };

        const job = await JobService.createJob(payload);

        expect(job).toBeDefined();
        // Should keep the explicitly provided franchiseId, NOT replace with customer's
        expect(job.franchiseId!.toString()).toBe(anotherFranchise._id!.toString());
    });

    it('should auto-populate jobAddress from customer when not provided', async () => {
        const payload = {
            customerId: existingCustomerId.toString(),
            franchiseId: franchiseUserId,
            jobDate: new Date(),
            amount: 50,
            paymentType: PAYMENT_TYPE.CASH,
            items: [{ name: 'Weeding', price: 50, quantity: 1, unitPrice: 50 }],
            // jobAddress intentionally MISSING
        };

        const job = await JobService.createJob(payload);

        expect(job).toBeDefined();
        expect(job.jobAddress).toBe('123 Customer Street');
    });

    it('should keep user-provided jobAddress and not override from customer', async () => {
        const payload = {
            customerId: existingCustomerId.toString(),
            franchiseId: franchiseUserId,
            jobDate: new Date(),
            amount: 75,
            paymentType: PAYMENT_TYPE.CASH,
            items: [{ name: 'Fertilization', price: 75, quantity: 1, unitPrice: 75 }],
            jobAddress: '456 Job Site Avenue',
        };

        const job = await JobService.createJob(payload);

        expect(job).toBeDefined();
        expect(job.jobAddress).toBe('456 Job Site Avenue');
    });

    it('should auto-populate BOTH franchiseId and jobAddress when neither is provided', async () => {
        const payload = {
            customerId: existingCustomerId.toString(),
            jobDate: new Date(),
            amount: 120,
            paymentType: PAYMENT_TYPE.CASH,
            items: [{ name: 'Full Service', price: 120, quantity: 1, unitPrice: 120 }],
            // Both franchiseId and jobAddress intentionally MISSING
        };

        const job = await JobService.createJob(payload);

        expect(job).toBeDefined();
        expect(job.franchiseId!.toString()).toBe(franchiseUserId.toString());
        expect(job.jobAddress).toBe('123 Customer Street');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 2: New Customer – franchiseId passed directly in payload
// ═══════════════════════════════════════════════════════════════════════════
describe('Job Creation – New Customer (inline creation)', () => {
    it('should save job with franchiseId when creating with a brand-new customer', async () => {
        // Simulates: Franchise Admin creates a new customer inline while creating a job.
        // The controller sets franchiseId = logged-in franchise user's ID.
        const newCustomer = await CustomerModel.create({
            name: 'Brand New Customer',
            email: 'newcust@test.com',
            phone: '9876543210',
            address: '789 New Street',
            franchiseId: franchiseUserId,
        });

        const payload = {
            customerId: newCustomer._id as Types.ObjectId,
            franchiseId: franchiseUserId,          // controller sets this for FRANCHISE_ADMIN
            assignedTo: franchiseUserId,            // controller defaults this
            jobDate: new Date(),
            amount: 150,
            paymentType: PAYMENT_TYPE.BANK_TRANSFER,
            items: [{ name: 'Garden Design', price: 150, quantity: 1, unitPrice: 150 }],
        };

        const job = await JobService.createJob(payload);

        expect(job).toBeDefined();
        expect(job.franchiseId!.toString()).toBe(franchiseUserId.toString());
        expect(job.customerId!.toString()).toBe(newCustomer._id!.toString());
        expect(job.assignedTo!.toString()).toBe(franchiseUserId.toString());
    });

    it('should save job with franchiseId when Master Admin creates job with new customer', async () => {
        // Simulates: Master Admin creates a new customer inline and selects a franchise.
        const newCustomer = await CustomerModel.create({
            name: 'Admin Created Customer',
            email: 'admincust@test.com',
            phone: '5551234567',
            address: '321 Admin Blvd',
            franchiseId: franchiseUserId,
        });

        const payload = {
            customerId: newCustomer._id as Types.ObjectId,
            franchiseId: franchiseUserId,          // Master Admin explicitly selected franchise
            createdBy: masterAdminId,
            jobDate: new Date(),
            amount: 300,
            paymentType: PAYMENT_TYPE.CASH,
            items: [{ name: 'Landscape Package', price: 300, quantity: 1, unitPrice: 300 }],
        };

        const job = await JobService.createJob(payload);

        expect(job).toBeDefined();
        expect(job.franchiseId!.toString()).toBe(franchiseUserId.toString());
        expect(job.createdBy!.toString()).toBe(masterAdminId.toString());
    });

    it('should auto-populate franchiseId from new customer when Master Admin forgets to select franchise', async () => {
        // Simulates: Master Admin creates a new customer inline but does NOT
        // select a franchise from dropdown – the customer is linked to a franchise though.
        const newCustomer = await CustomerModel.create({
            name: 'Forgot Franchise Customer',
            email: 'forgot@test.com',
            phone: '5559999999',
            address: '999 Forgot Lane',
            franchiseId: franchiseUserId,
        });

        const payload = {
            customerId: newCustomer._id as Types.ObjectId,
            // franchiseId is NULL – Master Admin didn't select it
            createdBy: masterAdminId,
            jobDate: new Date(),
            amount: 80,
            paymentType: PAYMENT_TYPE.DROP_INVOICE,
            items: [{ name: 'Seasonal Cleanup', price: 80, quantity: 1, unitPrice: 80 }],
        };

        const job = await JobService.createJob(payload);

        expect(job).toBeDefined();
        // Should auto-populate from the new customer's franchiseId
        expect(job.franchiseId!.toString()).toBe(franchiseUserId.toString());
        expect(job.jobAddress).toBe('999 Forgot Lane');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// TEST SUITE 3: Edge Cases
// ═══════════════════════════════════════════════════════════════════════════
describe('Job Creation – Edge Cases', () => {
    it('should remove invalid (non-ObjectId) franchiseId from payload', async () => {
        // If somehow an invalid string gets through
        const payload = {
            customerId: existingCustomerId.toString(),
            franchiseId: 'not-a-valid-objectid',
            jobDate: new Date(),
            amount: 50,
            paymentType: PAYMENT_TYPE.CASH,
            items: [{ name: 'Basic Mow', price: 50, quantity: 1, unitPrice: 50 }],
        };

        const job = await JobService.createJob(payload);

        expect(job).toBeDefined();
        // The invalid franchiseId should be deleted, and then auto-populated from customer
        expect(job.franchiseId!.toString()).toBe(franchiseUserId.toString());
    });

    it('should default job status to PENDING', async () => {
        const payload = {
            customerId: existingCustomerId.toString(),
            franchiseId: franchiseUserId,
            jobDate: new Date(),
            amount: 60,
            paymentType: PAYMENT_TYPE.CASH,
            items: [{ name: 'Trim', price: 60, quantity: 1, unitPrice: 60 }],
        };

        const job = await JobService.createJob(payload);

        expect(job).toBeDefined();
        expect(job.status).toBe(JOB_STATUS.PENDING);
    });
});
