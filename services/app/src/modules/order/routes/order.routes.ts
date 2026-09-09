import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate, authenticate, authorize, UserRole } from '@crevea/shared';
import * as orderController from '../controllers/order.controller';

const createOrderSchema = z.object({
  shippingAddress: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string().trim().regex(/^\+?[0-9\s().-]{7,20}$/, 'Invalid phone number'),
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
  couponCode: z.string().trim().min(3).max(50).optional(),
});

export default async function orderRoutes(server: FastifyInstance) {
  // Create order from cart
  server.post('/', { preHandler: [authenticate, authorize(UserRole.CUSTOMER)] }, async (request, reply) => {
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

  server.put('/:id/payment-proof', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = validate(z.object({ assetId: z.string().uuid() }), request.body);
    return reply.send(await orderController.attachPaymentProof(id, body.assetId, request.user!.userId));
  });

  // Get user orders
  server.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query as Record<string, string | undefined>;
    const result = await orderController.getUserOrders(request.user!.userId, {
      page: parseInt(String(page)),
      limit: parseInt(String(limit)),
    });
    return reply.send(result);
  });

  // Update order status
  server.put('/:id/status', { preHandler: [authenticate, authorize(UserRole.EXECUTIVE)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    const result = await orderController.updateOrderStatus(id, status, request.user!.userId, request.user!.role);
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
