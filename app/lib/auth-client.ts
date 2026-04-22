export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("keyzaa_token");
}
