import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate, authenticate } from '@crevea/shared';
import * as promotionController from '../controllers/promotion.controller';

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

export default async function promotionRoutes(server: FastifyInstance) {
  // Create discount code
  server.post('/discounts', { preHandler: authenticate }, async (request, reply) => {
    const data = validate(createDiscountSchema, request.body);
    const result = await promotionController.createDiscount(data);
    return reply.status(201).send(result);
  });

  // Validate discount code
  server.post('/discounts/validate', async (request, reply) => {
    const { code } = request.body as { code: string };
    const result = await promotionController.validateDiscount(code);
    return reply.send(result);
  });

  // Get active promotions
  server.get('/active', async (request, reply) => {
    const result = await promotionController.getActivePromotions();
    return reply.send(result);
  });

  // Get featured products
  server.get('/featured', async (request, reply) => {
    const result = await promotionController.getFeaturedProducts();
    return reply.send(result);
  });
}
