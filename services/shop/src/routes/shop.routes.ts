import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate, authenticate, authorize, requirePermission } from '@crevea/shared';
import { UserRole, Permission } from '@crevea/shared';
import * as shopController from '../controllers/shop.controller';

const createShopSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.enum(['CROCHET', 'ART', 'PAINTING', 'HANDCRAFT']),
  logo: z.string().url().optional(),
  banner: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string(),
  }).optional(),
  socialLinks: z.object({
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    twitter: z.string().url().optional(),
    website: z.string().url().optional(),
  }).optional(),
});

const updateShopSchema = createShopSchema.partial();

const verifyShopSchema = z.object({
  documents: z.array(z.string().url()).min(1),
});

export default async function shopRoutes(server: FastifyInstance) {
  // Create shop (sellers only)
  server.post('/', {
    preHandler: [authenticate, authorize(UserRole.SELLER)]
  }, async (request, reply) => {
    const data = validate(createShopSchema, request.body);
    const result = await shopController.createShop(request.user!.userId, data);
    return reply.status(201).send(result);
  });

  // Get shop by ID
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await shopController.getShop(id);
    return reply.send(result);
  });

  // Update shop
  server.put('/:id', {
    preHandler: [authenticate, requirePermission(Permission.SHOP_WRITE)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = validate(updateShopSchema, request.body);
    const result = await shopController.updateShop(id, request.user!.userId, data);
    return reply.send(result);
  });

  // Delete shop
  server.delete('/:id', {
    preHandler: [authenticate, requirePermission(Permission.SHOP_DELETE)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await shopController.deleteShop(id, request.user!.userId);
    return reply.status(204).send();
  });

  // List shops
  server.get('/', async (request, reply) => {
    const query = request.query as any;
    const result = await shopController.listShops(query);
    return reply.send(result);
  });

  // Submit verification
  server.post('/:id/verify', {
    preHandler: [authenticate, requirePermission(Permission.SHOP_WRITE)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = validate(verifyShopSchema, request.body);
    const result = await shopController.submitVerification(id, request.user!.userId, data.documents);
    return reply.send(result);
  });

  // Update shop status (admin only)
  server.put('/:id/status', {
    preHandler: [authenticate, requirePermission(Permission.SHOP_APPROVE)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status, notes } = request.body as { status: string; notes?: string };
    const result = await shopController.updateShopStatus(id, status, notes);
    return reply.send(result);
  });

  // Get shop analytics
  server.get('/:id/analytics', {
    preHandler: [authenticate, requirePermission(Permission.SHOP_READ)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { period } = request.query as { period?: string };
    const result = await shopController.getAnalytics(id, period || 'month');
    return reply.send(result);
  });

  // Get seller's shops
  server.get('/seller/my-shops', {
    preHandler: [authenticate, authorize(UserRole.SELLER)]
  }, async (request, reply) => {
    const result = await shopController.getSellerShops(request.user!.userId);
    return reply.send(result);
  });
}
