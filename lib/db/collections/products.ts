// Re-export from Supabase
export type { DbProduct } from "@/lib/db/supabase";

export {
  getProductById,
  getProductByPublicId,
  getProductsBySeller,
  createProduct,
  updateProduct,
  listProducts,
  deleteProduct,
} from "@/lib/db/supabase";
