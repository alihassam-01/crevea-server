import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate, authenticate, requirePermission } from '@crevea/shared';
import { Permission } from '@crevea/shared';
import * as productController from '../controllers/product.controller';

const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  type: z.enum(['PHYSICAL', 'DIGITAL']).default('PHYSICAL'),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url()),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  sku: z.string().optional(),
  weight: z.number().optional(),
  attributes: z.record(z.any()),
});

const updateProductSchema = createProductSchema.partial();

const updateInventorySchema = z.object({
  stock: z.number().int().min(0),
  lowStockThreshold: z.number().int().min(0).optional(),
});

export default async function productRoutes(server: FastifyInstance) {
  // Create product
  server.post('/', {
    preHandler: [authenticate, requirePermission(Permission.PRODUCT_WRITE)]
  }, async (request, reply) => {
    const data = validate(createProductSchema, request.body);
    const result = await productController.createProduct(request.user!.userId, data);
    return reply.status(201).send(result);
  });

  // Get product
  server.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await productController.getProduct(id);
    return reply.send(result);
  });

  // Update product
  server.put('/:id', {
    preHandler: [authenticate, requirePermission(Permission.PRODUCT_WRITE)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = validate(updateProductSchema, request.body);
    const result = await productController.updateProduct(id, request.user!.userId, data);
    return reply.send(result);
  });

  // Delete product
  server.delete('/:id', {
    preHandler: [authenticate, requirePermission(Permission.PRODUCT_DELETE)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await productController.deleteProduct(id, request.user!.userId);
    return reply.status(204).send();
  });

  // List products
  server.get('/', async (request, reply) => {
    const query = request.query as any;
    const result = await productController.listProducts(query);
    return reply.send(result);
  });

  // Get shop products
  server.get('/shop/:shopId', async (request, reply) => {
    const { shopId } = request.params as { shopId: string };
    const query = request.query as any;
    const result = await productController.getShopProducts(shopId, query);
    return reply.send(result);
  });

  // Update inventory
  server.put('/:id/inventory', {
    preHandler: [authenticate, requirePermission(Permission.PRODUCT_WRITE)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = validate(updateInventorySchema, request.body);
    const result = await productController.updateInventory(id, request.user!.userId, data);
    return reply.send(result);
  });

  // Add variation
  server.post('/:id/variations', {
    preHandler: [authenticate, requirePermission(Permission.PRODUCT_WRITE)]
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = request.body as any;
    const result = await productController.addVariation(id, request.user!.userId, data);
    return reply.status(201).send(result);
  });
}
