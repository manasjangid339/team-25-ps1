<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PS1 · ShopEase E-commerce Customer Support Agent
- Business user: online-store customer. Logged-in user: `CURRENT_USER_ID` (`"C001"`) from `lib/currentUser.ts`; never accept a customer id as a tool or API argument.
- Stack (fixed): Next.js App Router, React, TypeScript, Tailwind CSS, Next API routes, Zod, Supabase JS (server-only, secret key), Gemini `@google/genai` function calling.
- Tables (`seed/ps1_ecommerce_support.sql`):
  - `customers(id, name, email, phone, city)`
  - `products(id, name, category, price, return_window_days)`
  - `orders(id, customer_id, order_date, status, expected_delivery, delivered_date, total_amount, courier, tracking_number)`
  - `order_items(id, order_id, product_id, quantity, unit_price)`
  - `returns(id, order_id, product_id, reason, status, created_at)`
  - `support_tickets(id, customer_id, order_id, issue, priority, status, created_at)`
- Tools: live in `lib/agent/tools.ts`, use `defineTool()` + Zod schema, descriptions start with `"Use this when..."`, read real Supabase data, `throw new Error(...)` on rule/DB error.
- Return rule: order belongs to `C001`, status `delivered`, product in `order_items`, `return_window_days > 0`, today <= `delivered_date + return_window_days`, no existing return for same order + product.
- Security: never use Supabase secret key or `lib/supabase.ts` / `lib/env.ts` / `lib/agent/*` in components or `"use client"` files; never commit `.env.local` or keys.
- Ownership: each member edits only files they own in `TEAM_PLAN.md` section 3.
