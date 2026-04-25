<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Keyzaa Agent Guidelines

## Project Overview

- **Stack**: Next.js 16 + React 19 + Tailwind CSS v4 + TypeScript
- **Market**: Thai digital marketplace (mobile-first, EN/TH bilingual)
- **Brand**: Dark-first premium marketplace (Stripe/Linear/Vercel quality bar)
- **Domain**: Digital top-up, gift cards, instant delivery
- **Design refs**: Stripe, Linear, Apple, Vercel — avoid gaming-heavy neon aesthetics

## Build Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint (next/core-web-vitals + typescript)
```

No test framework is currently configured. To run a single file lint:
```bash
npx eslint path/to/file.tsx
```

## Design Principles

1. **Conversion clarity**: One dominant action per section, obvious price + CTA hierarchy
2. **Premium restraint**: Subtle gradients, controlled blur, soft shadows, no decorative clutter
3. **Mobile-first**: Thumb-friendly actions, sticky key CTAs, strong readability
4. **Trust signals**: Clear states, transparent feedback, secure visual tone
5. **System consistency**: Reusable component primitives, predictable spacing rhythm

## TypeScript

- `strict: true` enabled globally
- Use explicit types for props and return values — never use `any`
- Use `interface` for object shapes, `type` for unions and primitives
- Prefer `React.ReactNode` over `ReactNode`
- Always handle `undefined` state in hooks and context

## Components

- **Server Components**: Default (no directive needed)
- **Client Components**: Add `"use client"` as first line
- **Named exports required**: `export default function ComponentName`
- Props interfaces defined above the component

```tsx
interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export default function ProductCard({ id, name, price, image }: ProductCardProps) {
  return <div>{name}</div>;
}
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ProductCard`, `StickyHeader` |
| Hooks | camelCase with `use` prefix | `useCart`, `useLanguage` |
| Context | PascalCase | `CartContext`, `LanguageContext` |
| Functions | camelCase | `calculateTotal`, `formatPrice` |
| CSS classes | kebab-case (Tailwind) | `bg-bg-surface`, `text-text-main` |
| Files | kebab-case | `product-card.tsx`, `cart-context.tsx` |

## Imports Order

1. React and React types (`react`, `react-dom`)
2. Next.js (`next/link`, `next/image`, `next/navigation`)
3. External libraries
4. Internal path aliases (`@/...`)
5. Relative imports

```tsx
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useFormatter } from "@/lib/format";
import { CartProvider } from "@/app/context/CartContext";
import ProductCard from "../ProductCard";
```

## Tailwind CSS v4

**No tailwind.config.ts** — theme defined via `@theme inline` in `app/globals.css`.

### Color System

| Token | Usage | Value |
|-------|-------|-------|
| `bg-bg-base` | Page background | `#070912` |
| `bg-bg-subtle` | Section backgrounds | `#0d1222` |
| `bg-bg-surface` | Cards, panels | `#121933` |
| `bg-bg-elevated` | Modals, dropdowns | `#1a2344` |
| `bg-bg-surface-hover` | Interactive hover | `#23305b` |
| `text-text-main` | Primary text | `#f7f9ff` |
| `text-text-subtle` | Secondary text | `#ced8ff` |
| `text-text-muted` | Captions, hints | `#8b9ac4` |
| `brand-primary` | Primary CTA | `#635bff` |
| `accent` | Success, positive | `#5fd7a0` |
| `danger` | Errors, destructive | `#ff6b6b` |
| `warning` | Warnings | `#f8bb4a` |
| `success` | Confirmations | `#10b981` |

### Custom Utilities (globals.css)

```css
.section-container  /* max-width container with responsive padding */
.glass-panel       /* backdrop blur with gradient border */
.surface-card      /* elevated card with gradient bg */
.elevation-1/2/3   /* layered shadow depths */
.btn-primary       /* gradient brand button with hover states */
.type-display/h1/h2/body/meta  /* typography scale */
.motion-fade-up/fade-in        /* entrance animations */
```

### Accessibility

- Use `focus-visible:` instead of `focus:` for keyboard focus rings
- Animation: `transition-all duration-200` (or `duration-220` for buttons)
- Respect `prefers-reduced-motion`

## Context Pattern

```tsx
"use client";

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: CartItem) => {
    setItems((prev) => [...prev, item]);
  };

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
```

## Error Handling

- Use try/catch for localStorage, JSON.parse, and API calls
- Empty catch blocks are acceptable for localStorage failures
- Always handle `undefined` state in context hooks before use
- Display user-friendly error messages, never expose stack traces

## File Structure

```
app/
├── layout.tsx              # Root layout with providers
├── page.tsx                # Home page
├── globals.css            # Tailwind v4 @theme + global styles
├── components/            # Shared UI components
│   ├── CTAButton.tsx
│   └── ProductCard.tsx
├── context/               # React contexts
│   ├── CartContext.tsx
│   └── LanguageContext.tsx
├── lib/                   # Utilities, helpers
│   └── format.ts
├── products/
│   └── [id]/
│       └── page.tsx       # Dynamic product route
└── orders/
    └── [id]/
        └── page.tsx       # Dynamic order route
```

## ESLint Configuration

- Extends `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`
- Global ignores: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`
- Path alias: `@/*` maps to project root (configured in tsconfig.json)

## Bilingual Support

- All user-facing strings must support EN/TH
- Use `useLanguage` hook to get current locale and translations
- Font stack: Inter for Latin, Noto Sans Thai for Thai script

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Keyzaa** (2038 symbols, 3216 relationships, 84 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Keyzaa/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Keyzaa/clusters` | All functional areas |
| `gitnexus://repo/Keyzaa/processes` | All execution flows |
| `gitnexus://repo/Keyzaa/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
