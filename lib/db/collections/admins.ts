// Re-export from Supabase
export type { DbAdmin } from "@/lib/db/supabase";

// Admin helpers from supabase.ts (note: findAdminByEmail, not getAdminByEmail)
export {
  findAdminByEmail as getAdminByEmail,
  findAdminByUserId as getAdminByUserId,
  listAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
  listPlatformSettings,
  getPlatformSetting,
  setPlatformSetting,
} from "@/lib/db/supabase";
