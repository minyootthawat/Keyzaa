import { createServiceRoleClient } from "@/lib/supabase/supabase";
import { findUserById } from "@/lib/db/collections/users";
import { ADMIN_ROLE_PERMISSIONS } from "@/lib/auth/admin";

export type AdminRole = "super_admin" | "ops_admin" | "support_admin" | "catalog_admin";

export interface Admin {
  id: string;
  user_id: string;
  role: AdminRole;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AdminIpAllowlist {
  id: string;
  ip_address: string;
  label: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
}

export interface AuditLogParams {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogQuery {
  adminId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

const supabase = createServiceRoleClient();

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  return "code" in error && error.code === "PGRST205";
}

export async function getAdmins(): Promise<Admin[]> {
  const { data, error } = await supabase
    .from("admins")
    .select(`
      *,
      user:users!admins_user_id_fkey(id, email, name)
    `)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    user_id: row.user_id as string,
    role: row.role as AdminRole,
    created_by: row.created_by as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    user_email: (row.user as Record<string, unknown>)?.email as string,
    user_name: (row.user as Record<string, unknown>)?.name as string,
  }));
}

export async function getAdminByUserId(userId: string): Promise<Admin | null> {
  const { data, error } = await supabase
    .from("admins")
    .select(`
      *,
      user:users!admins_user_id_fkey(id, email, name)
    `)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    role: row.role as AdminRole,
    created_by: row.created_by as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    user_email: (row.user as Record<string, unknown>)?.email as string,
    user_name: (row.user as Record<string, unknown>)?.name as string,
  };
}

export async function createAdmin(
  userId: string,
  role: AdminRole,
  createdBy: string
): Promise<Admin> {
  const user = await findUserById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const { data, error } = await supabase
    .from("admins")
    .insert({
      user_id: userId,
      email: user.email,
      role,
      is_super_admin: role === "super_admin",
      permissions: ADMIN_ROLE_PERMISSIONS[role],
      created_by: createdBy,
    })
    .select(`
      *,
      user:users!admins_user_id_fkey(id, email, name)
    `)
    .single();

  if (error) throw error;

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    role: row.role as AdminRole,
    created_by: row.created_by as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    user_email: (row.user as Record<string, unknown>)?.email as string,
    user_name: (row.user as Record<string, unknown>)?.name as string,
  };
}

export async function updateAdminRole(
  adminId: string,
  role: AdminRole
): Promise<Admin> {
  const { data, error } = await supabase
    .from("admins")
    .update({
      role,
      is_super_admin: role === "super_admin",
      permissions: ADMIN_ROLE_PERMISSIONS[role],
    })
    .eq("id", adminId)
    .select(`
      *,
      user:users!admins_user_id_fkey(id, email, name)
    `)
    .single();

  if (error) throw error;

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    role: row.role as AdminRole,
    created_by: row.created_by as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    user_email: (row.user as Record<string, unknown>)?.email as string,
    user_name: (row.user as Record<string, unknown>)?.name as string,
  };
}

export async function deleteAdmin(adminId: string): Promise<void> {
  const { error } = await supabase.from("admins").delete().eq("id", adminId);
  if (error) throw error;
}

export async function getAdminAuditLog({
  adminId,
  action,
  dateFrom,
  dateTo,
  limit = 50,
  offset = 0,
}: AuditLogQuery): Promise<AdminAuditLog[]> {
  let query = supabase
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (adminId) query = query.eq("admin_id", adminId);
  if (action) query = query.eq("action", action);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  const { data, error } = await query;
  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    admin_id: row.admin_id as string,
    action: row.action as string,
    target_type: row.target_type as string | null,
    target_id: row.target_id as string | null,
    details: (row.details ?? {}) as Record<string, unknown>,
    ip_address: row.ip_address as string | null,
    user_agent: row.user_agent as string | null,
    created_at: row.created_at as string,
  }));
}

export async function createAuditLog({
  adminId,
  action,
  targetType,
  targetId,
  details,
  ipAddress,
  userAgent,
}: AuditLogParams): Promise<AdminAuditLog> {
  const { data, error } = await supabase
    .from("admin_audit_log")
    .insert({
      admin_id: adminId,
      action,
      target_type: targetType ?? null,
      target_id: targetId ?? null,
      details: details ?? {},
      ip_address: ipAddress ?? null,
      user_agent: userAgent ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    admin_id: row.admin_id as string,
    action: row.action as string,
    target_type: row.target_type as string | null,
    target_id: row.target_id as string | null,
    details: (row.details ?? {}) as Record<string, unknown>,
    ip_address: row.ip_address as string | null,
    user_agent: row.user_agent as string | null,
    created_at: row.created_at as string,
  };
}

export async function getIpAllowlist(): Promise<AdminIpAllowlist[]> {
  const { data, error } = await supabase
    .from("admin_ip_allowlist")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return [];
    }
    throw error;
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    ip_address: row.ip_address as string,
    label: row.label as string,
    is_active: row.is_active as boolean,
    created_by: row.created_by as string | null,
    created_at: row.created_at as string,
  }));
}

export async function addIpToAllowlist(
  ip: string,
  label: string,
  createdBy: string
): Promise<AdminIpAllowlist> {
  const { data, error } = await supabase
    .from("admin_ip_allowlist")
    .insert({
      ip_address: ip,
      label,
      created_by: createdBy,
    })
    .select("*")
    .single();

  if (error) throw error;

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    ip_address: row.ip_address as string,
    label: row.label as string,
    is_active: row.is_active as boolean,
    created_by: row.created_by as string | null,
    created_at: row.created_at as string,
  };
}

export async function removeIpFromAllowlist(id: string): Promise<void> {
  const { error } = await supabase
    .from("admin_ip_allowlist")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function toggleIpAllowlist(
  id: string,
  isActive: boolean
): Promise<AdminIpAllowlist> {
  const { data, error } = await supabase
    .from("admin_ip_allowlist")
    .update({ is_active: isActive })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  const row = data as Record<string, unknown>;
  return {
    id: row.id as string,
    ip_address: row.ip_address as string,
    label: row.label as string,
    is_active: row.is_active as boolean,
    created_by: row.created_by as string | null,
    created_at: row.created_at as string,
  };
}
