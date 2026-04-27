KEYZAA Marketplace - Developer Prompt (Thai)

🧠 บทบาท

คุณคือ Senior Full-stack Developer

⸻

🎯 เป้าหมายระบบ

สร้างแพลตฟอร์ม KEYZAA สำหรับซื้อขายสินค้าเกมดิจิทัล เช่น ไอดีเกม ไอเทม และบริการ

คุณสมบัติหลัก

* เป็น Marketplace (ไม่ใช่ร้านเดียว)
* มี Buyer / Seller / Admin
* มีระบบ Escrow (ถือเงินกลาง)
* มีระบบ dispute / รีวิว

⸻

🌐 ภาษา

* เว็บไซต์ต้องเป็นภาษาไทยทั้งหมด
* รองรับ multi-language ในอนาคต

⸻

🧱 Tech Stack

Frontend

* Next.js 14 (App Router)
* TypeScript
* Tailwind CSS
* shadcn/ui

Backend

* Next.js API routes / Server Actions

Database

* PostgreSQL
* Prisma ORM

Auth

* NextAuth หรือ JWT

⸻

👥 Roles

1. Guest
2. Buyer
3. Seller
4. Admin

⸻

📄 Pages

Public

* หน้าแรก
* หน้าสินค้า / ค้นหา
* รายละเอียดสินค้า
* โปรไฟล์ร้านค้า
* Login / Register

Buyer

* ตะกร้า
* Checkout
* ประวัติคำสั่งซื้อ
* รายละเอียดคำสั่งซื้อ
* แชท
* เปิดเคส

Seller

* สมัครร้านค้า
* Dashboard
* จัดการสินค้า
* เพิ่ม / แก้ไขสินค้า
* จัดการออเดอร์
* ยืนยันส่งสินค้า
* ถอนเงิน

Admin

* Dashboard
* ผู้ใช้
* อนุมัติร้าน
* ตรวจสินค้า
* Order
* Dispute
* ถอนเงิน

⸻

🔄 Flow หลัก

1. Seller ลงสินค้า
2. Buyer ซื้อสินค้า
3. ระบบเก็บเงิน (Escrow)
4. Seller ส่งสินค้า
5. Buyer ยืนยัน
6. ระบบปล่อยเงิน
7. Buyer รีวิว

⸻

📦 Order Status

* pending_payment
* paid
* waiting_delivery
* delivered
* completed
* disputed
* refunded
* cancelled

⸻

🛡 UX สำคัญ

* แสดง rating ⭐
* จำนวนขาย
* Verified badge 🛡
* ประเภทการส่ง

Checkout Message

“เงินของคุณจะถูกเก็บไว้ในระบบ และจะโอนให้ผู้ขายเมื่อคุณยืนยันสินค้าเท่านั้น”

⸻

🧾 Database Models

* User
* SellerProfile
* Product
* ProductImage
* Order
* OrderItem
* Payment
* Review
* Dispute
* PayoutRequest
* Conversation
* Message

⸻

🎨 UI Theme

* Dark mode
* โทน gaming
* สีหลัก: ม่วง / น้ำเงิน
* เน้น trust

⸻

🚀 MVP Steps

1. Setup project
2. Setup UI system
3. Prisma schema
4. Seed data
5. Home page
6. Listing page
7. Product detail
8. Checkout (mock)
9. Order system
10. Seller dashboard
11. Admin basic

⸻

⚙️ Rules

* ใช้ TypeScript strict
* Component reusable
* ใช้ mock data ก่อน
* ไม่ต้อง payment จริง

⸻

▶️ Start

เริ่มจาก:

1. Project structure
2. Tailwind + shadcn
3. Prisma schema
4. Seed data
5. Home + Listing

⸻

🔥 Next Prompts

Buyer Flow

สร้าง flow ฝั่งผู้ซื้อ:
- Product detail
- Cart
- Checkout
- Mock payment
- Order detail
- Confirm received
- Open dispute

Seller Flow

สร้าง seller dashboard:
- Overview
- Products
- Create/Edit
- Orders
- Confirm delivery
- Balance + payout

Admin Flow

สร้าง admin dashboard:
- Users
- Sellers
- Products
- Orders
- Disputes
- Payouts

⸻

📌 หมายเหตุ

เอกสารนี้ออกแบบสำหรับการสร้างระบบระดับ production (MVP)