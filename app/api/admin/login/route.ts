import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import { verifyAdminPassword } from "@/lib/auth/admin";

const JWT_SECRET = new TextEncoder().encode(
  (process.env.JWT_SECRET || "").replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim() || "fallback-dev-secret"
);

function buildAdminRefreshCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `admin_refresh_token=${token}; Path=/; Max-Age=${86400 * 7}; HttpOnly; SameSite=Lax${secure}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password required" },
        { status: 400 }
      );
    }

    const admin = await verifyAdminPassword(email, password);

    console.log("[admin-login] email:", email, "-> admin:", admin ? { id: admin.id, email: admin.email } : "NOT FOUND / INVALID");

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const tokenPayload = {
      id: String(admin.userId),
      sub: String(admin.id),
      email: admin.email,
      isAdmin: true,
      adminRole: admin.role,
      adminPermissions: admin.permissions || [],
    };

    const token = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(JWT_SECRET);

    const refreshToken = await new SignJWT(tokenPayload)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: admin.id,
          email: admin.email,
          name: admin.email.split("@")[0],
          isAdmin: true,
          adminRole: admin.role,
          adminPermissions: admin.permissions || [],
        },
      },
      { status: 200 }
    );

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });
    response.headers.append("Set-Cookie", buildAdminRefreshCookie(refreshToken));

    return response;
  } catch (error) {
    console.error("[admin-login] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
