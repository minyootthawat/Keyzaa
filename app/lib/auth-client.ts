/**
 * Get the admin/seller token from the HttpOnly cookie.
 * The cookie is automatically sent with every fetch request to the same origin,
 * but we also return it here so callers can pass it as Authorization header
 * to backoffice API routes that require it.
 */
export function getStoredToken(): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(/(?:^|;\s*)admin_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
