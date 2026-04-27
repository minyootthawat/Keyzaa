import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  (process.env.JWT_SECRET || "").replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim() || "fallback-dev-secret"
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (!payload.isAdmin) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: payload.sub,
        email: payload.email,
        isAdmin: true,
        adminRole: payload.adminRole,
        adminPermissions: payload.adminPermissions,
      },
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false, user: null });
  }
}
