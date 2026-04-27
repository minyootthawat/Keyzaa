import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { findUserByEmail } from "@/lib/db/collections/users";
import { getSellerByUserId } from "@/lib/db/collections/sellers";
import { getAdminAccessForEmail } from "@/lib/auth/admin";

const JWT_SECRET = new TextEncoder().encode(
  (process.env.JWT_SECRET || "").replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim() || "fallback-dev-secret"
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

    if (!user.password_hash) {
      return NextResponse.json(
        { error: "This account uses social login. Please sign in with Google, Facebook, or LINE." },
        { status: 401 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const userId = user._id!.toString();
    const adminAccess = await getAdminAccessForEmail(user.email);

    // Get sellerId from MongoDB
    const seller = await getSellerByUserId(userId);
    const sellerId = seller?._id?.toString();

    const token = await new SignJWT({
      userId,
      email: user.email,
      sellerId: sellerId ?? undefined,
      isAdmin: adminAccess.isAdmin,
      adminRole: adminAccess.adminRole ?? undefined,
      adminPermissions: adminAccess.permissions,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: userId,
          email: user.email,
          name: user.name,
          role: user.role,
          sellerId: sellerId ?? undefined,
          isAdmin: adminAccess.isAdmin,
          adminRole: adminAccess.adminRole ?? undefined,
          adminPermissions: adminAccess.permissions,
        },
      },
      {
        headers: {
          "Set-Cookie": `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
        },
      }
    );

    // Also store in localStorage for client-side access (used by backoffice)
    response.headers.set(
      "X-Auth-Token",
      token
    );

    return response;
  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
