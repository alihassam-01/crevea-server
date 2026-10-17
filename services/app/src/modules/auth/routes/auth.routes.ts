import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate, emailSchema, passwordSchema } from '@crevea/shared';
import * as authController from '../controllers/auth.controller';
import { authenticate, UserRole } from '@crevea/shared';

/**
 * Register schema
 */
const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: z.enum([UserRole.CUSTOMER, UserRole.VENDOR]).default(UserRole.CUSTOMER),
});

/**
 * Login schema
 */
const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

/**
 * Refresh token schema
 */
const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

/**
 * Forgot password schema
 */
const forgotPasswordSchema = z.object({
  email: emailSchema,
});

/**
 * Reset password schema
 */
const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

/**
 * Verify email schema
 */
const verifyEmailSchema = z.object({
  token: z.string().min(1),
});

/**
 * MFA enable schema
 */
const mfaEnableSchema = z.object({
  password: z.string().min(1),
});

/**
 * MFA verify schema
 */
const mfaVerifySchema = z.object({
  token: z.string().length(6),
});

const savedAddressSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: emailSchema,
  phone: z.string().trim().regex(/^\+?[0-9\s().-]{7,20}$/),
  street: z.string().trim().min(1).max(200),
  apartment: z.string().trim().max(100).optional(),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().min(1).max(100),
  country: z.string().trim().min(1).max(100),
  postalCode: z.string().trim().min(1).max(30),
});

const updateProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(100).optional(),
  lastName: z.string().trim().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  savedAddresses: z.array(savedAddressSchema).max(10).optional(),
  vendorOnboarding: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
    documents: z.array(z.string().uuid()).length(3),
  }).optional(),
});

/**
 * Auth routes
 */
export default async function authRoutes(server: FastifyInstance) {
  // Register
  server.post('/register', async (request, reply) => {
    const data = validate(registerSchema, request.body);
    const result = await authController.register(data);
    return reply.status(201).send(result);
  });

  // Login
  server.post('/login', async (request, reply) => {
    const data = validate(loginSchema, request.body);
    const result = await authController.login(data);
    return reply.send(result);
  });

  // Refresh token
  server.post('/refresh', async (request, reply) => {
    const data = validate(refreshSchema, request.body);
    const result = await authController.refreshToken(data.refreshToken);
    return reply.send(result);
  });

  // Logout
  server.post('/logout', { preHandler: authenticate }, async (request, reply) => {
    await authController.logout(request.user!.sessionId);
    return reply.status(204).send();
  });

  // Forgot password
  server.post('/forgot-password', async (request, reply) => {
    const data = validate(forgotPasswordSchema, request.body);
    await authController.forgotPassword(data.email);
    return reply.send({ success: true, message: 'Password reset email sent' });
  });

  // Reset password
  server.post('/reset-password', async (request, reply) => {
    const data = validate(resetPasswordSchema, request.body);
    await authController.resetPassword(data.token, data.password);
    return reply.send({ success: true, message: 'Password reset successful' });
  });

  // Change password for an authenticated user. Password verification happens on the server.
  server.post('/change-password', { preHandler: authenticate }, async (request, reply) => {
    const data = validate(changePasswordSchema, request.body);
    const result = await authController.changePassword(
      request.user!.userId,
      data.currentPassword,
      data.newPassword,
    );
    return reply.send(result);
  });

  // Verify email
  server.post('/verify-email', async (request, reply) => {
    const data = validate(verifyEmailSchema, request.body);
    await authController.verifyEmail(data.token);
    return reply.send({ success: true, message: 'Email verified successfully' });
  });

  // Enable MFA
  server.post('/mfa/enable', { preHandler: authenticate }, async (request, reply) => {
    const data = validate(mfaEnableSchema, request.body);
    const result = await authController.enableMFA(request.user!.userId, data.password);
    return reply.send(result);
  });

  // Verify MFA
  server.post('/mfa/verify', { preHandler: authenticate }, async (request, reply) => {
    const data = validate(mfaVerifySchema, request.body);
    await authController.verifyMFA(request.user!.userId, data.token);
    return reply.send({ success: true, message: 'MFA verified successfully' });
  });

  // Disable MFA
  server.post('/mfa/disable', { preHandler: authenticate }, async (request, reply) => {
    await authController.disableMFA(request.user!.userId);
    return reply.send({ success: true, message: 'MFA disabled successfully' });
  });

  // Get current user
  server.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const user = await authController.getCurrentUser(request.user!.userId);
    return reply.send({ success: true, data: user });
  });

  server.put('/me', { preHandler: authenticate }, async (request, reply) => {
    const data = validate(updateProfileSchema, request.body);
    const user = await authController.updateCurrentUser(request.user!.userId, data);
    return reply.send({ success: true, data: user });
  });
}
