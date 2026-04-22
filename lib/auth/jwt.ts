import { jwtVerify, type JWTPayload } from "jose";
import type { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export interface KeyzaaJWTPayload extends JWTPayload {
  userId?: string;
  email?: string;
}

export async function getBearerPayload(req: NextRequest): Promise<KeyzaaJWTPayload | null> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as KeyzaaJWTPayload;
}
