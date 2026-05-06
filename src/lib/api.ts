import type { ApiResponse } from "@/types/api";

export async function request<T>(
  method: string,
  url: string,
  body?: any,
  params?: Record<string, any>,
  signal?: AbortSignal
): Promise<ApiResponse<T>> {
  try {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const response = await fetch(`${url}${query}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    if (response.status === 401) {
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login";
      }
    }

    const text = await response.text();
    try {
      return JSON.parse(text) as ApiResponse<T>;
    } catch (e) {
      console.error("Failed to parse JSON response:", text);
      return {
        success: false,
        error: `Invalid server response (${response.status})`,
      } as ApiResponse<T>;
    }
  } catch (err: any) {
    console.error("API Request Error:", err);
    return {
      success: false,
      error: err.message || "Network request failed",
    } as ApiResponse<T>;
  }
}

export const api = {
  get: <T>(url: string, params?: Record<string, any>, signal?: AbortSignal) =>
    request<T>("GET", url, undefined, params, signal),
  post: <T>(url: string, body: any) => request<T>("POST", url, body),
  patch: <T>(url: string, body: any) => request<T>("PATCH", url, body),
  delete: <T>(url: string) => request<T>("DELETE", url),
};
