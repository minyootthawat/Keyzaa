import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { findUserByEmail, createServiceRoleClient } from "@/lib/db/supabase";
import { getAdminAccessForEmail } from "@/lib/auth/admin";

// Mock users for demo/E2E testing mode
const MOCK_AUTH_USERS = [
  {
    id: "user-seller-001",
    name: "Seller Test",
    email: "seller@test.com",
    password_hash: "$2b$10$811cObR5EGUOCHUj45n4ke6g.hqwYQG24ragb5zEyK5PK9VlWXq.K", // "password123"
    role: "seller",
    seller_id: "seller-001",
    created_at: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "user-buyer-001",
    name: "Somchai Rakgame",
    email: "somchai@demo.com",
    password_hash: "$2b$10$JAQ1Z9Na8577TG9SLjQhg.OPzuuHPLeeNglXs9Op.sFhuE9icOAEW", // "password123"
    role: "buyer",
    seller_id: null,
    created_at: "2026-01-01T00:00:00.000Z",
  },
];

function isMockMode(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim();
  return !supabaseUrl || supabaseUrl.includes("mock.supabase.co") || !serviceRoleKey || serviceRoleKey === "mock_key";
}

function findMockUserByEmail(email: string) {
  return MOCK_AUTH_USERS.find((u) => u.email === email.toLowerCase()) || null;
}

const JWT_SECRET = new TextEncoder().encode(
  (process.env.JWT_SECRET || '').replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim() || 'fallback-dev-secret'
);

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // ── Mock/demo mode ──────────────────────────────────────────────────────────
    if (isMockMode()) {
      const mockUser = findMockUserByEmail(email);
      if (!mockUser) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const validPassword = await bcrypt.compare(password, mockUser.password_hash);
      if (!validPassword) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const adminAccess = getAdminAccessForEmail(mockUser.email);
      const token = await new SignJWT({
        userId: mockUser.id,
        email: mockUser.email,
        isAdmin: adminAccess.isAdmin,
        adminRole: adminAccess.adminRole ?? undefined,
        adminPermissions: adminAccess.permissions,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(JWT_SECRET);

      return NextResponse.json({
        token,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          sellerId: mockUser.seller_id,
          isAdmin: adminAccess.isAdmin,
          adminRole: adminAccess.adminRole,
          adminPermissions: adminAccess.permissions,
          createdAt: mockUser.created_at,
        },
      });
    }

    // ── Real Supabase auth ─────────────────────────────────────────────────────
    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user has a password (social users may not)
    const passwordHash = (user as unknown as { password_hash?: string }).password_hash;
    if (!passwordHash) {
      return NextResponse.json(
        { error: "This account uses social login. Please sign in with Google, Facebook, or LINE." },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(password, passwordHash);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const userId = user.id;
    const adminAccess = getAdminAccessForEmail(user.email);

    // Get sellerId from sellers table (users table has no seller_id column)
    const supabase = createServiceRoleClient();
    const { data: sellerRow } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    const token = await new SignJWT({
      userId,
      email: user.email,
      isAdmin: adminAccess.isAdmin,
      adminRole: adminAccess.adminRole ?? undefined,
      adminPermissions: adminAccess.permissions,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    return NextResponse.json({
      token,
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: (user as unknown as { role?: string }).role ?? "buyer",
        sellerId: sellerRow?.id ?? null,
        isAdmin: adminAccess.isAdmin,
        adminRole: adminAccess.adminRole,
        adminPermissions: adminAccess.permissions,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
