import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, validate } from '@crevea/shared';
import * as wishlistController from '../controllers/wishlist.controller';

const wishlistItemSchema = z.object({ productId: z.string().uuid() });

export default async function wishlistRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: authenticate }, async (request, reply) => {
    return reply.send(await wishlistController.list(request.user!.userId));
  });

  server.post('/', { preHandler: authenticate }, async (request, reply) => {
    const { productId } = validate(wishlistItemSchema, request.body);
    return reply.status(201).send(await wishlistController.add(request.user!.userId, productId));
  });

  server.delete('/:productId', { preHandler: authenticate }, async (request, reply) => {
    const { productId } = request.params as { productId: string };
    const validProductId = validate(z.string().uuid(), productId);
    return reply.send(await wishlistController.remove(request.user!.userId, validProductId));
  });
}
