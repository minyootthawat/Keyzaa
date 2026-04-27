import { ObjectId } from "mongodb";
import { getDB } from "@/lib/mongodb";

export interface DbUser {
  _id?: ObjectId;
  email: string;
  name: string;
  password_hash?: string;
  role: "buyer" | "seller" | "both";
  provider?: string;
  provider_id?: string;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

// ─── CRUD helpers ───────────────────────────────────────────────────────────

export async function findUserByEmail(email: string): Promise<DbUser | null> {
  const db = getDB();
  return db.collection<DbUser>("users").findOne({ email: email.toLowerCase() });
}

export async function findUserById(id: string): Promise<DbUser | null> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return null;
  return db.collection<DbUser>("users").findOne({ _id: new ObjectId(id) });
}

export async function createUser(data: {
  email: string;
  name: string;
  passwordHash?: string;
  provider?: string;
  providerId?: string;
  role?: "buyer" | "seller" | "both";
}): Promise<DbUser> {
  const db = getDB();
  const now = new Date().toISOString();
  const doc: Omit<DbUser, "_id"> = {
    email: data.email.toLowerCase(),
    name: data.name,
    password_hash: data.passwordHash ?? undefined,
    role: data.role ?? "buyer",
    provider: data.provider ?? undefined,
    provider_id: data.providerId ?? undefined,
    last_login_at: now,
    created_at: now,
    updated_at: now,
  };
  const result = await db.collection<DbUser>("users").insertOne(doc as DbUser);
  return { ...doc, _id: result.insertedId } as DbUser;
}

export async function updateUser(
  id: string,
  updates: Partial<DbUser>
): Promise<DbUser | null> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return null;
  const result = await db
    .collection<DbUser>("users")
    .findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { ...updates, updated_at: new Date().toISOString() } },
      { returnDocument: "after" }
    );
  return result;
}

export async function updateUserLastLogin(id: string): Promise<void> {
  const db = getDB();
  if (!ObjectId.isValid(id)) return;
  await db
    .collection<DbUser>("users")
    .updateOne(
      { _id: new ObjectId(id) },
      { $set: { last_login_at: new Date().toISOString() } }
    );
}

export async function listUsers(opts?: {
  search?: string;
  role?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ users: DbUser[]; total: number }> {
  const db = getDB();
  const filter: Record<string, unknown> = {};
  if (opts?.search) {
    filter.$or = [
      { email: { $regex: opts.search, $options: "i" } },
      { name: { $regex: opts.search, $options: "i" } },
    ];
  }
  if (opts?.role) filter.role = opts.role;

  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  const [users, total] = await Promise.all([
    db
      .collection<DbUser>("users")
      .find(filter)
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limit)
      .toArray(),
    db.collection<DbUser>("users").countDocuments(filter),
  ]);

  return { users, total };
}
