import { getPool } from '../config/database';
import { generateRandomString } from '@crevea/shared';
import { addHours } from '@crevea/shared';
import { AuthenticationError } from '@crevea/shared';
import { EventType, IEvent, INotificationPayload } from '@crevea/shared';
import { publishEvent } from '../config/kafka';
import { v4 as uuidv4 } from 'uuid';
import { NotificationType, NotificationChannel } from '@crevea/shared';

/**
 * Send verification email
 */
export const sendVerificationEmail = async (userId: string, email: string): Promise<void> => {
  const pool = getPool();
  
  // Generate token
  const token = generateRandomString(32);
  const expiresAt = addHours(new Date(), 24); // 24 hours

  // Save token
  await pool.query(
    'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );

  // Publish email event
  const event: IEvent<INotificationPayload> = {
    id: uuidv4(),
    type: EventType.EMAIL_SEND,
    timestamp: new Date(),
    payload: {
      userId,
      type: 'EMAIL_VERIFICATION',
      title: 'Verify your email',
      message: `Click the link to verify your email: ${process.env.FRONTEND_URL}/verify-email?token=${token}`,
      channels: [NotificationChannel.EMAIL],
      data: { token, email },
    },
  };

  await publishEvent(event);
};

/**
 * Verify email token
 */
export const verifyEmailToken = async (token: string): Promise<string> => {
  const pool = getPool();
  
  const result = await pool.query(
    'SELECT * FROM email_verification_tokens WHERE token = $1 AND used = false',
    [token]
  );

  const tokenData = result.rows[0];
  
  if (!tokenData) {
    throw new AuthenticationError('Invalid verification token');
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    throw new AuthenticationError('Verification token expired');
  }

  // Mark token as used
  await pool.query(
    'UPDATE email_verification_tokens SET used = true WHERE id = $1',
    [tokenData.id]
  );

  return tokenData.user_id;
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (userId: string, email: string): Promise<void> => {
  const pool = getPool();
  
  // Generate token
  const token = generateRandomString(32);
  const expiresAt = addHours(new Date(), 1); // 1 hour

  // Save token
  await pool.query(
    'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [userId, token, expiresAt]
  );

  // Publish email event
  const event: IEvent<INotificationPayload> = {
    id: uuidv4(),
    type: EventType.EMAIL_SEND,
    timestamp: new Date(),
    payload: {
      userId,
      type: 'PASSWORD_RESET',
      title: 'Reset your password',
      message: `Click the link to reset your password: ${process.env.FRONTEND_URL}/reset-password?token=${token}`,
      channels: [NotificationChannel.EMAIL],
      data: { token, email },
    },
  };

  await publishEvent(event);
};

/**
 * Verify password reset token
 */
export const verifyPasswordResetToken = async (token: string): Promise<string> => {
  const pool = getPool();
  
  const result = await pool.query(
    'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = false',
    [token]
  );

  const tokenData = result.rows[0];
  
  if (!tokenData) {
    throw new AuthenticationError('Invalid reset token');
  }

  if (new Date(tokenData.expires_at) < new Date()) {
    throw new AuthenticationError('Reset token expired');
  }

  // Mark token as used
  await pool.query(
    'UPDATE password_reset_tokens SET used = true WHERE id = $1',
    [tokenData.id]
  );

  return tokenData.user_id;
};
