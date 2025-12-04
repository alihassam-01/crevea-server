import { FastifyInstance } from 'fastify';
import { authenticate } from '@crevea/shared';
import * as walletController from '../controllers/wallet.controller';

export default async function walletRoutes(server: FastifyInstance) {
  // Get wallet
  server.get('/', { preHandler: authenticate }, async (request, reply) => {
    const result = await walletController.getWallet(request.user!.userId);
    return reply.send(result);
  });

  // Get wallet transactions
  server.get('/transactions', { preHandler: authenticate }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as any;
    const result = await walletController.getTransactions(request.user!.userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return reply.send(result);
  });
}
