import { getUserRepository, getOAuthAccountRepository, User } from '../config/database';
import { UserRole, UserStatus, OAuthProvider, IUser } from '@crevea/shared';
import { comparePassword } from '@crevea/shared';
import { sanitizeEmail } from '@crevea/shared';

interface CreateUserData {
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified?: boolean;
  avatar?: string;
}

export const create = async (data: CreateUserData): Promise<IUser> => {
  const userRepo = getUserRepository();

  // Sanitize email
  const email = sanitizeEmail(data.email);

  // Check if user exists
  const existing = await userRepo.findOne({ where: { email } });
  if (existing) {
    throw new Error('User already exists');
  }

  // Create user
  const user = userRepo.create({
    email,
    passwordHash: data.passwordHash || '',
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role,
    status: UserStatus.ACTIVE,
    emailVerified: data.emailVerified || false,
    mfaEnabled: false,
    avatar: data.avatar,
  });

  await userRepo.save(user);

  return mapUserToInterface(user);
};

export const findByEmail = async (email: string): Promise<IUser | null> => {
  const userRepo = getUserRepository();
  const sanitizedEmail = sanitizeEmail(email);

  const user = await userRepo.findOne({ where: { email: sanitizedEmail } });
  return user ? mapUserToInterface(user) : null;
};

export const findById = async (id: string): Promise<IUser | null> => {
  const userRepo = getUserRepository();
  const user = await userRepo.findOne({ where: { id } });
  return user ? mapUserToInterface(user) : null;
};

export const verifyPassword = async (userId: string, password: string): Promise<boolean> => {
  const userRepo = getUserRepository();
  const user = await userRepo.findOne({ where: { id: userId } });

  if (!user) return false;

  return comparePassword(password, user.passwordHash);
};

export const updateUser = async (id: string, data: Partial<User>): Promise<IUser> => {
  const userRepo = getUserRepository();
  
  if (data.email) {
    data.email = sanitizeEmail(data.email);
  }

  await userRepo.update(id, {
    ...data,
    updatedAt: new Date(),
  });

  const user = await userRepo.findOne({ where: { id } });
  if (!user) throw new Error('User not found');

  return mapUserToInterface(user);
};

export const setEmailVerified = async (userId: string): Promise<void> => {
  const userRepo = getUserRepository();
  await userRepo.update(userId, { emailVerified: true });
};

export const markEmailVerified = async (userId: string): Promise<void> => {
  await setEmailVerified(userId);
};

export const updatePassword = async (userId: string, passwordHash: string): Promise<void> => {
  const userRepo = getUserRepository();
  await userRepo.update(userId, { passwordHash });
};

export const enableMFA = async (userId: string): Promise<void> => {
  const userRepo = getUserRepository();
  await userRepo.update(userId, { mfaEnabled: true });
};

export const saveMFASecret = async (userId: string, secret: string): Promise<void> => {
  const userRepo = getUserRepository();
  await userRepo.update(userId, { mfaSecret: secret });
};

export const disableMFA = async (userId: string): Promise<void> => {
  const userRepo = getUserRepository();
  await userRepo.update(userId, {
    mfaEnabled: false,
    mfaSecret: undefined,
  });
};

export const updateLastLogin = async (userId: string): Promise<void> => {
  const userRepo = getUserRepository();
  await userRepo.update(userId, { lastLoginAt: new Date() });
};

// OAuth methods
export const findOAuthAccount = async (
  provider: OAuthProvider,
  providerId: string
): Promise<{ userId: string } | null> => {
  const oauthRepo = getOAuthAccountRepository();
  const oauthAccount = await oauthRepo.findOne({
    where: { provider, providerId },
  });
  return oauthAccount ? { userId: oauthAccount.userId } : null;
};

export const createOAuthAccount = async (data: {
  userId: string;
  provider: OAuthProvider;
  providerId: string;
  email: string;
}): Promise<void> => {
  const oauthRepo = getOAuthAccountRepository();
  const oauthAccount = oauthRepo.create({
    userId: data.userId,
    provider: data.provider,
    providerId: data.providerId,
    email: sanitizeEmail(data.email),
    profile: {},
  });
  await oauthRepo.save(oauthAccount);
};

export const findOrCreateOAuthUser = async (
  provider: OAuthProvider,
  providerId: string,
  profile: any
): Promise<IUser> => {
  const userRepo = getUserRepository();
  const oauthRepo = getOAuthAccountRepository();

  // Check if OAuth account exists
  const oauthAccount = await oauthRepo.findOne({
    where: { provider, providerId },
  });

  if (oauthAccount) {
    const user = await userRepo.findOne({ where: { id: oauthAccount.userId } });
    if (user) return mapUserToInterface(user);
  }

  // Create new user
  const email = sanitizeEmail(profile.email || `${providerId}@${provider}.oauth`);

  let user = await userRepo.findOne({ where: { email } });

  if (!user) {
    user = userRepo.create({
      email,
      passwordHash: '', // OAuth users don't have password
      firstName: profile.firstName || profile.name?.givenName || 'User',
      lastName: profile.lastName || profile.name?.familyName || '',
      role: UserRole.CUSTOMER,
      status: UserStatus.ACTIVE,
      emailVerified: true, // OAuth emails are pre-verified
      avatar: profile.picture || profile.avatar,
    });

    await userRepo.save(user);
  }

  // Create OAuth account link
  const newOAuthAccount = oauthRepo.create({
    userId: user.id,
    provider,
    providerId,
    email: profile.email,
    profile,
  });

  await oauthRepo.save(newOAuthAccount);

  return mapUserToInterface(user);
};

// Helper to sanitize user data for client
export const sanitizeUser = (user: IUser): Omit<IUser, 'mfaSecret'> => {
  const { mfaSecret, ...sanitized } = user as any;
  return sanitized;
};

// Helper to map entity to interface
const mapUserToInterface = (user: User): IUser => {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatar: user.avatar,
    role: user.role,
    status: user.status,
    emailVerified: user.emailVerified,
    phoneVerified: false, // Not implemented yet
    mfaEnabled: user.mfaEnabled,
    mfaSecret: user.mfaSecret,
    passwordHash: user.passwordHash,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
