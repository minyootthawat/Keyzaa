/**
 * Game Accounts Seeder - Seeds game accounts for sale
 */
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { DEMO_GAME_ACCOUNTS, generateBulkGameAccounts } from "./data/games.data";

export async function seedGameAccounts(sellerIdMap: Map<string, string>): Promise<{
  count: number;
}> {
  const supabase = createServiceRoleClient();

  console.log("🌱 Seeding game accounts...");

  // Get seller slugs for bulk generation
  const sellerSlugs = Array.from(sellerIdMap.keys());
  
  // Generate bulk game accounts if needed
  const bulkAccounts = generateBulkGameAccounts(sellerSlugs, 30);
  const allAccounts = [...DEMO_GAME_ACCOUNTS, ...bulkAccounts];

  let createdCount = 0;
  let skippedCount = 0;

  for (const account of allAccounts) {
    const sellerId = sellerIdMap.get(account.sellerSlug);
    if (!sellerId) {
      console.log(`  ⚠️  No seller found for slug: ${account.sellerSlug}`);
      skippedCount++;
      continue;
    }

    // Check if game account exists
    const { data: existing } = await supabase
      .from("game_accounts")
      .select("id")
      .eq("seller_id", sellerId)
      .eq("account_username", account.accountUsername)
      .maybeSingle();

    if (existing) {
      // Update existing account
      const { error } = await supabase
        .from("game_accounts")
        .update({
          game_name: account.gameName,
          game_name_th: account.gameNameTh,
          description: account.description,
          price: account.price,
          stock: account.stock,
          platform: account.platform,
          region: account.region,
          image_url: account.imageUrl,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        console.log(`  ❌ Failed to update game account ${account.gameName}: ${error.message}`);
        skippedCount++;
      } else {
        skippedCount++;
      }
    } else {
      // Create new game account
      const { error } = await supabase
        .from("game_accounts")
        .insert({
          seller_id: sellerId,
          game_name: account.gameName,
          game_name_th: account.gameNameTh,
          account_username: account.accountUsername,
          account_password: account.accountPassword,
          description: account.description,
          price: account.price,
          stock: account.stock,
          platform: account.platform,
          region: account.region,
          image_url: account.imageUrl,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.log(`  ❌ Failed to create game account ${account.gameName}: ${error.message}`);
        skippedCount++;
      } else {
        createdCount++;
      }
    }
  }

  console.log(`  📊 Total: ${createdCount} created, ${skippedCount} updated/existing`);

  return { count: createdCount + skippedCount };
}
