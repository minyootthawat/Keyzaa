import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://dcs:dcs@dcs.kij1y8e.mongodb.net/?appName=DCS";
const MONGODB_DB = process.env.MONGODB_DB || "keyzaa";

const DEMO_USERS = [
  {
    email: "testbuyer@keyzaa.local",
    name: "Test Buyer",
    password: "demo123",
    role: "buyer",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    email: "testseller@keyzaa.local",
    name: "Test Seller",
    password: "demo123",
    role: "seller",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    email: "admin@keyzaa.local",
    name: "Admin",
    password: "demo123",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  const usersCol = db.collection("users");

  // Remove old demo users
  const oldEmails = DEMO_USERS.map((u) => u.email);
  const delResult = await usersCol.deleteMany({ email: { $in: oldEmails } });
  console.log(`Deleted ${delResult.deletedCount} old demo users`);

  // Insert new users with hashed passwords
  for (const user of DEMO_USERS) {
    const { password, ...rest } = user;
    const password_hash = await bcrypt.hash(password, 10);
    await usersCol.insertOne({
      ...rest,
      password_hash,
    });
    console.log(`Inserted: ${user.email} (${user.role})`);
  }

  // Also ensure seller record exists for testseller
  const existingSeller = await db.collection("sellers").findOne({ email: "testseller@keyzaa.local" });
  if (!existingSeller) {
    await db.collection("sellers").insertOne({
      email: "testseller@keyzaa.local",
      name: "Test Seller Shop",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log("Inserted seller record for testseller");
  }

  await client.close();
  console.log("Done!");
}

seed().catch(console.error);
