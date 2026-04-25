/**
 * Mock data for KeyZaa demo (mockup mode)
 * Used when NEXT_PUBLIC_SUPABASE_URL = mock.supabase.co
 */

export const MOCK_SELLER = {
  id: "seller-001",
  store_name: "GameZone Shop",
  phone: "081-234-5678",
  verified: true,
  rating: 4.8,
  sales_count: 1247,
  balance: 24890,
  pending_balance: 3200,
  payout_status: "enabled" as const,
  response_time_minutes: 15,
  fulfillment_rate: 98.5,
  dispute_rate: 0.3,
};

export const MOCK_PRODUCTS = [
  { id: "p1", seller_id: "seller-001", name: "MLBB Diamond 500", category: "เติมเกม", price: 299, stock: 99, image_url: "https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=400&q=80", is_active: true, description: "Diamond 500 พร้อมแถม", created_at: "2026-04-01T00:00:00Z", updated_at: "2026-04-01T00:00:00Z" },
  { id: "p2", seller_id: "seller-001", name: "Genshin 1000 Genesis Crystal", category: "เติมเกม", price: 499, stock: 50, image_url: "https://images.unsplash.com/photo-1536746803623-cef87080bfc8?w=400&q=80", is_active: true, description: "Crystal ราคาถูก", created_at: "2026-04-02T00:00:00Z", updated_at: "2026-04-02T00:00:00Z" },
  { id: "p3", seller_id: "seller-001", name: "Free Fire 500 Diamond", category: "เติมเกม", price: 189, stock: 200, image_url: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&q=80", is_active: true, description: "Auto topup 5 นาที", created_at: "2026-04-03T00:00:00Z", updated_at: "2026-04-03T00:00:00Z" },
  { id: "p4", seller_id: "seller-001", name: "Valorant Points 1000", category: "เติมเกม", price: 399, stock: 30, image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80", is_active: false, description: "EU Server", created_at: "2026-04-05T00:00:00Z", updated_at: "2026-04-05T00:00:00Z" },
  { id: "p5", seller_id: "seller-001", name: "PUBG UC 600 + 25 Bonus", category: "เติมเกม", price: 249, stock: 75, image_url: "https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=400&q=80", is_active: true, description: "ราคาพิเศษวันนี้", created_at: "2026-04-06T00:00:00Z", updated_at: "2026-04-06T00:00:00Z" },
  { id: "p6", seller_id: "seller-001", name: "Spotify Premium 6 เดือน", category: "Subscription", price: 599, stock: 20, image_url: "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400&q=80", is_active: true, description: "Account ใหม่ พร้อมเปลี่ยน email ได้", created_at: "2026-04-07T00:00:00Z", updated_at: "2026-04-07T00:00:00Z" },
];

export const MOCK_ORDERS = [
  { id: "o1", buyer_id: "b1", seller_id: "seller-001", product_id: "p1", quantity: 1, total_price: 299, gross_amount: 299, commission_amount: 21, seller_net_amount: 278, platform_fee_rate: 0.07, currency: "THB", status: "completed" as const, payment_status: "paid" as const, fulfillment_status: "delivered" as const, payment_method: "promptpay", created_at: "2026-04-20T10:00:00Z", updated_at: "2026-04-20T10:00:00Z" },
  { id: "o2", buyer_id: "b2", seller_id: "seller-001", product_id: "p2", quantity: 2, total_price: 998, gross_amount: 998, commission_amount: 70, seller_net_amount: 928, platform_fee_rate: 0.07, currency: "THB", status: "completed" as const, payment_status: "paid" as const, fulfillment_status: "delivered" as const, payment_method: "promptpay", created_at: "2026-04-21T14:30:00Z", updated_at: "2026-04-21T14:30:00Z" },
  { id: "o3", buyer_id: "b3", seller_id: "seller-001", product_id: "p3", quantity: 1, total_price: 189, gross_amount: 189, commission_amount: 13, seller_net_amount: 176, platform_fee_rate: 0.07, currency: "THB", status: "shipped" as const, payment_status: "paid" as const, fulfillment_status: "processing" as const, payment_method: "credit_card", created_at: "2026-04-23T09:15:00Z", updated_at: "2026-04-23T09:15:00Z" },
  { id: "o4", buyer_id: "b1", seller_id: "seller-001", product_id: "p5", quantity: 3, total_price: 747, gross_amount: 747, commission_amount: 52, seller_net_amount: 695, platform_fee_rate: 0.07, currency: "THB", status: "pending" as const, payment_status: "pending" as const, fulfillment_status: "pending" as const, payment_method: null, created_at: "2026-04-24T16:45:00Z", updated_at: "2026-04-24T16:45:00Z" },
];

export const MOCK_GAME_ACCOUNTS = [
  { id: "ga1", seller_id: "seller-001", game_name: "Mobile Legends", game_name_th: "MLBB Diamond 500", account_username: "mlbb_pro_player", account_password: "SecurePass123!", description: "Rank Mythic 500, 120 Win Rate, เซิร์ฟเวอร์ไทย", price: 2999, stock: 1, is_active: true, platform: "Mobile", region: "Thai", image_url: "https://images.unsplash.com/photo-1614294149010-950b698f72c0?w=400&q=80", created_at: "2026-04-01T00:00:00Z", updated_at: "2026-04-20T00:00:00Z" },
  { id: "ga2", seller_id: "seller-001", game_name: "Genshin Impact", game_name_th: "เกมเจนชิน 50 Primogems", account_username: "genshin_ar60_whale", account_password: "Traveler2024!", description: "AR60, C6 Raiden + C3 Zhongli + C2 Nahida. All 5-star weapons. 100% exploration.", price: 15999, stock: 1, is_active: true, platform: "PC", region: "Global", image_url: "https://images.unsplash.com/photo-1536746803623-cef87080bfc8?w=400&q=80", created_at: "2026-04-02T00:00:00Z", updated_at: "2026-04-20T00:00:00Z" },
  { id: "ga3", seller_id: "seller-001", game_name: "Free Fire", game_name_th: "ฟรีไฟร์ แอคเคาท์", account_username: "ff_booyah_top1", account_password: "BooyahPass99!", description: "Rank Grandmaster, pet Booyah, 50+ pet skins, diamond balance 5000+. เซิร์ฟเวอร์ไทย", price: 899, stock: 2, is_active: true, platform: "Mobile", region: "Thai", image_url: "https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=400&q=80", created_at: "2026-04-03T00:00:00Z", updated_at: "2026-04-20T00:00:00Z" },
  { id: "ga4", seller_id: "seller-001", game_name: "Valorant", game_name_th: "วาโรร์แรนท์ แอคเคาท์", account_username: "val_radiant_wannabe", account_password: "Radiant2024!", description: "Rank Diamond 2, 200 hours, Battle Pass fully bought. 5 skins bundles owned.", price: 4500, stock: 1, is_active: false, platform: "PC", region: "Global", image_url: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80", created_at: "2026-04-05T00:00:00Z", updated_at: "2026-04-20T00:00:00Z" },
];

export const MOCK_WALLET = {
  summary: {
    availableBalance: 24890,
    pendingBalance: 3200,
    grossSales: 158760,
    totalCommission: 11113,
    netEarnings: 147647,
    entryCount: 47,
  },
  entries: [
    { id: "e1", seller_id: "seller-001", type: "sale" as const, amount: 2999, description: "Order #ORD001 - MLBB Diamond 500", created_at: "2026-04-20T10:00:00Z" },
    { id: "e2", seller_id: "seller-001", type: "commission_fee" as const, amount: 210, description: "ค่าคอมมิชชั่น 7% - Order #ORD001", created_at: "2026-04-20T10:01:00Z" },
    { id: "e3", seller_id: "seller-001", type: "sale" as const, amount: 998, description: "Order #ORD002 - Genshin Crystal x2", created_at: "2026-04-21T14:30:00Z" },
    { id: "e4", seller_id: "seller-001", type: "commission_fee" as const, amount: 70, description: "ค่าคอมมิชชั่น 7% - Order #ORD002", created_at: "2026-04-21T14:31:00Z" },
    { id: "e5", seller_id: "seller-001", type: "sale" as const, amount: 189, description: "Order #ORD003 - Free Fire Diamond", created_at: "2026-04-23T09:15:00Z" },
    { id: "e6", seller_id: "seller-001", type: "commission_fee" as const, amount: 13, description: "ค่าคอมมิชชั่น 7% - Order #ORD003", created_at: "2026-04-23T09:16:00Z" },
    { id: "e7", seller_id: "seller-001", type: "sale" as const, amount: 15999, description: "Order #ORD004 - Genshin AR60 C6 Account", created_at: "2026-04-15T11:00:00Z" },
    { id: "e8", seller_id: "seller-001", type: "commission_fee" as const, amount: 1120, description: "ค่าคอมมิชชั่น 7% - Order #ORD004", created_at: "2026-04-15T11:01:00Z" },
    { id: "e9", seller_id: "seller-001", type: "withdrawal" as const, amount: 5000, description: "ถอนเงินเข้าบัญชี SCB ***4521", created_at: "2026-04-10T08:00:00Z" },
  ],
};

export const MOCK_BUYERS = [
  { id: "b1", name: "สมชาย รักเกม", email: "somchai@demo.com" },
  { id: "b2", name: "พิม วิเศษ", email: "phim@demo.com" },
  { id: "b3", name: "โจ้ ดิจิทัล", email: "joe@demo.com" },
];

export const MOCK_OVERVIEW = {
  kpis: {
    grossSales: 158760,
    netEarnings: 147647,
    availableForPayout: 24890,
    orderCount: 47,
  },
  orders: MOCK_ORDERS,
  products: MOCK_PRODUCTS.slice(0, 4).map((p) => ({
    id: p.id,
    title: p.name,
    stock: p.stock,
    soldCount: Math.floor(Math.random() * 100) + 10,
    price: p.price,
  })),
};

export const MOCK_SETTINGS = {
  store_name: "GameZone Shop",
  phone: "081-234-5678",
  description: "ร้านเติมเกมอันดับ 1 ในไทย บริการรวดเร็ว ปลอดภัย 100%",
  id_card_url: "",
};
