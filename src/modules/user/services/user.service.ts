import bcrypt from 'bcrypt';
import { HydratedDocument } from 'mongoose';
import { BaseDAO } from '../../../db/base.dao';
import { UserModel } from '../model/user.model';
import { UserDocument, CreateUserDTO, UpdateUserDTO } from '../interfaces/user.interface';
import { SerialNumberService } from '../../../common/serialNumber.service';

class UserServiceClass extends BaseDAO<UserDocument> {
  constructor() {
    super(UserModel);
  }

  async createUser(payload: CreateUserDTO): Promise<HydratedDocument<UserDocument>> {
    const emailToCheck = payload.email;
    if (emailToCheck) {
      const existing = await UserModel.findOne({ email: emailToCheck }).lean();
      if (existing) {
        throw new Error('Email already in use');
      }
    }

    const uniqueCode = await SerialNumberService.generateUniqueCode({
      prefix: 'USR-',
      padding: 4,
      model: UserModel,
    });

    const createdUser = await UserModel.create({
      ...payload,
      role: payload.role ?? 2,
      uniqueCode,
    } as unknown as UserDocument);

    return createdUser;
  }

  async updateUser(id: string, payload: UpdateUserDTO) {
    const updatePayload = { ...payload } as UpdateUserDTO & { password?: string };
    if (payload.password) {
      updatePayload.password = await bcrypt.hash(payload.password, 10);
    }
    return this.updateById(id, updatePayload);
  }

  async findByEmail(email: string) {
    return this.findOne({
      $or: [{ email }, { userEmail: email }],
    });
  }

  async comparePassword(user: UserDocument, password: string) {
    if (!user.password) {
      return false;
    }
    return bcrypt.compare(password, user.password);
  }

  sanitize(user: HydratedDocument<UserDocument>) {
    const json = user.toObject();
    const { password, ...sanitized } = json;
    return sanitized;
  }
}

export const UserService = new UserServiceClass();
