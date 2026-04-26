/**
 * Server-side auth helpers using NextAuth's getServerSession.
 * Use these in API route handlers - NOT in client components.
 *
 * For client components, use useSession() from next-auth/react.
 * For server components, use auth() from @/auth directly.
 */

import { auth } from "@/auth";
import { getAdminAccessForEmail } from "@/lib/auth/admin";
import type { AdminAccess } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

export type { AdminAccess };

/**
 * Get the current user from the NextAuth session.
 * Returns null if not authenticated.
 */
export async function getServerUser() {
  const session = await auth();
  if (!session?.user) return null;
  return session.user;
}

/**
 * Get admin access from the current session.
 * Returns the same shape as getAdminAccessFromRequest but uses session instead of JWT.
 */
export async function getServerAdminAccess(): Promise<{
  status: number;
  error?: string;
  access?: AdminAccess;
  userId?: string;
}> {
  const user = await getServerUser();

  if (!user) {
    return { status: 401, error: "Unauthorized" };
  }

  const access = getAdminAccessForEmail(user.email);
  if (!access.isAdmin) {
    return { status: 403, error: "Forbidden" };
  }

  return {
    status: 200,
    access,
    userId: user.id,
  };
}

/**
 * Get seller access from the current session.
 */
export async function getServerSellerAccess(): Promise<{
  status: number;
  error?: string;
  access?: { userId: string; sellerId: string; isVerified: boolean };
}> {
  const user = await getServerUser();

  if (!user) {
    return { status: 401, error: "Unauthorized" };
  }

  if (!user.sellerId) {
    return { status: 404, error: "Seller not found" };
  }

  const supabase = createServiceRoleClient();
  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("id, user_id, verified")
    .eq("user_id", user.id)
    .single();

  if (sellerError || !seller) {
    return { status: 404, error: "Seller not found" };
  }

  return {
    status: 200,
    access: {
      userId: user.id,
      sellerId: seller.id,
      isVerified: seller.verified === true,
    },
  };
}
