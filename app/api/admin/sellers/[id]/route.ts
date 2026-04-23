import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { getAdminAccessFromRequest } from "@/lib/auth/admin";

interface DbSeller {
  id: string;
  user_id: string;
  store_name: string;
  phone: string | null;
  id_card_url: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

interface DbUser {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

interface SellerWithUser {
  id: string;
  storeName: string;
  phone: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    createdAt: string;
  };
}

function mapDbToSellerWithUser(row: DbSeller, user: DbUser): SellerWithUser {
  return {
    id: row.id,
    storeName: row.store_name,
    phone: row.phone || "",
    verified: row.verified,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.created_at,
    },
  };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await getAdminAccessFromRequest(req);
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const { id } = await params;
    const body = await req.json();

    let verifiedUpdate: boolean | undefined;
    if (body.verified !== undefined) {
      verifiedUpdate = Boolean(body.verified);
    } else if (body.action) {
      switch (body.action) {
        case "approve":
          verifiedUpdate = true;
          break;
        case "reject":
          verifiedUpdate = false;
          break;
        default:
          return NextResponse.json({ error: "Invalid action" }, { status: 400 });
      }
    }

    if (verifiedUpdate === undefined) {
      return NextResponse.json({ error: "verified or action is required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("sellers")
      .update({ verified: verifiedUpdate })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Failed to update seller" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const { data: userData } = await supabase
      .from("users")
      .select("id, email, name, created_at")
      .eq("id", (data as DbSeller).user_id)
      .single();

    const seller: SellerWithUser = mapDbToSellerWithUser(
      data as DbSeller,
      userData as DbUser
    );

    return NextResponse.json({ seller });
  } catch (error) {
    console.error("Admin seller update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
