import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate, authenticate } from '@crevea/shared';
import * as sellerController from '../controllers/seller.controller';

const payoutRequestSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.string(),
  paymentDetails: z.object({
    accountNumber: z.string().optional(),
    bankName: z.string().optional(),
    accountHolder: z.string().optional(),
  }).optional(),
});

export default async function sellerRoutes(server: FastifyInstance) {
  // Get seller balance
  server.get('/:shopId/earnings/balance', { preHandler: authenticate }, async (request, reply) => {
    const { shopId } = request.params as { shopId: string };
    const result = await sellerController.getBalance(shopId);
    return reply.send(result);
  });

  // Get earnings history
  server.get('/:shopId/earnings/history', { preHandler: authenticate }, async (request, reply) => {
    const { shopId } = request.params as { shopId: string };
    const { page = 1, limit = 20 } = request.query as Record<string, string | undefined>;
    const result = await sellerController.getEarningsHistory(shopId, parseInt(String(page)), parseInt(String(limit)));
    return reply.send(result);
  });

  // Request payout
  server.post('/:shopId/payouts/request', { preHandler: authenticate }, async (request, reply) => {
    const { shopId } = request.params as { shopId: string };
    const data = validate(payoutRequestSchema, request.body);
    const result = await sellerController.requestPayout(shopId, data);
    return reply.send(result);
  });

  // Get payout history
  server.get('/:shopId/payouts', { preHandler: authenticate }, async (request, reply) => {
    const { shopId } = request.params as { shopId: string };
    const result = await sellerController.getPayouts(shopId);
    return reply.send(result);
  });
}
