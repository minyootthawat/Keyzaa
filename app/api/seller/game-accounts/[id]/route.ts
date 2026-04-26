import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (sellerError || !seller) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const { id } = await params;
  const { data, error } = await supabase
    .from("game_accounts")
    .select("*")
    .eq("id", id)
    .eq("seller_id", seller.id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ account: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (sellerError || !seller) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const { id } = await params;
  const { data: existing, error: fetchError } = await supabase
    .from("game_accounts")
    .select("*")
    .eq("id", id)
    .eq("seller_id", seller.id)
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
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: seller, error: sellerError } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (sellerError || !seller) {
    return NextResponse.json({ error: "Seller not found" }, { status: 404 });
  }

  const { id } = await params;
  const { error } = await supabase
    .from("game_accounts")
    .delete()
    .eq("id", id)
    .eq("seller_id", seller.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
