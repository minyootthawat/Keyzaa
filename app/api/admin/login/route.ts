import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { getDB } from "@/lib/mongodb/client";

const JWT_SECRET = new TextEncoder().encode(
  (process.env.JWT_SECRET || "").replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim() || "fallback-dev-secret"
);

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password required" },
        { status: 400 }
      );
    }

    const db = getDB();
    const admin = await db.collection("admins").findOne({
      email: email.toLowerCase(),
    });

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Get the user to verify password
    const user = await db.collection("users").findOne({ _id: admin.user_id });
    if (!user || !user.password_hash) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      sub: admin.user_id,
      email: admin.email,
      isAdmin: true,
      adminRole: admin.role,
      adminPermissions: admin.permissions || [],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.user_id,
        email: admin.email,
        name: user.name || admin.email.split("@")[0],
        isAdmin: true,
        adminRole: admin.role,
        adminPermissions: admin.permissions || [],
      },
    });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
