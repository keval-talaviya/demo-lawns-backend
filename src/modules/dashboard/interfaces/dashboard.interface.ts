// src/modules/dashboard/interfaces/dashboard.interface.ts

export interface DashboardOverview {
    totalJobs: number;
    totalCustomers: number;
    totalRevenue: number;
    totalFranchises?: number; // Master Admin only
    totalStaff?: number; // Franchise Admin only
}

export interface JobStatistics {
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    cancelled: number;
    completedThisMonth: number;
    totalThisMonth: number;
}

export interface InvoiceStatistics {
    total: number;
    paid: number;
    unpaid: number;
    partial: number;
    cancelled: number;
    revenueThisMonth: number;
    totalRevenue: number;
}

export interface CustomerStatistics {
    total: number;
    newThisMonth: number;
    active: number;
}

export interface RecentJob {
    id: string;
    jobNumber?: string;
    customerName: string;
    jobAddress?: string;
    status: number;
    amount: number;
    jobDate?: Date;
    createdAt: Date;
}

export interface RecentInvoice {
    id: string;
    invoiceNumber: string;
    customerName: string;
    totalAmount: number;
    paidAmount: number;
    status: number;
    issuedDate: Date;
}

export interface RecentCustomer {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    createdAt: Date;
}

export interface RecentActivities {
    jobs: RecentJob[];
    invoices: RecentInvoice[];
    customers: RecentCustomer[];
}

export interface FranchisePerformance {
    franchiseId: string;
    franchiseName: string;
    revenue: number;
    jobCount: number;
    completionRate: number;
}

export interface StaffPerformance {
    staffId: string;
    staffName: string;
    jobsCompleted: number;
    walletBalance: number;
}

export interface DashboardData {
    overview: DashboardOverview;
    jobs: JobStatistics;
    invoices: InvoiceStatistics;
    customers: CustomerStatistics;
    recentActivities: RecentActivities;
    franchisePerformance?: FranchisePerformance[]; // Master Admin only
    staffPerformance?: StaffPerformance[]; // Franchise Admin only
}
