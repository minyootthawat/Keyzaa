/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const sep = trimmed.indexOf("=");
    if (sep === -1) continue;
    const key = trimmed.slice(0, sep).trim();
    const value = trimmed.slice(sep + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

async function main() {
  loadLocalEnv();

  const { createClient } = require("@supabase/supabase-js");
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const now = new Date().toISOString();

  const demoUsers = [
    {
      email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || "admin@demo.keyzaa.local",
      password: process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || "demo123",
      name: "Demo Admin",
      role: "buyer",
    },
    {
      email: process.env.NEXT_PUBLIC_DEMO_BUYER_EMAIL || "buyer@demo.keyzaa.local",
      password: process.env.NEXT_PUBLIC_DEMO_BUYER_PASSWORD || "demo123",
      name: "Demo Buyer",
      role: "buyer",
    },
    {
      email: process.env.NEXT_PUBLIC_DEMO_SELLER_EMAIL || "seller@demo.keyzaa.local",
      password: process.env.NEXT_PUBLIC_DEMO_SELLER_PASSWORD || "demo123",
      name: "Demo Seller",
      role: "seller",
    },
  ];

  for (const user of demoUsers) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    const { error } = await supabase
      .from("users")
      .upsert(
        {
          email: user.email,
          name: user.name,
          password_hash: passwordHash,
          role: user.role,
          provider: null,
          provider_id: null,
          created_at: now,
          updated_at: now,
        },
        { onConflict: "email" }
      );

    if (error) {
      console.error(`Failed to seed ${user.email}:`, error.message);
    } else {
      console.log(`Seeded: ${user.email} / ${user.password}`);
    }
  }

  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
