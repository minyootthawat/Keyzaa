/**
 * Admin API client with in-memory token and automatic refresh.
 *
 * Token lives in module-scope memory (not localStorage) so it is never
 * persisted across browser sessions.  It is refreshed automatically when
 * the current token expires (HTTP 401 with "token expired" signal).
 */

import type {
  BackofficeOverviewResponse,
  BackofficeOrdersResponse,
  BackofficeProductsResponse,
  BackofficeSellersResponse,
} from "./backoffice";

// ─── Token storage ────────────────────────────────────────────────────────────

let _token: string | null = null;

/** Store token in memory (session-scoped, not persisted). */
export function setAdminToken(token: string | null) {
  _token = token;
}

/** Retrieve the current in-memory token. HttpOnly cookies are not readable from JS. */
export function getAdminToken(): string | null {
  return _token;
}

// ─── Refresh logic ────────────────────────────────────────────────────────────

/**
 * Call POST /api/admin/refresh with the current token.
 * Returns a new token string.
 * Throws on failure.
 */
async function refreshToken(): Promise<string> {
  const res = await fetch("/api/admin/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
    },
  });

  if (!res.ok) {
    // Refresh failed — clear token and redirect to login
    _token = null;
    if (typeof window !== "undefined") {
      window.location.href = "/backoffice/login";
    }
    throw new Error("token-refresh-failed");
  }

  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error("token-refresh-no-token");

  _token = data.token;
  return data.token;
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

export type AdminApiErrorCode =
  | "missing-admin-token"
  | "token-refresh-failed"
  | "backoffice-request-failed";

export interface AdminApiError {
  code: AdminApiErrorCode;
  status?: number;
  message?: string;
}

async function adminFetch<T>(
  path: string,
  options: RequestInit = {},
  attemptRefresh = true
): Promise<T> {
  const token = getAdminToken();

  const response = await fetch(path, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  // Handle token expiration
  if (response.status === 401 && attemptRefresh) {
    try {
      _token = null;
      const newToken = await refreshToken();
      const retryResponse = await fetch(path, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });

      if (!retryResponse.ok) {
        const errorBody = (await retryResponse.json().catch(() => ({}))) as Record<string, unknown>;
        throw {
          code: "backoffice-request-failed",
          status: retryResponse.status,
          message: String(errorBody.error ?? retryResponse.statusText),
        } as AdminApiError;
      }

      return (await retryResponse.json()) as T;
    } catch (refreshError) {
      if ((refreshError as AdminApiError).code === "token-refresh-failed") throw refreshError;
      // Fall through — retry failed
      throw {
        code: "backoffice-request-failed",
        status: response.status,
        message: "Retry after refresh failed",
      } as AdminApiError;
    }
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    throw {
      code: "backoffice-request-failed",
      status: response.status,
      message: String(errorBody.error ?? response.statusText),
    } as AdminApiError;
  }

  return (await response.json()) as T;
}

// ─── Public API surface ───────────────────────────────────────────────────────

export async function fetchAdminOverview(
  signal?: AbortSignal
): Promise<BackofficeOverviewResponse> {
  return adminFetch<BackofficeOverviewResponse>("/api/backoffice/overview", { signal });
}

export async function fetchAdminOrders(
  params?: { page?: number; limit?: number; status?: string },
  signal?: AbortSignal
): Promise<BackofficeOrdersResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.status) qs.set("status", params.status);
  const query = qs.toString();
  return adminFetch<BackofficeOrdersResponse>(
    `/api/backoffice/orders${query ? `?${query}` : ""}`,
    { signal }
  );
}

export async function fetchAdminProducts(
  params?: { page?: number; limit?: number; search?: string },
  signal?: AbortSignal
): Promise<BackofficeProductsResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.search) qs.set("search", params.search);
  const query = qs.toString();
  return adminFetch<BackofficeProductsResponse>(
    `/api/backoffice/products${query ? `?${query}` : ""}`,
    { signal }
  );
}

export async function fetchAdminSellers(
  params?: { page?: number; limit?: number; search?: string },
  signal?: AbortSignal
): Promise<BackofficeSellersResponse> {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.limit) qs.set("limit", String(params.limit));
  if (params?.search) qs.set("search", params.search);
  const query = qs.toString();
  return adminFetch<BackofficeSellersResponse>(
    `/api/backoffice/sellers${query ? `?${query}` : ""}`,
    { signal }
  );
}

/** Kick off a token refresh proactively (e.g. on app load). */
export function preloadAdminToken(token: string) {
  _token = token;
}
