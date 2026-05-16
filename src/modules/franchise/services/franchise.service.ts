import { BaseDAO } from '../../../db/base.dao';
import { FranchiseModel } from '../model/franchise.model';
import { FranchiseDocument } from '../interfaces/franchise.interface';
import { CreateFranchiseDTO, UpdateFranchiseDTO } from '../interfaces/franchise.interface';
import bcrypt from 'bcrypt';
import { SerialNumberService } from '../../../common/serialNumber.service';

class FranchiseServiceClass extends BaseDAO<FranchiseDocument> {
  constructor() {
    super(FranchiseModel);
  }

  async findByMail(email: string) {
    return this.findOne({ email });
  }

  sanitize(franchise: FranchiseDocument) {
    if (!franchise) return null;

    // Convert to plain object safely
    const obj =
      typeof franchise.toObject === 'function'
        ? franchise.toObject()
        : { ...(franchise as any) };

    // Remove sensitive fields
    delete obj.password;
    delete obj.__v;
    delete obj.isDeleted;
    delete obj.deletedAt;

    return obj;
  }
  async createFranchise(payload: CreateFranchiseDTO) {
    // Generate unique code: FR-0001
    const uniqueCode = await SerialNumberService.generateUniqueCode({
      prefix: 'FR-',
      padding: 4,
      model: FranchiseModel,
    });



    if (payload.password) {
      payload.password = await bcrypt.hash(payload.password, 10);
    }
    return this.create({
      ...payload,
      uniqueCode,
    } as unknown as FranchiseDocument);
  }

  async updateFranchise(id: string, payload: UpdateFranchiseDTO) {
    return this.updateById(id, payload as unknown as Partial<FranchiseDocument>);
  }
}

export const FranchiseService = new FranchiseServiceClass();





