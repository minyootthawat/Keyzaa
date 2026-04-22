# Keyzaa Thailand MVP Spec

## Document status

- Owner: Product / Growth / Ops
- Scope: Thailand-first marketplace MVP
- Date: 2026-04-22
- Status: Draft for implementation planning

## Goal

Launch a Thailand-first digital-goods marketplace MVP that improves conversion through local payment familiarity, bilingual clarity, mobile speed, and stronger trust controls.

## Business outcome

Keyzaa should compete in Thailand on trust, clarity, and local fit rather than raw marketplace breadth. The MVP should prove that a curated, bilingual, mobile-first experience can outperform a generic discount marketplace for Thai buyers.

## Primary users

- Thai mobile-first buyer purchasing digital top-up, gift cards, or instant-delivery digital goods
- Bilingual buyer switching between `TH` and `EN`
- Verified seller listing approved digital products
- Internal admin / ops reviewer managing sellers, orders, disputes, and risk

## Success metrics

- Checkout conversion rate
- Mobile product-page to checkout rate
- Percentage of successful payments via `PromptPay QR`
- Payment failure abandonment rate
- Support tickets per 100 orders
- Dispute rate by seller
- Repeat purchase rate within 30 days
- Thai-language session conversion versus English-language session conversion

## Product principles

- Mobile first
- `THB` first
- One dominant action per screen
- Trust signals before discount noise
- Bilingual by design, not by patchwork
- Stricter seller control over open-market breadth

## MVP scope

### Included

- Buyer storefront
- Product detail page
- Cart and checkout
- `PromptPay QR` payment
- Instant order fulfillment states
- Bilingual `EN/TH` UI
- Seller verification MVP
- Seller trust indicators
- Dispute and refund intake
- Admin review tools

### Excluded

- Loyalty wallet
- Subscriptions
- Advanced personalization
- Cross-border QR flows
- Deep seller analytics
- Tourist-specific flows

## Feature priorities

### P0

- `PromptPay QR` checkout
- `THB`-first pricing and formatting
- Region, activation, platform, and delivery labels
- Mobile checkout compression
- Bilingual checkout, support, and order flow copy
- Payment status and QR expiry recovery

### P1

- Seller verification workflow
- Refund and dispute center
- Seller trust scoring
- Thai search normalization
- `LINE` share and support entry points
- Admin audit trail and moderation controls

### P2

- Repeat-purchase shortcuts
- Loyalty credits or wallet
- Localized promo calendar
- Advanced fraud detection

## Functional requirements

### 1. Catalog

Each product must store:

- `id`
- `slug`
- `status`
- `category`
- `platform`
- `brand`
- `product_type`
- `delivery_type`
- `region_code`
- `face_value`
- `currency`
- `name_en`
- `name_th`
- `description_en`
- `description_th`
- `activation_steps_en`
- `activation_steps_th`
- `delivery_sla`
- `seller_id`
- `price_thb`

Required buyer-visible metadata:

- Platform
- Region compatibility
- Activation method
- Delivery speed
- Seller badge or trust label

Search requirements:

- Match English names
- Match Thai names
- Support Thai transliterations and common brand synonyms

### 2. Product detail page

Above the fold:

- Product name
- `THB` price
- Platform
- Region compatibility
- Delivery speed
- Seller badge or trust score
- Primary CTA

Trust section:

- How delivery works
- Refund and dispute policy summary
- Seller positive rate and fulfillment rate

Mobile requirements:

- Sticky buy CTA
- Compressed metadata blocks
- Clear distinction between products that can and cannot activate in Thailand

### 3. Checkout

Defaults:

- Default currency is `THB`
- Mobile layout is primary design target

Checkout flow:

1. Review item
2. Choose payment method
3. Generate `PromptPay QR`
4. Await payment confirmation
5. Show paid, failed, or expired state
6. Route to delivery screen

Payment methods in MVP:

- `PromptPay QR`
- Card can remain available if already integrated, but it must not be primary

QR requirements:

- Countdown or expiry timer
- Refresh or regenerate flow
- Instructions in `EN/TH`
- Pending-payment state
- Successful-payment auto transition

### 4. Order and fulfillment

Order statuses:

- `created`
- `pending_payment`
- `paid`
- `payment_failed`
- `expired`
- `fulfilling`
- `delivered`
- `delivery_failed`
- `disputed`
- `refunded`

Delivery page must show:

- Order number
- Item purchased
- Delivery result
- Redemption code or instructions
- Support CTA

Failure handling:

- Clear recovery state
- Direct path to support or dispute

### 5. Bilingual system

Supported locales:

- `th`
- `en`

All buyer-facing strings must exist in both languages for:

- Navigation
- Product metadata
- Checkout
- Payment instructions
- Order states
- Dispute forms
- Support messages

Typography requirements:

- Support Thai-safe font rendering such as `Noto Sans Thai`
- Avoid clipped Thai diacritics
- Tune line height and spacing for Thai readability

Locale persistence:

- Cookie or session based
- Easy language toggle

### 6. Seller verification

Seller states:

- `draft`
- `submitted`
- `under_review`
- `verified`
- `rejected`
- `suspended`

Required seller data:

- Legal business name
- Registration number
- Contact person
- Business country
- Payout details
- Business and identity documents

Rules:

- Sellers cannot list products until `verified`
- Admin can approve, reject, request more information, or suspend

### 7. Trust scoring

Internal trust inputs:

- Fulfillment success rate
- Dispute rate
- Refund rate
- Response time
- Account age

Buyer-facing outputs should stay simple:

- `New seller`
- `Verified seller`
- `Top seller`

Raw internal risk scoring should not be exposed publicly.

### 8. Dispute and refund center

Buyer actions:

- Open a dispute from the order page
- Submit reason, description, and optional screenshot

Dispute states:

- `open`
- `awaiting_buyer`
- `awaiting_seller`
- `under_review`
- `resolved_refund`
- `resolved_replacement`
- `rejected`

Admin actions:

- Review timeline
- View evidence
- Issue refund
- Issue replacement
- Update status

Requirements:

- Visible first-response SLA for buyers
- Full event logging for internal review

### 9. Admin console

Admin sections:

- Sellers
- Products
- Orders
- Disputes
- Risk flags

Required actions:

- Verify seller
- Disable product
- Refund order
- Suspend seller
- View payment and order logs

Required logs:

- Seller status changes
- Product edits
- Order state transitions
- Dispute actions

### 10. Compliance and privacy

PDPA baseline:

- Consent logging
- Privacy notice in `EN/TH`
- Data deletion request handling
- Retention policy for support documents

Marketplace governance baseline:

- Seller identity trail
- Order audit trail
- Complaint handling record
- Visible terms and refund rules

## Non-functional requirements

- Mobile performance prioritized over feature density
- Payment confirmation should feel near-real-time
- Reliable error states for payment timeout, delayed webhook, and duplicate refresh
- Accessible focus states and keyboard support

## Suggested data model

- `users`
- `sellers`
- `seller_documents`
- `products`
- `product_localizations`
- `orders`
- `order_items`
- `payments`
- `payment_events`
- `fulfillments`
- `disputes`
- `dispute_messages`
- `admin_actions`
- `audit_logs`

## User stories

- As a Thai buyer, I can see prices in `THB` without switching currency.
- As a Thai buyer, I can pay with `PromptPay QR`.
- As a buyer, I can tell immediately whether a product works in Thailand.
- As a buyer, I can receive my code instantly after payment.
- As a buyer, I can open a dispute if delivery fails.
- As a seller, I can submit verification documents for approval.
- As an admin, I can approve sellers and suspend risky ones.
- As an admin, I can review disputes and issue refunds.

## Implementation roadmap

### Sprint 1

- `THB`-first pricing
- Mobile checkout simplification
- `PromptPay QR` basic flow
- Bilingual checkout copy
- Product labels for region, platform, and delivery

### Sprint 2

- Payment status handling and QR retry flow
- Bilingual post-purchase delivery flow
- `LINE` share links
- Seller badge groundwork

### Sprint 3

- Seller verification MVP
- Trust score inputs
- Dispute and refund center MVP
- Admin review tools
- Thai search synonym layer

## Release criteria

- `PromptPay` payment flow works reliably
- Bilingual checkout and order flow is complete
- Product compatibility labels exist on all listings
- Seller verification is enforced before listing
- Dispute intake and admin review are operational
- Audit trail exists for sellers, products, and orders

## RAG tracker

### Green

- `THB`-first pricing
- `EN/TH` UI coverage
- Product trust labels
- Mobile PDP and checkout

### Amber

- `PromptPay` integration
- Seller verification ops
- Dispute tooling
- Thai search normalization
- `LINE` support and sharing hooks

### Red

- Loyalty and wallet
- Advanced fraud engine
- Cross-border payment features
- Recommendation and personalization systems

## Open questions

- Which payment provider will handle `PromptPay QR` and reconciliation?
- Will Keyzaa operate as a curated marketplace from day one or mix first-party and third-party inventory?
- What seller categories are allowed in the Thailand MVP?
- What refund rules can be automated versus manually reviewed?
- Should `LINE` support be native in-product at MVP, or linked out to existing support operations?
