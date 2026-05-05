export type SortOrder = "asc" | "desc";

export interface PaginationMeta {
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface ApiResponse<TData, TMeta = PaginationMeta> {
  success: boolean;
  data: TData;
  error?: string;
  meta?: TMeta;
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

