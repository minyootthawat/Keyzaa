import type { NextRequest } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { auth } from "@/auth";

export interface SellerAccess {
  userId: string;
  sellerId: string;
  isVerified: boolean;
}

export async function getSellerAccessFromRequest(req: NextRequest): Promise<{
  status: number;
  error?: string;
  access?: SellerAccess;
}> {
  const payload = await getBearerPayload(req);
  const userId = typeof payload?.id === "string" ? payload.id : null;

  if (!userId) {
    return { status: 401, error: "Unauthorized" };
  }

  const supabase = createServiceRoleClient();
  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("id, user_id, verified")
    .eq("user_id", userId)
    .single();

  if (sellerError || !seller) {
    return { status: 404, error: "Seller not found" };
  }

  return {
    status: 200,
    access: {
      userId,
      sellerId: seller.id,
      isVerified: seller.verified === true,
    },
  };
}

/**
 * Session-based seller access — preferred over getSellerAccessFromRequest.
 * Uses NextAuth's getServerSession instead of a JWT bearer token.
 */
export async function getSellerAccessFromSession(): Promise<{
  status: number;
  error?: string;
  access?: SellerAccess;
}> {
  const session = await auth();
  const user = session?.user;

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
