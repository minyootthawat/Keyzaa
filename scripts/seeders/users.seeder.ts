/**
 * Users Seeder - Seeds demo users (admins, buyers, sellers)
 */
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import bcrypt from "bcryptjs";
import { DEMO_ADMINS, DEMO_BUYERS, DEMO_SELLERS } from "./data/users.data";

const BCRYPT_ROUNDS = 10;
const DEMO_PASSWORD = "demo123";

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_ROUNDS);
}

export async function seedUsers(): Promise<{
  userIdMap: Map<string, string>;
  adminCount: number;
  buyerCount: number;
  sellerCount: number;
}> {
  const supabase = createServiceRoleClient();
  const userIdMap = new Map<string, string>();
  
  let adminCount = 0;
  let buyerCount = 0;
  let sellerCount = 0;

  console.log("🌱 Seeding users...");

  // Seed admins
  for (const admin of DEMO_ADMINS) {
    const result = await upsertUser(supabase, admin.email, admin.name, "buyer", hashPassword(DEMO_PASSWORD));
    if (result) {
      userIdMap.set(admin.email, result);
      adminCount++;
      
      // Create admin record
      await supabase.from("admins").upsert({
        id: result,
        email: admin.email.toLowerCase(),
        password_hash: hashPassword(DEMO_PASSWORD),
        role: "super_admin",
        is_super_admin: true,
        permissions: ["admin:access"],
        created_at: new Date().toISOString(),
      }, { onConflict: "id" });
      
      console.log(`  ✅ Admin: ${admin.email}`);
    } else {
      console.log(`  ⚠️  Admin already exists: ${admin.email}`);
    }
  }

  // Seed buyers
  for (const buyer of DEMO_BUYERS) {
    const result = await upsertUser(supabase, buyer.email, buyer.name, buyer.role, hashPassword(DEMO_PASSWORD));
    if (result) {
      userIdMap.set(buyer.email, result);
      buyerCount++;
      console.log(`  ✅ Buyer: ${buyer.email}`);
    } else {
      console.log(`  ⚠️  Buyer already exists: ${buyer.email}`);
    }
  }

  // Seed sellers
  for (const seller of DEMO_SELLERS) {
    const result = await upsertUser(supabase, seller.email, seller.name, "seller", hashPassword(DEMO_PASSWORD));
    if (result) {
      userIdMap.set(seller.email, result);
      sellerCount++;
      console.log(`  ✅ Seller: ${seller.email}`);
    } else {
      console.log(`  ⚠️  Seller already exists: ${seller.email}`);
    }
  }

  console.log(`  📊 Total: ${adminCount} admins, ${buyerCount} buyers, ${sellerCount} sellers`);

  return { userIdMap, adminCount, buyerCount, sellerCount };
}

async function upsertUser(
  supabase: ReturnType<typeof createServiceRoleClient>,
  email: string,
  name: string,
  role: string,
  passwordHash: string
): Promise<string | null> {
  // Check if user exists
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();

  if (existing) {
    // Update existing user
    const { error } = await supabase
      .from("users")
      .update({
        name,
        password_hash: passwordHash,
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) {
      console.error(`    ❌ Failed to update user ${email}: ${error.message}`);
      return null;
    }
    return existing.id;
  }

  // Create new user
  const { data, error } = await supabase
    .from("users")
    .insert({
      email: email.toLowerCase(),
      name,
      password_hash: passwordHash,
      role,
      provider: null,
      provider_id: null,
      is_email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error(`    ❌ Failed to create user ${email}: ${error?.message}`);
    return null;
  }

  return data.id;
}
