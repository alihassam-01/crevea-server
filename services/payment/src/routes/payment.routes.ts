import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate, authenticate } from '@crevea/shared';
import * as paymentController from '../controllers/payment.controller';

const processPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  method: z.enum(['CARD', 'CASH_ON_DELIVERY', 'BANK_TRANSFER', 'WALLET']),
});

export default async function paymentRoutes(server: FastifyInstance) {
  // Process payment
  server.post('/process', { preHandler: authenticate }, async (request, reply) => {
    const data = validate(processPaymentSchema, request.body);
    const result = await paymentController.processPayment(data.paymentId, data.method as any, request.user!.userId);
    return reply.send(result);
  });

  // Get payment
  server.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await paymentController.getPayment(id, request.user!.userId);
    return reply.send(result);
  });

  // Get payment by order
  server.get('/order/:orderId', { preHandler: authenticate }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const result = await paymentController.getPaymentByOrder(orderId, request.user!.userId);
    return reply.send(result);
  });

  // PayFast webhook
  server.post('/payfast/notify', async (request, reply) => {
    await paymentController.handlePayFastNotification(request.body);
    return reply.status(200).send();
  });
}
