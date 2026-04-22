/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const { MongoClient, ObjectId } = require("mongodb");

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function upsertBuyer(db, now) {
  const users = db.collection("users");
  const email = process.env.NEXT_PUBLIC_DEMO_BUYER_EMAIL || "buyer@demo.keyzaa.local";
  const password = process.env.NEXT_PUBLIC_DEMO_BUYER_PASSWORD || "demo123";
  const passwordHash = await bcrypt.hash(password, 12);

  await users.updateOne(
    { email },
    {
      $set: {
        name: "Demo Buyer",
        email,
        passwordHash,
        role: "buyer",
        sellerId: undefined,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return { email, password };
}

async function upsertSeller(db, now) {
  const users = db.collection("users");
  const sellers = db.collection("sellers");
  const email = process.env.NEXT_PUBLIC_DEMO_SELLER_EMAIL || "seller@demo.keyzaa.local";
  const password = process.env.NEXT_PUBLIC_DEMO_SELLER_PASSWORD || "demo123";
  const passwordHash = await bcrypt.hash(password, 12);

  const existingUser = await users.findOne({ email });
  const userId = existingUser?._id ? existingUser._id : new ObjectId();

  await users.updateOne(
    { _id: userId },
    {
      $set: {
        name: "Demo Seller",
        email,
        passwordHash,
        role: "seller",
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  const existingSeller = await sellers.findOne({ userId: userId.toString() });
  const sellerId = existingSeller?._id ? existingSeller._id : new ObjectId();

  await sellers.updateOne(
    { _id: sellerId },
    {
      $set: {
        userId: userId.toString(),
        shopName: "Demo Seller Shop",
        phone: "0812345678",
        rating: 4.9,
        salesCount: 240,
        balance: 0,
        pendingBalance: 0,
        verificationStatus: "verified",
        responseTimeMinutes: 5,
        fulfillmentRate: 99.4,
        disputeRate: 0.2,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  await users.updateOne(
    { _id: userId },
    {
      $set: {
        role: "seller",
        sellerId: sellerId.toString(),
        updatedAt: now,
      },
    }
  );

  return { email, password };
}

async function upsertAdmin(db, now) {
  const users = db.collection("users");
  const email = process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL || "admin@demo.keyzaa.local";
  const password = process.env.NEXT_PUBLIC_DEMO_ADMIN_PASSWORD || "demo123";
  const passwordHash = await bcrypt.hash(password, 12);

  await users.updateOne(
    { email },
    {
      $set: {
        name: "Demo Admin",
        email,
        passwordHash,
        role: "buyer",
        sellerId: undefined,
        adminRole: "super_admin",
        adminPermissions: ["admin:access", "admin:overview:read", "admin:orders:read", "admin:sellers:read", "admin:listings:read"],
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true }
  );

  return { email, password };
}

async function main() {
  loadLocalEnv();

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is required");
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  try {
    const db = client.db("keyzaa");
    const now = new Date().toISOString();
    const buyer = await upsertBuyer(db, now);
    const seller = await upsertSeller(db, now);
    const admin = await upsertAdmin(db, now);

    console.log("Seeded demo users:");
    console.log(`buyer: ${buyer.email} / ${buyer.password}`);
    console.log(`seller: ${seller.email} / ${seller.password}`);
    console.log(`admin: ${admin.email} / ${admin.password}`);
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Failed to seed demo users:", error);
  process.exit(1);
});
