/**
 * User Roles in the system
 */
export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  VENDOR = 'VENDOR',
  EXECUTIVE = 'EXECUTIVE',
}

/**
 * User status
 */
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

/**
 * Base User interface
 */
export interface IUser {
  id: string;
  email: string;
  passwordHash?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  phoneVerified: boolean;
  mfaEnabled: boolean;
  mfaSecret?: string;
  avatar?: string;
  preferences?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * OAuth Provider types
 */
export enum OAuthProvider {
  GOOGLE = 'GOOGLE',
}

/**
 * OAuth Account
 */
export interface IOAuthAccount {
  id: string;
  userId: string;
  provider: OAuthProvider;
  providerId: string;
  email: string;
  createdAt: Date;
}

/**
 * Session interface
 */
export interface ISession {
  id: string;
  userId: string;
  accessToken?: string;
  refreshToken: string;
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * JWT Payload
 */
export interface IJWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionId: string;
}

/**
 * Permission types
 */
export enum Permission {
  // User Management
  USER_READ = 'USER_READ',
  USER_WRITE = 'USER_WRITE',
  USER_DELETE = 'USER_DELETE',
  USER_BAN = 'USER_BAN',
  
  // Shop Management
  SHOP_READ = 'SHOP_READ',
  SHOP_WRITE = 'SHOP_WRITE',
  SHOP_DELETE = 'SHOP_DELETE',
  SHOP_APPROVE = 'SHOP_APPROVE',
  SHOP_VERIFY = 'SHOP_VERIFY',
  
  // Product Management
  PRODUCT_READ = 'PRODUCT_READ',
  PRODUCT_WRITE = 'PRODUCT_WRITE',
  PRODUCT_DELETE = 'PRODUCT_DELETE',
  
  // Order Management
  ORDER_READ = 'ORDER_READ',
  ORDER_WRITE = 'ORDER_WRITE',
  ORDER_CANCEL = 'ORDER_CANCEL',
  
  // Payment Management
  PAYMENT_READ = 'PAYMENT_READ',
  PAYMENT_REFUND = 'PAYMENT_REFUND',
  
  // Review Management
  REVIEW_READ = 'REVIEW_READ',
  REVIEW_MODERATE = 'REVIEW_MODERATE',
  REVIEW_DELETE = 'REVIEW_DELETE',
  
  // Admin
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD',
  ADMIN_REPORTS = 'ADMIN_REPORTS',
  SYSTEM_SETTINGS = 'SYSTEM_SETTINGS',
}

/**
 * Role-Permission mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.CUSTOMER]: [
    Permission.PRODUCT_READ,
    Permission.SHOP_READ,
    Permission.ORDER_READ,
    Permission.ORDER_WRITE,
    Permission.REVIEW_READ,
  ],
  [UserRole.VENDOR]: [
    Permission.PRODUCT_READ,
    Permission.PRODUCT_WRITE,
    Permission.PRODUCT_DELETE,
    Permission.SHOP_READ,
    Permission.SHOP_WRITE,
    Permission.ORDER_READ,
    Permission.ORDER_WRITE,
    Permission.PAYMENT_READ,
    Permission.REVIEW_READ,
  ],
  [UserRole.EXECUTIVE]: Object.values(Permission),
};
