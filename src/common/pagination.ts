export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export const buildPagination = ({
  page = 1,
  limit = 25,
}: PaginationParams): { skip: number; limit: number; page: number } => {
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number(limit) > 0 ? Number(limit) : 25;

  return {
    page: safePage,
    skip: (safePage - 1) * safeLimit,
    limit: safeLimit,
  };
};











