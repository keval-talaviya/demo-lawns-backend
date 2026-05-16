import { InvoiceModel } from '../model/invoice.model';
import { InvoiceDocument, CreateInvoiceDTO, UpdateInvoiceDTO, InvoiceItem } from '../interfaces/invoice.interface';
import { Types } from 'mongoose';
import { SerialNumberService } from '../../../common/serialNumber.service';
import { INVOICE_STATUS } from '../../../common/constants';
import { CompanySettingsModel } from '../../companySettings/model/companySettings.model';

class InvoiceServiceClass {

  async createInvoice(payload: CreateInvoiceDTO): Promise<InvoiceDocument> {
    // Generate invoice number if not provided
    if (!payload.invoiceNumber) {
      payload.invoiceNumber = await SerialNumberService.generateUniqueCode({
        prefix: 'INV-',
        model: InvoiceModel,
        fieldName: 'invoiceNumber',
      });
    }

    // Convert string IDs to ObjectIds
    if (payload.franchiseId && typeof payload.franchiseId === 'string') {
      payload.franchiseId = new Types.ObjectId(payload.franchiseId);
    }
    if (payload.customerId && typeof payload.customerId === 'string') {
      payload.customerId = new Types.ObjectId(payload.customerId);
    }
    if (payload.jobId && typeof payload.jobId === 'string') {
      payload.jobId = new Types.ObjectId(payload.jobId);
    }
    if (payload.createdBy && typeof payload.createdBy === 'string') {
      payload.createdBy = new Types.ObjectId(payload.createdBy);
    }

    // specific gst rate from company settings
    const companySettings = await CompanySettingsModel.findOne().select('gstRate').lean();
    const gstRate = companySettings?.gstRate || 0;

    // Calculate totals and status
    const calculatedData = this.calculateInvoiceTotals(payload, gstRate);

    console.log('DEBUG: createInvoice - calculation results:', JSON.stringify({
      inputPaidAmount: payload.paidAmount,
      inputStatus: payload.status,
      calculatedData
    }, null, 2));

    const invoiceData = {
      ...payload,
      ...calculatedData,
    };

    const invoice = await InvoiceModel.create(invoiceData);

    // Update Customer Balance (Increase debt)
    try {
      const { TransactionService } = await import('../../transaction/services/transaction.service');
      const { TRANSACTION_TYPE, PAYMENT_TYPE } = await import('../../../common/constants');

      // Create Transaction for Invoice Creation (WITHDRAW / Debt Increase)
      await TransactionService.createTransaction({
        franchiseId: invoice.franchiseId,
        customerId: invoice.customerId,
        invoiceId: invoice._id,
        type: TRANSACTION_TYPE.WITHDRAW, // 1
        amount: invoice.totalAmount,
        paymentType: PAYMENT_TYPE.DROP_INVOICE, // 3
        remarks: payload.transactionRemarks
          ? `${payload.transactionRemarks} Invoice # ${invoice.invoiceNumber}`
          : `Invoice #${invoice.invoiceNumber} created`,
        createdBy: invoice.createdBy,
        date: payload.issuedDate || new Date(),
      });


    } catch (err) {
      console.error('Failed to update balance/transaction on invoice creation', err);
    }

    return invoice;
  }

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

    const customerSelect = 'name email phone address balance';
    const franchiseSelect = 'name';
    // We might need job details if paymentType is not on invoice, but we added it.
    // Still useful to have job info.
    const jobSelect = 'paymentType';

    // Fetch GST Rate for recalculation
    const companySettings = await CompanySettingsModel.findOne().select('gstRate').lean();
    const gstRate = (companySettings as any)?.gstRate || 15;

    const [data, total] = await Promise.all([
      InvoiceModel.find(filter, projection)
        .populate({ path: 'customerId', select: customerSelect })
        .populate({ path: 'franchiseId', select: franchiseSelect })
        .populate({ path: 'jobId', select: jobSelect })
        .sort(opts.sort || { createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean() as unknown as any[],
      InvoiceModel.countDocuments(filter),
    ]);

    const rows: any[] = Array.isArray(data) ? data : [];

    const sanitizedData = rows.map((invoice: any) => {
      const customer: any = invoice.customerId ?? {};
      const franchise: any = invoice.franchiseId ?? {};
      const job: any = invoice.jobId ?? {};

      // Force recalculation for List View (GST-inclusive)
      const totalAmount = invoice.totalAmount ?? 0;
      const subtotal = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
      const tax = Number((totalAmount - subtotal).toFixed(2));

      return {
        id: invoice._id?.toString?.() ?? null,
        franchiseId: franchise?._id?.toString?.() ?? null,
        franchiseName: franchise?.name ?? null,
        invoiceNumber: invoice.invoiceNumber ?? null,
        jobId: job?._id?.toString?.() ?? null,
        // If paymentType is not on invoice, try to get from job
        paymentType: invoice.paymentType ?? job?.paymentType ?? null,

        customerId: customer?._id?.toString?.() ?? null,
        customerName: customer?.name ?? null,
        customerEmail: customer?.email ?? null,
        customerPhone: customer?.phone ?? null,
        customerAddress: customer?.address ?? null,

        subtotal,
        tax,
        totalAmount,
        receivedAmount: invoice.paidAmount ?? 0,
        dueAmount: invoice.dueAmount ?? 0,

        paymentStatus: invoice.status ?? 1, // Renamed from status
        invoiceDate: invoice.issuedDate ?? null, // Renamed from issuedDate
        createdAt: invoice.createdAt ?? null,
      };
    });

    return {
      invoice: sanitizedData,
      pagination: {
        total,
        page,
        limit,
      },
    };
  }

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    const invoice = await InvoiceModel.findById(id)
      .populate('customerId', 'name email phone address')
      .populate('franchiseId', 'name email')
      .populate('createdBy', 'name email')
      .lean();

    if (!invoice) return null;

    // Fetch GST Rate (optimization: could be cached, but single fetch is cheap)
    const companySettings = await CompanySettingsModel.findOne().select('gstRate').lean();
    const gstRate = (companySettings as any)?.gstRate || 15;

    // Force recalculation (GST-inclusive)
    const totalAmount = invoice.totalAmount ?? 0;
    const subtotal = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
    const tax = Number((totalAmount - subtotal).toFixed(2));

    return {
      ...invoice,
      tax,
      subtotal
    };
  }

  async updateInvoice(id: string, payload: UpdateInvoiceDTO): Promise<InvoiceDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    // Convert string IDs to ObjectIds
    if (payload.customerId && typeof payload.customerId === 'string') {
      payload.customerId = new Types.ObjectId(payload.customerId);
    }
    if (payload.jobId && typeof payload.jobId === 'string') {
      payload.jobId = new Types.ObjectId(payload.jobId);
    }

    // Get current invoice to recalculate totals if items changed
    const currentInvoice = await InvoiceModel.findById(id);
    if (!currentInvoice) return null;

    const oldTotalAmount = currentInvoice.totalAmount || 0;
    let updateData = { ...payload };
    let hasRecalculated = false;
    let calculatedTotals: any = null;

    // Recalculate totals if items are being updated
    if (payload.items) {
      // specific gst rate from company settings
      const companySettings = await CompanySettingsModel.findOne().select('gstRate').lean();
      const gstRate = companySettings?.gstRate || 0;

      calculatedTotals = this.calculateInvoiceTotals({
        ...currentInvoice.toObject(),
        ...payload,
      }, gstRate);

      updateData = {
        ...updateData,
        ...calculatedTotals,
      };
      hasRecalculated = true;
    }

    const updatedInvoice = await InvoiceModel.findByIdAndUpdate(id, updateData, { new: true });

    // Handle Balance/Transaction Adjustment & Job Sync
    if (updatedInvoice) {
      const isCustomerChanged = String(updatedInvoice.customerId) !== String(currentInvoice.customerId);
      const newTotalAmount = updatedInvoice.totalAmount || 0;
      const diffAmount = newTotalAmount - oldTotalAmount;

      try {
        const { TransactionService } = await import('../../transaction/services/transaction.service');
        const { TRANSACTION_TYPE, PAYMENT_TYPE } = await import('../../../common/constants');

        // CASE 1: Customer Reassignment
        if (isCustomerChanged) {
          // 1. Remove debt from OLD customer
          await TransactionService.createTransaction({
            franchiseId: currentInvoice.franchiseId,
            customerId: currentInvoice.customerId,
            invoiceId: updatedInvoice._id,
            type: TRANSACTION_TYPE.DEPOSIT, // Credit back
            amount: oldTotalAmount,
            paymentType: PAYMENT_TYPE.CASH,
            remarks: `Invoice #${updatedInvoice.invoiceNumber} transferred to new customer`,
            createdBy: updatedInvoice.createdBy,
            date: new Date(),
          });

          // 2. Add debt to NEW customer
          await TransactionService.createTransaction({
            franchiseId: updatedInvoice.franchiseId,
            customerId: updatedInvoice.customerId,
            invoiceId: updatedInvoice._id,
            type: TRANSACTION_TYPE.WITHDRAW, // New debt
            amount: newTotalAmount,
            paymentType: PAYMENT_TYPE.CASH,
            remarks: `Invoice #${updatedInvoice.invoiceNumber} transferred from previous customer`,
            createdBy: updatedInvoice.createdBy,
            date: new Date(),
          });

          console.log(`[INVOICE UPDATE] Debt transferred from ${currentInvoice.customerId} to ${updatedInvoice.customerId}`);
        }
        // CASE 2: Price Changed (Same Customer)
        else if (Math.abs(diffAmount) > 0.01) {
          await TransactionService.createTransaction({
            franchiseId: updatedInvoice.franchiseId,
            customerId: updatedInvoice.customerId,
            invoiceId: updatedInvoice._id,
            type: diffAmount > 0 ? TRANSACTION_TYPE.WITHDRAW : TRANSACTION_TYPE.DEPOSIT,
            amount: Math.abs(diffAmount),
            paymentType: PAYMENT_TYPE.CASH,
            remarks: `Invoice #${updatedInvoice.invoiceNumber} updated (Line items modified)`,
            createdBy: updatedInvoice.createdBy,
            date: new Date(),
          });
          console.log(`[INVOICE UPDATE] Balance adjusted by ${diffAmount} for Invoice ${updatedInvoice.invoiceNumber}`);
        }
      } catch (err) {
        console.error('Failed to update balance on invoice update', err);
      }

      // 3. Job Sync & Property Sync
      if (updatedInvoice.jobId) {
        try {
          const { JobModel } = await import('../../job/model/job.model');
          const jobUpdate: any = {};
          if (hasRecalculated) {
            jobUpdate.items = updatedInvoice.items;
            jobUpdate.amount = updatedInvoice.totalAmount;
          }
          if (isCustomerChanged) {
            jobUpdate.customerId = updatedInvoice.customerId;
          }

          if (Object.keys(jobUpdate).length > 0) {
            await JobModel.findByIdAndUpdate(updatedInvoice.jobId, jobUpdate);
            console.log(`[INVOICE UPDATE] Job ${updatedInvoice.jobId} synced with updated invoice`);
          }
        } catch (err) {
          console.error('Failed to sync job on invoice update', err);
        }
      }
    }

    return updatedInvoice;
  }

  async deleteById(id: string): Promise<InvoiceDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) return null;
    invoice.isDeleted = true;
    invoice.deletedAt = new Date();
    await invoice.save();
    return invoice;
  }

  async updatePayment(id: string, paidAmount: number): Promise<InvoiceDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const invoice = await InvoiceModel.findById(id);
    if (!invoice) return null;

    const newPaidAmount = Math.max(0, paidAmount);
    const newDueAmount = Math.max(0, invoice.totalAmount - newPaidAmount);

    let newStatus: 1 | 2 | 3 = INVOICE_STATUS.UNPAID;
    if (newPaidAmount === 0) {
      newStatus = INVOICE_STATUS.UNPAID;
    } else if (newDueAmount === 0) {
      newStatus = INVOICE_STATUS.PAID;
    } else {
      newStatus = INVOICE_STATUS.PARTIAL;
    }

    return await InvoiceModel.findByIdAndUpdate(
      id,
      {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        status: newStatus,
      },
      { new: true },
    );
  }

  async markAsPaid(id: string, amount?: number, paymentDate?: string | Date): Promise<InvoiceDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const invoice = await InvoiceModel.findById(id);
    if (!invoice) return null;

    // Determine payment amount
    let paymentAmount = 0;
    // Check if amount is provided (not null, not undefined)
    const isAmountProvided = amount !== undefined && amount !== null;

    if (isAmountProvided) {
      paymentAmount = Number(amount);
      console.log(`DEBUG: markAsPaid - Using provided amount: ${paymentAmount}`);
    } else {
      // If no amount provided (blank), pay off the remaining due amount (Mark Fully Paid)
      paymentAmount = Math.max(0, invoice.dueAmount || (invoice.totalAmount - (invoice.paidAmount || 0)));
      console.log(`DEBUG: markAsPaid - No amount provided, defaulting to full due: ${paymentAmount}`);
    }

    // Determine payment type for transaction
    // Use invoice's payment type, or default to CASH if not set
    const { PAYMENT_TYPE } = await import('../../../common/constants');
    const transactionPaymentType = invoice.paymentType || PAYMENT_TYPE.CASH;

    const newPaidAmount = (invoice.paidAmount || 0) + paymentAmount;
    const newDueAmount = Math.max(0, invoice.totalAmount - newPaidAmount);

    let newStatus: 1 | 2 | 3 = INVOICE_STATUS.UNPAID;
    if (newDueAmount <= 0) { // Pay off fully
      newStatus = INVOICE_STATUS.PAID;
    } else if (newPaidAmount === 0) {
      newStatus = INVOICE_STATUS.UNPAID;
    } else {
      newStatus = INVOICE_STATUS.PARTIAL;
    }

    const updatedInvoice = await InvoiceModel.findByIdAndUpdate(
      id,
      {
        paidAmount: newPaidAmount,
        dueAmount: newDueAmount,
        status: newStatus,
      },
      { new: true },
    );

    // Create Transaction for the payment
    if (paymentAmount > 0) {
      try {
        const { TransactionService } = await import('../../transaction/services/transaction.service');
        const { TRANSACTION_TYPE } = await import('../../../common/constants');

        const pDate = paymentDate ? new Date(paymentDate) : new Date();

        await TransactionService.createTransaction({
          franchiseId: invoice.franchiseId,
          customerId: invoice.customerId,
          invoiceId: invoice._id,
          type: TRANSACTION_TYPE.DEPOSIT, // 2
          amount: paymentAmount,
          paymentType: transactionPaymentType,
          remarks: `Invoice #${invoice.invoiceNumber} payment received`,
          createdBy: invoice.createdBy,
          date: pDate,
        });
      } catch (err) {
        console.error('Failed to create transaction on markAsPaid', err);
      }
    }

    return updatedInvoice;
  }

  async cancelInvoice(id: string): Promise<InvoiceDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const invoice = await InvoiceModel.findById(id);
    if (!invoice) return null;

    // Only allow cancellation if invoice is not fully paid
    if (invoice.status === INVOICE_STATUS.PAID) {
      throw new Error('Cannot cancel a fully paid invoice');
    }

    return await InvoiceModel.findByIdAndUpdate(
      id,
      {
        status: 4, // cancelled status (assuming 4 is cancelled)
        dueAmount: 0, // Clear due amount on cancellation
      },
      { new: true },
    );
  }

  async markOverdueInvoices() {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(23, 59, 59, 999);

      const result = await InvoiceModel.updateMany(
        {
          status: { $in: [INVOICE_STATUS.UNPAID, INVOICE_STATUS.PARTIAL] },
          createdAt: { $lte: sevenDaysAgo },
          isDeleted: false,
        },
        {
          $set: { status: INVOICE_STATUS.OVERDUE },
        }
      );

      return {
        matched: result.matchedCount,
        modified: result.modifiedCount,
      };
    } catch (error) {
      console.error('Error marking overdue invoices:', error);
      throw error;
    }
  }

  private calculateInvoiceTotals(invoiceData: any, gstRate: number = 0): {
    subtotal: number;
    totalAmount: number;
    dueAmount: number;
    status: 1 | 2 | 3;
    tax: number;
  } {
    const items: InvoiceItem[] = invoiceData.items || [];

    // Calculate total amount from items (Inclusive of Tax)
    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

    // GST-inclusive: extract GST already embedded in the price
    const subtotal = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
    const tax = Number((totalAmount - subtotal).toFixed(2));

    // Calculate due amount
    const paidAmount = invoiceData.paidAmount || 0;
    const dueAmount = Math.max(0, totalAmount - paidAmount);

    // Determine status
    let status: 1 | 2 | 3 = INVOICE_STATUS.UNPAID;
    if (dueAmount <= 0) {
      // If everything is paid (or it was a $0 job), it's PAID
      status = INVOICE_STATUS.PAID;
    } else if (paidAmount === 0) {
      status = INVOICE_STATUS.UNPAID;
    } else {
      status = INVOICE_STATUS.PARTIAL;
    }

    return {
      subtotal,
      totalAmount,
      dueAmount,
      status,
      tax,
    };
  }
}

export const InvoiceService = new InvoiceServiceClass();
