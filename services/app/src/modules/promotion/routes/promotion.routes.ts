import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate, authenticate, authorize, UserRole } from '@crevea/shared';
import * as couponService from '../services/coupon.service';

const createDiscountSchema = z.object({
  code: z.string().min(3).max(50),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  minPurchaseAmount: z.number().min(0).optional(),
  maxDiscountAmount: z.number().positive().optional(),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  usageLimit: z.number().int().positive().optional(),
});

const couponSchema = z.object({
  shopId: z.string().uuid(), code: z.string().trim().min(3).max(50),
  discountType: z.enum(['PERCENTAGE', 'FIXED']), discountValue: z.number().positive(),
  minPurchaseAmount: z.number().min(0).optional(), maxDiscountAmount: z.number().positive().optional(),
  usageLimit: z.number().int().positive().optional(), startsAt: z.string().datetime().optional(), endsAt: z.string().datetime(),
});

export default async function promotionRoutes(server: FastifyInstance) {
  server.post('/coupons', { preHandler: [authenticate, authorize(UserRole.VENDOR)] }, async (request, reply) => {
    const data = validate(couponSchema, request.body);
    const result = await couponService.create(request.user!.userId, { ...data, startsAt: data.startsAt ? new Date(data.startsAt) : new Date(), endsAt: new Date(data.endsAt) });
    return reply.status(201).send(result);
  });

  server.get('/coupons', { preHandler: [authenticate, authorize(UserRole.VENDOR)] }, async (request, reply) => reply.send({ success: true, data: await couponService.listForSeller(request.user!.userId) }));
  server.delete('/coupons/:id', { preHandler: [authenticate, authorize(UserRole.VENDOR)] }, async (request, reply) => {
    await couponService.remove(request.user!.userId, (request.params as { id: string }).id);
    return reply.status(204).send();
  });

  // Validate discount code
  server.post('/coupons/validate', { preHandler: authenticate }, async (request, reply) => {
    const body = request.body as { code: string; amount: number };
    return reply.send({ success: true, data: await couponService.validateCode(body.code, body.amount) });
  });

  // Get active promotions
  server.get('/active', async (_request, reply) => {
    return reply.send({ success: true, data: [] });
  });

  // Get featured products
  server.get('/featured', async (_request, reply) => {
    return reply.send({ success: true, data: [] });
  });
}
