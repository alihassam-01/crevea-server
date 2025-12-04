import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes script tags, event handlers, and dangerous attributes
 */
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty) return '';
  
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false,
  });
  
  return clean;
};

/**
 * Sanitize plain text - strips all HTML tags
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  return validator.stripLow(validator.escape(text));
};

/**
 * Validate and sanitize URL
 */
export const sanitizeUrl = (url: string): string | null => {
  if (!url) return null;
  
  if (!validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true })) {
    return null;
  }
  
  return validator.escape(url);
};

/**
 * Sanitize email
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  return validator.normalizeEmail(email) || '';
};

/**
 * Validate image URL
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!validator.isURL(url, { protocols: ['http', 'https'], require_protocol: true })) {
    return false;
  }
  
  const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
  const urlLower = url.toLowerCase();
  
  return validExtensions.some(ext => urlLower.includes(ext));
};

/**
 * Sanitize array of strings
 */
export const sanitizeStringArray = (arr: string[]): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map(item => sanitizeText(item)).filter(Boolean);
};

/**
 * Remove dangerous characters from SQL-like inputs
 * Note: TypeORM handles parameterization, but this adds extra safety
 */
export const sanitizeSqlInput = (input: string): string => {
  if (!input) return '';
  
  // Remove SQL comment markers and dangerous characters
  return input
    .replace(/--/g, '')
    .replace(/;/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .trim();
};

/**
 * Sanitize object by applying sanitization to all string values
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeText(sanitized[key]) as any;
    } else if (Array.isArray(sanitized[key])) {
      sanitized[key] = sanitizeStringArray(sanitized[key]) as any;
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key]);
    }
  }
  
  return sanitized;
};
