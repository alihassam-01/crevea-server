import 'reflect-metadata';
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import websocket from '@fastify/websocket';
import { createLogger, errorHandler, notFoundHandler, getEventBus, EventType } from '@crevea/shared';

import authRoutes from './modules/auth/routes/auth.routes';
import oauthRoutes from './modules/auth/routes/oauth.routes';
import shopRoutes from './modules/shop/routes/shop.routes';
import sizeChartRoutes from './modules/shop/routes/size-chart.routes';
import sellerRoutes from './modules/shop/routes/seller.routes';
import productRoutes from './modules/product/routes/product.routes';
import orderRoutes from './modules/order/routes/order.routes';
import cartRoutes from './modules/order/routes/cart.routes';
import paymentRoutes from './modules/payment/routes/payment.routes';
import walletRoutes from './modules/payment/routes/wallet.routes';
import notificationRoutes from './modules/notification/routes/notification.routes';
import reviewRoutes from './modules/review/routes/review.routes';
import adminRoutes from './modules/admin/routes/admin.routes';
import payoutRoutes from './modules/admin/routes/payout.routes';
import promotionRoutes from './modules/promotion/routes/promotion.routes';
import { handleOrderCreated, toOrderCreatedEvent } from './modules/payment/handlers/order.handler';
import { handleAllEvents } from './modules/notification/handlers/event.handler';
import { handleEmailEvents } from './modules/email/handlers/email.handler';
import { initDatabase } from './database';
import { initRedis } from './redis';

const logger = createLogger('crevea-app');
const port = parseInt(process.env.PORT || '3000', 10);

export async function buildServer() {
  const server = Fastify({ logger: false, trustProxy: true });
  await server.register(cors, { origin: process.env.FRONTEND_URL || 'http://localhost:9011', credentials: true });
  await server.register(helmet, { contentSecurityPolicy: false });
  await server.register(websocket);

  server.get('/health', async () => ({ status: 'ok', service: 'crevea', timestamp: new Date().toISOString() }));

  await server.register(authRoutes, { prefix: '/api/auth' });
  await server.register(oauthRoutes, { prefix: '/api/oauth' });
  await server.register(shopRoutes, { prefix: '/api/shops' });
  await server.register(sizeChartRoutes, { prefix: '/api/shops' });
  await server.register(sellerRoutes, { prefix: '/api/shops' });
  await server.register(productRoutes, { prefix: '/api/products' });
  await server.register(orderRoutes, { prefix: '/api/orders' });
  await server.register(cartRoutes, { prefix: '/api/cart' });
  await server.register(paymentRoutes, { prefix: '/api/payments' });
  await server.register(walletRoutes, { prefix: '/api/wallet' });
  await server.register(notificationRoutes, { prefix: '/api/notifications' });
  await server.register(reviewRoutes, { prefix: '/api/reviews' });
  await server.register(adminRoutes, { prefix: '/api/admin' });
  await server.register(payoutRoutes, { prefix: '/api/admin' });
  await server.register(promotionRoutes, { prefix: '/api/promotions' });

  server.setErrorHandler(errorHandler);
  server.setNotFoundHandler(notFoundHandler);
  return server;
}

async function start() {
  try {
    await initDatabase();
    await initRedis();

    const events = getEventBus();
    await events.connect();
    await events.subscribe([EventType.ORDER_CREATED], async (event) => {
      const orderEvent = toOrderCreatedEvent(event);
      if (orderEvent) await handleOrderCreated(orderEvent);
    });
    await events.subscribe([EventType.ORDER_CREATED, EventType.ORDER_CONFIRMED, EventType.ORDER_SHIPPED, EventType.ORDER_DELIVERED, EventType.PAYMENT_COMPLETED, EventType.SHOP_APPROVED, EventType.SHOP_REJECTED], handleAllEvents);
    await events.subscribe([EventType.EMAIL_SEND], handleEmailEvents);

    const server = await buildServer();
    await server.listen({ port, host: '0.0.0.0' });
    logger.info(`Crevea application running on port ${port}`);
  } catch (error) {
    logger.error({ err: error }, 'Failed to start Crevea application');
    process.exit(1);
  }
}

if (require.main === module) start();
