import { successResponse, ExternalServiceError } from '@crevea/shared';
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
  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL!,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    throw new ExternalServiceError('Google', 'Failed to exchange code for tokens');
  }

  const tokens = await tokenResponse.json();

  // Get user info
  const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userResponse.ok) {
    throw new ExternalServiceError('Google', 'Failed to fetch user info');
  }

  const googleUser = await userResponse.json();

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
 * Get Facebook OAuth URL
 */
export const getFacebookAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_CLIENT_ID!,
    redirect_uri: process.env.FACEBOOK_CALLBACK_URL!,
    scope: 'email,public_profile',
    response_type: 'code',
  });

  return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
};

/**
 * Handle Facebook OAuth callback
 */
export const handleFacebookCallback = async (code: string) => {
  // Exchange code for tokens
  const tokenResponse = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?` +
    new URLSearchParams({
      code,
      client_id: process.env.FACEBOOK_CLIENT_ID!,
      client_secret: process.env.FACEBOOK_CLIENT_SECRET!,
      redirect_uri: process.env.FACEBOOK_CALLBACK_URL!,
    })
  );

  if (!tokenResponse.ok) {
    throw new ExternalServiceError('Facebook', 'Failed to exchange code for tokens');
  }

  const tokens = await tokenResponse.json();

  // Get user info
  const userResponse = await fetch(
    `https://graph.facebook.com/me?fields=id,email,first_name,last_name,picture&access_token=${tokens.access_token}`
  );

  if (!userResponse.ok) {
    throw new ExternalServiceError('Facebook', 'Failed to fetch user info');
  }

  const fbUser = await userResponse.json();

  const userData: OAuthUserData = {
    providerId: fbUser.id,
    email: fbUser.email,
    firstName: fbUser.first_name,
    lastName: fbUser.last_name,
    avatar: fbUser.picture?.data?.url,
  };

  return handleOAuthLogin(OAuthProvider.FACEBOOK, userData);
};

/**
 * Get Apple OAuth URL
 */
export const getAppleAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: process.env.APPLE_CLIENT_ID!,
    redirect_uri: process.env.APPLE_CALLBACK_URL!,
    response_type: 'code',
    scope: 'email name',
    response_mode: 'form_post',
  });

  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
};

/**
 * Handle Apple OAuth callback
 */
export const handleAppleCallback = async (code: string) => {
  // Apple OAuth implementation is more complex and requires JWT
  // This is a simplified version
  throw new ExternalServiceError('Apple', 'Apple OAuth not fully implemented yet');
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
