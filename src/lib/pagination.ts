import type { PaginationMeta } from "@/types/api";

export function parsePaginationParams(params: URLSearchParams) {
  const page = Math.max(parseInt(params.get("page") || "1"), 1);
  const limit = Math.max(parseInt(params.get("limit") || "20"), 1);
  const sort = params.get("sort") || "created_at";
  const order = (params.get("order") || "desc") as "asc" | "desc";
  const skip = (page - 1) * limit;

  return { page, limit, skip, sort, order };
}

export function buildMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    total,
    page,
    pages: Math.ceil(total / limit),
    limit,
  };
}
