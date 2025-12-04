import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

/**
 * Generate MFA secret and QR code
 */
export const generateMFASecret = async (email: string) => {
  const secret = speakeasy.generateSecret({
    name: `Crevea (${email})`,
    issuer: 'Crevea',
    length: 32,
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode,
  };
};

/**
 * Verify MFA token
 */
export const verifyMFAToken = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after
  });
};
