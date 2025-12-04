import { FastifyInstance } from 'fastify';
import { authenticate } from '@crevea/shared';
import * as notificationController from '../controllers/notification.controller';

export default async function notificationRoutes(server: FastifyInstance) {
  // Get user notifications
  server.get('/', { preHandler: authenticate }, async (request, reply) => {
    const { page = 1, limit = 20, unreadOnly } = request.query as any;
    const result = await notificationController.getNotifications(request.user!.userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      unreadOnly: unreadOnly === 'true',
    });
    return reply.send(result);
  });

  // Mark notification as read
  server.put('/:id/read', { preHandler: authenticate }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await notificationController.markAsRead(id, request.user!.userId);
    return reply.status(204).send();
  });

  // Mark all as read
  server.put('/read-all', { preHandler: authenticate }, async (request, reply) => {
    await notificationController.markAllAsRead(request.user!.userId);
    return reply.status(204).send();
  });

  // WebSocket for real-time notifications
  server.get('/ws', { websocket: true }, async (connection, _request) => {
    // In production, authenticate WebSocket connection
    connection.socket.on('message', (message) => {
      // Handle incoming messages
      console.log('Received:', message.toString());
    });

    connection.socket.send(JSON.stringify({ type: 'connected', message: 'WebSocket connected' }));
  });
}
