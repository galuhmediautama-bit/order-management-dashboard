/**
 * Pagination Utility
 * Handle pagination untuk large datasets
 * Implements cursor-based dan offset-based pagination
 */

export interface PaginationParams {
  page: number; // 1-indexed
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Calculate pagination offset
 */
export const getPaginationOffset = (page: number, pageSize: number): number => {
  return (page - 1) * pageSize;
};

/**
 * Create paginated result
 */
export const createPaginatedResult = <T>(
  data: T[],
  page: number,
  pageSize: number,
  total: number
): PaginatedResult<T> => {
  const totalPages = Math.ceil(total / pageSize);

  return {
    data,
    page,
    pageSize,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/**
 * Paginate array in memory
 */
export const paginateArray = <T>(
  items: T[],
  page: number,
  pageSize: number
): PaginatedResult<T> => {
  const offset = getPaginationOffset(page, pageSize);
  const paginatedData = items.slice(offset, offset + pageSize);

  return createPaginatedResult(paginatedData, page, pageSize, items.length);
};

/**
 * Parse pagination params from query string
 */
export const parsePaginationParams = (
  searchParams: URLSearchParams,
  defaultPageSize: number = 50
): PaginationParams => {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get('pageSize') || String(defaultPageSize), 10))
  );

  return { page, pageSize };
};

/**
 * Create query string from pagination params
 */
export const createPaginationQueryString = (
  page: number,
  pageSize: number
): string => {
  return `page=${page}&pageSize=${pageSize}`;
};

/**
 * Default page sizes
 */
export const PAGE_SIZES = {
  SMALL: 10,
  MEDIUM: 25,
  LARGE: 50,
  EXTRA_LARGE: 100,
};

export default {
  getPaginationOffset,
  createPaginatedResult,
  paginateArray,
  parsePaginationParams,
  createPaginationQueryString,
  PAGE_SIZES,
};
