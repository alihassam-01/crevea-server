import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate, authenticate, requirePermission } from '@crevea/shared';
import { Permission } from '@crevea/shared';
import * as reviewController from '../controllers/review.controller';

const createReviewSchema = z.object({
  type: z.enum(['PRODUCT', 'SHOP']),
  targetId: z.string().uuid(),
  orderId: z.string().uuid().optional(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  comment: z.string().optional(),
  images: z.array(z.string().url()).optional(),
});

export default async function reviewRoutes(server: FastifyInstance) {
  // Create review
  server.post('/', { preHandler: authenticate }, async (request, reply) => {
    const data = validate(createReviewSchema, request.body);
    const result = await reviewController.createReview(request.user!.userId, data);
    return reply.status(201).send(result);
  });

  // Get reviews for target (product/shop)
  server.get('/target/:targetId', async (request, reply) => {
    const { targetId } = request.params as { targetId: string };
    const { page = 1, limit = 20 } = request.query as any;
    const result = await reviewController.getReviews(targetId, {
      page: parseInt(page),
      limit: parseInt(limit),
    });
    return reply.send(result);
  });

  // Approve review (admin)
  server.put('/:id/approve', {
    preHandler: [authenticate, requirePermission(Permission.REVIEW_MODERATE)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await reviewController.approveReview(id);
    return reply.send(result);
  });

  // Reject review (admin)
  server.put('/:id/reject', {
    preHandler: [authenticate, requirePermission(Permission.REVIEW_MODERATE)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await reviewController.rejectReview(id);
    return reply.send(result);
  });
}
