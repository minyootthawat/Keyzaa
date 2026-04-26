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
  const { data, error } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.id;
}

async function getPortfolioById(portfolioId: string): Promise<DbPortfolio | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("portfolios")
    .select("*")
    .eq("id", portfolioId)
    .single();

  if (error || !data) return null;
  return data as DbPortfolio;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = await getSellerIdFromUserId(userId);
    if (!sellerId) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const portfolio = await getPortfolioById(id);
    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    if (portfolio.seller_id !== sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ portfolio: mapDbToPortfolio(portfolio) });
  } catch (error) {
    console.error("Portfolio get error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = await getSellerIdFromUserId(userId);
    if (!sellerId) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const portfolio = await getPortfolioById(id);
    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    if (portfolio.seller_id !== sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const updates: Partial<{
      name: string;
      description: string | null;
      image_url: string | null;
      is_active: boolean;
    }> = {};

    if (body.name !== undefined) {
      if (typeof body.name !== "string" || body.name.trim() === "") {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description =
        typeof body.description === "string" && body.description.trim() !== ""
          ? body.description.trim()
          : null;
    }

    if (body.image !== undefined) {
      updates.image_url =
        typeof body.image === "string" && body.image.trim() !== ""
          ? body.image.trim()
          : null;
    }

    if (body.isActive !== undefined) {
      updates.is_active = Boolean(body.isActive);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("portfolios")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: "Failed to update portfolio" }, { status: 500 });
    }

    return NextResponse.json({ portfolio: mapDbToPortfolio(data as DbPortfolio) });
  } catch (error) {
    console.error("Portfolio update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sellerId = await getSellerIdFromUserId(userId);
    if (!sellerId) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const portfolio = await getPortfolioById(id);
    if (!portfolio) {
      return NextResponse.json({ error: "Portfolio not found" }, { status: 404 });
    }

    if (portfolio.seller_id !== sellerId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("portfolios")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json({ error: "Failed to delete portfolio" }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Portfolio delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
