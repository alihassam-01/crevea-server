import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate, authenticate, requirePermission, Permission } from '@crevea/shared';
import * as payoutController from '../controllers/payout.controller';

const approvePayoutSchema = z.object({
  approvedAmount: z.number().positive(),
  notes: z.string().optional(),
});

const rejectPayoutSchema = z.object({
  reason: z.string().min(1),
});

const updateCommissionSchema = z.object({
  commissionRate: z.number().min(0).max(100),
});

const payoutQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.string().trim().min(1).optional(),
});

export default async function payoutRoutes(server: FastifyInstance) {
  server.get('/payouts', {
    preHandler: [authenticate, requirePermission(Permission.ADMIN_DASHBOARD)]
  }, async (request, reply) => {
    const query = validate(payoutQuery, request.query);
    return reply.send(await payoutController.getPayouts({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      status: query.status,
    }));
  });

  // Get pending payouts
  server.get('/payouts/pending', {
    preHandler: [authenticate, requirePermission(Permission.ADMIN_DASHBOARD)]
  }, async (_request, reply) => {
    const result = await payoutController.getPendingPayouts();
    return reply.send(result);
  });

  // Approve payout
  server.post('/payouts/:id/approve', {
    preHandler: [authenticate, requirePermission(Permission.ADMIN_DASHBOARD)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = validate(approvePayoutSchema, request.body);
    const result = await payoutController.approvePayout(id, data, request.user!.userId);
    return reply.send(result);
  });

  // Reject payout
  server.post('/payouts/:id/reject', {
    preHandler: [authenticate, requirePermission(Permission.ADMIN_DASHBOARD)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = validate(rejectPayoutSchema, request.body);
    const result = await payoutController.rejectPayout(id, data);
    return reply.send(result);
  });

  // Complete payout
  server.post('/payouts/:id/complete', {
    preHandler: [authenticate, requirePermission(Permission.ADMIN_DASHBOARD)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await payoutController.completePayout(id);
    return reply.send(result);
  });

  // Update shop commission
  server.put('/shops/:shopId/commission', {
    preHandler: [authenticate, requirePermission(Permission.ADMIN_DASHBOARD)]
  }, async (request, reply) => {
    const { shopId } = request.params as { shopId: string };
    const data = validate(updateCommissionSchema, request.body);
    const result = await payoutController.updateShopCommission(shopId, data, request.user!.userId);
    return reply.send(result);
  });
}
