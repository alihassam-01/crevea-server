import { FastifyInstance } from 'fastify';
import { authenticate, requirePermission } from '@crevea/shared';
import { Permission } from '@crevea/shared';
import * as adminController from '../controllers/admin.controller';

export default async function adminRoutes(server: FastifyInstance) {
  // Dashboard stats
  server.get('/dashboard', {
    preHandler: [authenticate, requirePermission(Permission.ADMIN_ACCESS)]
  }, async (request, reply) => {
    const result = await adminController.getDashboardStats();
    return reply.send(result);
  });

  // User management
  server.get('/users', {
    preHandler: [authenticate, requirePermission(Permission.USER_MANAGE)]
  }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as any;
    const result = await adminController.getUsers({ page: parseInt(page), limit: parseInt(limit) });
    return reply.send(result);
  });

  // Shop moderation
  server.get('/shops/pending', {
    preHandler: [authenticate, requirePermission(Permission.SHOP_MODERATE)]
  }, async (request, reply) => {
    const result = await adminController.getPendingShops();
    return reply.send(result);
  });

  // Review moderation
  server.get('/reviews/pending', {
    preHandler: [authenticate, requirePermission(Permission.REVIEW_MODERATE)]
  }, async (request, reply) => {
    const result = await adminController.getPendingReviews();
    return reply.send(result);
  });

  // System health
  server.get('/health/system', {
    preHandler: [authenticate, requirePermission(Permission.ADMIN_ACCESS)]
  }, async (request, reply) => {
    const result = await adminController.getSystemHealth();
    return reply.send(result);
  });
}
