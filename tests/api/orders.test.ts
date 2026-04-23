import { MongoClient } from "mongodb";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-jwt-secret-for-testing-only"
);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://keyzaa:keyzaa_dev_password@localhost:27017";
const DB_NAME = "keyzaa";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TEST_USER_ID = "test-buyer-001";
const TEST_SELLER_ID = "test-seller-001";

async function createTestToken(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(JWT_SECRET);
}

async function connectMongo(): Promise<MongoClient> {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  return client;
}

async function cleanupTestData(mongoClient: MongoClient, supabase: any) {
  const db = mongoClient.db(DB_NAME);
  
  // Clean up MongoDB orders for test user
  await db.collection("orders").deleteMany({ buyerId: TEST_USER_ID });
  await db.collection("seller_ledger_entries").deleteMany({ sellerId: TEST_SELLER_ID });
  
  // Clean up Supabase orders for test user (using raw SQL since service role bypasses RLS)
  await supabase.rpc("delete_test_orders", { buyer_id: TEST_USER_ID }).catch(() => {
    // If RPC not available, try direct delete
  });
  
  // Clean up any orders we created for test user directly
  const { error } = await supabase
    .from("orders")
    .delete()
    .or(`buyer_id.eq.${TEST_USER_ID}`);
  
  if (error) {
    console.log("Supabase cleanup note:", error.message);
  }
}

async function runTests() {
  console.log("=== Orders API Integration Tests ===\n");
  
  let passed = 0;
  let failed = 0;
  
  // Connect to MongoDB
  console.log("1. Connecting to MongoDB...");
  const mongoClient = await connectMongo();
  console.log("   MongoDB connected\n");
  
  // Connect to Supabase
  console.log("2. Connecting to Supabase...");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  console.log("   Supabase connected\n");
  
  // Generate test JWT
  console.log("3. Generating test JWT...");
  const token = await createTestToken(TEST_USER_ID);
  console.log("   JWT created\n");
  
  const API_BASE = "http://localhost:3000";
  
  try {
    // Test 1: POST /api/orders - Create an order
    console.log("4. Testing POST /api/orders...");
    const orderPayload = {
      totalPrice: 299.00,
      paymentMethod: "promptpay",
      items: [
        {
          id: "prod_001",
          productId: "prod_001",
          title: "Test Product",
          price: 299.00,
          quantity: 1,
          sellerId: TEST_SELLER_ID,
          platform: "google_play",
          keys: ["TEST-KEY-001"],
        },
      ],
    };
    
    const postResponse = await fetch(`${API_BASE}/api/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(orderPayload),
    });
    
    const postResult = await postResponse.json();
    
    if (postResponse.status !== 200) {
      console.log("   FAIL: POST /api/orders failed");
      console.log("   Status:", postResponse.status);
      console.log("   Response:", JSON.stringify(postResult, null, 2));
      failed++;
    } else {
      console.log("   PASS: POST /api/orders succeeded");
      console.log("   Response:", JSON.stringify(postResult, null, 2));
      passed++;
      
      const orderId = postResult.order?.orderId;
      
      if (orderId) {
        // Test 2: Verify dual-write to MongoDB
        console.log("\n5. Verifying MongoDB write...");
        const db = mongoClient.db(DB_NAME);
        const mongoOrder = await db.collection("orders").findOne({ orderId });
        
        if (mongoOrder) {
          console.log("   PASS: Order found in MongoDB");
          console.log("   Order ID:", mongoOrder.orderId);
          console.log("   Buyer ID:", mongoOrder.buyerId);
          console.log("   Total Price:", mongoOrder.totalPrice);
          passed++;
        } else {
          console.log("   FAIL: Order NOT found in MongoDB");
          failed++;
        }
        
        // Test 3: Verify dual-write to Supabase
        console.log("\n6. Verifying Supabase write...");
        const { data: supabaseOrders, error: sbError } = await supabase
          .from("orders")
          .select("*")
          .eq("buyer_id", TEST_USER_ID)
          .order("created_at", { ascending: false })
          .limit(5);
        
        if (sbError) {
          console.log("   FAIL: Supabase query error:", sbError.message);
          failed++;
        } else if (supabaseOrders && supabaseOrders.length > 0) {
          console.log("   PASS: Orders found in Supabase");
          console.log("   Count:", supabaseOrders.length);
          console.log("   Latest order:", JSON.stringify(supabaseOrders[0], null, 2));
          passed++;
        } else {
          console.log("   FAIL: No orders found in Supabase");
          failed++;
        }
        
        // Test 4: GET /api/orders - Retrieve orders
        console.log("\n7. Testing GET /api/orders...");
        const getResponse = await fetch(`${API_BASE}/api/orders`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        
        const getResult = await getResponse.json();
        
        if (getResponse.status !== 200) {
          console.log("   FAIL: GET /api/orders failed");
          console.log("   Status:", getResponse.status);
          console.log("   Response:", JSON.stringify(getResult, null, 2));
          failed++;
        } else if (getResult.orders && getResult.orders.length > 0) {
          console.log("   PASS: GET /api/orders succeeded");
          console.log("   Orders count:", getResult.orders.length);
          passed++;
        } else {
          console.log("   FAIL: GET returned no orders");
          failed++;
        }
      }
    }
    
    // Cleanup
    console.log("\n8. Cleaning up test data...");
    await cleanupTestData(mongoClient, supabase);
    console.log("   Cleanup complete\n");
    
  } catch (error) {
    console.log("   ERROR:", error);
    failed++;
  } finally {
    await mongoClient.close();
  }
  
  // Summary
  console.log("\n=== Test Summary ===");
  console.log("Passed:", passed);
  console.log("Failed:", failed);
  console.log("Total:", passed + failed);
  
  if (failed === 0) {
    console.log("\nAll tests passed! Dual-write verification successful.");
    process.exit(0);
  } else {
    console.log("\nSome tests failed. Check the output above.");
    process.exit(1);
  }
}

// Run tests
runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});