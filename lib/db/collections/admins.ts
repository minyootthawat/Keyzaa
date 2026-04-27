import { ObjectId } from "mongodb";
import { getDB } from "@/lib/mongodb";

// ─── Admin helpers ──────────────────────────────────────────────────────────

export interface DbAdmin {
  _id?: ObjectId;
  user_id: string;
  email: string;
  role: string;
  permissions: string[];
  created_by?: string | null;
  created_at: string;
}

export async function getAdminByEmail(email: string): Promise<DbAdmin | null> {
  const db = getDB();
  return db.collection<DbAdmin>("admins").findOne({ email: email.toLowerCase() });
}

export async function getAdminByUserId(userId: string): Promise<DbAdmin | null> {
  const db = getDB();
  return db.collection<DbAdmin>("admins").findOne({ user_id: userId });
}

export async function listAdmins(opts?: {
  search?: string;
  role?: string;
  limit?: number;
  offset?: number;
}): Promise<{ admins: DbAdmin[]; total: number }> {
  const db = getDB();
  const filter: Record<string, unknown> = {};
  if (opts?.search) {
    filter.email = { $regex: opts.search, $options: "i" };
  }
  if (opts?.role) filter.role = opts.role;

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const [admins, total] = await Promise.all([
    db
      .collection<DbAdmin>("admins")
      .find(filter)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
    db.collection<DbAdmin>("admins").countDocuments(filter),
  ]);

  return { admins, total };
}

export async function createAdmin(data: {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  createdBy?: string;
}): Promise<DbAdmin> {
  const db = getDB();
  const doc: Omit<DbAdmin, "_id"> = {
    user_id: data.userId,
    email: data.email.toLowerCase(),
    role: data.role,
    permissions: data.permissions,
    created_by: data.createdBy ?? undefined,
    created_at: new Date().toISOString(),
  };
  const result = await db.collection<DbAdmin>("admins").insertOne(doc as DbAdmin);
  return { ...doc, _id: result.insertedId } as DbAdmin;
}

export async function updateAdmin(
  id: string,
  updates: Partial<DbAdmin>
): Promise<DbAdmin | null> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return null;
  return db
    .collection<DbAdmin>("admins")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );
}

export async function deleteAdmin(id: string): Promise<boolean> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return false;
  const result = await db
    .collection<DbAdmin>("admins")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

// ─── Audit log helpers ──────────────────────────────────────────────────────

export interface DbAuditLog {
  _id?: ObjectId;
  admin_id: string;
  action: string;
  target_type?: string;
  target_id?: string;
  details?: unknown;
  ip_address?: string;
  created_at: string;
}

export async function createAuditLog(data: {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: unknown;
  ipAddress?: string;
}): Promise<DbAuditLog> {
  const db = getDB();
  const doc: Omit<DbAuditLog, "_id"> = {
    admin_id: data.adminId,
    action: data.action,
    target_type: data.targetType ?? undefined,
    target_id: data.targetId ?? undefined,
    details: data.details ?? undefined,
    ip_address: data.ipAddress ?? undefined,
    created_at: new Date().toISOString(),
  };
  const result = await db
    .collection<DbAuditLog>("admin_audit_log")
    .insertOne(doc as DbAuditLog);
  return { ...doc, _id: result.insertedId } as DbAuditLog;
}

export async function listAuditLogs(opts?: {
  adminId?: string;
  action?: string;
  targetType?: string;
  limit?: number;
  offset?: number;
}): Promise<{ logs: DbAuditLog[]; total: number }> {
  const db = getDB();
  const filter: Record<string, unknown> = {};
  if (opts?.adminId) filter.admin_id = opts.adminId;
  if (opts?.action) filter.action = opts.action;
  if (opts?.targetType) filter.target_type = opts.targetType;

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const [logs, total] = await Promise.all([
    db
      .collection<DbAuditLog>("admin_audit_log")
      .find(filter)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
    db.collection<DbAuditLog>("admin_audit_log").countDocuments(filter),
  ]);

  return { logs, total };
}

// ─── IP allowlist helpers ───────────────────────────────────────────────────

export interface DbIpAllowlist {
  _id?: ObjectId;
  ip_address: string;
  label?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export async function listIpAllowlist(): Promise<DbIpAllowlist[]> {
  const db = getDB();
  return db
    .collection<DbIpAllowlist>("admin_ip_allowlist")
    .find()
    .sort({ created_at: -1 })
    .toArray();
}

export async function addIpAllowlistEntry(data: {
  ipAddress: string;
  label?: string;
  createdBy: string;
}): Promise<DbIpAllowlist> {
  const db = getDB();
  const doc: Omit<DbIpAllowlist, "_id"> = {
    ip_address: data.ipAddress,
    label: data.label ?? undefined,
    is_active: true,
    created_by: data.createdBy,
    created_at: new Date().toISOString(),
  };
  const result = await db
    .collection<DbIpAllowlist>("admin_ip_allowlist")
    .insertOne(doc as DbIpAllowlist);
  return { ...doc, _id: result.insertedId } as DbIpAllowlist;
}

export async function updateIpAllowlistEntry(
  id: string,
  updates: Partial<DbIpAllowlist>
): Promise<DbIpAllowlist | null> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return null;
  return db
    .collection<DbIpAllowlist>("admin_ip_allowlist")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: "after" }
    );
}

export async function deleteIpAllowlistEntry(id: string): Promise<boolean> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return false;
  const result = await db
    .collection<DbIpAllowlist>("admin_ip_allowlist")
    .deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

// ─── Platform settings helpers ──────────────────────────────────────────────

export interface DbPlatformSetting {
  _id?: ObjectId;
  key: string;
  value: unknown;
  updated_at: string;
}

export async function getPlatformSetting(key: string): Promise<DbPlatformSetting | null> {
  const db = getDB();
  return db.collection<DbPlatformSetting>("platform_settings").findOne({ key });
}

export async function setPlatformSetting(key: string, value: unknown): Promise<void> {
  const db = getDB();
  await db.collection<DbPlatformSetting>("platform_settings").updateOne(
    { key },
    {
      $set: {
        value,
        updated_at: new Date().toISOString(),
      },
    },
    { upsert: true }
  );
}

export async function listPlatformSettings(): Promise<DbPlatformSetting[]> {
  const db = getDB();
  return db
    .collection<DbPlatformSetting>("platform_settings")
    .find()
    .toArray();
}
