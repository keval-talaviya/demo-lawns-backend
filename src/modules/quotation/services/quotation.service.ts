import { CompanySettingsModel } from '../../companySettings/model/companySettings.model';
import { FilterQuery } from 'mongoose';
import { PaginateOptions, BaseDAO } from '../../../db/base.dao';
import { QuotationModel } from '../model/quotation.model';
import { QuotationDocument, CreateQuotationDTO, UpdateQuotationDTO } from '../interfaces/quotation.interface';
import { Types } from 'mongoose';
import { SerialNumberService } from '../../../common/serialNumber.service';

class QuotationServiceClass extends BaseDAO<QuotationDocument> {
  constructor() {
    super(QuotationModel);
  }

  async createQuotation(payload: CreateQuotationDTO, franchiseId: Types.ObjectId | null) {
    // Generate unique code: QUOT-0001
    const uniqueCode = await SerialNumberService.generateUniqueCode({
      prefix: 'QUOT-',
      padding: 4,
      model: QuotationModel,
    });

    return this.create({
      ...payload,
      franchiseId,
      uniqueCode,
    } as unknown as QuotationDocument);
  }

  async updateQuotation(id: string, payload: UpdateQuotationDTO) {
    return this.updateById(id, payload as unknown as Partial<QuotationDocument>);
  }

  async getQuotationsByFranchise(franchiseId: Types.ObjectId, options: { page?: number; limit?: number } = {}) {
    return this.paginateQuotations({ franchiseId }, options);
  }

  async paginateQuotations(
    filter: FilterQuery<QuotationDocument> = {},
    options: PaginateOptions<QuotationDocument> = {},
  ) {
    const [result, companySettings] = await Promise.all([
      super.paginate(filter, options),
      CompanySettingsModel.findOne().lean(),
    ]);

    const gstRate = (companySettings as any)?.gstRate || 15;

    // Recalculate tax and subtotal for display
    const sanitizedData = result.data.map((doc) => {
      const q = doc instanceof QuotationModel ? doc.toObject() : doc; // Fallback for docs with missing tax breakdown

      const totalAmount = q.totalAmount || 0;
      const subtotal = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
      const tax = Number((totalAmount - subtotal).toFixed(2));

      return {
        ...q,
        subtotal,
        tax,
      };
    });

    return {
      ...result,
      data: sanitizedData,
    };
  }
  async getQuotationById(id: string) {
    const [doc, companySettings] = await Promise.all([
      this.findById(id),
      CompanySettingsModel.findOne().lean(),
    ]);

    if (!doc) return null;

    const gstRate = (companySettings as any)?.gstRate || 15;
    const q = doc instanceof QuotationModel ? doc.toObject() : doc;    // Fallback recalculation
    const totalAmount = q.totalAmount || 0;
    const subtotal = Number((totalAmount / (1 + gstRate / 100)).toFixed(2));
    const tax = Number((totalAmount - subtotal).toFixed(2));

    return {
      ...q,
      subtotal,
      tax,
    };
  }
}

export const QuotationService = new QuotationServiceClass();





