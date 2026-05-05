import type { ApiErrorShape, ApiResponse } from "@/types/api";

type Primitive = string | number | boolean | null | undefined;
type QueryValue = Primitive | Primitive[];

export interface ApiRequestOptions {
  token?: string;
  signal?: AbortSignal;
  headers?: HeadersInit;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor({ message, status, details }: ApiErrorShape) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function buildUrl(url: string, params?: Record<string, QueryValue>) {
  const base =
    typeof window === "undefined" ? process.env.NEXT_PUBLIC_APP_URL : window.location.origin;
  const requestUrl = new URL(url, base);

  if (!params) {
    return requestUrl.toString();
  }

  for (const [key, rawValue] of Object.entries(params)) {
    const values = Array.isArray(rawValue) ? rawValue : [rawValue];

    values
      .filter((value) => value !== undefined && value !== null && value !== "")
      .forEach((value) => {
        requestUrl.searchParams.append(key, String(value));
      });
  }

  return requestUrl.toString();
}

async function request<TResponse>(
  method: string,
  url: string,
  body?: unknown,
  params?: Record<string, QueryValue>,
  options: ApiRequestOptions = {}
) {
  const response = await fetch(buildUrl(url, params), {
    method,
    signal: options.signal,
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<TResponse> | null;

  if (response.status === 401 && typeof window !== "undefined") {
    window.location.assign("/auth/login");
  }

  if (!response.ok || !payload?.success) {
    throw new ApiError({
      message: payload?.error ?? "Request failed",
      status: response.status,
      details: payload,
    });
  }

  return payload;
}

export const api = {
  get<TResponse>(
    url: string,
    params?: Record<string, QueryValue>,
    options?: ApiRequestOptions
  ) {
    return request<TResponse>("GET", url, undefined, params, options);
  },
  post<TResponse>(url: string, body?: unknown, options?: ApiRequestOptions) {
    return request<TResponse>("POST", url, body, undefined, options);
  },
  patch<TResponse>(url: string, body?: unknown, options?: ApiRequestOptions) {
    return request<TResponse>("PATCH", url, body, undefined, options);
  },
  delete<TResponse>(url: string, options?: ApiRequestOptions) {
    return request<TResponse>("DELETE", url, undefined, undefined, options);
  },
};

