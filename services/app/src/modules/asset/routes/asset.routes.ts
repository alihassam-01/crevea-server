import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, validate } from '@crevea/shared';
import * as assetService from '../services/asset.service';

const createUploadSchema = z.object({
  domain: z.enum(['users', 'shops', 'products', 'stories', 'reviews', 'orders']),
  entityId: z.string().min(1).max(100),
  assetType: z.enum(['profile', 'logo', 'banner', 'images', 'cover', 'media', 'payment-proof', 'verification']),
  contentType: z.string().min(1).max(64),
  size: z.number().int().positive(),
  checksum: z.string().regex(/^[a-f0-9]{64}$/).optional(),
});

export default async function assetRoutes(server: FastifyInstance) {
  server.post('/uploads', { preHandler: authenticate }, async (request, reply) => {
    const result = await assetService.createUpload(request.user!.userId, validate(createUploadSchema, request.body));
    return reply.status(201).send({ success: true, data: result });
  });

  server.post('/uploads/:uploadId/finalize', { preHandler: authenticate }, async (request, reply) => {
    const { uploadId } = request.params as { uploadId: string };
    const result = await assetService.finalizeUpload(request.user!.userId, uploadId);
    return reply.send({ success: true, data: result });
  });

  server.delete('/:assetId', { preHandler: authenticate }, async (request, reply) => {
    const { assetId } = request.params as { assetId: string };
    await assetService.deleteAsset(request.user!.userId, assetId);
    return reply.status(204).send();
  });
}
