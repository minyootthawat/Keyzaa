// Re-export from Supabase
export type { DbUser } from "@/lib/db/supabase";

export {
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  updateUserLastLogin,
  listUsers,
} from "@/lib/db/supabase";
