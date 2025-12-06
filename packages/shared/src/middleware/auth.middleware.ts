import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthenticationError, AuthorizationError } from '../errors';
import { verifyToken } from '../utils/security';
import { UserRole, Permission, ROLE_PERMISSIONS } from '../types';

/**
 * Extend FastifyRequest to include user
 */
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string;
      email: string;
      role: UserRole;
      sessionId: string;
    };
  }
}

/**
 * Authentication Middleware
 */
export const authenticate = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  try {
    const authHeader = request.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET!;
    
    const payload = verifyToken(token, secret);
    
    if (!payload) {
      throw new AuthenticationError('Invalid or expired token');
    }

    request.user = payload;
    // Normalize role to uppercase string to avoid casing issues
    if (request.user && typeof request.user.role === 'string') {
      request.user.role = request.user.role.toString().toUpperCase() as any;
    }
    // Debug log: show authenticated payload (safe to log id and role)
    console.log('[auth] user payload set:', {
      userId: request.user.userId,
      email: request.user.email,
      role: request.user.role,
      sessionId: request.user.sessionId,
    });
  } catch (error) {
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw new AuthenticationError('Authentication failed');
  }
};

/**
 * Authorization Middleware Factory
 */
export const authorize = (...roles: UserRole[]) => {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.user) {
      throw new AuthenticationError('User not authenticated');
    }

    // Debug log: who is required and what the user has
    console.log('[auth] authorize check. required:', roles, 'userRole:', request.user.role);

    if (!roles.includes(request.user.role)) {
      throw new AuthorizationError(
        `Access denied. Required roles: ${roles.join(', ')}`
      );
    }
  };
};

/**
 * Permission-based Authorization
 */
export const requirePermission = (...permissions: Permission[]) => {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.user) {
      throw new AuthenticationError('User not authenticated');
    }

    const userPermissions = ROLE_PERMISSIONS[request.user.role];
    
    const hasPermission = permissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      throw new AuthorizationError(
        `Missing required permissions: ${permissions.join(', ')}`
      );
    }
  };
};

/**
 * Optional Authentication (doesn't throw if no token)
 */
export const optionalAuth = async (
  request: FastifyRequest,
  _reply: FastifyReply
) => {
  try {
    const authHeader = request.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const secret = process.env.JWT_SECRET!;
      const payload = verifyToken(token, secret);
      
      if (payload) {
        request.user = payload;
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
};
