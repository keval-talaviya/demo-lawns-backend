import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { HydratedDocument } from 'mongoose';
import { config } from '../../../config';
import { UserService } from '../../user/services/user.service';
import { UserDocument, CreateUserDTO, AuthPayload } from '../../user/interfaces/user.interface';
import { ROLES } from '../../../common/constants';
import { FranchiseService } from '../../franchise/services/franchise.service';
import { FranchiseDocument } from '../../franchise/interfaces/franchise.interface';
type TokenPayload = { id: string; email: string; role: number; [k: string]: any };

class AuthServiceClass {
  
private issueToken(userOrPayload: import('mongoose').HydratedDocument<UserDocument> | TokenPayload): string {
  // Build canonical payload from either a Mongoose document or a plain payload
  const id =
    // prefer the string id property if available, otherwise try _id, otherwise empty string
    (userOrPayload as any).id ?? ((userOrPayload as any)._id ? String((userOrPayload as any)._id) : '');
  const email = (userOrPayload as any).userEmail ?? (userOrPayload as any).email ?? '';
  const role = (userOrPayload as any).role ?? ROLES.FRANCHISE_ADMIN ?? 3; // default if needed

  const payload = { id, email, role };

  const accessSecret: string = String(config.jwt.accessSecret || 'access_secret');
  const accessExpiry: string = String(config.jwt.accessExpiry || '15m');

  const accessToken = jwt.sign(payload, accessSecret, {
    expiresIn: accessExpiry,
  } as jwt.SignOptions);

  return accessToken;
}


  /**
   * Public register:
   * - Disallow creating MASTER_ADMIN or FRANCHISE via this route.
   */
  async register(payload: CreateUserDTO) {
    // Prevent privileged role creation via public route
    if (payload.role === ROLES.MASTER_ADMIN) {
      throw new Error('Cannot create Master Admin via public register');
    }
    if (payload.role === ROLES.FRANCHISE_ADMIN || payload.isFranchise) {
      throw new Error('Franchise must be created by Master Admin');
    }

    // Normalize legacy parent field
    if ((payload as any).parentFranchiseId && !(payload as any).parentId) {
      (payload as any).parentId = (payload as any).parentFranchiseId;
      delete (payload as any).parentFranchiseId;
    }

    const user = await UserService.createUser(payload);
    const accessToken = this.issueToken(user);
    return {
      user: UserService.sanitize(user),
      accessToken,
    };
  }

  /**
   * Admin-only: create a franchise (caller must be MASTER_ADMIN).
   * Returns created franchise + accessToken.
   */
  async adminCreateFranchise(payload: CreateUserDTO, caller: HydratedDocument<UserDocument>) {
    if (!caller || caller.role !== ROLES.MASTER_ADMIN) {
      throw new Error('Only Master Admin can create franchise accounts');
    }

    // Force franchise role and mark as franchise
    payload.role = ROLES.FRANCHISE_ADMIN;
    payload.isFranchise = true;

    // Optionally set parentId to caller (master admin) or null
    if (!payload.parentId) {
       payload.parentId = String(caller._id);
    }

    // Normalize legacy parent field
    if ((payload as any).parentFranchiseId && !(payload as any).parentId) {
      (payload as any).parentId = (payload as any).parentFranchiseId;
      delete (payload as any).parentFranchiseId;
    }

    const franchise = await UserService.createUser(payload);
    const accessToken = this.issueToken(franchise);
    return {
      user: UserService.sanitize(franchise),
      accessToken,
    };
  }

  /**
   * Login: accepts email (userEmail or legacy email) and password.
   */
  async login({ email, password }: AuthPayload) {
    const user = await UserService.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValid = await UserService.comparePassword(user, password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const accessToken = this.issueToken(user);
    return {
      user: UserService.sanitize(user),
      accessToken,
    };
  }

async franchiseLogin({ email, password }: AuthPayload) {
  const franchise = await FranchiseService.findByMail(email);
  if (!franchise) throw new Error('Invalid credentials');

  const isValid = await bcrypt.compare(password, String(franchise.password));
  if (!isValid) throw new Error('Invalid credentials');

  const accessToken = this.issueToken({
    id: String(franchise._id),
    email: franchise.email,
    role: ROLES.FRANCHISE_ADMIN,
  });

  const sanitizedUser = FranchiseService.sanitize(franchise);

  return {
    success: true,
    message: 'Login successful.',
    data: {
      user: sanitizedUser,
      accessToken,
    },
  };
}

}

export const AuthService = new AuthServiceClass();
