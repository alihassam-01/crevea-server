import { 
  ValidationError, 
  AuthenticationError, 
  ConflictError,
  NotFoundError,
  BusinessLogicError,
  successResponse 
} from '@crevea/shared';
import * as userService from '../services/user.service';
import * as jwtService from '../services/jwt.service';
import * as sessionService from '../services/session.service';
import * as mfaService from '../services/mfa.service';
import * as emailService from '../services/email.service';
import { hashPassword, comparePassword } from '@crevea/shared';
import { UserRole } from '@crevea/shared';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'SELLER';
}

interface LoginData {
  email: string;
  password: string;
}

/**
 * Register new user
 */
export const register = async (data: RegisterData) => {
  // Check if user exists
  const existingUser = await userService.findByEmail(data.email);
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Hash password
  const passwordHash = await hashPassword(data.password);

  // Create user
  const user = await userService.create({
    email: data.email,
    passwordHash,
    firstName: data.firstName,
    lastName: data.lastName,
    role: data.role as UserRole,
  });

  // Send verification email
  await emailService.sendVerificationEmail(user.id, user.email);

  // Generate tokens
  const { accessToken, refreshToken } = await jwtService.generateTokens(user);

  return successResponse({
    user: userService.sanitizeUser(user),
    accessToken,
    refreshToken,
  });
};

/**
 * Login user
 */
export const login = async (data: LoginData) => {
  // Find user
  const user = await userService.findByEmail(data.email);
  if (!user || !user.passwordHash) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Verify password
  const isValid = await comparePassword(data.password, user.passwordHash);
  if (!isValid) {
    throw new AuthenticationError('Invalid email or password');
  }

  // Check if user is banned
  if (user.status === 'BANNED') {
    throw new AuthenticationError('Your account has been banned');
  }

  // Check MFA
  if (user.mfaEnabled) {
    // Return temporary token for MFA verification
    const tempToken = await jwtService.generateTempToken(user.id);
    return successResponse({
      requiresMFA: true,
      tempToken,
    });
  }

  // Generate tokens
  const { accessToken, refreshToken } = await jwtService.generateTokens(user);

  return successResponse({
    user: userService.sanitizeUser(user),
    accessToken,
    refreshToken,
  });
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken: string) => {
  const tokens = await jwtService.refreshAccessToken(refreshToken);
  return successResponse(tokens);
};

/**
 * Logout user
 */
export const logout = async (sessionId: string) => {
  await sessionService.deleteSession(sessionId);
};

/**
 * Forgot password
 */
export const forgotPassword = async (email: string) => {
  const user = await userService.findByEmail(email);
  if (!user) {
    // Don't reveal if user exists
    return;
  }

  await emailService.sendPasswordResetEmail(user.id, user.email);
};

/**
 * Reset password
 */
export const resetPassword = async (token: string, newPassword: string) => {
  const userId = await emailService.verifyPasswordResetToken(token);
  
  const passwordHash = await hashPassword(newPassword);
  await userService.updatePassword(userId, passwordHash);
  
  // Invalidate all sessions
  await sessionService.deleteAllUserSessions(userId);
};

/**
 * Verify email
 */
export const verifyEmail = async (token: string) => {
  const userId = await emailService.verifyEmailToken(token);
  await userService.markEmailVerified(userId);
};

/**
 * Enable MFA
 */
export const enableMFA = async (userId: string, password: string) => {
  const user = await userService.findById(userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  // Verify password
  if (!user.passwordHash) {
    throw new BusinessLogicError('Cannot enable MFA for OAuth users');
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw new AuthenticationError('Invalid password');
  }

  // Generate MFA secret
  const { secret, qrCode } = await mfaService.generateMFASecret(user.email);
  
  // Save secret (but don't enable yet)
  await userService.saveMFASecret(userId, secret);

  return successResponse({
    secret,
    qrCode,
  });
};

/**
 * Verify MFA
 */
export const verifyMFA = async (userId: string, token: string) => {
  const user = await userService.findById(userId);
  if (!user || !user.mfaSecret) {
    throw new NotFoundError('User');
  }

  const isValid = mfaService.verifyMFAToken(user.mfaSecret, token);
  if (!isValid) {
    throw new AuthenticationError('Invalid MFA token');
  }

  // Enable MFA
  await userService.enableMFA(userId);
};

/**
 * Disable MFA
 */
export const disableMFA = async (userId: string) => {
  await userService.disableMFA(userId);
};

/**
 * Get current user
 */
export const getCurrentUser = async (userId: string) => {
  const user = await userService.findById(userId);
  if (!user) {
    throw new NotFoundError('User');
  }

  return userService.sanitizeUser(user);
};
