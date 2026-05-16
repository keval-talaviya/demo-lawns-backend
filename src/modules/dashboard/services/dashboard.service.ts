// src/modules/dashboard/services/dashboard.service.ts
import { Types } from 'mongoose';
import { JobModel } from '../../job/model/job.model';
import { InvoiceModel } from '../../invoice/model/invoice.model';
import { CustomerModel } from '../../customer/model/customer.model';
import { UserModel } from '../../user/model/user.model';
import { JOB_STATUS, INVOICE_STATUS, ROLES } from '../../../common/constants';
import {
    DashboardData,
    DashboardOverview,
    JobStatistics,
    InvoiceStatistics,
    CustomerStatistics,
    RecentActivities,
    FranchisePerformance,
    StaffPerformance,
} from '../interfaces/dashboard.interface';

export const DashboardService = {
    /**
     * Get Master Admin Dashboard
     */
    async getMasterAdminDashboard(franchiseId?: string): Promise<DashboardData> {
        const filter: any = { isDeleted: false };

        // If franchiseId is provided, filter by that franchise
        if (franchiseId && Types.ObjectId.isValid(franchiseId)) {
            filter.franchiseId = new Types.ObjectId(franchiseId);
        }

        // Get date ranges
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Overview
        const [totalJobs, totalCustomers, totalFranchises, totalRevenueResult] = await Promise.all([
            JobModel.countDocuments(filter),
            CustomerModel.countDocuments(filter),
            franchiseId ? 1 : UserModel.countDocuments({ role: ROLES.FRANCHISE_ADMIN, isDeleted: false }),
            InvoiceModel.aggregate([
                { $match: filter },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
        ]);

        const overview: DashboardOverview = {
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
        let franchisePerformance: FranchisePerformance[] | undefined;
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
    async getFranchiseAdminDashboard(franchiseId: string): Promise<DashboardData> {
        if (!Types.ObjectId.isValid(franchiseId)) {
            throw new Error('Invalid franchise ID');
        }

        const franchiseObjectId = new Types.ObjectId(franchiseId);
        const filter: any = { isDeleted: false, franchiseId: franchiseObjectId };

        // Get date ranges
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Count staff
        const totalStaff = await UserModel.countDocuments({
            parentId: franchiseObjectId,
            isDeleted: false,
        });

        // Overview
        const [totalJobs, totalCustomers, totalRevenueResult] = await Promise.all([
            JobModel.countDocuments(filter),
            CustomerModel.countDocuments(filter),
            InvoiceModel.aggregate([
                { $match: filter },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
        ]);

        const overview: DashboardOverview = {
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
    async getJobStatistics(filter: any, startOfMonth: Date, endOfMonth: Date): Promise<JobStatistics> {
        const [pending, inProgress, completed, overdue, cancelled, completedThisMonth, totalThisMonth] = await Promise.all([
            JobModel.countDocuments({ ...filter, status: JOB_STATUS.PENDING }),
            JobModel.countDocuments({ ...filter, status: JOB_STATUS.IN_PROGRESS }),
            JobModel.countDocuments({ ...filter, status: JOB_STATUS.COMPLETED }),
            JobModel.countDocuments({ ...filter, status: JOB_STATUS.OVERDUE }),
            JobModel.countDocuments({ ...filter, status: JOB_STATUS.CANCELLED }),
            JobModel.countDocuments({
                ...filter,
                status: JOB_STATUS.COMPLETED,
                completionDate: { $gte: startOfMonth, $lte: endOfMonth },
            }),
            JobModel.countDocuments({
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
    async getInvoiceStatistics(filter: any, startOfMonth: Date, endOfMonth: Date): Promise<InvoiceStatistics> {
        const [total, paid, unpaid, partial, cancelled, revenueThisMonthResult, totalRevenueResult] = await Promise.all([
            InvoiceModel.countDocuments(filter),
            InvoiceModel.countDocuments({ ...filter, status: INVOICE_STATUS.PAID }),
            InvoiceModel.countDocuments({ ...filter, status: INVOICE_STATUS.UNPAID }),
            InvoiceModel.countDocuments({ ...filter, status: INVOICE_STATUS.PARTIAL }),
            InvoiceModel.countDocuments({ ...filter, status: INVOICE_STATUS.CANCELLED }),
            InvoiceModel.aggregate([
                {
                    $match: {
                        ...filter,
                        issuedDate: { $gte: startOfMonth, $lte: endOfMonth },
                    },
                },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
            InvoiceModel.aggregate([
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
    async getCustomerStatistics(filter: any, startOfMonth: Date, endOfMonth: Date): Promise<CustomerStatistics> {
        const [total, newThisMonth, activeCustomerIds] = await Promise.all([
            CustomerModel.countDocuments(filter),
            CustomerModel.countDocuments({
                ...filter,
                createdAt: { $gte: startOfMonth, $lte: endOfMonth },
            }),
            JobModel.distinct('customerId', filter),
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
    async getRecentActivities(filter: any): Promise<RecentActivities> {
        const [recentJobs, recentInvoices, recentCustomers] = await Promise.all([
            JobModel.find(filter)
                .populate('customerId', 'name')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            InvoiceModel.find(filter)
                .populate('customerId', 'name')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            CustomerModel.find(filter)
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
        ]);

        return {
            jobs: recentJobs.map((job: any) => ({
                id: job._id.toString(),
                jobNumber: job.jobNumber,
                customerName: job.customerId?.name || 'Unknown',
                jobAddress: job.jobAddress,
                status: job.status,
                amount: job.amount || 0,
                jobDate: job.jobDate,
                createdAt: job.createdAt,
            })),
            invoices: recentInvoices.map((invoice: any) => ({
                id: invoice._id.toString(),
                invoiceNumber: invoice.invoiceNumber || `INV-${invoice._id}`,
                customerName: invoice.customerId?.name || 'Unknown',
                totalAmount: invoice.totalAmount || 0,
                paidAmount: invoice.paidAmount || 0,
                status: invoice.status,
                issuedDate: invoice.issuedDate,
            })),
            customers: recentCustomers.map((customer: any) => ({
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
    async getFranchisePerformance(): Promise<FranchisePerformance[]> {
        const franchises = await UserModel.find({
            role: ROLES.FRANCHISE_ADMIN,
            isDeleted: false,
        })
            .select('_id name email')
            .lean();

        const performanceData = await Promise.all(
            franchises.map(async (franchise: any) => {
                const franchiseId = franchise._id;

                const [revenueResult, jobCount, completedJobs] = await Promise.all([
                    InvoiceModel.aggregate([
                        { $match: { franchiseId, isDeleted: false } },
                        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
                    ]),
                    JobModel.countDocuments({ franchiseId, isDeleted: false }),
                    JobModel.countDocuments({ franchiseId, isDeleted: false, status: JOB_STATUS.COMPLETED }),
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
            })
        );

        // Sort by revenue descending
        return performanceData.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    },

    /**
     * Get Staff Performance (Franchise Admin only)
     */
    async getStaffPerformance(franchiseId: Types.ObjectId): Promise<StaffPerformance[]> {
        const staff = await UserModel.find({
            parentId: franchiseId,
            isDeleted: false,
        })
            .select('_id name balance')
            .lean();

        const performanceData = await Promise.all(
            staff.map(async (staffMember: any) => {
                const jobsCompleted = await JobModel.countDocuments({
                    completedBy: staffMember._id,
                    status: JOB_STATUS.COMPLETED,
                    isDeleted: false,
                });

                return {
                    staffId: staffMember._id.toString(),
                    staffName: staffMember.name,
                    jobsCompleted,
                    walletBalance: staffMember.balance || 0,
                };
            })
        );

        // Sort by jobs completed descending
        return performanceData.sort((a, b) => b.jobsCompleted - a.jobsCompleted);
    },
};
