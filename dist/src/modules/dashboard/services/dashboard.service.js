"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
// src/modules/dashboard/services/dashboard.service.ts
const mongoose_1 = require("mongoose");
const job_model_1 = require("../../job/model/job.model");
const invoice_model_1 = require("../../invoice/model/invoice.model");
const customer_model_1 = require("../../customer/model/customer.model");
const user_model_1 = require("../../user/model/user.model");
const constants_1 = require("../../../common/constants");
exports.DashboardService = {
    /**
     * Get Master Admin Dashboard
     */
    async getMasterAdminDashboard(franchiseId) {
        const filter = { isDeleted: false };
        // If franchiseId is provided, filter by that franchise
        if (franchiseId && mongoose_1.Types.ObjectId.isValid(franchiseId)) {
            filter.franchiseId = new mongoose_1.Types.ObjectId(franchiseId);
        }
        // Get date ranges
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        // Overview
        const [totalJobs, totalCustomers, totalFranchises, totalRevenueResult] = await Promise.all([
            job_model_1.JobModel.countDocuments(filter),
            customer_model_1.CustomerModel.countDocuments(filter),
            franchiseId ? 1 : user_model_1.UserModel.countDocuments({ role: constants_1.ROLES.FRANCHISE_ADMIN, isDeleted: false }),
            invoice_model_1.InvoiceModel.aggregate([
                { $match: filter },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
        ]);
        const overview = {
            totalJobs,
            totalCustomers,
            totalRevenue: totalRevenueResult[0]?.total || 0,
            totalFranchises: franchiseId ? undefined : totalFranchises,
        };
        // Job Statistics
        const jobs = await this.getJobStatistics(filter, startOfMonth, endOfMonth);
        // Invoice Statistics
        const invoices = await this.getInvoiceStatistics(filter, startOfMonth, endOfMonth);
        // Customer Statistics
        const customers = await this.getCustomerStatistics(filter, startOfMonth, endOfMonth);
        // Recent Activities
        const recentActivities = await this.getRecentActivities(filter);
        // Franchise Performance (only if not filtering by specific franchise)
        let franchisePerformance;
        if (!franchiseId) {
            franchisePerformance = await this.getFranchisePerformance();
        }
        return {
            overview,
            jobs,
            invoices,
            customers,
            recentActivities,
            franchisePerformance,
        };
    },
    /**
     * Get Franchise Admin Dashboard
     */
    async getFranchiseAdminDashboard(franchiseId) {
        if (!mongoose_1.Types.ObjectId.isValid(franchiseId)) {
            throw new Error('Invalid franchise ID');
        }
        const franchiseObjectId = new mongoose_1.Types.ObjectId(franchiseId);
        const filter = { isDeleted: false, franchiseId: franchiseObjectId };
        // Get date ranges
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        // Count staff
        const totalStaff = await user_model_1.UserModel.countDocuments({
            parentId: franchiseObjectId,
            isDeleted: false,
        });
        // Overview
        const [totalJobs, totalCustomers, totalRevenueResult] = await Promise.all([
            job_model_1.JobModel.countDocuments(filter),
            customer_model_1.CustomerModel.countDocuments(filter),
            invoice_model_1.InvoiceModel.aggregate([
                { $match: filter },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
        ]);
        const overview = {
            totalJobs,
            totalCustomers,
            totalRevenue: totalRevenueResult[0]?.total || 0,
            totalStaff,
        };
        // Job Statistics
        const jobs = await this.getJobStatistics(filter, startOfMonth, endOfMonth);
        // Invoice Statistics
        const invoices = await this.getInvoiceStatistics(filter, startOfMonth, endOfMonth);
        // Customer Statistics
        const customers = await this.getCustomerStatistics(filter, startOfMonth, endOfMonth);
        // Recent Activities
        const recentActivities = await this.getRecentActivities(filter);
        // Staff Performance
        const staffPerformance = await this.getStaffPerformance(franchiseObjectId);
        return {
            overview,
            jobs,
            invoices,
            customers,
            recentActivities,
            staffPerformance,
        };
    },
    /**
     * Get Job Statistics
     */
    async getJobStatistics(filter, startOfMonth, endOfMonth) {
        const [pending, inProgress, completed, overdue, cancelled, completedThisMonth, totalThisMonth] = await Promise.all([
            job_model_1.JobModel.countDocuments({ ...filter, status: constants_1.JOB_STATUS.PENDING }),
            job_model_1.JobModel.countDocuments({ ...filter, status: constants_1.JOB_STATUS.IN_PROGRESS }),
            job_model_1.JobModel.countDocuments({ ...filter, status: constants_1.JOB_STATUS.COMPLETED }),
            job_model_1.JobModel.countDocuments({ ...filter, status: constants_1.JOB_STATUS.OVERDUE }),
            job_model_1.JobModel.countDocuments({ ...filter, status: constants_1.JOB_STATUS.CANCELLED }),
            job_model_1.JobModel.countDocuments({
                ...filter,
                status: constants_1.JOB_STATUS.COMPLETED,
                completionDate: { $gte: startOfMonth, $lte: endOfMonth },
            }),
            job_model_1.JobModel.countDocuments({
                ...filter,
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            }),
        ]);
        return {
            pending,
            inProgress,
            completed,
            overdue,
            cancelled,
            completedThisMonth,
            totalThisMonth,
        };
    },
    /**
     * Get Invoice Statistics
     */
    async getInvoiceStatistics(filter, startOfMonth, endOfMonth) {
        const [total, paid, unpaid, partial, cancelled, revenueThisMonthResult, totalRevenueResult] = await Promise.all([
            invoice_model_1.InvoiceModel.countDocuments(filter),
            invoice_model_1.InvoiceModel.countDocuments({ ...filter, status: constants_1.INVOICE_STATUS.PAID }),
            invoice_model_1.InvoiceModel.countDocuments({ ...filter, status: constants_1.INVOICE_STATUS.UNPAID }),
            invoice_model_1.InvoiceModel.countDocuments({ ...filter, status: constants_1.INVOICE_STATUS.PARTIAL }),
            invoice_model_1.InvoiceModel.countDocuments({ ...filter, status: constants_1.INVOICE_STATUS.CANCELLED }),
            invoice_model_1.InvoiceModel.aggregate([
                {
                    $match: {
                        ...filter,
                        issuedDate: { $gte: startOfMonth, $lte: endOfMonth },
                    },
                },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
            invoice_model_1.InvoiceModel.aggregate([
                { $match: filter },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
        ]);
        return {
            total,
            paid,
            unpaid,
            partial,
            cancelled,
            revenueThisMonth: revenueThisMonthResult[0]?.total || 0,
            totalRevenue: totalRevenueResult[0]?.total || 0,
        };
    },
    /**
     * Get Customer Statistics
     */
    async getCustomerStatistics(filter, startOfMonth, endOfMonth) {
        const [total, newThisMonth, activeCustomerIds] = await Promise.all([
            customer_model_1.CustomerModel.countDocuments(filter),
            customer_model_1.CustomerModel.countDocuments({
                ...filter,
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            }),
            job_model_1.JobModel.distinct('customerId', filter),
        ]);
        return {
            total,
            newThisMonth,
            active: activeCustomerIds.length,
        };
    },
    /**
     * Get Recent Activities
     */
    async getRecentActivities(filter) {
        const [recentJobs, recentInvoices, recentCustomers] = await Promise.all([
            job_model_1.JobModel.find(filter)
                .populate('customerId', 'name')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            invoice_model_1.InvoiceModel.find(filter)
                .populate('customerId', 'name')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            customer_model_1.CustomerModel.find(filter)
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
        ]);
        return {
            jobs: recentJobs.map((job) => ({
                id: job._id.toString(),
                jobNumber: job.jobNumber,
                customerName: job.customerId?.name || 'Unknown',
                jobAddress: job.jobAddress,
                status: job.status,
                amount: job.amount || 0,
                jobDate: job.jobDate,
                createdAt: job.createdAt,
            })),
            invoices: recentInvoices.map((invoice) => ({
                id: invoice._id.toString(),
                invoiceNumber: invoice.invoiceNumber || `INV-${invoice._id}`,
                customerName: invoice.customerId?.name || 'Unknown',
                totalAmount: invoice.totalAmount || 0,
                paidAmount: invoice.paidAmount || 0,
                status: invoice.status,
                issuedDate: invoice.issuedDate,
            })),
            customers: recentCustomers.map((customer) => ({
                id: customer._id.toString(),
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                createdAt: customer.createdAt,
            })),
        };
    },
    /**
     * Get Franchise Performance (Master Admin only)
     */
    async getFranchisePerformance() {
        const franchises = await user_model_1.UserModel.find({
            role: constants_1.ROLES.FRANCHISE_ADMIN,
            isDeleted: false,
        })
            .select('_id name email')
            .lean();
        const performanceData = await Promise.all(franchises.map(async (franchise) => {
            const franchiseId = franchise._id;
            const [revenueResult, jobCount, completedJobs] = await Promise.all([
                invoice_model_1.InvoiceModel.aggregate([
                    { $match: { franchiseId, isDeleted: false } },
                    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
                ]),
                job_model_1.JobModel.countDocuments({ franchiseId, isDeleted: false }),
                job_model_1.JobModel.countDocuments({ franchiseId, isDeleted: false, status: constants_1.JOB_STATUS.COMPLETED }),
            ]);
            const revenue = revenueResult[0]?.total || 0;
            const completionRate = jobCount > 0 ? (completedJobs / jobCount) * 100 : 0;
            return {
                franchiseId: franchiseId.toString(),
                franchiseName: franchise.name,
                revenue,
                jobCount,
                completionRate: Math.round(completionRate * 100) / 100,
            };
        }));
        // Sort by revenue descending
        return performanceData.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    },
    /**
     * Get Staff Performance (Franchise Admin only)
     */
    async getStaffPerformance(franchiseId) {
        const staff = await user_model_1.UserModel.find({
            parentId: franchiseId,
            isDeleted: false,
        })
            .select('_id name balance')
            .lean();
        const performanceData = await Promise.all(staff.map(async (staffMember) => {
            const jobsCompleted = await job_model_1.JobModel.countDocuments({
                completedBy: staffMember._id,
                status: constants_1.JOB_STATUS.COMPLETED,
                isDeleted: false,
            });
            return {
                staffId: staffMember._id.toString(),
                staffName: staffMember.name,
                jobsCompleted,
                walletBalance: staffMember.balance || 0,
            };
        }));
        // Sort by jobs completed descending
        return performanceData.sort((a, b) => b.jobsCompleted - a.jobsCompleted);
    },
};
//# sourceMappingURL=dashboard.service.js.map