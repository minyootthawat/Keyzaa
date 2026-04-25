const { MongoClient } = require("mongodb");

async function main() {
  // Try multiple connection strings
  const connections = [
    "mongodb://keyzaa:keyzaa_dev_password@localhost:27017/?connectTimeoutMS=3000&serverSelectionTimeoutMS=3000",
    "mongodb://localhost:27017/?connectTimeoutMS=3000&serverSelectionTimeoutMS=3000",
  ];

  let connected = false;
  for (const uri of connections) {
    try {
      console.log(`Trying: ${uri.replace(/\/\/.*@/, '//***@')}`);
      const client = new MongoClient(uri);
      await client.connect();
      const db = client.db("keyzaa");

      const counts = {
        products: await db.collection("products").countDocuments(),
        sellers: await db.collection("sellers").countDocuments(),
        users: await db.collection("users").countDocuments(),
        portfolios: await db.collection("portfolios").countDocuments()
      };

      console.log("\nMongoDB Collection Counts:");
      console.log("  products:", counts.products);
      console.log("  sellers:", counts.sellers);
      console.log("  users:", counts.users);
      console.log("  portfolios:", counts.portfolios);

      const collections = await db.listCollections().toArray();
      console.log("\nExisting collections:", collections.map(c => c.name).join(", "));
      
      connected = true;
      await client.close();
      break;
    } catch (e) {
      console.log(`  Failed: ${e.message}`);
      try { await client?.close(); } catch {}
    }
  }

  if (!connected) {
    console.log("\nCould not connect to any MongoDB instance.");
    console.log("MongoDB may not be running or credentials may be wrong.");
  }
}

main().catch(e => { console.error("FATAL:", e.message); process.exit(1); });
