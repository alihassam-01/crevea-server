import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { IJWTPayload } from '../types';

const SALT_ROUNDS = 10;

/**
 * Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 */
export const generateToken = (
  payload: IJWTPayload,
  secret: string,
  expiresIn: string
): string => {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
};

/**
 * Verify JWT token
 */
export const verifyToken = (
  token: string,
  secret: string
): IJWTPayload | null => {
  try {
    return jwt.verify(token, secret) as IJWTPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Generate OTP
 */
export const generateOTP = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return otp;
};
