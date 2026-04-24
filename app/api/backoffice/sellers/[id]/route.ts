import { NextRequest, NextResponse } from "next/server";
import { getAdminAccessFromRequest } from "@/lib/auth/admin";
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

    // Update seller in Supabase
    const { data: updated, error } = await supabase
      .from("sellers")
      .update({ verified: verifiedUpdate, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*, users(id, email, name, created_at)")
      .single();

    if (error || !updated) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    const row = updated as Record<string, unknown>;
    const seller: SellerWithUser = {
      id: row.id as string,
      storeName: (row.store_name as string) ?? "",
      phone: (row.phone as string) ?? "",
      verified: Boolean(row.verified),
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
      user: {
        id: (row.users as { id: string } | null)?.id ?? (row.user_id as string),
        email: (row.users as { email: string } | null)?.email ?? "",
        name: (row.users as { name: string } | null)?.name ?? "",
        createdAt:
          (row.users as { created_at: string } | null)?.created_at ?? (row.created_at as string),
      },
    };

    return NextResponse.json({ seller });
  } catch (error) {
    console.error("Admin seller update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
