/**
 * API Response wrapper
 */
import { JsonObject, JsonValue } from './json.types';

export interface IApiResponse<T = JsonObject> {
  success: boolean;
  data?: T;
  error?: IApiError;
  meta?: IApiMeta;
}

/**
 * API Error
 */
export interface IApiError {
  code: string;
  message: string;
  details?: JsonValue;
}

/**
 * API Meta (for pagination, etc.)
 */
export interface IApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
}

/**
 * Pagination Query
 */
export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search Query
 */
export interface ISearchQuery extends IPaginationQuery {
  q?: string;
  filters?: JsonObject;
}

/**
 * Date Range
 */
export interface IDateRange {
  startDate: Date;
  endDate: Date;
}
