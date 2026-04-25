import { NextRequest, NextResponse } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { MOCK_GAME_ACCOUNTS } from "@/lib/mock-data";

async function getSellerIdFromUserId(userId: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.id;
}

export async function GET(req: NextRequest) {
  const payload = await getBearerPayload(req);
  const userId = typeof payload?.userId === "string" ? payload.userId : null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = await getSellerIdFromUserId(userId);
  if (!sellerId) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  // Mock mode — return mock data filtered by sellerId
  const accounts = MOCK_GAME_ACCOUNTS.filter((a) => a.seller_id === sellerId);
  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const payload = await getBearerPayload(req);
  const userId = typeof payload?.userId === "string" ? payload.userId : null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = await getSellerIdFromUserId(userId);
  if (!sellerId) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  // Mock mode — accept but don't persist
  const body = await req.json().catch(() => ({}));
  const newAccount = { id: `ga_${Date.now()}`, seller_id: sellerId, is_active: true, ...body };
  return NextResponse.json({ account: newAccount }, { status: 201 });
}
