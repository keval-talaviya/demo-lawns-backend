// ===============================
// 📘 AB Lawas - Constants (Numeric)
// Author: Keval Patel
// ===============================

// User Role Enum
export const ROLES = {
  MASTER_ADMIN: 1, // master_admin
  FRANCHISE_ADMIN: 2, // franchise_admin
  STAFF: 3, // staff
} as const;

// User Status Enum
export const USER_STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
} as const;

// Quotation Status Enum
export const QUOTATION_STATUS = {
  DRAFT: 1,
  SENT: 2,
  APPROVED: 3,
  REJECTED: 4,
} as const;

export type QuotationStatus = (typeof QUOTATION_STATUS)[keyof typeof QUOTATION_STATUS];
// Job Status Enum
export const JOB_STATUS = {
  PENDING: 1,
  IN_PROGRESS: 2,
  COMPLETED: 3,
  CANCELLED: 4,
  OVERDUE: 5,
} as const;

// Job Type Enum
export const JOB_TYPE = {
  ONE_TIME: 1,
  RECURRING: 2,
} as const;

// Frequency Unit Enum
export const FREQUENCY_UNIT = {
  DAYS: 1,
  WEEKS: 2,
  MONTHS: 3,
  YEARS: 4,
} as const;

// Payment Type Enum
export const PAYMENT_TYPE = {
  BANK_TRANSFER: 1,
  CASH: 2,
  DROP_INVOICE: 3,
} as const;

// Job Schedule Status Enum
export const JOB_SCHEDULE_STATUS = {
  SCHEDULED: 1,
  COMPLETED: 2,
  CANCELLED: 3,
} as const;

// Payment Mode Enum
export const PAYMENT_MODE = {
  CASH: 1,
  UPI: 2,
  BANK: 3,
  OTHER: 4,
} as const;

// Transaction Type Enum
export const TRANSACTION_TYPE = {
  WITHDRAW: 1,
  DEPOSIT: 2,
} as const;

// Invoice Status Enum
export const INVOICE_STATUS = {
  UNPAID: 1,
  PARTIAL: 2,
  PAID: 3,
  CANCELLED: 4,
  OVERDUE: 5,
} as const;

// Report Type Enum
export const REPORT_TYPE = {
  DAILY: 1,
  MONTHLY: 2,
  YEARLY: 3,
} as const;

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 25,
} as const;

export const PERMISSIONS = {
  VIEW: 'view',
  CREATE: 'create',
  EDIT: 'edit',
  DELETE: 'delete',
} as const;

export const MODULES = {
  FRANCHISE: 'franchise',
  CUSTOMER: 'customer',
  QUOTATION: 'quotation',
  JOB: 'job',
  JOB_SCHEDULE: 'job_schedule',
  INVOICE: 'invoice',
  REPORT: 'report',
  USER: 'user',
  SERVICES: 'services',
} as const;

// Public service list used for dropdowns and the inquiry form
export const SERVICE_LIST = [
  { id: 'lawn_mowing', label: 'Lawn Mowing' },
  { id: 'garden_maintenance', label: 'Garden Maintenance' },
  { id: 'hedge_trimming', label: 'Hedge Trimming' },
  { id: 'fertilization_weed_control', label: 'Fertilization & Weed Control' },
  { id: 'landscape_design', label: 'Landscape Design' },
  { id: 'seasonal_cleanup', label: 'Seasonal Cleanup' },
  { id: 'other', label: 'Other' },
] as const;
