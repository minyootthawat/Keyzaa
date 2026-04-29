/**
 * Ledger Seeder - Seeds wallet/ledger entries for sellers
 */
import { createServiceRoleClient } from "@/lib/supabase/supabase";

interface LedgerSeedData {
  sellerId: string;
  type: "sale" | "commission_fee" | "withdrawal" | "refund";
  amount: number;
  description: string;
  daysAgo: number;
  orderId?: string;
}

export async function seedLedger(
  sellerIdMap: Map<string, string>,
  targetPerSeller: number = 50
): Promise<{ count: number }> {
  const supabase = createServiceRoleClient();

  console.log(`🌱 Seeding ledger entries (${targetPerSeller} per seller)...`);

  const sellerIds = Array.from(sellerIdMap.values());
  let totalCreated = 0;

  for (const sellerId of sellerIds) {
    let createdCount = 0;
    const entries: LedgerSeedData[] = [];

    // Generate realistic ledger entries
    // Start with sales
    const saleCount = Math.floor(targetPerSeller * 0.6); // 60% sales
    for (let i = 0; i < saleCount; i++) {
      const daysAgo = Math.floor(Math.pow(Math.random(), 2) * 90);
      const amount = Math.floor(Math.random() * 900) + 100;
      
      entries.push({
        sellerId,
        type: "sale",
        amount,
        description: `Order #ORD${sellerId.slice(0, 8)}-${i + 1}`,
        daysAgo,
      });
    }

    // Add commission fees (corresponds to sales)
    const commissionCount = Math.floor(targetPerSeller * 0.3); // 30% commission fees
    for (let i = 0; i < commissionCount; i++) {
      const daysAgo = Math.floor(Math.pow(Math.random(), 2) * 90);
      const amount = Math.floor(Math.random() * 45) + 5; // 5% commission
      
      entries.push({
        sellerId,
        type: "commission_fee",
        amount: -amount, // Negative for fees
        description: `Platform fee 5% - Order`,
        daysAgo,
      });
    }

    // Add occasional withdrawals
    const withdrawalCount = Math.floor(targetPerSeller * 0.1); // 10% withdrawals
    for (let i = 0; i < withdrawalCount; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const amount = Math.floor(Math.random() * 5000) + 1000;
      
      entries.push({
        sellerId,
        type: "withdrawal",
        amount: -amount,
        description: `Withdrawal to bank account`,
        daysAgo,
      });
    }

    // Insert entries
    for (const entry of entries) {
      const entryDate = new Date();
      entryDate.setDate(entryDate.getDate() - entry.daysAgo);

      const { error } = await supabase
        .from("ledger_entries")
        .insert({
          seller_id: entry.sellerId,
          type: entry.type,
          amount: entry.amount,
          order_id: entry.orderId || null,
          description: entry.description,
          created_at: entryDate.toISOString(),
        });

      if (!error) {
        createdCount++;
      }
    }

    totalCreated += createdCount;
  }

  console.log(`  📊 Total: ${totalCreated} ledger entries`);

  return { count: totalCreated };
}
