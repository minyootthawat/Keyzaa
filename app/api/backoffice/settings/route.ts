import { NextRequest, NextResponse } from "next/server";
import { getServerAdminAccess } from "@/lib/auth/server";
import { listPlatformSettings, setPlatformSetting } from "@/lib/db/collections/admins";

export async function GET(req: NextRequest) {
  try {
    const result = await getServerAdminAccess(req);
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const settings = await listPlatformSettings();

    const settingsMap: Record<string, Record<string, unknown>> = {};
    for (const row of settings) {
      settingsMap[row.key] = row.value as Record<string, unknown>;
    }

    return NextResponse.json(settingsMap);
  } catch (error) {
    console.error("Admin settings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const result = await getServerAdminAccess();
    if (result.status !== 200) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const body = await req.json();
    const { key, updates } = body as { key: string; updates: Record<string, unknown> };

    if (!key || !updates) {
      return NextResponse.json({ error: "key and updates are required" }, { status: 400 });
    }

    const allowedKeys = ["general", "features", "categories"];
    if (!allowedKeys.includes(key)) {
      return NextResponse.json({ error: "Invalid settings key" }, { status: 400 });
    }

    // Fetch current value and merge
    const { getPlatformSetting } = await import("@/lib/db/collections/admins");
    const current = await getPlatformSetting(key);
    const currentValue = (current?.value as Record<string, unknown>) ?? {};
    const mergedValue = { ...currentValue, ...updates };

    await setPlatformSetting(key, mergedValue);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin settings PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
