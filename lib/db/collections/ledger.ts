// Re-export from Supabase
export type { DbLedgerEntry } from "@/lib/db/supabase";

export {
  getLedgerBySeller,
  createLedgerEntry,
} from "@/lib/db/supabase";
