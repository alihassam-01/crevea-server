import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export const generateMFASecret = async (email: string): Promise<{ secret: string; qrCode: string }> => {
  const secret = speakeasy.generateSecret({
    name: `Crevea (${email})`,
    issuer: 'Crevea Marketplace',
  });

  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  return {
    secret: secret.base32,
    qrCode,
  };
};

export const verifyMFAToken = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after
  });
};
