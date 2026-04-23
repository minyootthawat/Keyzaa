# Mobile Responsive Audit — Keyzaa

**Auditor:** Tech Lead
**Date:** 2026-04-23
**Scope:** All pages under `app/` and all components under `app/components/`
**Criteria:** Sidebar/header collapse, touch targets >= 44px, readable text (no overflow), no horizontal scroll

---

## Summary

| Status | Count | Pages/Components |
|--------|-------|-----------------|
| PASS   | 14    | Most buyer-facing pages, CTAButton, BottomNav, ProductCard |
| WARN   | 6     | Minor issues (safe area, cramped filters, aspect ratios) |
| FAIL   | 4     | Tables with hardcoded min-width causing horizontal scroll |

---

## Critical Issues (FAIL)

### 1. Seller Dashboard — Products Table
**File:** `app/(seller)/seller/dashboard/products/page.tsx`
**Line:** ~156

```tsx
<table className="w-full min-w-[760px] text-left text-sm">
```

The table has `min-w-[760px]` hardcoded. On mobile (< 768px), this will cause horizontal scrolling. The entire table is wrapped in `overflow-x-auto` which is correct, but the table width forces it to trigger on all mobile screens.

**Fix:** Change to `min-w-[600px]` and add a responsive consideration. Alternatively, replace the table with a card-based list layout on mobile (`hidden md:block` for the table, show card list on mobile).

---

### 2. Seller Dashboard — Overview Table
**File:** `app/(seller)/seller/dashboard/page.tsx`
**Line:** ~137

```tsx
<table className="w-full min-w-[640px] text-left text-sm">
```

Same issue: `min-w-[640px]` forces horizontal scroll on mobile.

**Fix:** Reduce to `min-w-[520px]` or replace with responsive card layout.

---

### 3. Admin Dashboard — Recent Orders Table
**File:** `app/(admin)/admin/dashboard/page.tsx`
**Line:** ~152

```tsx
<table className="w-full min-w-[640px] text-left text-sm">
```

Same hardcoded `min-w-[640px]` issue.

**Fix:** Reduce or use responsive layout.

---

### 4. Admin Dashboard — Top Sellers / Listing Breakdown Layout
**File:** `app/(admin)/admin/dashboard/page.tsx`
**Line:** ~202

```tsx
<div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
```

On `sm` breakpoint (640px+), the listing breakdown shows 2 columns. On `xl` (1280px+), it collapses to 1 column. This reverse behavior (2 cols on small screens, 1 col on extra large) is likely unintended. At `xl` the page is already wide so 1 column wastes space, but the issue is the reverse breakpoint logic causing awkward intermediate states.

---

## Warnings (WARN)

### 5. Checkout — Quantity Buttons Too Small
**File:** `app/(buyer)/checkout/page.tsx`
**Lines:** ~230–232

```tsx
<button className="h-8 w-8 rounded-full ...">-</button>
```

Touch target is **32x32px** — below the 44px minimum. These +/- quantity controls should be at least 44px for comfortable thumb interaction.

**Fix:** Change `h-8 w-8` to `h-11 w-11` (44px).

---

### 6. Seller Register — Form Inputs Height
**File:** `app/(seller)/seller/register/page.tsx`
**Lines:** ~67, ~78

```tsx
className="... px-4 py-3 ..."
```

Input height is `py-3` (~36px). While this is close to the 44px touch target guidance for interactive elements, form fields benefit from at least `py-3.5` (~42px) for visual balance on mobile.

**Fix:** Change `py-3` to `py-3.5` on both inputs.

---

### 7. Seller/Admin Sidebar Nav Items — Tight Touch Targets
**Files:** `app/components/SellerSidebar.tsx`, `app/components/AdminSidebar.tsx`
**Line (SellerSidebar):** ~36

```tsx
className="shrink-0 rounded-xl px-3 py-2.5 ..."
```

Nav items are `py-2.5` (~30px) with `px-3` (~36px). Below 44px. However, since these sidebars are hidden on mobile (used only on `lg+`), this is only a concern if the sidebar is ever made visible on smaller screens. Currently safe due to `lg:block`/`hidden lg:overflow-visible` pattern, but worth documenting.

---

### 8. BottomNav — `pb-safe` may not be recognized
**File:** `app/components/BottomNav.tsx`
**Line:** ~72

```tsx
className="... pb-safe ..."
```

`pb-safe` is not a standard Tailwind class. It may be a custom utility or it may be silently ignored, meaning the nav does not account for iOS home indicator area (~34px). If `pb-safe` is not defined in `globals.css`, the bottom nav could be obscured by the home indicator on iPhone models with a home bar.

**Fix:** Verify `pb-safe` is defined in `globals.css`. If not, replace with `pb-[env(safe-area-inset-bottom)]` or explicit `pb-6`.

---

### 9. Trust Panel on Home — Horizontal Scroll
**File:** `app/(buyer)/page.tsx`
**Line:** ~156

```tsx
<div className="flex gap-3 overflow-x-auto no-scrollbar">
```

The trust items strip scrolls horizontally. While intentional (pinned trust signals), this introduces horizontal scroll on the page. The parent section has no constraint preventing the page from gaining a horizontal scrollbar.

**Fix:** Wrap in a container with `max-w-full overflow-hidden` or ensure the parent constrains this section's width.

---

### 10. ProductCard — Aspect Ratio on Mobile
**File:** `app/components/ProductCard.tsx`
**Line:** ~62

```tsx
<div className="relative aspect-[4/5] w-full overflow-hidden ...">
```

`aspect-[4/5]` is consistent across breakpoints. This is a design choice, but on very small screens (320px), the card becomes very tall and narrow in the 2-column grid. Not a hard fail — it's readable — but worth noting.

---

### 11. FilterBar Selects — Cramped on Small Screens
**File:** `app/components/FilterBar.tsx`
**Line:** ~40

```tsx
className="... px-8 py-2.5 ..."
```

Select pills on the products page use `px-8` which adds left padding for the chevron icon. On narrow screens, this makes the label very cramped. The `no-scrollbar` on the FilterBar container helps, but individual SelectPill labels (`text-[11px]`) are very small.

---

### 12. Product Detail — 3-Column Info Grid
**File:** `app/(buyer)/products/[id]/page.tsx`
**Line:** ~149

```tsx
<div className="grid gap-3 sm:grid-cols-3">
```

At `sm` (640px), this creates 3 equal columns. On a phone in landscape or larger phones in portrait, the 3 info cards (Activation, Region, Delivery) become very narrow. In portrait on a standard 375px phone, each column is ~110px which is readable but tight.

---

## Passed Checks (PASS)

### Buyer Layout
- StickyHeader collapses gracefully — search bar hidden on mobile (shown as separate element below header on mobile)
- Language toggle: `h-11` ✓
- Cart button: `h-11 w-11` ✓
- Logo hidden text on mobile (`hidden sm:flex`) ✓
- Profile link hidden on mobile (`hidden sm:flex`) ✓

### BottomNav
- Nav items: `min-h-11` (44px) ✓
- Nav items: `min-w-[72px]` ✓
- Active indicator dot ✓
- Cart badge positioned correctly ✓
- `sm:hidden` — correctly hidden on desktop ✓

### CTAButton
- `py-3.5` (~42px) — borderline but acceptable. Padding adds up with line height.
- `rounded-2xl` — good corner radius ✓
- `focus-visible:ring-2` — keyboard focus ring present ✓

### ProductCard
- Buy Now button: `h-11` ✓
- Image: `aspect-[4/5]` consistent ✓
- `sizes` attribute on Image — proper responsive images ✓

### Home Page
- Hero grid: `lg:grid-cols-[1.1fr_0.9fr]` — stacks on mobile ✓
- CTA buttons: `h-14` (56px) ✓
- Category grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` ✓
- Product grid: `sm:grid-cols-2 lg:grid-cols-4` ✓
- `line-clamp-2` prevents text overflow ✓
- `truncate` used on seller names ✓

### Checkout Page
- Grid layout: `lg:grid-cols-[minmax(0,1fr)_420px]` — stacks on mobile ✓
- Sticky order summary: `lg:sticky lg:top-[96px]` ✓
- Cart item image: `h-20 w-20` (80px) ✓

### Products Page
- FilterBar horizontal scroll: contained ✓
- Product grid: `grid-cols-2 sm:grid-cols-4 xl:grid-cols-5` ✓
- SearchBar responsive ✓

### Orders Page
- `max-w-3xl` — readable line length ✓
- OrderCard handles overflow with `truncate` ✓

### Profile Page
- Grid: `xl:grid-cols-[minmax(0,1.2fr)_360px]` — stacks on mobile ✓
- `truncate` on long shop names ✓

### Seller Dashboard Layout
- Grid: `lg:grid-cols-[220px_1fr]` — sidebar hidden on mobile ✓
- SellerSidebar: `lg:sticky lg:top-28` ✓

### Seller Register
- Centered card: `max-w-md` ✓
- Form inputs: labeled ✓
- Full-width button ✓

### Seller Wallet
- Grid: `sm:grid-cols-2 xl:grid-cols-3` ✓
- Withdraw modal: `fixed inset-0` covers screen ✓

### Seller Settings
- Form layout: clean single column ✓
- Inputs: properly labeled ✓

### Admin Login
- Centered card: `max-w-md` ✓
- Form inputs: labeled ✓
- `h-11` on buttons ✓

### Admin Layout
- Header: full-width, no sidebar on mobile ✓
- No overflow tables in the admin layout itself ✓

---

## Recommendations (Priority Order)

| Priority | Issue | File | Action |
|----------|-------|------|--------|
| P0 | Quantity buttons `h-8` (< 44px) | checkout/page.tsx | Change to `h-11 w-11` |
| P0 | Seller products table `min-w-[760px]` | seller/dashboard/products/page.tsx | Reduce to `min-w-[600px]` or use card layout |
| P0 | Seller overview table `min-w-[640px]` | seller/dashboard/page.tsx | Reduce or card layout |
| P0 | Admin orders table `min-w-[640px]` | admin/dashboard/page.tsx | Reduce |
| P1 | `pb-safe` not verified in globals.css | BottomNav.tsx | Verify or replace with `pb-[env(safe-area-inset-bottom)]` |
| P1 | Trust panel horizontal scroll | (buyer)/page.tsx | Constrain parent width |
| P1 | Admin listing grid reverse breakpoints | admin/dashboard/page.tsx | Fix `sm:grid-cols-2 xl:grid-cols-1` → `md:grid-cols-2 xl:grid-cols-1` |
| P2 | Seller register inputs `py-3` | seller/register/page.tsx | Change to `py-3.5` |
| P2 | FilterBar select labels very small | FilterBar.tsx | Consider `text-[12px]` minimum |

---

## Component Responsiveness Matrix

| Component | Mobile Layout | Touch Targets | Overflow | Notes |
|-----------|--------------|---------------|----------|-------|
| StickyHeader | Collapsed nav | h-11 all buttons | None | Logo text hidden < sm |
| BottomNav | Fixed bottom bar | min-h-11 all items | None | Best mobile nav implementation |
| SellerSidebar | Hidden < lg | N/A | N/A | Desktop only |
| AdminSidebar | Hidden < lg | N/A | N/A | Desktop only |
| ProductCard | 2-col grid | h-11 CTA | None | Consistent across breakpoints |
| OrderCard | Full width | Normal | None | Uses truncate well |
| CTAButton | Full width if `fullWidth` | ~42px py-3.5 | None | Borderline on strict 44px |
| FilterBar | Horizontal scroll | Normal | Horizontal scroll | Intended behavior |
| SearchBar | Mobile variant | h-11 | None | Separate search shown on mobile |
