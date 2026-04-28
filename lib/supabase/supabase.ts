import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "").trim();

export function createBrowserClientSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set");
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
}

export function createServerClientSupabase(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set");
  }
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function createServiceRoleClient(): SupabaseClient {
  const raw = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const serviceRoleKey = raw.replace(/[\x00-\x1F\x7F-\x9F]/g, "").trim();
  if (
    !serviceRoleKey ||
    serviceRoleKey === "mock_key" ||
    !supabaseUrl ||
    supabaseUrl.includes("mock.supabase.co")
  ) {
    // Return a dummy client for mock/demo mode — API routes should fallback to mock data
    return createClient("https://mock.supabase.co", "mock_key");
  }
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL must be set");
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Alias for clarity — server-side API routes use this
export function createAdminClient(): SupabaseClient {
  return createServiceRoleClient();
}

// Lazy singleton — only created when actually called, not at module load time
let _supabase: SupabaseClient | null = null;
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createBrowserClientSupabase();
  }
  return _supabase;
}
