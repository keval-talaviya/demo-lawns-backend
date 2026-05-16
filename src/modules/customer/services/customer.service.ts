import { BaseDAO } from '../../../db/base.dao';
import { CustomerModel } from '../model/customer.model';
import { CustomerDocument, CreateCustomerDTO, UpdateCustomerDTO } from '../interfaces/customer.interface';
import { Types } from 'mongoose';
import { SerialNumberService } from '../../../common/serialNumber.service';

class CustomerServiceClass extends BaseDAO<CustomerDocument> {
  constructor() {
    super(CustomerModel);
  }

  async createCustomer(payload: CreateCustomerDTO, franchiseId: Types.ObjectId | null) {
    // Generate unique code: CUST-0001


    const uniqueCode = await SerialNumberService.generateUniqueCode({
      prefix: 'CUST-',
      padding: 4,
      model: CustomerModel,
    });

    return this.create({
      ...payload,
      franchiseId,
      uniqueCode,
    } as unknown as CustomerDocument);
  }

  async updateCustomer(id: string, payload: UpdateCustomerDTO) {
    return this.updateById(id, payload as unknown as Partial<CustomerDocument>);
  }

  async getCustomersByFranchise(franchiseId: Types.ObjectId, options: { page?: number; limit?: number } = {}) {
    return this.paginate({ franchiseId }, options);
  }
}

export const CustomerService = new CustomerServiceClass();





