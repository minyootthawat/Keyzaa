import { NextRequest, NextResponse } from "next/server";
import { getBearerPayload } from "@/lib/auth/jwt";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

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

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("game_accounts")
    .select("*")
    .eq("seller_id", sellerId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ accounts: data });
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

  const supabase = createServiceRoleClient();
  const body = await req.json().catch(() => ({}));
  const { data, error } = await supabase
    .from("game_accounts")
    .insert({ seller_id: sellerId, is_active: true, ...body })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ account: data }, { status: 201 });
}
