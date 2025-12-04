import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate, authenticate } from '@crevea/shared';
import * as orderController from '../controllers/order.controller';

const createOrderSchema = z.object({
  shippingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    street: z.string(),
    apartment: z.string().optional(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string(),
  }),
  billingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    street: z.string(),
    apartment: z.string().optional(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string(),
  }).optional(),
  paymentMethod: z.enum(['CARD', 'CASH_ON_DELIVERY', 'BANK_TRANSFER', 'WALLET']),
});

export default async function orderRoutes(server: FastifyInstance) {
  // Create order from cart
  server.post('/', { preHandler: authenticate }, async (request, reply) => {
    const data = validate(createOrderSchema, request.body);
    const result = await orderController.createOrder(request.user!.userId, data);
    return reply.status(201).send(result);
  });

  // Get order
  server.get('/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await orderController.getOrder(id, request.user!.userId);
    return reply.send(result);
  });

  // Get user orders
  server.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as any;
    const result = await orderController.getUserOrders(request.user!.userId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return reply.send(result);
  });

  // Update order status
  server.put('/:id/status', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    const result = await orderController.updateOrderStatus(id, status, request.user!.userId);
    return reply.send(result);
  });

  // Cancel order
  server.post('/:id/cancel', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { reason } = request.body as { reason: string };
    const result = await orderController.cancelOrder(id, request.user!.userId, reason);
    return reply.send(result);
  });

  // Get order tracking
  server.get('/:id/tracking', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await orderController.getOrderTracking(id, request.user!.userId);
    return reply.send(result);
  });
}
