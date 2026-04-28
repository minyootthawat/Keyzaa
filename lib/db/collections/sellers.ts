// Re-export from Supabase
export type { DbSeller } from "@/lib/db/supabase";

export {
  getSellerByUserId,
  getSellerById,
  getSellerByEmail,
  createSeller,
  updateSeller,
  listSellers,
} from "@/lib/db/supabase";
