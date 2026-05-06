export type SortOrder = "asc" | "desc";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  meta?: {
    total: number;
    page: number;
    pages: number;
    limit: number;
  };
}

export interface ApiErrorShape {
  message: string;
  status: number;
  details?: unknown;
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: SortOrder;
  search?: string;
}
