import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, authorize, OrderStatus, UserRole, validate } from '@crevea/shared';
import * as productController from '../../product/controllers/product.controller';
import * as shopController from '../controllers/shop.controller';
import * as shopService from '../services/shop.service';
import * as vendorService from '../services/vendor.service';

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const orderQuery = pageQuery.extend({
  status: z.string().min(1).optional(),
  search: z.string().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const productSchema = z.object({
  shopId: z.string().uuid().optional(),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  type: z.enum(['PHYSICAL', 'DIGITAL']).default('PHYSICAL'),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  images: z.array(z.string().url()).default([]),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  sku: z.string().optional(),
  weight: z.number().optional(),
  attributes: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

const updateProductSchema = productSchema.omit({ shopId: true }).partial();
const statusSchema = z.object({ status: z.nativeEnum(OrderStatus) });
const orderEditSchema = z.object({ trackingNumber: z.string().max(255).optional() });
const messageSchema = z.object({ body: z.string().min(1).max(5000) });

export default async function vendorRoutes(server: FastifyInstance) {
  const vendorOnly = [authenticate, authorize(UserRole.VENDOR)];

  server.get('/shops', { preHandler: vendorOnly }, async (request, reply) => {
    return reply.send({ success: true, data: await shopService.findBySeller(request.user!.userId) });
  });

  server.post('/shops', { preHandler: vendorOnly }, async (request, reply) => {
    return reply.status(201).send(await shopController.createShop(request.user!.userId, request.body));
  });

  server.post('/products', { preHandler: vendorOnly }, async (request, reply) => {
    const data = validate(productSchema, request.body);
    return reply.status(201).send(await productController.createProduct(request.user!.userId, data));
  });

  server.put('/products/:id', { preHandler: vendorOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send(await productController.updateProduct(id, request.user!.userId, validate(updateProductSchema, request.body)));
  });

  server.delete('/products/:id', { preHandler: vendorOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await productController.deleteProduct(id, request.user!.userId);
    return reply.status(204).send();
  });

  server.put('/products/:id/inventory', { preHandler: vendorOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = z.object({ stock: z.number().int().min(0), lowStockThreshold: z.number().int().min(0).optional() });
    return reply.send(await productController.updateInventory(id, request.user!.userId, validate(data, request.body)));
  });

  server.get('/orders', { preHandler: vendorOnly }, async (request, reply) => {
    const query = validate(orderQuery, request.query);
    return reply.send(await vendorService.listOrders({ ...query, page: query.page ?? 1, limit: query.limit ?? 20, vendorId: request.user!.userId }));
  });

  server.get('/orders/:id', { preHandler: vendorOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send(await vendorService.getOrder(request.user!.userId, id));
  });

  server.post('/orders/:id/accept', { preHandler: vendorOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send(await vendorService.acceptOrder(request.user!.userId, id));
  });

  server.patch('/orders/:id/status', { preHandler: vendorOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = validate(statusSchema, request.body);
    return reply.send(await vendorService.updateOrderStatus(request.user!.userId, id, status));
  });

  server.patch('/orders/:id', { preHandler: vendorOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send(await vendorService.editOrder(request.user!.userId, id, validate(orderEditSchema, request.body)));
  });

  server.get('/orders/:id/messages', { preHandler: vendorOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = validate(pageQuery, request.query);
    return reply.send(await vendorService.listMessages(request.user!.userId, id, query.page ?? 1, query.limit ?? 20));
  });

  server.post('/orders/:id/messages', { preHandler: vendorOnly }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const { body } = validate(messageSchema, request.body);
    return reply.status(201).send(await vendorService.createMessage(request.user!.userId, id, body));
  });
}
