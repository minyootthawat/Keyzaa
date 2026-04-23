# 📘 คู่มือการใช้งาน Keyzaa

**Version:** 1.0.0  
**Website:** https://keyzaa.vercel.app  
**Repository:** https://github.com/minyootthawat/Keyzaa  
**Stack:** Next.js 16 + React 19 + Supabase + NextAuth v5 + Tailwind CSS v4

---

## 📋 สารบัญ

1. [ภาพรวมระบบ](#1-ภาพรวมระบบ)
2. [การติดตั้ง Local](#2-การติดตั้ง-local)
3. [สถาปัตยกรรมโปรเจค](#3-สถาปัตยกรรมโปรเจค)
4. [โครงสร้าง Database](#4-โครงสร้าง-database)
5. [การ Authenticate](#5-การ-authenticate)
6. [API Reference](#6-api-reference)
7. [การใช้งานแต่ละ Role](#7-การใช้งานแต่ละ-role)
8. [Environment Variables](#8-environment-variables)
9. [การ Deploy](#9-การ-deploy)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. ภาพรวมระบบ

Keyzaa คือ Digital Marketplace สำหรับคนไทย เน้นความเร็ว ความปลอดภัย และความน่าเชื่อถือ

**Features หลัก:**
- 🛒 ระบบตะกร้าสินค้า + Checkout
- 🎮 เติมเกม / Gift Card / Subscription / AI Tools / โปร
- 💳 รองรับ PromptPay + TrueMoney
- 🔐 Authentication หลายช่องทาง (Google, Facebook, LINE, Email)
- 🏪 ระบบร้านค้า (Seller Dashboard)
- 📦 ติดตามออเดอร์แบบ Real-time
- 👨‍💼 ระบบ Admin สำหรับจัดการ Platform
- 🇹🇭 รองรับภาษาไทย + English

**Roles:**
| Role | สิทธิ์ |
|------|--------|
| Buyer | เลือกซื้อสินค้า, ชำระเงิน, ติดตามออเดอร์ |
| Seller | ลงสินค้าขาย, จัดการออเดอร์, ดูยอดเงินในกระเป๋า |
| Admin | ดูภาพรวมทั้ง Platform, จัดการ Users/Sellers/Orders |

---

## 2. การติดตั้ง Local

### 2.1 Prerequisites

- Node.js 18+
- pnpm 9+
- Supabase account

### 2.2 Clone & Install

```bash
# Clone repo
git clone https://github.com/minyootthawat/Keyzaa.git
cd Keyzaa

# Install dependencies
pnpm install

# Copy env file
cp .env.local.example .env.local
```

### 2.3 ตั้งค่า .env.local

```bash
# Supabase (จาก Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-generate-with-openssl

# OAuth Providers (จาก Google/Facebook/LINE Developer Console)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
FACEBOOK_CLIENT_ID=your-fb-client-id
FACEBOOK_CLIENT_SECRET=your-fb-client-secret
LINE_CLIENT_ID=your-line-channel-id
LINE_CLIENT_SECRET=your-line-channel-secret
```

### 2.4 สร้าง Database Schema บน Supabase

1. ไปที่ https://supabase.com/dashboard → Your Project → SQL Editor
2. Copy ไฟล์ `supabase/schema.sql` ไปวางแล้วกด RUN

### 2.5 Run Development Server

```bash
pnpm dev
```

เปิด http://localhost:3000

---

## 3. สถาปัตยกรรมโปรเจค

```
Keyzaa/
├── app/                          # Next.js App Router
│   ├── (buyer)/                  # Buyer routes (ไม่ต้อง login)
│   │   ├── page.tsx              # Landing page
│   │   ├── products/             # หน้าสินค้า
│   │   ├── checkout/             # ชำระเงิน
│   │   ├── orders/               # ออเดอร์ของฉัน
│   │   └── profile/              # โปรไฟล์
│   ├── (seller)/                 # Seller routes (ต้อง login + เป็น Seller)
│   │   ├── seller/
│   │   │   ├── register/         # ลงทะเบียนร้านค้า
│   │   │   └── dashboard/        # Seller Dashboard
│   │   │       ├── page.tsx      # ภาพรวม
│   │   │       ├── products/     # จัดการสินค้า
│   │   │       ├── orders/       # จัดการออเดอร์
│   │   │       ├── wallet/       # กระเป๋าเงิน
│   │   │       └── settings/     # ตั้งค่าร้าน
│   ├── (admin)/                  # Admin routes
│   │   ├── admin/
│   │   │   ├── login/            # Admin login
│   │   │   └── dashboard/       # Admin Dashboard
│   ├── api/                      # API Routes
│   │   ├── auth/                 # NextAuth + Login/Register/Me
│   │   ├── orders/              # Orders CRUD
│   │   ├── seller/              # Seller APIs
│   │   └── admin/               # Admin APIs
│   ├── components/               # Shared Components
│   ├── context/                  # React Context (Auth, Cart, Language)
│   └── lib/                     # Utility libs
├── lib/
│   ├── db/
│   │   └── supabase.ts          # CRUD functions สำหรับ Supabase
│   └── supabase/
│       └── supabase.ts          # Supabase client factory
├── types/
│   └── database.ts              # TypeScript types สำหรับ database entities
└── supabase/
    └── schema.sql               # Database schema
```

---

## 4. โครงสร้าง Database

### 4.1 Tables

#### `public.users` — ข้อมูลผู้ใช้
| Column | Type | คำอธิบาย |
|--------|------|---------|
| id | uuid | Primary key (เป็น id ของ Supabase Auth ด้วย) |
| email | text | Email ผู้ใช้ (unique) |
| name | text | ชื่อผู้ใช้ |
| password_hash | text | Hash ของรหัสผ่าน (nullable สำหรับ social login) |
| role | text | 'buyer' / 'seller' / 'both' |
| provider | text | 'google' / 'facebook' / 'line' / 'credentials' |
| provider_id | text | ID จาก OAuth provider |
| created_at | timestamptz | วันที่สร้าง |
| updated_at | timestamptz | วันที่แก้ไขล่าสุด |
| last_login_at | timestamptz | วันที่ login ล่าสุด |

#### `public.sellers` — ข้อมูลร้านค้า
| Column | Type | คำอธิบาย |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid | FK → users.id |
| store_name | text | ชื่อร้าน |
| phone | text | เบอร์โทร |
| id_card_url | text | URL รูปบัตรประชาชน (สำหรับยืนยันตัวตน) |
| verified | boolean | ผ่านการยืนยันตัวตนหรือยัง |
| created_at | timestamptz | วันที่สร้าง |
| updated_at | timestamptz | วันที่แก้ไขล่าสุด |

#### `public.products` — สินค้า
| Column | Type | คำอธิบาย |
|--------|------|---------|
| id | uuid | Primary key |
| seller_id | uuid | FK → sellers.id |
| name | text | ชื่อสินค้า |
| description | text | รายละเอียด |
| category | text | หมวดหมู่ (เติมเกม, Gift Card, Subscription, AI Tools, โปร) |
| price | numeric(10,2) | ราคา (บาท) |
| stock | integer | จำนวนในสต็อก |
| image_url | text | URL รูปสินค้า |
| is_active | boolean | สินค้าพร้อมขายหรือไม่ |
| created_at | timestamptz | วันที่สร้าง |
| updated_at | timestamptz | วันที่แก้ไขล่าสุด |

#### `public.orders` — ออเดอร์
| Column | Type | คำอธิบาย |
|--------|------|---------|
| id | uuid | Primary key |
| buyer_id | uuid | FK → users.id |
| seller_id | uuid | FK → sellers.id |
| product_id | uuid | FK → products.id |
| quantity | integer | จำนวน |
| total_price | numeric(10,2) | ราคารวม (บาท) |
| status | text | pending → paid → shipped → completed / cancelled |
| payment_method | text | ช่องทางชำระเงิน |
| created_at | timestamptz | วันที่สร้างออเดอร์ |
| updated_at | timestamptz | วันที่แก้ไขล่าสุด |

#### `public.seller_ledger_entries` — บัญชีรายรับร้านค้า
| Column | Type | คำอธิบาย |
|--------|------|---------|
| id | uuid | Primary key |
| seller_id | uuid | FK → sellers.id |
| type | text | 'sale' / 'commission_fee' / 'withdrawal' |
| amount | numeric(10,2) | จำนวนเงิน |
| order_id | uuid | FK → orders.id (nullable) |
| description | text | รายละเอียด |
| created_at | timestamptz | วันที่บันทึก |

### 4.2 Row Level Security (RLS)

ทุก table มี RLS เปิดอยู่ — หมายความว่า query ทุกตัวจะถูก filter ตาม user ที่ login

| Table | Policy | ใครเข้าถึงได้ |
|-------|--------|---------------|
| users | own data | เจ้าของ account และ Admin |
| sellers | own record | เจ้าของร้าน และ Admin |
| products | active products | ทุกคน |
| products | manage own | เจ้าของร้าน และ Admin |
| orders | own orders | เจ้าของออเดอร์ หรือร้านที่เกี่ยวข้อง |
| seller_ledger_entries | own ledger | เจ้าของร้าน และ Admin |

---

## 5. การ Authenticate

### 5.1 NextAuth Setup

ระบบใช้ NextAuth v5 (beta) อยู่ใน `auth.ts` ที่ root

```typescript
// auth.ts
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: SupabaseAdapter({ url, secret }),
  providers: [
    Google({ clientId, clientSecret }),
    Facebook({ clientId, clientSecret }),
    LineProvider({ clientId, clientSecret }),
    Credentials({
      credentials: { email, password },
      async authorize(credentials) { ... }
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) { ... },   // ใส่ id, role, sellerId ลง token
    async session({ session, token }) { ... }, // ใส่ลง session
  },
  pages: { signIn: "/" },
});
```

### 5.2 User Roles & Session

Session ของ user จะมี:

```typescript
session.user = {
  id: string,           // UUID ของ user
  name?: string,
  email?: string,
  image?: string,
  role: "buyer" | "seller" | "both",
  sellerId?: string,    // UUID ของ seller record (ถ้ามี)
}
```

### 5.3 Seller Registration Flow

1. User login ด้วย Google/Facebook/LINE/Credentials
2. ไปที่ `/seller/register`
3. กรอกชื่อร้าน + เบอร์โทร + อัปโหลดรูปบัตรประชาชน
4. ระบบสร้าง `sellers` record + อัปเดต `users.role = 'seller'`

### 5.4 Route Guards

```typescript
// app/components/SellerRouteGuard.tsx
// Wrap route ที่ต้องการ Seller เท่านั้น
<SellerRouteGuard>
  <SellerDashboard />
</SellerRouteGuard>

// ถ้าไม่ใช่ seller → redirect ไป /seller/register
// ถ้าไม่ได้ login → redirect ไป /
```

---

## 6. API Reference

### 6.1 Authentication

#### `POST /api/auth/register` — ลงทะเบียนด้วย Email
```json
// Request
{ "email": "user@example.com", "password": "123456", "name": "สมชาย" }

// Response 200
{ "success": true, "user": { "id": "...", "email": "...", "name": "สมชาย" } }

// Response 400 (email ซ้ำ)
{ "error": "Email already registered" }
```

#### `POST /api/auth/login` — Login ด้วย Credentials
```json
// Request
{ "email": "user@example.com", "password": "123456" }

// Response 200
{ "success": true }

// Response 401
{ "error": "Invalid credentials" }
```

#### `GET /api/auth/me` — ดูข้อมูล User ปัจจุบัน
```json
// Headers: Cookie (session)
// Response 200
{ "user": { "id": "...", "email": "...", "name": "...", "role": "seller", "sellerId": "..." } }

// Response 401
{ "error": "Unauthorized" }
```

### 6.2 Orders

#### `POST /api/orders` — สร้างออเดอร์ใหม่
```json
// Request
{
  "sellerId": "seller-uuid",
  "productId": "product-uuid",
  "quantity": 1,
  "paymentMethod": "promptpay"
}

// Response 201
{ "order": { "id": "...", "status": "pending", "totalPrice": 950 } }
```

#### `GET /api/orders` — ดูออเดอร์ของฉัน (Buyer)
```json
// Response 200
{ "orders": [{ "id": "...", "status": "completed", "totalPrice": 950, ... }] }
```

#### `GET /api/orders/[id]` — ดูออเดอร์เดียว
#### `PATCH /api/orders/[id]` — อัปเดตสถานะออเดอร์ (เฉพาะ Buyer หรือ Seller)
```json
// Request
{ "status": "cancelled" }  // Buyer ยกเลิก pending order
{ "status": "shipped" }    // Seller อัปเดตสถานะ
```

### 6.3 Seller APIs

#### `POST /api/seller/register` — ลงทะเบียนร้านค้า
```json
// Request
{ "storeName": "ร้านเกมดี", "phone": "081-234-5678", "idCardUrl": "https://..." }

// Response 201
{ "seller": { "id": "...", "storeName": "ร้านเกมดี", "verified": false } }
```

#### `GET /api/seller/me` — ดูข้อมูลร้านของฉัน
#### `GET /api/seller/products` — ดูสินค้าของร้าน
#### `POST /api/seller/products` — เพิ่มสินค้าใหม่
```json
// Request
{ "name": "ROV 1000 Diamonds", "category": "เติมเกม", "price": 950, "stock": 100, "description": "..." }

// Response 201
{ "product": { "id": "...", "name": "ROV 1000 Diamonds", "isActive": true } }
```

#### `PATCH /api/seller/products/[id]` — แก้ไขสินค้า
#### `DELETE /api/seller/products/[id]` — ลบสินค้า
#### `GET /api/seller/orders` — ดูออเดอร์ที่เข้ามา
#### `GET /api/seller/overview` — ภาพรวมร้าน (ยอดขาย, ออเดอร์, รายได้)
#### `GET /api/seller/wallet` — ดูยอดเงินในกระเป๋า (ดึงจาก `seller_ledger_entries`)

### 6.4 Admin APIs

#### `GET /api/admin/overview` — ภาพรวม Platform
```json
// Response 200
{
  "totalUsers": 150,
  "totalSellers": 45,
  "totalProducts": 320,
  "totalOrders": 890,
  "totalRevenue": 450000
}
```

---

## 7. การใช้งานแต่ละ Role

### 7.1 🛒 Buyer

**Login:** เปิดหน้าแรก → กดปุ่ม Login มุมบนขวา → เลือก Google/Facebook/LINE/ใส่ Email+Password

**ซื้อสินค้า:**
1. เลือกสินค้าจากหน้าแรก หรือค้นหาที่ `/products`
2. กดเข้าไปดูรายละเอียดที่ `/products/[id]`
3. กด "เพิ่มลงตะกร้า" → ไอคอนตะกร้าข้างบนมีจำนวนขึ้น
4. ไปที่ Checkout → เลือกช่องทางชำระเงิน (PromptPay / TrueMoney)
5. ชำระเงิน → ระบบสร้างออเดอร์ + ส่งโค้ดให้อัตโนมัติ

**ติดตามออเดอร์:**
1. ไปที่ `/orders` → เห็นรายการออเดอร์ทั้งหมด
2. กดเข้า `/orders/[id]` → ดูสถานะ + โค้ดสินค้า

### 7.2 🏪 Seller

**ลงทะเบียนร้าน:** ไปที่ `/seller/register` หลังจาก login แล้ว

**Seller Dashboard:**

| Page | หน้าที่ |
|------|--------|
| `/seller/dashboard` | ภาพรวม — ยอดขายวันนี้, ออเดอร์ใหม่, สินค้าขายดี |
| `/seller/dashboard/products` | เพิ่ม/แก้ไข/ลบสินค้า |
| `/seller/dashboard/orders` | ดูออเดอร์ที่เข้ามา + อัปเดตสถานะ (pending → paid → shipped → completed) |
| `/seller/dashboard/wallet` | ดูยอดเงินคงเหลือ + รายการบัญชี |
| `/seller/dashboard/settings` | แก้ไขชื่อร้าน, เบอร์โทร |

**เพิ่มสินค้า:**
1. ไปที่ `/seller/dashboard/products`
2. กด "เพิ่มสินค้าใหม่"
3. กรอก: ชื่อสินค้า, หมวดหมู่, ราคา, สต็อก, รายละเอียด
4. กดบันทึก → สินค้าจะแสดงบนหน้า marketplace ทันที

**อัปเดตออเดอร์:**
1. ไปที่ `/seller/dashboard/orders`
2. กดออเดอร์ที่ต้องการ
3. เปลี่ยนสถานะ: pending → paid (ได้รับเงินแล้ว) → shipped (ส่งโค้ดแล้ว) → completed

### 7.3 👨‍💼 Admin

**Login:** ไปที่ `/admin/login` → ใช้ admin account

**Admin Dashboard** (`/admin/dashboard`):
- ดูภาพรวม Platform ทั้งหมด (Users, Sellers, Products, Orders, Revenue)
- ดูรายละเอียด Users / Sellers / Orders

---

## 8. Environment Variables

### Development (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://epbitsaowxxmutgmeqro.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_jr_e6ivs-...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production

# OAuth
GOOGLE_CLIENT_ID=123...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...
FACEBOOK_CLIENT_ID=1234567890123456
FACEBOOK_CLIENT_SECRET=...
LINE_CLIENT_ID=1234567890
LINE_CLIENT_SECRET=...
```

### Production (Vercel Environment Variables)

| Variable | Value | Note |
|----------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://epbitsaowxxmutgmeqro.supabase.co | Public |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | sb_publishable_... | Public (safe ใช้ browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | sb_secret_... | **Private** — server-side only |
| `NEXTAUTH_URL` | https://keyzaa.vercel.app | Production URL |
| `NEXTAUTH_SECRET` | (generate ใหม่) | ใช้ `openssl rand -base64 32` สร้าง |
| `GOOGLE_CLIENT_ID` | ... | จาก Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | ... | จาก Google Cloud Console |
| `FACEBOOK_CLIENT_ID` | ... | จาก Meta Developer |
| `FACEBOOK_CLIENT_SECRET` | ... | จาก Meta Developer |
| `LINE_CLIENT_ID` | ... | จาก LINE Developer Console |
| `LINE_CLIENT_SECRET` | ... | จาก LINE Developer Console |

---

## 9. การ Deploy

### 9.1 Deploy to Vercel (Recommended)

```bash
cd ~/dev/Keyzaa

# Login Vercel
vercel login

# Link project
vercel link

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production
# ... add OAuth vars ...

# Deploy
vercel --prod
```

### 9.2 Deploy ผ่าน GitHub (Auto-deploy)

1. Push code lên GitHub branch `develop`
2. ไปที่ https://vercel.com → Import GitHub repo
3. เพิ่ม Environment Variables ใน Vercel Dashboard
4. Deploy จะรันอัตโนมัติทุกครั้งที่ push

### 9.3 Database Migration

เมื่อมีการเปลี่ยนแปลง schema:

1. แก้ไข `supabase/schema.sql`
2. ไปที่ Supabase Dashboard → SQL Editor
3. Run SQL ใหม่ที่เพิ่ม/แก้ไข tables หรือ policies

---

## 10. Troubleshooting

### Build Error: `supabaseUrl is required`

**สาเหตุ:** Env vars ยังไม่ตั้งค่าตอน Vercel build

**วิธีแก้:**
1. ตั้งค่า `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` ใน Vercel Dashboard → Settings → Environment Variables
2. Redeploy

### Auth Error: Adapter undefined

**สาเหตุ:** `NEXT_PUBLIC_SUPABASE_URL` หรือ `SUPABASE_SERVICE_ROLE_KEY` ว่างตอน NextAuth init

**วิธีแก้:** ตรวจสอบว่า env vars ถูกตั้งค่าถูกต้องทั้ง local และ Vercel

### RLS Policy Error: Permission Denied

**สาเหตุ:** User ที่ login ไม่มีสิทธิ์เข้าถึง resource นั้น

**วิธีแก้:** ตรวจสอบ RLS policies ใน `supabase/schema.sql` ว่าถูกสร้างหรือยัง (ลอง run SQL ใหม่)

### Duplicate Policy Error

**สาเหตุ:** Policy มีอยู่แล้วใน database — run SQL ซ้ำทับ

**วิธีแก้:** ตรวจสอบว่า `DROP POLICY IF EXISTS` อยู่ก่อน `CREATE POLICY` ใน SQL ทุกตัว

### OAuth Login ไม่ได้

**สาเหตุ:** OAuth redirect URIs ไม่ตรงกับ Supabase/Google/Facebook/LINE dashboard

**วิธีแก้:**
1. Supabase Dashboard → Authentication → URL Configuration → Site URL + Redirect URLs ใส่ `https://keyzaa.vercel.app`
2. Google Cloud Console → OAuth 2.0 → Authorized redirect URIs ใส่ `https://epbitsaowxxmutgmeqro.supabase.co/auth/v1/callback`
3. Facebook Meta → OAuth Redirect URIs ใส่ `https://epbitsaowxxmutgmeqro.supabase.co/auth/v1/callback`
4. LINE Login Console → Callback URL ใส่ `https://epbitsaowxxmutgmeqro.supabase.co/auth/v1/callback`

### pnpm install error: `ERR_PNPM_OUTDATED_LOCKFILE`

**สาเหตุ:** `pnpm-lock.yaml` ไม่ตรงกับ `package.json` (เพิ่ม dependencies ใหม่)

**วิธีแก้:**
```bash
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml
git commit -m "fix: update pnpm-lock.yaml"
```

---

## 📞 ติดต่อ

- **GitHub Issues:** https://github.com/minyootthawat/Keyzaa/issues
- **Supabase Dashboard:** https://supabase.com/dashboard/project/epbitsaowxxmutgmeqro
- **Vercel Dashboard:** https://vercel.com/dcsm-projects/keyzaa
