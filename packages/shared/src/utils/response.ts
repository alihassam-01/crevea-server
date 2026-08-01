import { IApiResponse, IApiMeta, JsonValue } from '../types';

/**
 * Success response
 */
export const successResponse = <T>(
  data: T,
  meta?: IApiMeta
): IApiResponse<T> => {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
};

/**
 * Error response
 */
export const errorResponse = (
  code: string,
  message: string,
  details?: JsonValue
): IApiResponse => {
  return {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
};

/**
 * Paginated response
 */
export const paginatedResponse = <T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): IApiResponse<T[]> => {
  return {
    success: true,
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
