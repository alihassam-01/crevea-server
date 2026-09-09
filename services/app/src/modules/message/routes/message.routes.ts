import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, validate } from '@crevea/shared';
import * as messageService from '../services/message.service';

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const messageSchema = z.object({ body: z.string().trim().min(1).max(5000) });

export default async function messageRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: authenticate }, async (request, reply) => {
    const query = validate(pageQuery, request.query);
    return reply.send(await messageService.listForUser(request.user!.userId, query.page ?? 1, query.limit ?? 50));
  });

  server.get('/orders/:orderId', { preHandler: authenticate }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const query = validate(pageQuery, request.query);
    return reply.send(await messageService.listForOrder(request.user!.userId, orderId, query.page ?? 1, query.limit ?? 50));
  });

  server.post('/orders/:orderId', { preHandler: authenticate }, async (request, reply) => {
    const { orderId } = request.params as { orderId: string };
    const { body } = validate(messageSchema, request.body);
    return reply.status(201).send(await messageService.send(request.user!.userId, orderId, body));
  });
}
