import { envConfig } from "@/lib/env/config";
import type { PaginationMeta, SortOrder } from "@/types/api";

export interface PaginationInput {
  page?: number | string | null;
  limit?: number | string | null;
}

export interface PaginationState {
  page: number;
  limit: number;
  offset: number;
}

export function getPaginationState(input: PaginationInput): PaginationState {
  const page = Math.max(Number(input.page ?? 1) || 1, 1);
  const requestedLimit =
    Math.max(Number(input.limit ?? envConfig.pagination.defaultLimit) || 1, 1) ||
    envConfig.pagination.defaultLimit;
  const limit = Math.min(requestedLimit, envConfig.pagination.maxLimit);

  return {
    page,
    limit,
    offset: (page - 1) * limit,
  };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number
): PaginationMeta {
  return {
    total,
    page,
    pages: Math.max(Math.ceil(total / limit), 1),
    limit,
  };
}

export function normalizeSortOrder(value?: string | null): SortOrder {
  return value?.toLowerCase() === "asc" ? "asc" : "desc";
}

