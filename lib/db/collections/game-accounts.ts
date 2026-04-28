// Re-export from Supabase
export type { DbGameAccount } from "@/lib/db/supabase";

export {
  getGameAccountsBySeller,
  getGameAccountById,
  createGameAccount,
  updateGameAccount,
  deleteGameAccount,
} from "@/lib/db/supabase";
