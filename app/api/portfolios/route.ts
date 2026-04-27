import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { auth } from "@/auth";

interface DbPortfolio {
  id: string;
  seller_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

function mapDbToPortfolio(row: DbPortfolio) {
  return {
    id: row.id,
    sellerId: row.seller_id,
    name: row.name,
    description: row.description ?? "",
    image: row.image_url ?? "",
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getSellerIdFromUserId(userId: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  return data.id;
}

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = await getSellerIdFromUserId(userId);
    if (!sellerId) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("portfolios")
      .select("*")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const portfolios = (data as DbPortfolio[]).map(mapDbToPortfolio);
    return NextResponse.json({ portfolios });
  } catch (error) {
    console.error("Portfolios list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = await getSellerIdFromUserId(userId);
    if (!sellerId) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const body = await req.json();

    const { name, description, image } = body;
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("portfolios")
      .insert({
        seller_id: sellerId,
        name: name.trim(),
        description: typeof description === "string" && description.trim() !== "" ? description.trim() : null,
        image_url: typeof image === "string" && image.trim() !== "" ? image.trim() : null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to create portfolio" }, { status: 500 });
    }

    return NextResponse.json({ portfolio: mapDbToPortfolio(data as DbPortfolio) }, { status: 201 });
  } catch (error) {
    console.error("Portfolio create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
