import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { getDB } from "@/lib/mongodb/client";
import { ObjectId } from "mongodb";

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

    console.log("[admin-login] email:", email, "-> admin:", admin ? admin.email : "NOT FOUND");

    if (!admin) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Find user: try by user_id (ObjectId or UUID) first, then fallback to email
    const userId = admin.user_id;
    const isObjectId = typeof userId === "string" && /^[a-f\d]{24}$/i.test(userId);

    let adminUser = null;
    if (userId) {
      if (isObjectId) {
        adminUser = await db.collection("users").findOne({ _id: new ObjectId(userId as string) });
      } else {
        // Try as UUID / string _id first
        adminUser = await db.collection("users").findOne({ _id: userId as unknown as ObjectId });
        // Fallback: find by email if user_id lookup failed
        if (!adminUser) {
          adminUser = await db.collection("users").findOne({ email: admin.email });
        }
      }
    } else {
      // No user_id — find by email
      adminUser = await db.collection("users").findOne({ email: admin.email });
    }

    // If still not found, scan users collection to see what emails exist
    if (!adminUser) {
      const sampleUsers = await db.collection("users").find({}).limit(5).toArray();
      console.log("[admin-login] No user found. Sample users:", sampleUsers.map(u => ({ _id: u._id, email: u.email, hasHash: !!u.password_hash })));
    }

    console.log("[admin-login] adminUser:", adminUser
      ? { _id: adminUser._id, email: adminUser.email, hasHash: !!adminUser.password_hash }
      : "NOT FOUND");

    if (!adminUser) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!adminUser.password_hash) {
      console.log("[admin-login] adminUser has no password_hash");
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, adminUser.password_hash);
    console.log("[admin-login] password match:", passwordMatch);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await new SignJWT({
      sub: String(admin.user_id),
      email: admin.email,
      isAdmin: true,
      adminRole: admin.role,
      adminPermissions: admin.permissions || [],
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(JWT_SECRET);

    const response = NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: admin.user_id,
          email: admin.email,
          name: adminUser.name || admin.email.split("@")[0],
          isAdmin: true,
          adminRole: admin.role,
          adminPermissions: admin.permissions || [],
        },
      },
      { status: 200 }
    );

    // Set HttpOnly cookie BEFORE returning response
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("[admin-login] error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
