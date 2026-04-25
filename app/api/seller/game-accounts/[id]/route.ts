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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getBearerPayload(req);
  const userId = typeof payload?.userId === "string" ? payload.userId : null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = await getSellerIdFromUserId(userId);
  if (!sellerId) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("game_accounts")
    .select("*")
    .eq("id", id)
    .eq("seller_id", sellerId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ account: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getBearerPayload(req);
  const userId = typeof payload?.userId === "string" ? payload.userId : null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = await getSellerIdFromUserId(userId);
  if (!sellerId) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { data: existing, error: fetchError } = await supabase
    .from("game_accounts")
    .select("*")
    .eq("id", id)
    .eq("seller_id", sellerId)
    .single();

  if (fetchError || !existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const { data, error } = await supabase
    .from("game_accounts")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ account: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = await getBearerPayload(req);
  const userId = typeof payload?.userId === "string" ? payload.userId : null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sellerId = await getSellerIdFromUserId(userId);
  if (!sellerId) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const { id } = await params;
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("game_accounts")
    .delete()
    .eq("id", id)
    .eq("seller_id", sellerId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
