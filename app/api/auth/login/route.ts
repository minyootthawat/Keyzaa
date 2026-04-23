import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { findUserByEmail } from "@/lib/db/supabase";
import { getAdminAccessForEmail } from "@/lib/auth/admin";

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

    const token = await new SignJWT({
      userId,
      email: user.email,
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
        sellerId: (user as unknown as { seller_id?: string }).seller_id ?? null,
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
