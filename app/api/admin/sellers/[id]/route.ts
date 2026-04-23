import { NextRequest, NextResponse } from "next/server";
import { getAdminAccessFromRequest } from "@/lib/auth/admin";
import { connectDB, getSellerById, updateSeller } from "@/lib/db/mongodb";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

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

function mapMongoToSellerWithUser(row: { _id: { toString(): string }; [key: string]: unknown }, user: { id: string; email: string; name: string; created_at: string }): SellerWithUser {
  return {
    id: row._id.toString(),
    storeName: row.store_name as string,
    phone: (row.phone as string) || "",
    verified: Boolean(row.verified),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
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

    const updated = await updateSeller(id, { verified: verifiedUpdate });
    if (!updated) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    // Fetch user info from Supabase
    const supabase = createServiceRoleClient();
    const { data: userData } = await supabase
      .from("users")
      .select("id, email, name, created_at")
      .eq("id", updated.user_id as string)
      .single();

    const user = userData ?? { id: updated.user_id as string, email: "", name: "", created_at: "" };
    const seller: SellerWithUser = mapMongoToSellerWithUser(updated as { _id: { toString(): string }; [key: string]: unknown }, user);

    return NextResponse.json({ seller });
  } catch (error) {
    console.error("Admin seller update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}