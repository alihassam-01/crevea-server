import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requirePermission, Permission, ShopCategory, UserRole, UserStatus, validate } from '@crevea/shared';
import * as adminController from '../controllers/admin.controller';
import { EXECUTIVE_CONTENT_KEYS } from '../admin.constants';

const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const userQuery = pageQuery.extend({
  search: z.string().trim().min(1).optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

const orderQuery = pageQuery.extend({
  search: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
  customerId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const earningsQuery = pageQuery.extend({
  vendorId: z.string().uuid().optional(),
  shopId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const createVendorSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
});

const vendorShopSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.nativeEnum(ShopCategory),
  logo: z.string().url().optional(),
  banner: z.string().url().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.record(z.string(), z.unknown()).optional(),
  socialLinks: z.record(z.string(), z.unknown()).optional(),
});

const updateUserSchema = z.object({
  status: z.nativeEnum(UserStatus).optional(),
  role: z.nativeEnum(UserRole).optional(),
}).refine(data => data.status !== undefined || data.role !== undefined, 'At least one user field is required');

const contentSchema = z.object({
  key: z.enum([
    EXECUTIVE_CONTENT_KEYS.PRIVACY_POLICY,
    EXECUTIVE_CONTENT_KEYS.TERMS_AND_CONDITIONS,
    EXECUTIVE_CONTENT_KEYS.VENDOR_POLICY,
  ]),
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  published: z.boolean().default(false),
});

export default async function adminRoutes(server: FastifyInstance) {
  const executive = [authenticate, requirePermission(Permission.ADMIN_DASHBOARD)];

  server.get('/dashboard', { preHandler: executive }, async (_request, reply) => reply.send(await adminController.getDashboardStats()));

  server.get('/users', { preHandler: [authenticate, requirePermission(Permission.USER_READ)] }, async (request, reply) => {
    const query = validate(userQuery, request.query);
    return reply.send(await adminController.getUsers({ ...query, page: query.page ?? 1, limit: query.limit ?? 20 }));
  });

  server.patch('/users/:id', { preHandler: [authenticate, requirePermission(Permission.USER_WRITE)] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    return reply.send(await adminController.updateUser(id, validate(updateUserSchema, request.body)));
  });

  server.get('/vendors', { preHandler: executive }, async (request, reply) => {
    const query = validate(userQuery.omit({ role: true }), request.query);
    return reply.send(await adminController.getVendors({ ...query, page: query.page ?? 1, limit: query.limit ?? 20 }));
  });

  server.post('/vendors', { preHandler: [authenticate, requirePermission(Permission.USER_WRITE)] }, async (request, reply) => {
    return reply.status(201).send(await adminController.createVendor(validate(createVendorSchema, request.body)));
  });

  server.post('/vendors/:vendorId/shops', { preHandler: [authenticate, requirePermission(Permission.SHOP_WRITE)] }, async (request, reply) => {
    const { vendorId } = request.params as { vendorId: string };
    return reply.status(201).send(await adminController.createVendorShop(vendorId, validate(vendorShopSchema, request.body)));
  });

  server.get('/orders', { preHandler: executive }, async (request, reply) => {
    const query = validate(orderQuery, request.query);
    return reply.send(await adminController.getOrders({ ...query, page: query.page ?? 1, limit: query.limit ?? 20 }));
  });

  server.get('/revenue', { preHandler: executive }, async (request, reply) => {
    const query = validate(orderQuery.omit({ page: true, limit: true, search: true, customerId: true }), request.query);
    return reply.send(await adminController.getRevenue(query));
  });

  server.get('/earnings', { preHandler: executive }, async (request, reply) => {
    const query = validate(earningsQuery, request.query);
    return reply.send(await adminController.getVendorEarnings({ ...query, page: query.page ?? 1, limit: query.limit ?? 20 }));
  });

  server.get('/vendors/:vendorId/analytics', { preHandler: executive }, async (request, reply) => {
    const { vendorId } = request.params as { vendorId: string };
    const query = validate(orderQuery.omit({ page: true, limit: true, search: true, status: true, customerId: true }), request.query);
    return reply.send(await adminController.getVendorAnalytics(vendorId, query.from, query.to));
  });

  server.get('/shops/pending', { preHandler: [authenticate, requirePermission(Permission.SHOP_APPROVE)] }, async (request, reply) => {
    const query = validate(pageQuery, request.query);
    return reply.send(await adminController.getPendingShops({ page: query.page ?? 1, limit: query.limit ?? 20 }));
  });

  server.get('/reviews/pending', { preHandler: [authenticate, requirePermission(Permission.REVIEW_MODERATE)] }, async (request, reply) => {
    const query = validate(pageQuery, request.query);
    return reply.send(await adminController.getPendingReviews({ page: query.page ?? 1, limit: query.limit ?? 20 }));
  });

  server.get('/content/:key', { preHandler: executive }, async (request, reply) => {
    const { key } = request.params as { key: keyof typeof EXECUTIVE_CONTENT_KEYS };
    return reply.send(await adminController.getContentPage(EXECUTIVE_CONTENT_KEYS[key]));
  });

  server.put('/content/:key', { preHandler: executive }, async (request, reply) => {
    const { key } = request.params as { key: keyof typeof EXECUTIVE_CONTENT_KEYS };
    const data = validate(contentSchema.omit({ key: true }), request.body);
    return reply.send(await adminController.upsertContentPage(EXECUTIVE_CONTENT_KEYS[key], { ...data, published: data.published ?? false }, request.user!.userId));
  });

  server.get('/health/system', { preHandler: executive }, async (_request, reply) => reply.send(await adminController.getSystemHealth()));
}
