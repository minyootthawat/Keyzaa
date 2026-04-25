import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/supabase";

export async function GET() {
  try {
    const supabase = createServiceRoleClient();

    // Fetch products with seller info
    const { data: products, error } = await supabase
      .from("products")
      .select(`
        id,
        name,
        category,
        price,
        stock,
        image_url,
        is_active,
        sellers:seller_id(id, store_name, verified)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(8);

    if (error) {
      console.error("Home products error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    // Fetch category counts
    const { data: categoryRows } = await supabase
      .from("products")
      .select("category")
      .eq("is_active", true);

    const categoryCounts: Record<string, number> = {};
    for (const row of categoryRows ?? []) {
      if (row.category) {
        categoryCounts[row.category] = (categoryCounts[row.category] ?? 0) + 1;
      }
    }

    // Fetch total seller count
    const { count: sellerCount } = await supabase
      .from("sellers")
      .select("*", { count: "exact", head: true });

    // Compute derived fields the landing page needs
    // Simulate realistic discounts: products under ฿200 get higher discounts (bundles/deals)
    const enrichedProducts = (products ?? []).map((p) => {
      const price = Number(p.price);
      // Products under ฿200 get 15-50% discount, others 0-25%
      const discount = price < 200
        ? Math.floor(Math.random() * 35) + 15   // 15-50%
        : Math.floor(Math.random() * 25);        // 0-25%
      const originalPrice = discount > 0 ? Math.round(price / (1 - discount / 100)) : price;
      const sellerData = p.sellers as unknown as { id: string; store_name: string; verified: boolean } | null;

      return {
        id: p.id,
        title: p.name,
        category: p.category,
        price,
        stock: p.stock,
        image: p.image_url || "https://picsum.photos/seed/default/400/300",
        isActive: p.is_active,
        discount,
        originalPrice,
        sellerCount: sellerCount ?? 0,
        seller: {
          id: sellerData?.id ?? "unknown",
          storeName: sellerData?.store_name ?? "ร้านค้า",
          verified: sellerData?.verified ?? false,
        },
      };
    });

    return NextResponse.json({
      products: enrichedProducts,
      categories: categoryCounts,
      totalProducts: categoryRows?.length ?? 0,
      totalSellers: sellerCount ?? 0,
    });
  } catch (error) {
    console.error("Home API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
