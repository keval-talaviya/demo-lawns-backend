"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebDailyReportController = void 0;
const http_status_codes_1 = require("http-status-codes");
const mongoose_1 = require("mongoose");
const response_1 = require("../../../common/response");
const constants_1 = require("../../../common/constants");
const job_model_1 = require("../../job/model/job.model");
const user_service_1 = require("../../user/services/user.service");
const invoice_model_1 = require("../../invoice/model/invoice.model");
exports.WebDailyReportController = {
    async getWorkReport(req, res) {
        try {
            const loggedUser = req.user;
            if (!loggedUser) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.UNAUTHORIZED, 'Unauthorized');
            }
            const { userId } = req.query;
            const rawDate = req.query.date;
            const rawStart = req.query.startDate;
            const rawEnd = req.query.endDate;
            const statusQuery = req.query.status;
            if (!userId || !mongoose_1.Types.ObjectId.isValid(userId)) {
                return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Valid User ID is required');
            }
            const targetUserId = new mongoose_1.Types.ObjectId(userId);
            const role = Number(loggedUser.role);
            // Permission Check (same as your original)
            if (role === constants_1.ROLES.FRANCHISE_ADMIN) {
                const targetUser = await user_service_1.UserService.findById(userId);
                if (!targetUser) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.NOT_FOUND, 'User not found');
                }
                const loggedUserIdStr = String(loggedUser._id);
                const parentIdStr = targetUser.parentId ? String(targetUser.parentId) : null;
                if (String(targetUser._id) !== loggedUserIdStr && parentIdStr !== loggedUserIdStr) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied: You can only view reports for your staff');
                }
            }
            else if (role !== constants_1.ROLES.MASTER_ADMIN) {
                if (String(loggedUser._id) !== String(userId)) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.FORBIDDEN, 'Access denied');
                }
            }
            // Helper: safe parse date that fixes " " -> "+" and decodes URI components
            const safeParseDate = (input) => {
                if (!input)
                    return null;
                try {
                    // Decode in case client double-encoded or provided spaces where + should be
                    let s = decodeURIComponent(String(input));
                    // If someone sent "2025-11-23T05:48:53.159 00:00" (space instead of +), convert it back
                    if (s.includes(' ')) {
                        // common pattern: timezone part may be " 00:00" due to + -> space; replace the first space before timezone with "+"
                        // but be conservative: only replace last occurrence of ' ' if it looks like a timezone segment
                        const maybeTZ = s.match(/\s[+-]?\d{2}:\d{2}$/);
                        if (maybeTZ) {
                            s = s.replace(/\s([+-]?\d{2}:\d{2})$/, '+$1');
                        }
                        else {
                            // fallback: replace all spaces with '+' only if it contains 'T' (iso-like)
                            if (s.includes('T'))
                                s = s.replace(/ /g, '+');
                        }
                    }
                    const d = new Date(s);
                    if (isNaN(d.getTime()))
                        return null;
                    return d;
                }
                catch (e) {
                    return null;
                }
            };
            // Build Query with Legacy Fallback
            // Using $and at root level to combine all conditions properly
            const query = {
                $and: [
                    { status: constants_1.JOB_STATUS.COMPLETED },
                    {
                        $or: [
                            { isDeleted: false },
                            { isDeleted: null },
                            { isDeleted: { $exists: false } }
                        ]
                    },
                    {
                        $or: [
                            { assignedTo: targetUserId },
                            { completedBy: targetUserId }
                        ]
                    }
                ]
            };
            // Date filtering with Legacy Fallback
            if (rawDate) {
                const parsed = safeParseDate(rawDate);
                if (!parsed) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date format for parameter `date`');
                }
                const startOfDay = new Date(parsed);
                startOfDay.setUTCHours(0, 0, 0, 0);
                const endOfDay = new Date(parsed);
                endOfDay.setUTCHours(23, 59, 59, 999);
                query.$and.push({
                    $or: [
                        { completionDate: { $gte: startOfDay, $lte: endOfDay } },
                        { completionDate: null, updatedAt: { $gte: startOfDay, $lte: endOfDay } }
                    ]
                });
            }
            else if (rawStart || rawEnd) {
                const startParsed = safeParseDate(rawStart || '');
                const endParsed = safeParseDate(rawEnd || '');
                if (rawStart && !startParsed) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date format for parameter `startDate`');
                }
                if (rawEnd && !endParsed) {
                    return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.BAD_REQUEST, 'Invalid date format for parameter `endDate`');
                }
                const dateFilter = {};
                if (startParsed)
                    dateFilter.$gte = startParsed;
                if (endParsed)
                    dateFilter.$lte = endParsed;
                // Add date range filter to the $and array
                query.$and.push({
                    $or: [
                        { completionDate: dateFilter },
                        { completionDate: null, updatedAt: dateFilter }
                    ]
                });
            }
            console.log('Work Report Query:', JSON.stringify(query, null, 2));
            const jobs = await job_model_1.JobModel.find(query)
                .populate('customerId', 'name')
                .populate('quotationId', 'quotationNumber')
                .sort({ completionDate: -1, updatedAt: -1 })
                .lean();
            console.log(`Found ${jobs.length} jobs`);
            const enrichedJobs = await Promise.all(jobs.map(async (job) => {
                const invoice = await invoice_model_1.InvoiceModel.findOne({ jobId: job._id })
                    .select('invoiceNumber status paidAmount totalAmount paymentType')
                    .lean();
                const invoiceNumber = invoice?.invoiceNumber || 'N/A';
                const invoiceId = invoice?._id || null;
                const invoiceStatus = invoice?.status ?? 1;
                let paymentStatus;
                if (invoiceStatus === 3)
                    paymentStatus = 'PAID';
                else if (invoiceStatus === 2)
                    paymentStatus = 'PARTIAL';
                else if (invoiceStatus === 5)
                    paymentStatus = 'OVERDUE';
                else
                    paymentStatus = 'UNPAID';
                const pType = invoice?.paymentType ?? job.paymentType;
                const paymentTypeLabel = pType === constants_1.PAYMENT_TYPE.CASH ? 'Cash' : 'Bank Transfer';
                const jobAmount = Number(job.amount || 0);
                const receivedAmount = Number(invoice?.paidAmount || 0);
                return {
                    jobId: job._id,
                    jobNumber: job.jobNumber || String(job._id),
                    invoiceId,
                    invoiceNumber,
                    invoiceStatus,
                    customer: job.customerId?.name || 'Unknown',
                    particulars: job.items?.map((i) => i.name).join(', ') || 'Job',
                    completedAt: job.completionDate,
                    totalAmount: jobAmount,
                    receivedAmount,
                    paymentType: paymentTypeLabel,
                    _paymentTypeCode: pType,
                    paymentStatus,
                };
            }));
            // Apply payment status filter
            let filteredJobs = enrichedJobs;
            if (statusQuery && statusQuery !== '' && statusQuery !== 'all') {
                const statusNum = Number(statusQuery);
                if (!isNaN(statusNum)) {
                    filteredJobs = enrichedJobs.filter(j => j.invoiceStatus === statusNum);
                }
            }
            // Calculate balances from filtered jobs only
            let totalCash = 0;
            let totalBank = 0;
            let totalPaid = 0;
            let totalUnpaid = 0;
            let totalAmount = 0;
            for (const j of filteredJobs) {
                totalAmount += j.totalAmount;
                if (j._paymentTypeCode === constants_1.PAYMENT_TYPE.CASH) {
                    totalCash += j.totalAmount;
                }
                else {
                    totalBank += j.totalAmount;
                }
                if (j.invoiceStatus === 3) {
                    totalPaid += j.totalAmount;
                }
                else {
                    totalUnpaid += Math.max(0, j.totalAmount - j.receivedAmount);
                }
            }
            // Strip internal fields before returning
            const returnJobs = filteredJobs.map(({ invoiceStatus: _s, _paymentTypeCode: _p, ...rest }) => rest);
            return (0, response_1.successResponse)(res, {
                balances: {
                    cash: totalCash,
                    bank: totalBank,
                    paid: totalPaid,
                    unpaid: totalUnpaid,
                    total: totalAmount
                },
                jobs: returnJobs
            }, 'Daily work report generated successfully');
        }
        catch (error) {
            return (0, response_1.errorResponse)(res, http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR, 'Failed to generate work report', { error });
        }
    }
};
//# sourceMappingURL=webDailyReport.controller.js.map