import { generateToken, verifyToken } from '@crevea/shared';
import { IUser, IJWTPayload } from '@crevea/shared';
import { AuthenticationError } from '@crevea/shared';
import * as sessionService from './session.service';

/**
 * Generate access and refresh tokens
 */
export const generateTokens = async (user: IUser) => {
  // Create session
  const session = await sessionService.createSession(user.id);

  // Generate access token
  const payload: IJWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId: session.id,
  };

  const accessToken = generateToken(
    payload,
    process.env.JWT_SECRET!,
    process.env.JWT_EXPIRES_IN || '15m'
  );

  const refreshToken = session.refreshToken;

  return { accessToken, refreshToken };
};

/**
 * Generate temporary token for MFA
 */
export const generateTempToken = async (userId: string): Promise<string> => {
  const payload = {
    userId,
    temp: true,
  };

  return generateToken(
    payload as any,
    process.env.JWT_SECRET!,
    '5m'
  );
};

/**
 * Refresh access token
 */
export const refreshAccessToken = async (refreshToken: string) => {
  // Verify refresh token exists in database
  const session = await sessionService.findByRefreshToken(refreshToken);
  
  if (!session) {
    throw new AuthenticationError('Invalid refresh token');
  }

  // Check if session expired
  if (new Date(session.expiresAt) < new Date()) {
    await sessionService.deleteSession(session.id);
    throw new AuthenticationError('Refresh token expired');
  }

  // Get user
  const { findById } = await import('./user.service');
  const user = await findById(session.userId);
  
  if (!user) {
    throw new AuthenticationError('User not found');
  }

  // Generate new access token
  const payload: IJWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId: session.id,
  };

  const accessToken = generateToken(
    payload,
    process.env.JWT_SECRET!,
    process.env.JWT_EXPIRES_IN || '15m'
  );

  return { accessToken, refreshToken };
};
