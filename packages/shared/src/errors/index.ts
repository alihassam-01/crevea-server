/**
 * HTTP Status Codes
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503,
}

/**
 * Base Error Class
 */
export class BaseError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Validation Error
 */
export class ValidationError extends BaseError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(
      message,
      HttpStatusCode.BAD_REQUEST,
      'VALIDATION_ERROR',
      true,
      details
    );
  }
}

/**
 * Authentication Error
 */
export class AuthenticationError extends BaseError {
  constructor(message: string = 'Authentication failed') {
    super(
      message,
      HttpStatusCode.UNAUTHORIZED,
      'AUTHENTICATION_ERROR',
      true
    );
  }
}

/**
 * Authorization Error
 */
export class AuthorizationError extends BaseError {
  constructor(message: string = 'You do not have permission to perform this action') {
    super(
      message,
      HttpStatusCode.FORBIDDEN,
      'AUTHORIZATION_ERROR',
      true
    );
  }
}

/**
 * Not Found Error
 */
export class NotFoundError extends BaseError {
  constructor(resource: string = 'Resource', id?: string) {
    const message = id 
      ? `${resource} with id '${id}' not found`
      : `${resource} not found`;
    super(
      message,
      HttpStatusCode.NOT_FOUND,
      'NOT_FOUND',
      true
    );
  }
}

/**
 * Conflict Error
 */
export class ConflictError extends BaseError {
  constructor(message: string = 'Resource already exists', details?: any) {
    super(
      message,
      HttpStatusCode.CONFLICT,
      'CONFLICT_ERROR',
      true,
      details
    );
  }
}

/**
 * Payment Error
 */
export class PaymentError extends BaseError {
  constructor(message: string = 'Payment processing failed', details?: any) {
    super(
      message,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      'PAYMENT_ERROR',
      true,
      details
    );
  }
}

/**
 * External Service Error
 */
export class ExternalServiceError extends BaseError {
  constructor(service: string, message: string = 'External service error', details?: any) {
    super(
      `${service}: ${message}`,
      HttpStatusCode.SERVICE_UNAVAILABLE,
      'EXTERNAL_SERVICE_ERROR',
      true,
      details
    );
  }
}

/**
 * Rate Limit Error
 */
export class RateLimitError extends BaseError {
  constructor(message: string = 'Too many requests, please try again later') {
    super(
      message,
      HttpStatusCode.TOO_MANY_REQUESTS,
      'RATE_LIMIT_ERROR',
      true
    );
  }
}

/**
 * Inventory Error
 */
export class InventoryError extends BaseError {
  constructor(message: string = 'Insufficient inventory', details?: any) {
    super(
      message,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      'INVENTORY_ERROR',
      true,
      details
    );
  }
}

/**
 * Business Logic Error
 */
export class BusinessLogicError extends BaseError {
  constructor(message: string, code: string = 'BUSINESS_LOGIC_ERROR', details?: any) {
    super(
      message,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      code,
      true,
      details
    );
  }
}
