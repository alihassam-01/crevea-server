import { FastifyInstance } from 'fastify';
import { authenticate, requirePermission, Permission } from '@crevea/shared';
import * as payoutService from '../services/payout.service';
import * as commissionService from '../services/commission.service';

export default async function adminShopRoutes(server: FastifyInstance) {
  // Admin endpoints that communicate with shop service for internal operations

  // Get pending payouts (internal)
  server.get('/payouts/pending', {
    preHandler: [authenticate, requirePermission(Permission.ADMIN_DASHBOARD)]
  }, async (_request, reply) => {
    const payouts = await payoutService.getPendingPayouts();
    return reply.send(payouts);
  });

  // Approve payout (internal)
  server.post('/payouts/:id/approve', {
    preHandler: [authenticate, requirePermission(Permission.ADMIN_DASHBOARD)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { approvedAmount, notes } = request.body as any;
    const result = await payoutService.approvePayout(id, approvedAmount, request.user!.userId, notes);
    return reply.send(result);
  });

  // Reject payout (internal)
  server.post('/payouts/:id/reject', {
    preHandler: [authenticate, requirePermission(Permission.ADMIN_DASHBOARD)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason } = request.body as any;
    await payoutService.rejectPayout(id, reason);
    return reply.status(204).send();
  });

  // Complete payout (internal)
  server.post('/payouts/:id/complete', {
    preHandler: [authenticate, requirePermission(Permission.ADMIN_DASHBOARD)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await payoutService.completePayout(id);
    return reply.send(result);
  });

  // Update shop commission (internal)
  server.put('/shops/:shopId/commission', {
    preHandler: [authenticate, requirePermission(Permission.ADMIN_DASHBOARD)]
  }, async (request, reply) => {
    const { shopId } = request.params as { shopId: string };
    const { commissionRate } = request.body as any;
    await commissionService.updateShopCommission(shopId, commissionRate, request.user!.userId);
    return reply.status(204).send();
  });
}
