import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

export async function GET() {
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

  const { data, error } = await supabase
    .from("game_accounts")
    .select("*")
    .eq("seller_id", seller.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ accounts: data });
}

export async function POST(req: NextRequest) {
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

  const body = await req.json().catch(() => ({}));
  const { data, error } = await supabase
    .from("game_accounts")
    .insert({ seller_id: seller.id, is_active: true, ...body })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ account: data }, { status: 201 });
}