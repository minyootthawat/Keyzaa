import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI!;
const MONGODB_DB = process.env.MONGODB_DB ?? "keyzaa";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export function getMongoClient(): MongoClient {
  if (!cachedClient) {
    if (!MONGODB_URI) {
      throw new Error("MONGODB_URI env var is not set");
    }
    cachedClient = new MongoClient(MONGODB_URI);
  }
  return cachedClient;
}

export function getDB(): Db {
  if (!cachedDb) {
    cachedDb = getMongoClient().db(MONGODB_DB);
  }
  return cachedDb;
}

export async function closeDB(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}
