# Design

## Theme

Dark. Deep navy-black base (#07111f) with blue-tinted surfaces. The scene: a Thai buyer on their phone at night, scrolling a marketplace. They need to feel safe handing over money to a stranger. Premium dark theme communicates trust and quality without being flashy.

## Color Palette

### Brand

- Primary: `#2d5bff` (electric blue — trust, clarity)
- Secondary: `#1537b8` (deep blue — depth, stability)
- Tertiary: `#8db5ff` (pale blue — highlights, badges)
- Accent: `#3fcf8e` (mint green — success, CTAs, deals)

### Background

- Base: `#07111f` (near-black navy)
- Subtle: `#0d1728`
- Surface: `#122036`
- Elevated: `#192b47`
- Surface hover: `#203452`
- Glass: `rgba(10, 20, 35, 0.72)`

### Text

- Main: `#f7f9ff` (warm white)
- Subtle: `#d6e2ff` (blue-tinted white)
- Muted: `#8ea3c7` (muted blue-gray)

### Borders

- Subtle: `rgba(169, 193, 231, 0.16)`
- Main: `rgba(124, 164, 235, 0.42)`
- Strong: `rgba(170, 197, 246, 0.26)`

### Status

- Danger: `#ff6b6b`
- Warning: `#f6c05d`
- Success: `#10b981`

## Typography

- Body: `Inter` + `Noto Sans Thai` (UI + Thai support)
- Display: `Noto Sans Thai` + `Inter`
- Type scale: display (3rem), h1 (2.5rem), h2 (1.625rem), body (1rem), meta (0.75rem uppercase)
- Line-length cap: 65ch

## Spacing & Layout

- Container max-width: fluid, `section-container` class
- Section padding: generous vertical rhythm, tight horizontal
- Cards: `rounded-2xl` (1.5rem), elevated backgrounds
- Mobile-first: single column, full-width CTAs

## Motion

- Ease: `ease-out-quart` curves
- Duration: 150-300ms for micro-interactions
- No bounce, no elastic
- Scroll-driven: subtle parallax or fade-in on sections

## Components

### Buttons

- Primary: blue bg, white text, rounded-xl, hover brightens
- Secondary: transparent/ghost, border, rounded-xl
- Accent: green bg for positive actions
- Sizes: h-11 (44px touch target), h-13 for primary CTA

### Cards

- Elevated surface background (`#122036`)
- Subtle border (`rgba(169, 193, 231, 0.16)`)
- `rounded-2xl`, padding 16-24px
- Shadow: soft blue-tinted drop shadow

### Badges

- Category badges: uppercase meta text, colored bg tint
- Discount badges: red/orange bg, white text, rounded-full
- Trust badges: green tint, verified checkmark

### Forms

- Dark inputs with subtle border
- Focus: blue border glow
- Error: red border + inline message

### Navigation

- Sticky header with blur backdrop
- Mobile: bottom nav bar (5 items)
- Seller sidebar: 220px fixed left

## Visual Assets

- Icons: Lucide React (consistent stroke-based)
- Images: product screenshots, seller avatars
- Decorative: subtle radial gradients on body bg, no solid color fills

## Pattern: Body Background

```css
radial-gradient(1100px circle at 10% -10%, rgba(45, 91, 255, 0.16), transparent 55%),
radial-gradient(900px circle at 96% 0%, rgba(141, 181, 255, 0.1), transparent 52%),
linear-gradient(180deg, rgba(8, 17, 31, 0.98) 0%, rgba(9, 19, 34, 1) 38%, rgba(7, 17, 31, 1) 100%),
#07111f;
```

## Pattern: Glass Panel

```css
background: rgba(10, 20, 35, 0.72);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.08);
border-radius: 1.5rem;
```
