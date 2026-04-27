import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/lib/auth/admin";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

export async function GET() {
  try {
    const access = await requireAdminPermission("admin:settings:write");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("platform_settings")
      .select("key, value")
      .order("key");

    if (error) {
      console.error("Settings GET error:", error);
      return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
    }

    const settings: Record<string, Record<string, unknown>> = {};
    for (const row of data ?? []) {
      settings[row.key] = row.value;
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Admin settings GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const access = await requireAdminPermission("admin:settings:write");
    if (access.status !== 200) {
      return NextResponse.json({ error: access.error }, { status: access.status });
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

    const supabase = createServiceRoleClient();

    // Fetch current value
    const { data: current } = await supabase
      .from("platform_settings")
      .select("value")
      .eq("key", key)
      .single();

    const mergedValue = { ...(current?.value ?? {}), ...updates };

    const { error } = await supabase
      .from("platform_settings")
      .update({ value: mergedValue, updated_at: new Date().toISOString() })
      .eq("key", key);

    if (error) {
      console.error("Settings PATCH error:", error);
      return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin settings PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
