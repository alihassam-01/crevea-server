import { FastifyInstance } from 'fastify';
import * as oauthController from '../controllers/oauth.controller';

/**
 * OAuth routes
 */
export default async function oauthRoutes(server: FastifyInstance) {
  // Google OAuth
  server.get('/google', async (_request, reply) => {
    const authUrl = oauthController.getGoogleAuthUrl();
    return reply.redirect(authUrl);
  });

  server.get('/google/callback', async (request, reply) => {
    const { code } = request.query as { code: string };
    const result = await oauthController.handleGoogleCallback(code);
    
    // Redirect to frontend with tokens
    const redirectUrl = `${process.env.FRONTEND_URL}/auth/callback?accessToken=${result.accessToken}&refreshToken=${result.refreshToken}`;
    return reply.redirect(redirectUrl);
  });

}
