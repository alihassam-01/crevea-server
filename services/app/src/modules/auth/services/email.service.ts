import { getPasswordResetTokenRepository, getEmailVerificationTokenRepository } from '../../../database';
import { createLogger } from '@crevea/shared';
import { v4 as uuidv4 } from 'uuid';
import { addHours } from '@crevea/shared';
import { randomInt } from 'crypto';
import { sendEmail as sendTransactionalEmail } from '../../email/services/email.service';
import { frontendUrl } from '../../../frontend';

const logger = createLogger('email-service');

// Placeholder for actual email sending
// In production, integrate with SendGrid, AWS SES, or similar
const sendEmail = async (to: string, subject: string, _html: string): Promise<void> => {
  logger.info(`Sending email to ${to}: ${subject}`);
  // TODO: Implement actual email sending
};

export const sendVerificationEmail = async (userId: string, email: string): Promise<void> => {
  const tokenRepo = getEmailVerificationTokenRepository();

  // Generate token
  const token = uuidv4();
  const expiresAt = addHours(new Date(), 24); // 24 hours

  // Save token
  const verificationToken = tokenRepo.create({
    userId,
    token,
    expiresAt,
    used: false,
  });

  await tokenRepo.save(verificationToken);

  // Send email
  const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;
  await sendEmail(
    email,
    'Verify your email',
    `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`
  );
};

export const sendPasswordResetEmail = async (userId: string, email: string): Promise<void> => {
  const tokenRepo = getPasswordResetTokenRepository();

  // Generate token
  const token = randomInt(100000, 1000000).toString();
  const expiresAt = addHours(new Date(), 1); // 1 hour

  // Save token
  const resetToken = tokenRepo.create({
    userId,
    token,
    expiresAt,
    used: false,
  });

  await tokenRepo.save(resetToken);

  await sendTransactionalEmail({
    to: email,
    subject: 'Your Crevea password reset code',
    text: `Your Crevea password reset code is ${token}. It expires in one hour.`,
    html: `<p>Your Crevea password reset code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:6px">${token}</p><p>This code expires in one hour.</p>`,
  });
};

export const verifyEmailToken = async (token: string): Promise<string> => {
  const tokenRepo = getEmailVerificationTokenRepository();

  const verificationToken = await tokenRepo.findOne({
    where: { token, used: false },
  });

  if (!verificationToken) {
    throw new Error('Invalid or expired token');
  }

  if (verificationToken.expiresAt < new Date()) {
    throw new Error('Token has expired');
  }

  // Mark as used
  await tokenRepo.update(verificationToken.id, { used: true });

  return verificationToken.userId;
};

export const verifyPasswordResetToken = async (token: string): Promise<string> => {
  const tokenRepo = getPasswordResetTokenRepository();

  const resetToken = await tokenRepo.findOne({
    where: { token, used: false },
  });

  if (!resetToken) {
    throw new Error('Invalid or expired token');
  }

  if (resetToken.expiresAt < new Date()) {
    throw new Error('Token has expired');
  }

  // Mark as used
  await tokenRepo.update(resetToken.id, { used: true });

  return resetToken.userId;
};
