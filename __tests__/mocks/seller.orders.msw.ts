/**
 * MSW handlers for seller orders API tests.
 * Intercepts Supabase REST API calls at the network level.
 */

import { http, HttpResponse } from "msw";

// In production these come from env vars — set in vitest.setup.ts
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://mock-project.supabase.co";

export const mockUnauthorized = http.get(
  `${SUPABASE_URL}/rest/v1/sellers`,
  () => HttpResponse.json({ message: "Unauthorized" }, { status: 401 })
);

export const mockSellerNotFound = http.get(
  `${SUPABASE_URL}/rest/v1/sellers`,
  ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get("user_id") === "user-123") {
      return HttpResponse.json(null, { status: 200 });
    }
    return HttpResponse.json({ message: "Not found" }, { status: 404 });
  }
);

export const mockSellerOrdersEmpty = http.get(
  `${SUPABASE_URL}/rest/v1/sellers`,
  () =>
    HttpResponse.json([{ id: "seller-001", user_id: "user-123" }], {
      status: 200,
    })
);

export const mockSellerOrdersWithData = http.get(
  `${SUPABASE_URL}/rest/v1/sellers`,
  () =>
    HttpResponse.json([{ id: "seller-001", user_id: "user-123" }], {
      status: 200,
    })
);

export const mockDbError = http.get(
  `${SUPABASE_URL}/rest/v1/sellers`,
  () => HttpResponse.json({ message: "Connection refused" }, { status: 500 })
);

// Order-specific handlers — use intercept on any URL pattern
export const mockOrdersHandler = (ordersData: unknown[]) =>
  http.get(`${SUPABASE_URL}/rest/v1/orders`, () =>
    HttpResponse.json(ordersData, { status: 200 })
  );

export const mockOrderItemsHandler = (itemsData: unknown[]) =>
  http.get(`${SUPABASE_URL}/rest/v1/order_items`, () =>
    HttpResponse.json(itemsData, { status: 200 })
  );

export const mockUsersHandler = (usersData: unknown[]) =>
  http.get(`${SUPABASE_URL}/rest/v1/users`, () =>
    HttpResponse.json(usersData, { status: 200 })
  );
