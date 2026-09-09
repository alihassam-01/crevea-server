import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, authorize, UserRole, validate } from '@crevea/shared';
import * as controller from '../controllers/vendor-story.controller';

const storySchema = z.object({
  title: z.string().trim().min(1).max(255),
  body: z.string().trim().min(1).max(100000),
  coverImageUrl: z.string().url().optional().or(z.literal('')),
  images: z.array(z.string().url()).max(3).default([]),
  videoUrl: z.string().url().optional().or(z.literal('')),
  published: z.boolean(),
});

export default async function vendorStoryRoutes(server: FastifyInstance) {
  server.get('/me/story', {
    preHandler: [authenticate, authorize(UserRole.VENDOR)],
  }, async (request, reply) => {
    return reply.send(await controller.getOwnStory(request.user!.userId));
  });

  server.put('/me/story', {
    preHandler: [authenticate, authorize(UserRole.VENDOR)],
  }, async (request, reply) => {
    const input = validate(storySchema, request.body);
    return reply.send(await controller.saveOwnStory(request.user!.userId, input));
  });

  server.get('/:vendorId/story', async (request, reply) => {
    const { vendorId } = request.params as { vendorId: string };
    return reply.send(await controller.getPublishedStory(vendorId));
  });
}
