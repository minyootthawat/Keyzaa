/**
 * Orders Seeder - Seeds orders with various statuses
 */
import { createServiceRoleClient } from "@/lib/supabase/supabase";

interface OrderSeedData {
  buyerId: string;
  sellerId: string;
  items: Array<{
    productId: string;
    title: string;
    price: number;
    quantity: number;
  }>;
  totalPrice: number;
  status: "pending" | "paid" | "processing" | "completed" | "cancelled";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  fulfillmentStatus: "pending" | "processing" | "delivered" | "failed" | "cancelled";
  paymentMethod: string;
  daysAgo: number;
}

export async function seedOrders(
  userIdMap: Map<string, string>,
  sellerIdMap: Map<string, string>,
  productIdMap: Map<string, string>,
  targetCount: number = 100
): Promise<{ count: number }> {
  const supabase = createServiceRoleClient();

  console.log(`🌱 Seeding orders (target: ${targetCount})...`);

  // Get buyer and seller IDs
  const buyerIds = Array.from(userIdMap.values()).slice(0, 10); // Use first 10 users as buyers
  const sellerIds = Array.from(sellerIdMap.values());
  const productIds = Array.from(productIdMap.values());

  if (buyerIds.length === 0 || sellerIds.length === 0 || productIds.length === 0) {
    console.log("  ⚠️  Missing buyers, sellers, or products - skipping orders");
    return { count: 0 };
  }

  // Status distribution - realistic e-commerce order distribution
  const statuses: OrderSeedData["status"][] = [
    "completed", "completed", "completed", "completed", "completed", // 50% completed
    "paid", "paid", "paid", // 20% paid
    "processing", "processing", // 15% processing
    "pending", // 10% pending
    "cancelled", // 5% cancelled
  ];

  const paymentMethods = ["promptpay", "credit_card", "bank_transfer"];
  let createdCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < targetCount; i++) {
    const buyerId = buyerIds[i % buyerIds.length];
    const sellerId = sellerIds[i % sellerIds.length];
    
    // Create 1-3 items per order
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const items: OrderSeedData["items"] = [];
    let totalPrice = 0;

    for (let j = 0; j < itemCount; j++) {
      const productId = productIds[(i + j) % productIds.length];
      const price = Math.floor(Math.random() * 400) + 50;
      const quantity = Math.floor(Math.random() * 3) + 1;
      
      items.push({
        productId,
        title: `Product ${productId.slice(0, 8)}`,
        price,
        quantity,
      });
      totalPrice += price * quantity;
    }

    const status = statuses[i % statuses.length];
    const paymentStatus = status === "completed" || status === "paid" ? "paid" : status === "cancelled" ? "refunded" : "pending";
    const fulfillmentStatus = status === "completed" ? "delivered" : status === "processing" ? "processing" : status === "cancelled" ? "cancelled" : "pending";

    // Calculate commission (5%)
    const commissionAmount = totalPrice * 0.05;
    const sellerNetAmount = totalPrice - commissionAmount;

    // Random days ago (0-90 days, weighted toward recent)
    const daysAgo = Math.floor(Math.pow(Math.random(), 2) * 90);
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - daysAgo);

    // Check for existing order (simplified check)
    const { data: existing } = await supabase
      .from("orders")
      .select("id")
      .eq("buyer_id", buyerId)
      .eq("seller_id", sellerId)
      .eq("total_price", totalPrice)
      .maybeSingle();

    if (existing) {
      skippedCount++;
      continue;
    }

    const { error } = await supabase
      .from("orders")
      .insert({
        buyer_id: buyerId,
        seller_id: sellerId,
        items,
        total_price: totalPrice,
        gross_amount: totalPrice,
        commission_amount: commissionAmount,
        seller_net_amount: sellerNetAmount,
        platform_fee_rate: 0.05,
        currency: "THB",
        status,
        payment_status: paymentStatus,
        fulfillment_status: fulfillmentStatus,
        payment_method: paymentMethods[i % paymentMethods.length],
        created_at: orderDate.toISOString(),
        updated_at: orderDate.toISOString(),
      });

    if (error) {
      console.log(`  ❌ Failed to create order ${i + 1}: ${error.message}`);
      skippedCount++;
    } else {
      createdCount++;
    }

    // Log progress every 50 orders
    if ((i + 1) % 50 === 0) {
      console.log(`  📦 Created ${createdCount} orders so far...`);
    }
  }

  console.log(`  📊 Total: ${createdCount} created, ${skippedCount} skipped`);

  return { count: createdCount };
}
