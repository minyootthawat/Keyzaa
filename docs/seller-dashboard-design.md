# KeyZaa Seller Dashboard — Design Specification

**Document version:** 1.0
**Date:** 2026-04-27
**Status:** Draft for implementation
**Design references:** Stripe, Linear, Vercel — dark-first premium SaaS quality
**Scope:** All 6 seller dashboard pages

---

## 1. Design Language

### 1.1 Aesthetic Direction

Dark-first premium dashboard. Every surface should feel like it belongs in a high-end SaaS product — not a generic admin panel. Think Stripe's data density married to Linear's spatial calm. Avoid gaming-neon aesthetics. The UI should feel like a precision instrument: controlled, confident, refined.

### 1.2 Color Palette

```
Background layers (dark mode default):
  --bg-base:        #07111f   /* page canvas */
  --bg-subtle:      #0d1728   /* section wells */
  --bg-surface:     #122036   /* cards, panels */
  --bg-elevated:    #192b47   /* modals, dropdowns */
  --bg-surface-hover: #203552 /* interactive hover */

Border system:
  --border-subtle:  rgba(169, 193, 231, 0.16)
  --border-main:    rgba(124, 164, 235, 0.42)
  --border-strong:  rgba(170, 197, 246, 0.26)

Text:
  --text-main:      #f7f9ff   /* primary content */
  --text-subtle:    #d6e2ff   /* secondary content */
  --text-muted:     #8ea3c7   /* labels, captions */

Brand & semantic:
  --brand-primary:  #2d5bff   /* primary CTA, links */
  --brand-secondary: #1537b8
  --brand-tertiary: #8db5ff
  --accent:         #3fcf8e   /* success, positive delta */
  --accent-hover:   #59d99d
  --danger:         #ff6b6b   /* errors, destructive */
  --warning:        #f6c05d   /* warnings, pending */
  --success:        #10b981   /* confirmations */
```

### 1.3 Typography Scale

```
.type-display  clamp(1.875rem, 4vw, 3rem)   weight-800  tracking -0.02em
.type-h1       clamp(1.75rem, 3.2vw, 2.5rem) weight-800  tracking -0.016em
.type-h2       clamp(1.25rem, 2.1vw, 1.625rem) weight-700 tracking -0.012em
.type-body     1rem                         weight-400  line-height 1.6
.type-meta     0.75rem                       weight-500  tracking 0.08em
.type-num      tabular-nums variant for all numeric displays
```

### 1.4 Spatial System

```
Base unit: 4px
Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
Card padding: 20px (mobile) / 24px (desktop)
Section gap: 24px (mobile) / 28px (desktop)
Page gutter: 16px mobile / 24px tablet / 32px desktop
Sidebar width: 220px (fixed)
```

### 1.5 Motion Philosophy

Entrance animations communicate state, not decoration. All motion should be:
- **Purposeful**: each animation communicates a state change
- **Quick**: 200ms standard, 300ms for emphasis
- **Subtle**: fade + slight Y-translate (8-12px), no bounces or overshoots

```
Fade up entrance:   opacity 0→1, translateY 12px→0, 280ms ease-out
Fade in:           opacity 0→1, 200ms ease-out
Hover lift:        translateY -2px, box-shadow deepen, 180ms
Button press:      scale 0.97, 120ms
```

### 1.6 Component Primitives

| Token | Usage | Implementation |
|-------|-------|----------------|
| `surface-card` | Default card | `bg-bg-surface` + `rounded-2xl` + subtle border |
| `glass-panel` | Sidebar, modals | `backdrop-blur-xl` + gradient border via pseudo-element |
| `section-container` | Page max-width | `max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8` |
| `btn-primary` | Primary CTA | Brand gradient, hover state, rounded-xl |
| `btn-secondary` | Secondary CTA | Surface bg, border, hover lift |
| `badge` | Status chips | `rounded-full px-2.5 py-0.5 text-xs font-semibold` |
| `skeleton` | Loading state | `animate-pulse bg-bg-surface/60 rounded-xl` |

### 1.7 Chart & Data Visualization

Charts should use brand colors with muted fills for context:
- Primary metric: `--brand-primary` (solid line or bar fill)
- Secondary metric: `--brand-tertiary` at 40% opacity
- Positive delta: `--accent`
- Negative delta: `--danger`
- Grid lines: `--border-subtle` at 0.5 opacity
- Axis labels: `--text-muted`, meta size

Use area charts with gradient fills for time-series. Use horizontal bar charts for ranking/sorting comparisons.

---

## 2. Layout Structure

### 2.1 Shell

```
<StickyHeader />                    ← 76px (sm) / 116px (mobile with nav)
<div class="flex min-h-screen">
  <SellerSidebar />                 ← 220px fixed, sticky top-28 on desktop
  <main class="flex-1 pt-[76px]">   ← responsive offset
    <div class="section-container">
      <div class="grid lg:grid-cols-[220px_1fr] lg:gap-7">
        {children}
      </div>
    </div>
  </main>
</div>
```

### 2.2 Responsive Strategy

```
Mobile (<768px):   Single column, sidebar hidden (hamburger drawer)
Tablet (768-1024): Single column, sidebar as persistent top nav strip
Desktop (>1024):   Two-column grid, sidebar sticky left
```

### 2.3 Page Header Pattern

Every page follows this rhythm:
```
[Page title + bilingual subtitle]   ← type-h1 + type-body muted
[Context bar: filters / date range / action buttons]  ← optional
[Primary content blocks]            ← cards, tables, charts
```

---

## 3. Sidebar — SellerSidebar Component

### 3.1 Visual Design

- **Container**: `surface-card glass-panel p-4 lg:p-5` with `lg:sticky lg:top-28`
- **Background**: `bg-bg-surface` with `backdrop-blur-xl` and gradient border
- **Width**: 220px on desktop, full-width drawer on mobile
- **Corner radius**: 2xl (16px outer), xl (12px) for nav items

### 3.2 Structure

```
[publisher badge]          ← "SELLER PANEL" uppercase meta label
[nav items list]           ← 6 items, vertical stack on desktop
  ├── Overview             ← /seller/dashboard
  ├── Orders               ← /seller/dashboard/orders
  ├── Products             ← /seller/dashboard/products
  ├── Game Accounts        ← /seller/dashboard/game-accounts
  ├── Wallet               ← /seller/dashboard/wallet
  └── Settings             ← /seller/dashboard/settings
[divider with border]
[seller shop name]          ← pulled from auth context
[switch to buyer mode]     ← secondary link
```

### 3.3 Nav Item States

| State | Background | Text | Border |
|-------|------------|------|--------|
| Default | transparent | `--text-subtle` | none |
| Hover | `bg-bg-surface` | `--text-main` | none |
| Active | `bg-brand-primary/25` | `--text-main` | left 2px `--brand-primary` |

### 3.4 Active Indicator

Active item has a 2px left border in `--brand-primary` with `rounded-l-xl` clip. This is cleaner than full background fills.

---

## 4. Page Specifications

### 4.1 Overview / Dashboard (`/seller/dashboard`)

**Purpose**: At-a-glance health metrics + recent activity.

#### Layout Sections

1. **Page header** — title, subtitle, CTA to add product
2. **Verification banner** (conditional) — shown if `verificationStatus === "new"`
3. **Stock alert banner** (conditional) — shown if any product has stock < 10
4. **KPI row** — 4 metric cards in a responsive grid (2-col mobile, 4-col desktop)
5. **Quick actions bar** — 3 icon+label buttons (Add Product, View Orders, Withdraw)
6. **Recent orders section** — horizontal scroll of order cards with pagination
7. **Order summary block** — gross/net 2-column grid
8. **Listings table** — product performance with stock, sold, revenue columns

#### KPI Cards

Each KPI card:
- `surface-card p-5`
- Label: `--text-muted`, meta size, uppercase tracking
- Value: `--text-main`, 2xl bold tabular-nums
- Delta badge: `--accent` or `--danger` with ↑/↓ + %
- Sparkline: 7-bar inline chart in `bg-brand-primary/40`, hover reveals solid
- Layout: label → value → delta → sparkline (vertical stack)

**4 KPI metrics**:
1. **Gross Sales** — total order revenue (฿)
2. **Net Earnings** — after platform fee (฿)
3. **Available for Payout** — withdrawable balance (฿)
4. **Paid Orders** — completed order count

#### Recent Orders

Horizontal scroll container (`overflow-x-auto`, `gap-4`, `scrollbar-hide`).
Each order card (`min-w-[240px]`):
- Order ID truncated to last 6 chars
- Date (localized)
- Status badge (delivered/paid → accent, pending → warning)
- Total price bold

#### Listings Table

Full-width, `min-w-[640px]`, text-left. Columns:
- Product name (truncated, max-w-[260px])
- Stock (number)
- Sold count (number)
- Gross sales (฿ value, bold)

---

### 4.2 Orders (`/seller/dashboard/orders`)

**Purpose**: Full order history with filtering, search, and status management.

#### Layout Sections

1. **Page header** — "Orders" title + bilingual subtitle
2. **Filter bar** — status tabs + date range picker + search input
3. **Orders table** — full data table with all order columns
4. **Pagination** — page controls + total count

#### Filter Bar

Status tabs (pill-style, scrollable on mobile):
```
[All] [Pending] [Paid] [Delivered] [Cancelled] [Disputed]
```

Active tab: `bg-brand-primary/25 text-text-main border border-brand-primary/40`
Inactive: `bg-transparent text-text-muted hover:bg-bg-surface`

Date range: compact picker (Last 7 days / 30 days / Custom)
Search: icon-prefix input, searches order ID + product name

#### Orders Table

Columns:
| Order ID | Buyer | Products | Total | Status | Date | Actions |

- Order ID: `#XXXXXX` uppercase, monospace-feel
- Buyer: display name or masked ` Buyer-XXXX`
- Products: item count + first product truncated
- Total: bold ฿ value, tabular-nums
- Status: colored badge (paid→accent, pending→warning, cancelled→danger, delivered→success-bg)
- Date: localized, `DD MMM YYYY` format
- Actions: `...` dropdown (View, Contact Buyer, Issue Refund, Cancel)

Row hover: `bg-bg-surface/60`
Row height: 56px min
Zebra: subtle alternating via background opacity

#### Pagination

Bottom-aligned, page X of Y, Previous/Next buttons.
Button style: `bg-bg-surface hover:bg-bg-surface-hover rounded-lg px-3 py-1.5`

---

### 4.3 Products (`/seller/dashboard/products`)

**Purpose**: Manage product listings — create, edit, toggle visibility, delete.

#### Layout Sections

1. **Page header** — title + subtitle + "Add Product" CTA
2. **Filter bar** — category dropdown, status filter (Active/Draft/Out of Stock), search
3. **Products grid/table** — toggle between card view and table view
4. **Pagination**

#### Products Table

Columns:
| Image | Product Name | Category | Stock | Price | Status | Sales | Actions |

- Image: 48x48 rounded-lg thumbnail
- Product name: bold, truncated, shows title + subtitle
- Category: badge pill
- Stock: number, red if < 10
- Price: bold ฿ value
- Status: `Active` (accent), `Draft` (muted), `Out of Stock` (danger)
- Sales: sold count
- Actions: Edit, Duplicate, Toggle Visibility, Delete

#### Add/Edit Product Modal

Full-page modal overlay (`backdrop-blur-sm bg-bg-base/80`).
Sections:
1. **Basic info**: title (EN + TH), description, category
2. **Pricing**: price (THB), compare-at price, cost price (internal)
3. **Inventory**: stock quantity, SKU
4. **Media**: image upload zone (drag-drop, multi-image)
5. **Delivery**: auto-delivery toggle, delivery instructions
6. **Status**: draft or published

Modal: `bg-bg-elevated rounded-3xl p-6 lg:p-8`, max-w-[720px], scrollable body.

---

### 4.4 Game Accounts (`/seller/dashboard/game-accounts`)

**Purpose**: Manage pre-owned game accounts for resale.

#### Layout Sections

1. **Page header** — title + subtitle + "List Game Account" CTA
2. **Filter bar** — platform, game, price range, status
3. **Accounts grid** — card layout (2-col mobile, 3-col tablet, 4-col desktop)
4. **Pagination**

#### Game Account Card

```
[Platform badge]           ← top-left overlay (Steam, PlayStation, etc.)
[Account preview image]     ← 16:9 ratio, rounded-t-2xl
[Game title]               ← bold, truncated to 2 lines
[Account details preview]  ← level, region, etc. (2-3 lines max)
[Divider]
[Price + View button]      ← bottom row, full-width
[Status indicator]         ← Available / Sold / Reserved
```

Card: `surface-card rounded-2xl overflow-hidden hover:translate-y-[-2px] transition-all`
Hover: subtle shadow deepen + 2px lift

#### Platform Badges

Color-coded pills:
```
Steam:    bg-blue-500/20 text-blue-300
PlayStation: bg-blue-400/20 text-blue-200
Xbox:     bg-green-500/20 text-green-300
Nintendo: bg-red-500/20 text-red-300
Mobile:   bg-purple-500/20 text-purple-300
```

#### List Game Account Form

Multi-step form:
1. **Platform & Game** — select platform, search/select game
2. **Account details** — username, email, level, region, server, extra info
3. **Credentials** — credentials + 2FA info (encrypted at rest, masked in UI)
4. **Pricing** — asking price, platform fee displayed
5. **Review & Publish** — preview card + publish

---

### 4.5 Wallet (`/seller/dashboard/wallet`)

**Purpose**: Earnings overview, payout history, withdrawal.

#### Layout Sections

1. **Page header** — "Wallet" + subtitle
2. **Balance cards** — 3-column grid (Available / Pending / Total Earned)
3. **Payout actions** — "Withdraw" CTA + bank account selector
4. **Transaction history** — table of all credits and debits
5. **Payout schedule** — info card about payout timing

#### Balance Cards

Three cards in a row:
1. **Available for Withdrawal** — large accent-colored value, ฿ value
2. **Pending Clearance** — muted value, shows funds in escrow (e.g., new orders)
3. **Total Earned (All Time)** — lifetime net earnings

Each card: `surface-card p-5` with icon, label, value stack.

#### Payout Action Panel

```
[Bank account selector]   ← dropdown, shows masked account number
[Amount input]            ← pre-filled with available balance
[Fee disclosure]          ← "฿0.00 fee · Arrives in 1-2 business days"
[Withdraw button]         ← btn-primary full-width
```

#### Transaction History Table

Columns:
| Date | Description | Order ID | Amount | Balance After |

- Amount: positive (฿+green) for credits, negative (฿-red) for debits
- Description: "Order #XXXXXX", "Payout to ***1234", "Refund", "Platform fee"
- Balance After: running balance, tabular-nums
- Pagination: standard

#### Payout Schedule Info Card

`bg-brand-primary/10 border border-brand-primary/30 rounded-2xl p-4`.
Content: "Payouts are processed daily at 00:00 ICT. Withdrawals arriving in 1-2 business days."

---

### 4.6 Settings (`/seller/dashboard/settings`)

**Purpose**: Store profile, verification, payment methods, notifications, security.

#### Layout Sections

1. **Page header** — "Settings" + subtitle
2. **Settings nav tabs** — horizontal tabs (Profile / Verification / Payout / Notifications / Security)
3. **Settings content panel** — form sections based on active tab

#### Settings Tabs

Horizontal scrollable tab bar:
```
[Profile] [Verification] [Payout Methods] [Notifications] [Security]
```

Active: bottom border `border-brand-primary`, text `--text-main`
Inactive: no border, text `--text-muted`

#### Profile Tab

- Shop name (text input, EN + TH)
- Shop bio (textarea, 280 char max)
- Profile avatar upload
- Contact email (read-only, from account)
- Language preference (EN / TH / Both)
- Save button: `btn-primary mt-6`

#### Verification Tab

Current verification status badge + checklist:
```
Status: [Pending Review] / [Verified] / [Rejected]
Documents submitted: [ID] [Proof of Address] [Business docs]
```

Progress checklist with checkmarks for submitted vs. pending items.

#### Payout Methods Tab

- Bank account list (masked, show bank + last 4 digits)
- "Add Bank Account" button
- Default account selector (radio)
- PromptPay QR display (for Thai payouts)

#### Notifications Tab

Toggle switches for:
- New order email/SMS
- Low stock alerts
- Payout processed
- Dispute/refund notifications
- Marketing (optional)

Toggle style: pill switch, `bg-brand-primary` when on, `bg-bg-surface` when off.

#### Security Tab

- Change password form
- Two-factor authentication toggle
- Active sessions list
- "Sign out all devices" button

---

## 5. KPI Card — Component Specification

```tsx
// Conceptual structure
<div className="surface-card p-5">
  <p className="text-xs text-text-muted uppercase tracking-wide">{label}</p>
  <p className="type-num mt-1 text-2xl font-extrabold text-text-main">{value}</p>
  <div className="flex items-center gap-1.5 mt-1">
    <span className={`type-num text-xs font-semibold ${deltaColor}`}>{delta}</span>
    <span className="text-xs text-text-muted">vs last period</span>
  </div>
  <div className="mt-3 flex h-10 items-end gap-[3px]">
    {/* 7 sparkline bars */}
  </div>
</div>
```

**Variants**:
- Positive trend: `--accent` delta
- Negative trend: `--danger` delta
- Neutral: `--text-muted` delta

---

## 6. Table — Component Specification

### 6.1 Standard Data Table

```
<table className="w-full text-left text-sm">
  <thead>
    <tr className="text-text-muted border-b border-border-subtle">
      {columns.map(col => (
        <th key={col.key} className="px-5 py-3 font-semibold">{col.label}</th>
      ))}
    </tr>
  </thead>
  <tbody>
    {rows.map((row, i) => (
      <tr key={row.id} className="border-b border-border-subtle/50 hover:bg-bg-surface/40 transition-colors">
        {columns.map(col => (
          <td key={col.key} className="px-5 py-4">{col.render(row)}</td>
        ))}
      </tr>
    ))}
  </tbody>
</table>
```

### 6.2 Column Types

| Type | Display | Alignment |
|------|---------|-----------|
| `text` | Plain text | left |
| `number` | Tabular-nums | right |
| `currency` | ฿ + formatted value | right |
| `badge` | Colored status chip | center |
| `date` | Localized DD MMM YYYY | left |
| `action` | Dropdown or icon buttons | right |

---

## 7. Status Badge — Color System

```
Paid        →  bg-accent/20 text-accent
Pending     →  bg-warning/20 text-warning
Delivered   →  bg-success-bg text-success
Cancelled   →  bg-danger/20 text-danger
Disputed    →  bg-danger/20 text-danger
Draft       →  bg-bg-surface text-text-muted
Active      →  bg-accent/20 text-accent
Out of Stock → bg-danger/20 text-danger
```

---

## 8. Loading & Empty States

### 8.1 Skeleton Loading

KPI row: 4 cards with pulsing placeholder bars.
Tables: 5 skeleton rows with rounded placeholder divs.
Cards: Full card outline with shimmer animation.

```tsx
// Example skeleton card
<div className="surface-card p-5">
  <div className="h-3 w-20 rounded bg-bg-surface/80 animate-pulse" />
  <div className="mt-3 h-8 w-28 rounded bg-bg-surface/80 animate-pulse" />
  <div className="mt-3 h-10 w-full rounded bg-bg-surface/60 animate-pulse" />
</div>
```

### 8.2 Empty States

Centered illustration (SVG geometric shape, not cartoon) + heading + subtext + CTA.
Example for orders:
```
[Icon: empty inbox]
"ยังไม่มีออเดอร์" / "No orders yet"
"ออเดอร์แรกของคุณจะปรากฏที่นี่" / "Your first order will appear here"
[CTA: "ไปหน้าสินค้า" / "Browse products"]
```

---

## 9. Responsive Behavior

### Mobile (< 768px)

- Sidebar: hidden, accessed via hamburger menu (drawer from left)
- KPI cards: 1 column per row, full width
- Tables: horizontal scroll with sticky first column
- Charts: full-width, reduced height (200px)
- Forms: single-column, stacked inputs
- Action buttons: full-width on mobile

### Tablet (768px - 1024px)

- Sidebar: visible as top horizontal scroll nav strip
- KPI cards: 2-column grid
- Tables: full-width, scrollable
- Charts: side-by-side when comparing two metrics

### Desktop (> 1024px)

- Sidebar: 220px fixed left column, sticky
- KPI cards: 4-column grid
- Tables: full data, pagination at bottom
- Charts: larger canvas, tooltips enabled
- Split view: orders detail pane side-by-side with table

---

## 10. Accessibility

- All interactive elements have `focus-visible` ring (never `focus:`)
- Color is never the sole indicator — always paired with text or icon
- Tables have proper `th` scope attributes
- Form inputs have associated `label` elements
- Icon buttons have `aria-label`
- Loading states communicate via `aria-busy` and `aria-live` regions
- Motion respects `prefers-reduced-motion`

---

## 11. Implementation Notes

### Component Priority

1. `SellerSidebar` — already implemented, refine to spec
2. `KPICard` — new shared component, used on Overview + Wallet
3. `DataTable` — new shared component for Orders, Products, Wallet tables
4. `StatusBadge` — new shared component, used everywhere
5. `SparklineChart` — new shared component for KPI cards
6. `FilterBar` — shared between Orders and Products
7. `SettingsTabs` — container component for Settings page

### Shared Component Paths

```
app/components/
  ├── KPICard.tsx
  ├── DataTable.tsx
  ├── StatusBadge.tsx
  ├── SparklineChart.tsx
  ├── FilterBar.tsx
  ├── SettingsTabs.tsx
  └── GameAccountCard.tsx
```

### API Endpoints (for data hooks)

```
GET  /api/seller/overview          → overview page data
GET  /api/seller/orders            → paginated orders
GET  /api/seller/products           → paginated products
GET  /api/seller/game-accounts     → paginated game accounts
GET  /api/seller/wallet            → balance + transactions
GET  /api/seller/settings          → seller profile
PUT  /api/seller/settings          → update profile
POST /api/seller/products          → create product
PUT  /api/seller/products/:id      → update product
DELETE /api/seller/products/:id    → delete product
POST /api/seller/withdraw          → initiate payout
```

### Internationalization

All strings pulled via `useLanguage()` hook from `LanguageContext`.
Keys follow pattern: `seller_[page]_[element]` (e.g., `seller_overview_grossSales`).

---

## 12. Page-by-Page Summary

| Page | Route | Primary Data | Key Components |
|------|-------|--------------|----------------|
| Overview | `/seller/dashboard` | KPIs, recent orders, top products | KPICard, SparklineChart, OrderCard |
| Orders | `/seller/dashboard/orders` | Paginated order list | FilterBar, DataTable, StatusBadge |
| Products | `/seller/dashboard/products` | Product listings | FilterBar, DataTable, ProductModal |
| Game Accounts | `/seller/dashboard/game-accounts` | Game account listings | GameAccountCard, PlatformBadge |
| Wallet | `/seller/dashboard/wallet` | Balance, transactions | KPICard, TransactionTable, PayoutForm |
| Settings | `/seller/dashboard/settings` | Profile, verification, payout | SettingsTabs, ToggleSwitch, InputFields |
