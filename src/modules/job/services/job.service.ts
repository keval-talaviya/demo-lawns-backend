import { JobModel } from '../model/job.model';
import { Types } from 'mongoose';
import { InvoiceService } from '../../invoice/services/invoice.service';

import { CustomerService } from '../../customer/services/customer.service';
import { CustomerModel } from '../../customer/model/customer.model';
import { JOB_TYPE, FREQUENCY_UNIT, PAYMENT_TYPE, JOB_STATUS, INVOICE_STATUS } from '../../../common/constants';
import { UserModel } from '../../user/model/user.model';
import TransactionManager from '../../../services/transactionManager.service';
import { CompanySettingsModel } from '../../companySettings/model/companySettings.model';
import { InvoiceModel } from '../../invoice/model/invoice.model';
import { TransactionModel } from '../../transaction/models/transaction.model';
import { UserWalletTransactionModel } from '../../userWallet/models/userWallet.model';

/**
 * Calculate the next job date based on frequency settings
 * @param currentDate - Base date to calculate from
 * @param frequencyValue - Numeric value (e.g., 7, 14, 1)
 * @param frequencyUnit - Unit type from FREQUENCY_UNIT constants
 * @returns Next job date
 */
function calculateNextJobDate(
  currentDate: Date,
  frequencyValue: number,
  frequencyUnit: number
): Date {
  const nextDate = new Date(currentDate);

  switch (frequencyUnit) {
    case FREQUENCY_UNIT.DAYS:
      nextDate.setDate(nextDate.getDate() + frequencyValue);
      break;
    case FREQUENCY_UNIT.WEEKS:
      nextDate.setDate(nextDate.getDate() + (frequencyValue * 7));
      break;
    case FREQUENCY_UNIT.MONTHS:
      nextDate.setMonth(nextDate.getMonth() + frequencyValue);
      break;
    case FREQUENCY_UNIT.YEARS:
      nextDate.setFullYear(nextDate.getFullYear() + frequencyValue);
      break;
    default:
      // Default to days if unknown unit
      console.warn(`Unknown frequency unit: ${frequencyUnit}, defaulting to days`);
      nextDate.setDate(nextDate.getDate() + frequencyValue);
  }

  return nextDate;
}

export const JobService = {
  async createJob(payload: any) {
    if (payload.franchiseId && !Types.ObjectId.isValid(payload.franchiseId as any)) {
      delete payload.franchiseId;
    }
    if (payload.customerId && Types.ObjectId.isValid(payload.customerId as any)) {
      payload.customerId = new Types.ObjectId(payload.customerId);
    }
    if (payload.assignedTo && Types.ObjectId.isValid(payload.assignedTo as any)) {
      payload.assignedTo = new Types.ObjectId(payload.assignedTo);
    }

    // Check if we need to auto-populate fields from Customer
    // 1. jobAddress: if not provided
    // 2. franchiseId: if not provided (e.g. Master Admin selects customer but not franchise)
    console.log('DEBUG createJob - payload.jobAddress:', payload.jobAddress);

    const hasJobAddress = payload.jobAddress && typeof payload.jobAddress === 'string' && payload.jobAddress.trim() !== '';
    const hasFranchiseId = !!payload.franchiseId;

    if ((!hasJobAddress || !hasFranchiseId) && payload.customerId) {
      console.log('DEBUG createJob - Auto-populating fields from customer');
      // Ensure customerId is an ObjectId before finding
      if (Types.ObjectId.isValid(payload.customerId as any)) {
        const customer = await CustomerModel.findById(payload.customerId);
        if (customer) {
          // Populate address if missing
          if (!hasJobAddress && customer.address) {
            console.log('DEBUG createJob - Setting jobAddress to:', customer.address);
            payload.jobAddress = customer.address;
          }
          // Populate franchiseId if missing
          if (!hasFranchiseId && customer.franchiseId) {
            console.log('DEBUG createJob - Setting franchiseId from customer:', customer.franchiseId);
            payload.franchiseId = customer.franchiseId;
          }
        }
      }
    }

    return await JobModel.create(payload);
  },

  async paginate(
    filter: any,
    opts: { page: number; limit: number; sort?: any; projection?: any } = {
      page: 1,
      limit: 25,
    },
  ) {
    const page = Math.max(1, opts.page || 1);
    const limit = Math.max(1, opts.limit || 25);
    const skip = (page - 1) * limit;

    const defaultProjection = {
      __v: 0,
      isDeleted: 0,
      deletedAt: 0,
      updatedAt: 0,
    };

    const projection = { ...defaultProjection, ...(opts.projection || {}) };

    const customerSelect = 'name email phone address';
    const assignedToSelect = 'name email';
    const quotationSelect = 'uniqueCode totalAmount';
    const franchiseSelect = 'name email';

    // NOTE: cast `.lean()` results to `any[]` so TS lets us access populated fields safely.
    const [data, total, companySettings] = await Promise.all([
      JobModel.find(filter, projection)
        .populate({ path: 'customerId', select: customerSelect })
        .populate({ path: 'assignedTo', select: assignedToSelect })
        .populate({ path: 'quotationId', select: quotationSelect })
        .populate({ path: 'franchiseId', select: franchiseSelect })
        .sort(opts.sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as unknown as any[],
      JobModel.countDocuments(filter),
      CompanySettingsModel.findOne().lean(),
    ]);

    // Defensive: if data isn't an array, fall back to empty
    const rows: any[] = Array.isArray(data) ? data : [];

    // Extract company settings
    const companyName = (companySettings as any)?.companyName || 'Lawn Care';
    const gstRate = (companySettings as any)?.gstRate || 15;

    const sanitizedData = rows.map((job: any) => {
      // populated fields may be ObjectId or populated doc — cast to any and read safely
      const customer: any = job.customerId ?? {};
      const assigned: any = job.assignedTo ?? {};
      const quotation: any = job.quotationId ?? {};
      const franchise: any = job.franchiseId ?? {};
      // Compose particulars summary: "ItemName: price" joined by ', '
      const particulars = Array.isArray(job.items)
        ? job.items.map((it: any) => `${it.name}: ${Number(it.price).toFixed(2)}`).join(', ')
        : '';

      // Calculate tax breakdown (GST-inclusive)
      const totalAmount = job.amount ?? 0;
      const subtotal = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
      const tax = Number((totalAmount - subtotal).toFixed(2));

      return {
        id: job._id?.toString?.() ?? null,
        franchiseId: franchise?._id?.toString?.() ?? null,
        franchiseName: franchise?.name ?? null,
        quotationCode: quotation?.uniqueCode ?? null,
        customerId: customer?._id?.toString?.() ?? null,
        customerName: customer?.name ?? null,
        customerEmail: customer?.email ?? null,
        customerPhone: customer?.phone ?? null,
        customerAddress: customer?.address ?? null,
        jobDate: job.jobDate ?? null,
        assignedTo: assigned?.name ?? null,
        assignedToId: assigned?._id?.toString?.() ?? null,
        paymentType: job.paymentType ?? null,
        jobType: job.jobType ?? null,
        particulars,
        items: job.items ?? [],
        amount: job.amount ?? 0,
        subtotal,
        tax,
        gstRate,
        totalAmount,
        status: job.status ?? null,
        isCompleted: job.status === JOB_STATUS.COMPLETED,
        createdAt: job.createdAt ?? null,
        jobAddress: job.jobAddress ?? null,
      };
    });

    return {
      job: sanitizedData,
      pagination: {
        total,
        page,
        limit,
      },
      companyName,
      gstRate,
    };
  },

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    const job = await JobModel.findById(id)
      .populate('customerId', 'name email phone address')
      .populate('assignedTo', 'name email')
      .populate('quotationId', 'uniqueCode')
      .populate('franchiseId', 'name email')
      .lean();

    if (!job) return null;

    const companySettings = await CompanySettingsModel.findOne().select('gstRate').lean();
    const gstRate = (companySettings as any)?.gstRate || 15;

    const totalAmount = job.amount ?? 0;
    const subtotal = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
    const tax = Number((totalAmount - subtotal).toFixed(2));

    return {
      ...job,
      tax,
      subtotal,
      gstRate,
      id: job._id?.toString()
    };
  },

  async updateJob(id: string, payload: any) {
    if (!Types.ObjectId.isValid(id)) return null;

    // Fetch existing job to check for franchise change
    const existingJob = await JobModel.findById(id);
    if (!existingJob) return null;

    if (payload.assignedTo && Types.ObjectId.isValid(payload.assignedTo as any)) {
      payload.assignedTo = new Types.ObjectId(payload.assignedTo);
    }

    if (payload.franchiseId && Types.ObjectId.isValid(payload.franchiseId as any)) {
      payload.franchiseId = new Types.ObjectId(payload.franchiseId);
    }

    // Handle Franchise Change Logic
    const oldFranchiseId = existingJob.franchiseId;
    const newFranchiseId = payload.franchiseId;

    const isFranchiseChanged = newFranchiseId && oldFranchiseId && !new Types.ObjectId(newFranchiseId).equals(oldFranchiseId);

    if (isFranchiseChanged) {
      console.log(`[JOB UPDATE] Franchise changed for Job ${id} from ${oldFranchiseId} to ${newFranchiseId}. Cascading updates...`);

      // 1. Update linked Invoices
      const invoices = await InvoiceModel.find({ jobId: id });
      const invoiceIds = invoices.map(inv => inv._id);

      if (invoiceIds.length > 0) {
        await InvoiceModel.updateMany(
          { jobId: id },
          { $set: { franchiseId: newFranchiseId } }
        );

        // 2. Update linked Transactions
        await TransactionModel.updateMany(
          { invoiceId: { $in: invoiceIds } },
          { $set: { franchiseId: newFranchiseId } }
        );

        // 3. Update linked UserWalletTransactions
        await UserWalletTransactionModel.updateMany(
          { jobId: id },
          { $set: { franchiseId: newFranchiseId } }
        );
      }

      // 4. Handle Assignment - if assigned user doesn't belong to the new franchise, unassign them
      const assignedToId = payload.assignedTo || existingJob.assignedTo;
      if (assignedToId) {
        const assignedUser = await UserModel.findById(assignedToId);
        if (assignedUser) {
          // If user is a staff (role 3), check their parentId
          if (assignedUser.role === 3) {
            if ((assignedUser as any).parentId && !(assignedUser as any).parentId.equals(newFranchiseId)) {
              payload.assignedTo = null; // Unassign if staff belongs to different franchise
            }
          } else if (assignedUser.role === 2) {
            // If user is a franchise admin, they must BE the new franchise
            if (!(assignedUser as any)._id.equals(newFranchiseId)) {
              payload.assignedTo = null;
            }
          }
        }
      }
    }

    // If customerId is changed AND jobAddress is NOT provided or is empty, fetch new customer address
    const hasJobAddress = payload.jobAddress && typeof payload.jobAddress === 'string' && payload.jobAddress.trim() !== '';
    if (payload.customerId && !hasJobAddress) {
      if (Types.ObjectId.isValid(payload.customerId as any)) {
        const customer = await CustomerModel.findById(payload.customerId);
        if (customer && customer.address) {
          payload.jobAddress = customer.address;
        }
      }
    }

    return await JobModel.findByIdAndUpdate(id, payload, { new: true });
  },

  async deleteById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    const job = await JobModel.findById(id);
    if (!job) return null;
    job.isDeleted = true;
    job.deletedAt = new Date();
    await job.save();
    return job;
  },

  async completeJob(id: string, completedBy: string, amountPaid: number = 0) {
    if (!Types.ObjectId.isValid(id)) return null;

    // Get the job with populated customer and franchise data, and fetch company settings
    const [job, companySettings] = await Promise.all([
      JobModel.findById(id).populate('customerId', 'balance').populate('franchiseId'),
      CompanySettingsModel.findOne().lean(),
    ]);
    if (!job) return null;

    // Fetch completedBy user name
    let completedByName = 'Unknown';
    if (Types.ObjectId.isValid(completedBy)) {
      const user = await UserModel.findById(completedBy);
      if (user) completedByName = user.name;
    }

    // Extract company settings
    const companyName = (companySettings as any)?.companyName || 'Lawn Care';
    const gstRate = (companySettings as any)?.gstRate || 15;
    const gstNumber = (companySettings as any)?.gstNumber || '';


    const invoiceItems = job.items.map(item => ({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      price: item.price,
    }));

    const totalAmount = invoiceItems.reduce((sum, item) => sum + item.price, 0);
    const subtotal = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
    const tax = Number((totalAmount - subtotal).toFixed(2));


    // Simplified logic: Use provided amountPaid or default to 0
    // We no longer auto-set CASH to full amount because it's confusing the user.
    const finalAmountPaid = amountPaid !== undefined ? amountPaid : 0;

    console.log(`[JOB COMPLETION] JobId: ${job._id}, PaymentType: ${job.paymentType}, ReceivedAmount: ${amountPaid}, FinalPaid: ${finalAmountPaid}, Total: ${totalAmount}`);

    let invoiceStatus: 1 | 2 | 3 = 1; // Default: UNPAID
    if (finalAmountPaid >= totalAmount && totalAmount > 0) {
      invoiceStatus = 3; // PAID
    } else if (finalAmountPaid > 0) {
      invoiceStatus = 2; // PARTIAL
    }

    // Finalize amountPaid based on logic
    amountPaid = finalAmountPaid;



    const invoiceData = {
      franchiseId: job.franchiseId,
      invoiceNumber: '',
      customerId: job.customerId,
      jobId: job._id as Types.ObjectId,
      items: invoiceItems,
      subtotal,
      tax,
      totalAmount,
      paidAmount: job.paymentType === PAYMENT_TYPE.BANK_TRANSFER ? 0 : amountPaid,
      status: job.paymentType === PAYMENT_TYPE.BANK_TRANSFER
        ? INVOICE_STATUS.UNPAID
        : invoiceStatus,

      paymentType: job.paymentType,
      issuedDate: new Date(),
      createdBy: Types.ObjectId.isValid(completedBy) ? new Types.ObjectId(completedBy) : undefined,
      transactionRemarks: `Complete ${amountPaid > 0 ? 'Cash ' : ''}Job by ${completedByName}`,
    };



    const invoice = await InvoiceService.createInvoice(invoiceData);

    // Handle payment using TransactionManager
    // SKIP for BANK_TRANSFER during job completion - user wants it UNPAID by default
    if (amountPaid > 0 && job.paymentType !== PAYMENT_TYPE.BANK_TRANSFER) {
      try {
        // Get the assigned staff/user ID
        const assignedUserId = job.assignedTo || completedBy;

        await TransactionManager.handleInvoicePayment({
          invoiceId: invoice._id as Types.ObjectId,
          amountPaid: amountPaid,
          paymentType: job.paymentType || 2,
          staffUserId: assignedUserId,
          createdBy: Types.ObjectId.isValid(completedBy)
            ? new Types.ObjectId(completedBy)
            : (assignedUserId as Types.ObjectId),
          remarks: `Job completion payment by ${completedByName} - Job #${(job as any).jobNumber || job._id}`,
        });

      } catch (paymentError) {
        console.error('Failed to process payment transactions:', paymentError);
      }


    }


    // Update job: status, completionDate, updatedBy, and add invoiceId to transactionHistory
    const updateData: any = {
      status: 3, // completed
      completionDate: new Date(),
      updatedBy: Types.ObjectId.isValid(completedBy) ? new Types.ObjectId(completedBy) : undefined,
      completedBy: Types.ObjectId.isValid(completedBy) ? new Types.ObjectId(completedBy) : undefined,
      transactionHistory: [...(job.transactionHistory || []), invoice._id],
    };

    await JobModel.findByIdAndUpdate(id, updateData, { new: true });

    // Fetch and return the completed job with populated customer and franchise data
    const completedJob = await JobModel.findById(id)
      .populate('customerId', 'name email phone balance address')
      .populate('franchiseId', 'name email')
      .populate('assignedTo', 'name email')
      .lean();

    // Send invoice emails asynchronously (don't block the response)
    // Skip sending invoice emails for CASH payment type jobs
    if (job.paymentType !== PAYMENT_TYPE.CASH) {
      try {
        const { sendInvoiceEmails } = await import('../../../services/invoice.mailer');

        const customer: any = completedJob?.customerId ?? {};
        const franchise: any = completedJob?.franchiseId ?? {};

        if (customer.email) {
          // Prepare invoice data for customer email
          const invoiceEmailData = {
            invoiceNumber: (invoice as any).invoiceNumber || `INV-${invoice._id}`,
            customerName: customer.name || 'Valued Customer',
            customerAddress: customer.address,
            issuedDate: new Date(),
            items: invoiceItems,
            subtotal,
            tax,
            totalAmount,
            paidAmount: amountPaid,
            paymentStatus: invoiceStatus === 3 ? 'PAID' : 'UNPAID',
            jobAddress: (job as any).jobAddress,
            companyName,
            gstRate,
            gstNumber,
          };

          // Prepare franchise notification data
          const franchiseEmailData = {
            invoiceNumber: (invoice as any).invoiceNumber || `INV-${invoice._id}`,
            customerName: customer.name || 'Customer',
            franchiseName: franchise.name || 'Franchise',
            customerEmail: customer.email,
            issuedDate: new Date(),
            totalAmount,
            paidAmount: amountPaid,
            paymentStatus: invoiceStatus === 3 ? 'PAID' : 'UNPAID',
            jobAddress: (job as any).jobAddress,
            companyName,
          };

          // Send emails (async, non-blocking)
          sendInvoiceEmails(invoiceEmailData, franchiseEmailData).catch((error) => {
            console.error('Failed to send invoice emails:', error);
            // Don't throw - email failure shouldn't block job completion
          });

        }
      } catch (emailError) {
        console.error('Error preparing invoice emails:', emailError);
        // Don't throw - email failure shouldn't block job completion
      }
    } // End of CASH payment type check

    // ========================================
    // AUTO-CREATE NEXT RECURRING JOB
    // ========================================
    if (job.jobType === JOB_TYPE.RECURRING) {
      try {
        // Validate frequency settings
        if (!job.frequencyValue || !job.frequencyUnit) {
          console.warn(`Recurring job ${id} missing frequency settings, skipping auto-creation`);
        } else {
          // Calculate next job date
          // Use current date (completion time) as base so the gap is relative to actual work done
          const baseDate = new Date();
          const nextJobDate = calculateNextJobDate(
            baseDate,
            job.frequencyValue,
            job.frequencyUnit
          );

          // Create new recurring job with same details
          const newJobData: any = {
            franchiseId: job.franchiseId,
            customerId: job.customerId,
            assignedTo: job.assignedTo,
            jobDate: nextJobDate,
            jobType: job.jobType, // Keep as recurring
            frequencyValue: job.frequencyValue,
            frequencyUnit: job.frequencyUnit,
            amount: job.amount,
            paymentType: job.paymentType,
            invoiceEmails: job.invoiceEmails || [],
            jobAddress: job.jobAddress,
            items: job.items.map((item: any) => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              price: item.price,
            })),
            notes: job.notes,
            status: JOB_STATUS.PENDING, // New job starts as pending
            createdBy: job.createdBy,
          };

          // Create the new job
          const newJob = await JobModel.create(newJobData);
          console.log(`✅ Auto-created recurring job ${newJob._id} for ${nextJobDate.toISOString().split('T')[0]}`);
        }
      } catch (recurringError) {
        console.error('Failed to auto-create recurring job:', recurringError);
        // Don't throw - job completion should still succeed
      }
    }

    // Enrich the response with computed fields for the UI
    if (completedJob) {
      const customer: any = completedJob.customerId ?? {};
      const franchise: any = completedJob.franchiseId ?? {};
      const assigned: any = completedJob.assignedTo ?? {};

      return {
        id: completedJob._id?.toString?.() ?? null,
        franchiseId: franchise?._id?.toString?.() ?? null,
        franchiseName: franchise?.name ?? null,
        customerId: customer?._id?.toString?.() ?? null,
        customerName: customer?.name ?? null,
        customerEmail: customer?.email ?? null,
        customerPhone: customer?.phone ?? null,
        customerAddress: customer?.address ?? null,
        customerBalance: customer?.balance ?? 0,
        // jobTitle and jobDescription removed per client change
        assignedTo: assigned?.name ?? null,
        assignedToId: assigned?._id?.toString?.() ?? null,
        amount: completedJob.amount ?? 0,
        paymentType: completedJob.paymentType ?? null,
        status: completedJob.status ?? null,
        jobType: completedJob.jobType ?? null,
        items: completedJob.items ?? [],
        completedAt: completedJob.updatedAt ?? null,
        createdAt: completedJob.createdAt ?? null,
      };
    }

    return completedJob;
  },

  async cancelJob(id: string, cancelledBy: string) {
    if (!Types.ObjectId.isValid(id)) return null;

    const job = await JobModel.findById(id);
    if (!job) return null;

    const updateData: any = {
      status: JOB_STATUS.CANCELLED,
      updatedBy: Types.ObjectId.isValid(cancelledBy) ? new Types.ObjectId(cancelledBy) : undefined,
    };

    await JobModel.findByIdAndUpdate(id, updateData, { new: true });

    // Fetch and return the cancelled job with populated data
    const cancelledJob = await JobModel.findById(id)
      .populate('customerId', 'name email phone address')
      .populate('franchiseId', 'name email')
      .populate('assignedTo', 'name email')
      .lean();

    if (cancelledJob) {
      const customer: any = cancelledJob.customerId ?? {};
      const franchise: any = cancelledJob.franchiseId ?? {};
      const assigned: any = cancelledJob.assignedTo ?? {};

      return {
        id: cancelledJob._id?.toString?.() ?? null,
        franchiseId: franchise?._id?.toString?.() ?? null,
        franchiseName: franchise?.name ?? null,
        customerId: customer?._id?.toString?.() ?? null,
        customerName: customer?.name ?? null,
        customerEmail: customer?.email ?? null,
        customerPhone: customer?.phone ?? null,
        customerAddress: customer?.address ?? null,
        assignedTo: assigned?.name ?? null,
        assignedToId: assigned?._id?.toString?.() ?? null,
        amount: cancelledJob.amount ?? 0,
        paymentType: cancelledJob.paymentType ?? null,
        status: cancelledJob.status ?? null,
        jobType: cancelledJob.jobType ?? null,
        items: cancelledJob.items ?? [],
        cancelledAt: cancelledJob.updatedAt ?? null,
        createdAt: cancelledJob.createdAt ?? null,
      };
    }

    return cancelledJob;
  },

  async markOverdueJobs() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today
      const filter = {
        isDeleted: false,
        jobDate: { $exists: true, $ne: null, $lt: today },
        status: { $in: [JOB_STATUS.PENDING, JOB_STATUS.IN_PROGRESS] },
      };

      const result = await JobModel.updateMany(filter, {
        $set: {
          status: JOB_STATUS.OVERDUE,
          updatedAt: new Date(),
        },
      });

      return {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      };
    } catch (error) {
      console.error('Error marking overdue jobs:', error);
      throw error;
    }
  },

  /**
   * Get jobs within a date range with filters
   */
  async getJobsByDateRange(startDate: Date, endDate: Date, filters: any = {}) {
    const filter: any = {
      ...filters,
      jobDate: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const customerSelect = 'name email phone address';
    const assignedToSelect = 'name email';
    const quotationSelect = 'uniqueCode totalAmount';
    const franchiseSelect = 'name email';

    const [jobs, companySettings] = await Promise.all([
      JobModel.find(filter)
        .populate({ path: 'customerId', select: customerSelect })
        .populate({ path: 'assignedTo', select: assignedToSelect })
        .populate({ path: 'quotationId', select: quotationSelect })
        .populate({ path: 'franchiseId', select: franchiseSelect })
        .sort({ jobDate: 1 })
        .lean() as unknown as any[],
      CompanySettingsModel.findOne().lean(),
    ]);

    // Extract company settings
    const gstRate = (companySettings as any)?.gstRate || 15;

    // Sanitize and format the data
    const sanitizedJobs = jobs.map((job: any) => {
      const customer: any = job.customerId ?? {};
      const assigned: any = job.assignedTo ?? {};
      const quotation: any = job.quotationId ?? {};
      const franchise: any = job.franchiseId ?? {};

      const particulars = Array.isArray(job.items)
        ? job.items.map((it: any) => `${it.name}: ${Number(it.price).toFixed(2)}`).join(', ')
        : '';

      // Calculate tax breakdown (GST-inclusive)
      const totalAmount = job.amount ?? 0;
      const subtotal = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
      const tax = Number((totalAmount - subtotal).toFixed(2));

      return {
        id: job._id?.toString?.() ?? null,
        franchiseId: franchise?._id?.toString?.() ?? null,
        franchiseName: franchise?.name ?? null,
        quotationCode: quotation?.uniqueCode ?? null,
        customerId: customer?._id?.toString?.() ?? null,
        customerName: customer?.name ?? null,
        customerEmail: customer?.email ?? null,
        customerPhone: customer?.phone ?? null,
        customerAddress: customer?.address ?? null,
        jobDate: job.jobDate ?? null,
        assignedTo: assigned?.name ?? null,
        assignedToId: assigned?._id?.toString?.() ?? null,
        paymentType: job.paymentType ?? null,
        jobType: job.jobType ?? null,
        particulars,
        items: job.items ?? [],
        amount: job.amount ?? 0,
        subtotal,
        tax,
        gstRate,
        totalAmount,
        status: job.status ?? null,
        isCompleted: job.status === JOB_STATUS.COMPLETED,
        createdAt: job.createdAt ?? null,
        jobAddress: job.jobAddress ?? null,
        notes: job.notes ?? null,
      };
    });

    return sanitizedJobs;
  },

  /**
   * Group jobs by date (YYYY-MM-DD format)
   */
  groupJobsByDate(jobs: any[]) {
    const grouped: { [key: string]: any[] } = {};

    jobs.forEach((job) => {
      if (job.jobDate) {
        const date = new Date(job.jobDate);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(job);
      }
    });

    return grouped;
  },

  /**
   * Get job counts by date for calendar rendering
   */
  async getJobCountsByDate(startDate: Date, endDate: Date, filters: any = {}) {
    const filter: any = {
      ...filters,
      jobDate: {
        $gte: startDate,
        $lte: endDate,
      },
    };

    const jobs = await JobModel.find(filter).select('jobDate status').lean();

    // Group counts by date
    const countsByDate: { [key: string]: { total: number; byStatus: { [status: number]: number } } } = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let overdueCount = 0;
    let pendingCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;

    jobs.forEach((job: any) => {
      if (job.jobDate) {
        const date = new Date(job.jobDate);
        const dateKey = date.toISOString().split('T')[0];

        if (!countsByDate[dateKey]) {
          countsByDate[dateKey] = { total: 0, byStatus: {} };
        }

        countsByDate[dateKey].total++;
        const status = job.status ?? 1;
        countsByDate[dateKey].byStatus[status] = (countsByDate[dateKey].byStatus[status] || 0) + 1;

        // Count overall stats
        if (status === JOB_STATUS.COMPLETED) {
          completedCount++;
        } else if (status === JOB_STATUS.CANCELLED) {
          cancelledCount++;
        } else if (status === JOB_STATUS.PENDING) {
          pendingCount++;
          // Check if overdue
          if (date < today) {
            overdueCount++;
          }
        } else if (status === JOB_STATUS.OVERDUE) {
          overdueCount++;
        }
      }
    });

    return {
      countsByDate,
      summary: {
        total: jobs.length,
        pending: pendingCount,
        completed: completedCount,
        cancelled: cancelledCount,
        overdue: overdueCount,
      },
    };
  },
};
