import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate, authenticate } from '@crevea/shared';
import * as cartController from '../controllers/cart.controller';

export const addItemSchema = z.object({
  productId: z.string().uuid(),
  shopId: z.string().uuid().optional(),
  variationId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  productName: z.string(),
  productImage: z.string().url().optional(),
});

export default async function cartRoutes(server: FastifyInstance) {
  // Get cart
  server.get('/', { preHandler: authenticate }, async (request, reply) => {
    const result = await cartController.getCart(request.user!.userId);
    return reply.send(result);
  });

  // Add item to cart
  server.post('/items', { preHandler: authenticate }, async (request, reply) => {
    const data = validate(addItemSchema, request.body);
    const result = await cartController.addItem(request.user!.userId, data);
    return reply.send(result);
  });

  // Update cart item
  server.put('/items/:productId', { preHandler: authenticate }, async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const { quantity, variationId } = request.body as { quantity: number; variationId?: string };
    const result = await cartController.updateItem(request.user!.userId, productId, quantity, variationId);
    return reply.send(result);
  });

  // Remove cart item
  server.delete('/items/:productId', { preHandler: authenticate }, async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const { variationId } = request.query as { variationId?: string };
    const result = await cartController.removeItem(request.user!.userId, productId, variationId);
    return reply.send(result);
  });

  // Clear cart
  server.delete('/', { preHandler: authenticate }, async (request, reply) => {
    await cartController.clearCart(request.user!.userId);
    return reply.status(204).send();
  });
}
