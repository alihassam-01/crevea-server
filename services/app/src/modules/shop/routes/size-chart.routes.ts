import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { validate, authenticate } from '@crevea/shared';
import * as sizeChartController from '../controllers/size-chart.controller';

const createSizeChartSchema = z.object({
  name: z.string().min(1).max(255),
  imageUrl: z.string().url(),
  category: z.string().optional(),
});

const updateSizeChartSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
});

export default async function sizeChartRoutes(server: FastifyInstance) {
  // Create size chart
  server.post('/:shopId/size-charts', { preHandler: authenticate }, async (request, reply) => {
    const { shopId } = request.params as { shopId: string };
    const data = validate(createSizeChartSchema, request.body);
    const result = await sizeChartController.createSizeChart(shopId, data, request.user!.userId);
    return reply.send(result);
  });

  // List all size charts for a shop
  server.get('/:shopId/size-charts', async (request, reply) => {
    const { shopId } = request.params as { shopId: string };
    const result = await sizeChartController.getSizeCharts(shopId);
    return reply.send(result);
  });

  // Get single size chart
  server.get('/:shopId/size-charts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const result = await sizeChartController.getSizeChart(id);
    return reply.send(result);
  });

  // Update size chart
  server.put('/:shopId/size-charts/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = validate(updateSizeChartSchema, request.body);
    const result = await sizeChartController.updateSizeChart(id, data, request.user!.userId);
    return reply.send(result);
  });

  // Delete size chart
  server.delete('/:shopId/size-charts/:id', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await sizeChartController.deleteSizeChart(id, request.user!.userId);
    return reply.status(204).send();
  });
}
