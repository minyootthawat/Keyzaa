/**
 * Sellers Seeder - Seeds seller profiles
 */
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { DEMO_SELLERS } from "./data/users.data";

export async function seedSellers(userIdMap: Map<string, string>): Promise<{
  sellerIdMap: Map<string, string>;
  count: number;
}> {
  const supabase = createServiceRoleClient();
  const sellerIdMap = new Map<string, string>();

  console.log("🌱 Seeding sellers...");

  for (const seller of DEMO_SELLERS) {
    const userId = userIdMap.get(seller.email);
    if (!userId) {
      console.log(`  ⚠️  No user found for ${seller.email}, skipping seller`);
      continue;
    }

    // Check if seller exists
    const { data: existing } = await supabase
      .from("sellers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      // Update existing seller
      const { error } = await supabase
        .from("sellers")
        .update({
          store_name: seller.storeName,
          store_slug: seller.storeSlug,
          description: seller.description || null,
          phone: seller.phone,
          status: "active",
          is_verified: seller.verified,
          rating: seller.rating,
          total_sales: seller.totalSales,
          balance: seller.balance,
          pending_balance: seller.pendingBalance,
          payout_status: "manual",
          response_time_minutes: seller.responseTimeMinutes,
          fulfillment_rate: seller.fulfillmentRate,
          dispute_rate: seller.disputeRate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        console.log(`  ❌ Failed to update seller ${seller.storeName}: ${error.message}`);
        continue;
      }
      
      sellerIdMap.set(seller.storeSlug, existing.id);
      console.log(`  ✅ Updated seller: ${seller.storeName}`);
    } else {
      // Create new seller
      const { data, error } = await supabase
        .from("sellers")
        .insert({
          user_id: userId,
          store_name: seller.storeName,
          store_slug: seller.storeSlug,
          description: seller.description || null,
          phone: seller.phone,
          status: "active",
          is_verified: seller.verified,
          rating: seller.rating,
          total_sales: seller.totalSales,
          balance: seller.balance,
          pending_balance: seller.pendingBalance,
          payout_status: "manual",
          response_time_minutes: seller.responseTimeMinutes,
          fulfillment_rate: seller.fulfillmentRate,
          dispute_rate: seller.disputeRate,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error || !data) {
        console.log(`  ❌ Failed to create seller ${seller.storeName}: ${error?.message}`);
        continue;
      }

      sellerIdMap.set(seller.storeSlug, data.id);
      console.log(`  ✅ Created seller: ${seller.storeName}`);
    }
  }

  console.log(`  📊 Total: ${sellerIdMap.size} sellers`);

  return { sellerIdMap, count: sellerIdMap.size };
}
