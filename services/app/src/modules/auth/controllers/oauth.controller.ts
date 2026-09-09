import { ExternalServiceError } from '@crevea/shared';
import https from 'node:https';
import * as userService from '../services/user.service';
import * as jwtService from '../services/jwt.service';
import { UserRole, OAuthProvider } from '@crevea/shared';

interface OAuthUserData {
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  given_name: string;
  family_name: string;
  picture?: string;
}

const googleRequest = (url: string, options: https.RequestOptions = {}, body?: string) => new Promise<{ statusCode: number; body: string }>((resolve, reject) => {
  const request = https.request(url, { ...options, family: 4 }, (response) => {
    let responseBody = '';
    response.setEncoding('utf8');
    response.on('data', (chunk) => { responseBody += chunk; });
    response.on('end', () => resolve({ statusCode: response.statusCode || 500, body: responseBody }));
  });

  request.on('error', reject);
  request.setTimeout(15000, () => request.destroy(new Error('Google request timed out')));
  if (body) request.write(body);
  request.end();
});

/**
 * Get Google OAuth URL
 */
export const getGoogleAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

/**
 * Handle Google OAuth callback
 */
export const handleGoogleCallback = async (code: string) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_CALLBACK_URL) {
    throw new ExternalServiceError('Google', 'Google OAuth environment variables are not configured');
  }

  // Exchange code for tokens
  let tokenResponse: { statusCode: number; body: string };
  try {
    tokenResponse = await googleRequest('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }, new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }).toString());
  } catch (error) {
    throw new ExternalServiceError('Google', `Unable to reach Google OAuth: ${error instanceof Error ? error.message : 'network error'}`);
  }

  if (tokenResponse.statusCode < 200 || tokenResponse.statusCode >= 300) {
    throw new ExternalServiceError('Google', 'Failed to exchange code for tokens');
  }

  const tokens = JSON.parse(tokenResponse.body) as GoogleTokenResponse;

  // Get user info
  const userResponse = await googleRequest('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (userResponse.statusCode < 200 || userResponse.statusCode >= 300) {
    throw new ExternalServiceError('Google', 'Failed to fetch user info');
  }

  const googleUser = JSON.parse(userResponse.body) as GoogleUserInfo;

  const userData: OAuthUserData = {
    providerId: googleUser.id,
    email: googleUser.email,
    firstName: googleUser.given_name,
    lastName: googleUser.family_name,
    avatar: googleUser.picture,
  };

  return handleOAuthLogin(OAuthProvider.GOOGLE, userData);
};

/**
 * Handle OAuth login (common logic)
 */
const handleOAuthLogin = async (provider: OAuthProvider, userData: OAuthUserData) => {
  // Check if OAuth account exists
  let oauthAccount = await userService.findOAuthAccount(provider, userData.providerId);
  
  let user;
  
  if (oauthAccount) {
    // Existing OAuth account
    user = await userService.findById(oauthAccount.userId);
  } else {
    // Check if user with email exists
    user = await userService.findByEmail(userData.email);
    
    if (user) {
      // Link OAuth account to existing user
      await userService.createOAuthAccount({
        userId: user.id,
        provider,
        providerId: userData.providerId,
        email: userData.email,
      });
    } else {
      // Create new user
      user = await userService.create({
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: UserRole.CUSTOMER,
        emailVerified: true, // OAuth emails are pre-verified
        avatar: userData.avatar,
      });

      // Create OAuth account
      await userService.createOAuthAccount({
        userId: user.id,
        provider,
        providerId: userData.providerId,
        email: userData.email,
      });
    }
  }

  // Generate tokens
  const { accessToken, refreshToken } = await jwtService.generateTokens(user!);

  return {
    user: userService.sanitizeUser(user!),
    accessToken,
    refreshToken,
  };
};
