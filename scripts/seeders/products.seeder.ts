/**
 * Products Seeder - Seeds products for all sellers
 */
import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { DEMO_PRODUCTS, generateBulkProducts } from "./data/products.data";

export async function seedProducts(sellerIdMap: Map<string, string>): Promise<{
  productIdMap: Map<string, string>;
  count: number;
}> {
  const supabase = createServiceRoleClient();
  const productIdMap = new Map<string, string>();

  console.log("🌱 Seeding products...");

  // Get seller slugs for bulk generation
  const sellerSlugs = Array.from(sellerIdMap.keys());
  
  // Generate bulk products if needed
  const bulkProducts = generateBulkProducts(sellerSlugs, 50);
  const allProducts = [...DEMO_PRODUCTS, ...bulkProducts];

  // Batch process for better performance
  const batchSize = 50;
  let createdCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < allProducts.length; i += batchSize) {
    const batch = allProducts.slice(i, i + batchSize);
    
    for (const product of batch) {
      const sellerId = sellerIdMap.get(product.sellerSlug);
      if (!sellerId) {
        console.log(`  ⚠️  No seller found for slug: ${product.sellerSlug}`);
        skippedCount++;
        continue;
      }

      const productKey = `${product.sellerSlug}:${product.name}`;
      
      // Check if product exists
      const { data: existing } = await supabase
        .from("products")
        .select("id")
        .eq("seller_id", sellerId)
        .eq("name", product.name)
        .maybeSingle();

      if (existing) {
        // Update existing product
        const { error } = await supabase
          .from("products")
          .update({
            description: product.description,
            category: product.category,
            price: product.price,
            stock: product.stock,
            image_url: product.imageUrl,
            status: "active",
            is_featured: product.isFeatured || false,
            tags: product.tags,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          console.log(`  ❌ Failed to update product ${product.name}: ${error.message}`);
          skippedCount++;
        } else {
          productIdMap.set(productKey, existing.id);
          skippedCount++;
        }
      } else {
        // Create new product
        const { data, error } = await supabase
          .from("products")
          .insert({
            seller_id: sellerId,
            name: product.name,
            description: product.description,
            category: product.category,
            price: product.price,
            stock: product.stock,
            image_url: product.imageUrl,
            status: "active",
            is_featured: product.isFeatured || false,
            tags: product.tags,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (error || !data) {
          console.log(`  ❌ Failed to create product ${product.name}: ${error?.message}`);
          skippedCount++;
        } else {
          productIdMap.set(productKey, data.id);
          createdCount++;
        }
      }
    }

    console.log(`  📦 Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allProducts.length / batchSize)}`);
  }

  console.log(`  📊 Total: ${createdCount} created, ${skippedCount} updated/existing`);

  return { productIdMap, count: productIdMap.size };
}
