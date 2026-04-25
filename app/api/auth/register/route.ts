import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { createUser, findUserByEmail } from "@/lib/db/supabase";
import { getAdminAccessForEmail } from "@/lib/auth/admin";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check if already registered
    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await createUser({
      email,
      name,
      passwordHash,
      role: "buyer",
    });

    if (!user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
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
        sellerId: null,
        isAdmin: adminAccess.isAdmin,
        adminRole: adminAccess.adminRole,
        adminPermissions: adminAccess.permissions,
        createdAt: user.created_at,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
