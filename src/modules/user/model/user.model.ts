import { Schema, model } from 'mongoose';
import { UserDocument } from '../interfaces/user.interface';
import bcrypt from 'bcrypt';

const userSchema = new Schema<UserDocument>(
  {
    uniqueCode: { type: String, unique: true, sparse: true },
    isFranchise: { type: Boolean, default: false },
    address: { type: String, default: null },
    email: { type: String, default: null },
    parentId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    accountNumber: { type: String, defult: null },
    // User fields,
    role: {
      type: Number,
      enum: [1, 2, 3], // 1: master_admin, 2: franchise_admin, 3: staff
      default: 3,
      required: true,
    },
    name: { type: String, required: true },
    password: { type: String, required: true },
    phoneNumber: { type: String, default: null },
    countryCode: { type: Number, default: null },
    balance: { type: Number, default: 0 },
    permissions: [{ type: String }],
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    // Common fields
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

/**
 * Hash password before save
 */
userSchema.pre<UserDocument>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err as any);
  }
});


export const UserModel = model<UserDocument>('User', userSchema);
