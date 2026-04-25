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
  const account = MOCK_GAME_ACCOUNTS.find((a) => a.id === id && a.seller_id === sellerId);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ account });
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
  const account = MOCK_GAME_ACCOUNTS.find((a) => a.id === id && a.seller_id === sellerId);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const updated = { ...account, ...body };
  return NextResponse.json({ account: updated });
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
  const account = MOCK_GAME_ACCOUNTS.find((a) => a.id === id && a.seller_id === sellerId);
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ success: true });
}
