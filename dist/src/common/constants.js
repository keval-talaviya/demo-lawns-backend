"use strict";
// ===============================
// 📘 AB Lawas - Constants (Numeric)
// Author: Keval Patel
// ===============================
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVICE_LIST = exports.MODULES = exports.PERMISSIONS = exports.DEFAULT_PAGINATION = exports.REPORT_TYPE = exports.INVOICE_STATUS = exports.TRANSACTION_TYPE = exports.PAYMENT_MODE = exports.JOB_SCHEDULE_STATUS = exports.PAYMENT_TYPE = exports.FREQUENCY_UNIT = exports.JOB_TYPE = exports.JOB_STATUS = exports.QUOTATION_STATUS = exports.USER_STATUS = exports.ROLES = void 0;
// User Role Enum
exports.ROLES = {
    MASTER_ADMIN: 1, // master_admin
    FRANCHISE_ADMIN: 2, // franchise_admin
    STAFF: 3, // staff
};
// User Status Enum
exports.USER_STATUS = {
    ACTIVE: 1,
    INACTIVE: 2,
};
// Quotation Status Enum
exports.QUOTATION_STATUS = {
    DRAFT: 1,
    SENT: 2,
    APPROVED: 3,
    REJECTED: 4,
};
// Job Status Enum
exports.JOB_STATUS = {
    PENDING: 1,
    IN_PROGRESS: 2,
    COMPLETED: 3,
    CANCELLED: 4,
    OVERDUE: 5,
};
// Job Type Enum
exports.JOB_TYPE = {
    ONE_TIME: 1,
    RECURRING: 2,
};
// Frequency Unit Enum
exports.FREQUENCY_UNIT = {
    DAYS: 1,
    WEEKS: 2,
    MONTHS: 3,
    YEARS: 4,
};
// Payment Type Enum
exports.PAYMENT_TYPE = {
    BANK_TRANSFER: 1,
    CASH: 2,
    DROP_INVOICE: 3,
};
// Job Schedule Status Enum
exports.JOB_SCHEDULE_STATUS = {
    SCHEDULED: 1,
    COMPLETED: 2,
    CANCELLED: 3,
};
// Payment Mode Enum
exports.PAYMENT_MODE = {
    CASH: 1,
    UPI: 2,
    BANK: 3,
    OTHER: 4,
};
// Transaction Type Enum
exports.TRANSACTION_TYPE = {
    WITHDRAW: 1,
    DEPOSIT: 2,
};
// Invoice Status Enum
exports.INVOICE_STATUS = {
    UNPAID: 1,
    PARTIAL: 2,
    PAID: 3,
    CANCELLED: 4,
    OVERDUE: 5,
};
// Report Type Enum
exports.REPORT_TYPE = {
    DAILY: 1,
    MONTHLY: 2,
    YEARLY: 3,
};
exports.DEFAULT_PAGINATION = {
    page: 1,
    limit: 25,
};
exports.PERMISSIONS = {
    VIEW: 'view',
    CREATE: 'create',
    EDIT: 'edit',
    DELETE: 'delete',
};
exports.MODULES = {
    FRANCHISE: 'franchise',
    CUSTOMER: 'customer',
    QUOTATION: 'quotation',
    JOB: 'job',
    JOB_SCHEDULE: 'job_schedule',
    INVOICE: 'invoice',
    REPORT: 'report',
    USER: 'user',
    SERVICES: 'services',
};
// Public service list used for dropdowns and the inquiry form
exports.SERVICE_LIST = [
    { id: 'lawn_mowing', label: 'Lawn Mowing' },
    { id: 'garden_maintenance', label: 'Garden Maintenance' },
    { id: 'hedge_trimming', label: 'Hedge Trimming' },
    { id: 'fertilization_weed_control', label: 'Fertilization & Weed Control' },
    { id: 'landscape_design', label: 'Landscape Design' },
    { id: 'seasonal_cleanup', label: 'Seasonal Cleanup' },
    { id: 'other', label: 'Other' },
];
//# sourceMappingURL=constants.js.map