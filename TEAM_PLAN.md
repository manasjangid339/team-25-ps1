# TEAM_PLAN · Team 25 · PS1 ShopEase (E-commerce Customer Support Agent)

## 0. Instructions for Antigravity (read first, obey always)
1. I will say `I am <Name>` (Aadrit / Manas / Haavish / Krrish). Work ONLY in that member's section.
2. Take the FIRST unchecked step `- [ ]` in that section. Never skip, reorder, or do another member's step.
3. If the step says **Needs:** another step, run `git pull --rebase` and check that step is `[x]` here. If not, tell me and stop.
4. Run the step's prompt. Edit only files listed in that member's **Owns**. Then show: files changed, short diff summary, how to test.
5. **Never commit or push without asking.** Propose a commit message and wait for me to say "yes".
6. On "yes": change that step's `[ ]` to `[x]` in this file (same commit), then run `git pull --rebase`, `npm run build` (code steps), `git add -A`, `git commit -m "<msg>"`, `git push`. Then stop and wait.
7. Before the first commit on any laptop, run `git config user.email`. If empty or not the member's GitHub email, stop and ask (needed so commits show on GitHub under that member).

## 1. Hard rules (hackathon, must pass)
- Stack is fixed: Next.js App Router + React + TypeScript + Tailwind, Next API route handlers, Zod, Supabase JS (server only, secret key), Gemini `@google/genai` function calling, Git/GitHub, Vercel. Add no other framework, DB, LLM, ORM or UI library.
- Build on the starter. Reuse `defineTool()` (lib/agent/defineTool.ts), `getSupabase()` (lib/supabase.ts), `isoDate` (lib/schemas.ts), the loop in lib/agent/runAgent.ts, the pattern of app/api/tasks/route.ts.
- Agent: ≥2 tools, ≥1 writes to Supabase, Gemini picks the tool (never `if`/`switch` on user text), every tool's args checked by Zod, results shown on screen, tools read real Supabase data (no hard-coded data).
- Logged-in user = `CURRENT_USER_ID` from `lib/currentUser.ts` (`"C001"`, Priya Raman). Never accept a customer id as a tool/API argument. Never return another customer's data.
- Never commit `.env.local` or any key (costs 5 marks). Never import `lib/supabase.ts`, `lib/env.ts` or `lib/agent/*` from components or `"use client"` files.
- Tool descriptions start with "Use this when...". Return small objects (≤20 rows). `throw new Error("<clear message>")` on a rule break or Supabase error.
- Seed data only, no real personal data. Code freeze 3:30 (nothing pushed after). Every member commits their own work.

## 2. Project facts
- Repo: `team-25-ps1` · Logged-in customer: `C001` · Model env: `GEMINI_MODEL=gemini-3.8-flash`
- Env vars (in `.env.local` and Vercel only): `GEMINI_API_KEY, GEMINI_MODEL, SUPABASE_URL, SUPABASE_SECRET_KEY, APP_PASSCODE`
- Tables (seed/ps1_ecommerce_support.sql):
  - `customers(id text, name, email, phone, city)`
  - `products(id text 'P101', name, category, price, return_window_days int)` (0 = not returnable)
  - `orders(id int, customer_id, order_date, status placed|shipped|out_for_delivery|delivered|cancelled, expected_delivery, delivered_date, total_amount, courier, tracking_number)`
  - `order_items(id, order_id, product_id, quantity, unit_price)`
  - `returns(id, order_id, product_id, reason, status requested|approved|picked_up|refunded|rejected, created_at)`
  - `support_tickets(id, customer_id, order_id null, issue, priority low|medium|high, status open|in_progress|resolved, created_at)`
- Return rule: order belongs to C001, status `delivered`, product is in that order, `return_window_days > 0`, today ≤ `delivered_date + return_window_days`, and no existing return for the same order+product.
- Demo prompts: "Where is my order 1003?" · "I want to return the shoes from my last order, they are too small." · "My order is 4 days late and nobody is answering."

## 3. Roles and file ownership
| Member | Role | Owns |
|---|---|---|
| Manas | Team Lead + Database | GitHub repo, Supabase, Vercel, `TEAM_PLAN.md` (sections 0–3, 8), `AGENTS.md`, `README.md`, slides, form |
| Aadrit | AI / Agent | `lib/currentUser.ts`, `lib/agent/*` |
| Haavish | Backend / API | `lib/schemas.ts`, `lib/rules.ts`, `app/api/orders/`, `app/api/returns/`, `app/api/tickets/` |
| Krrish | Frontend | `app/page.tsx`, `app/orders/`, `app/returns/`, `app/admin/`, `components/*` |

Commit identity (each member once, on own laptop, signed into own GitHub account):
```
git config user.name "<your GitHub name>"
git config user.email "<email linked to your GitHub account>"
```

---

## 4. MANAS · Team Lead + Database
- [ ] **S1 Repo + DB setup (manual, no AI)**
  > On GitHub open the starter template → Use this template → name `team-25-ps1` (Public) → Settings → Collaborators → add Aadrit, Haavish, Krrish. Supabase: new project (region Mumbai) → SQL Editor → run `seed/00_starter_example.sql`, then `seed/ps1_ecommerce_support.sql`. Copy Project URL + secret (service_role) key; share keys only in private team chat. Copy `.env.example` to `.env.local`, fill 5 values, `npm install`, `npm run dev`.
  Done when: localhost:3000 opens after passcode. Commit: add this file at repo root → `"Add team plan"`.
- [ ] **S2 AGENTS.md**
  > Read @seed/ps1_ecommerce_support.sql and @TEAM_PLAN.md. Create AGENTS.md in the project root (under 40 lines, short bullets) for our project: PS1 ShopEase E-commerce Customer Support Agent; business user is an online-store customer; logged-in user id C001 from lib/currentUser.ts, never a tool argument. Include: the fixed stack (Next.js App Router, TypeScript, Tailwind, Supabase server-only with secret key, Gemini function calling with @google/genai, Zod); the exact table names and main columns from the seed file; tools live in lib/agent/tools.ts and use defineTool() with a Zod schema, descriptions start with "Use this when..."; the return rule from TEAM_PLAN.md section 2; never use the Supabase secret key in components, never commit .env.local; each member edits only files they own (TEAM_PLAN.md section 3).
  Done when: table names in AGENTS.md match the seed exactly. Commit: `"Add AGENTS.md rules file"`.
- [ ] **S3 Deploy to Vercel (manual)**
  > vercel.com → log in with GitHub → Add New → Project → import `team-25-ps1` → add the 5 env vars → Deploy. Open `<vercel-url>/api/health`; all must be true.
  Done when: Vercel link opens and login works. No commit.
- [ ] **S4 Plan review (plan mode, no code)**
  > Read @AGENTS.md, @TEAM_PLAN.md, @lib @app and @seed/ps1_ecommerce_support.sql. Do not write code. Check the plan in TEAM_PLAN.md: every table/column used exists in the seed; there are ≥2 tools and ≥1 writes; no tool takes a customer id; the return rule is enforced in code; file ownership has no overlaps. List any problem in one line each.
  Done when: no problems, or fixes agreed with team. No commit.
- [ ] **S5 README for judges** · Needs: Aadrit S5, Krrish S3
  > Rewrite README.md in this exact structure, short, plain English, no keys: `# ShopEase: E-commerce Customer Support Agent` / `Team 25 | PS1 | SRM Agentic AI Hackathon` / `## The problem` (2 lines: online-store customers wait hours for answers about order status, returns and late orders) / `## What our app does` (3–5 bullets) / `## Live demo` (Vercel link: <VERCEL_URL>, Passcode: <PASSCODE>, Try: "I want to return the shoes from my last order, they are too small.") / `## Agent tools` table (Tool | What it does | Reads or writes) for getMyOrders, getOrderDetails, checkReturnEligibility, createReturnRequest, escalateToHuman — read the real descriptions from @lib/agent/tools.ts / `## Database tables` (one line per table in seed/ps1_ecommerce_support.sql) / `## Tech stack` Next.js, React, TypeScript, Tailwind CSS, Supabase, Gemini API (function calling), Zod, Vercel / `## Team` table: Manas | Team Lead + Database; Aadrit | AI / Agent; Haavish | Backend / API; Krrish | Frontend / `## Run it locally` 1. npm install 2. Copy .env.example to .env.local and fill in the keys 3. npm run dev.
  Done when: no placeholders left. Commit: `"Add README"`.
- [ ] **S6 Slides text (paste into ChatGPT/Gemini, not the repo)**
  > Write text for 5 slides, plain English, max 5 short bullets each. Project: ShopEase, PS1 E-commerce Customer Support Agent, Team 25. Team: Manas (Team Lead + Database), Aadrit (AI / Agent), Haavish (Backend / API), Krrish (Frontend). Problem: online-store customers wait hours for simple answers (where is my order, can I return this, my order is late). App: a support chat where the agent checks orders, explains status, starts a return when policy allows and raises a ticket for a human. Tools: getMyOrders, getOrderDetails, checkReturnEligibility (read); createReturnRequest, escalateToHuman (write). Rule: returns only for delivered orders within the product's return window. Working demo: "I want to return the shoes from my last order, they are too small." Refused: "Return order 99999". Links: GitHub <REPO_URL>, live <VERCEL_URL>. Slides: 1 Title and team, 2 The problem, 3 Solution and demo, 4 How the agent works (user → Gemini → tools → Supabase, Zod, stack), 5 Results and links.
  Done when: slides made with 2 real screenshots (chat with tools + data changed), no keys visible, exported PDF or view-only link. No commit.
- [ ] **S7 Final audit** (run at 3:00 and again at 3:25 — see section 8). No commit unless the team agrees on fixes.

## 5. AADRIT · AI / Agent
- [x] **S1 Current user**
  > Create lib/currentUser.ts with exactly: `export const CURRENT_USER_ID = "C001";`
  Commit: `"Add current user C001"`.
- [x] **S2 Read tools**
  > In @lib/agent/tools.ts replace the 3 task example tools with these read tools using defineTool like the existing examples. Import CURRENT_USER_ID from lib/currentUser.ts; never take a customer id as an argument. Descriptions start with "Use this when...". Max 20 rows. Throw new Error(error.message) on a Supabase error.
  > - getMyOrders: no args. Reads orders where customer_id = CURRENT_USER_ID, newest order_date first. Returns id, order_date, status, expected_delivery, delivered_date, total_amount, courier, tracking_number.
  > - getOrderDetails: arg order_id (z.number().int().positive(), "order number, for example 1003"). Reads that order only if customer_id = CURRENT_USER_ID (else throw "Order <id> was not found in your account"), plus order_items joined with products to show product_id, name, category, quantity, unit_price, return_window_days. Also return days_late = days between expected_delivery and today if status is not delivered/cancelled and today > expected_delivery, else 0.
  > - checkReturnEligibility: args order_id (int) and product_id (string, "product id like P101"). Calls checkReturnRule from lib/rules.ts and returns { eligible, reason, last_return_date }.
  > Set the tools array to these 3 tools.
  **Needs:** Haavish S1. Test: "Where is my order 1003?" shows the tool box. Commit: `"Add read tools"`.
- [x] **S3 Write tool createReturnRequest**
  > In @lib/agent/tools.ts add write tool createReturnRequest (writes: true). Args: order_id (int positive), product_id (string), reason (string min 3 max 300, "why the customer is returning it"). First call checkReturnRule from lib/rules.ts; if not eligible throw new Error(reason). If eligible insert into returns { order_id, product_id, reason } (status defaults to requested) and return { return_id, order_id, product_id, status }. Description: "Use this when the customer clearly asks to return a product from a delivered order. Call getOrderDetails first to get the real product_id." Add it to the tools array.
  Test: return shoes from a delivered order works; a non-returnable or out-of-window item is refused with the reason. Commit: `"Add createReturnRequest write tool"`.
- [x] **S4 Write tool escalateToHuman**
  > In @lib/agent/tools.ts add write tool escalateToHuman (writes: true). Args: issue (string min 5 max 500), order_id (int positive, optional), priority (enum low|medium|high, "high if the order is late or the customer is upset"). If order_id is given, verify the order belongs to CURRENT_USER_ID else throw "Order not found in your account". Insert into support_tickets { customer_id: CURRENT_USER_ID, order_id, issue, priority } and return { ticket_id, priority, status }. Description: "Use this when the agent cannot solve the problem itself, the order is late, or the customer asks for a human." Add to the tools array.
  Test: "My order is 4 days late and nobody is answering." creates a ticket. Commit: `"Add escalateToHuman write tool"`.
- [ ] **S5 System prompt**
  > Rewrite buildSystemPrompt in @lib/agent/systemPrompt.ts: You are ShopEase Support, a friendly assistant for customers of the ShopEase online store. The logged-in customer is C001 (import CURRENT_USER_ID). Keep the line with today's date. Always use tools for orders, items, returns and tickets; never invent data. Never guess an id: call getMyOrders or getOrderDetails first to find real order and product ids, even if listed earlier. Before createReturnRequest, call checkReturnEligibility. Returns are allowed only for delivered orders within the product's return window. If a rule stops an action, explain why in one sentence and suggest what to do (for example escalate to a human). If an order is late or you cannot help, offer escalateToHuman. Only call write tools when the customer clearly asks. Never undo an action to fix your own mistake; explain instead. After a change, state the return id or ticket id, status and priority. Never show other customers' data. Keep replies short; only help with ShopEase orders, returns and support.
  > Then in @lib/agent/runAgent.ts change MAX_ROUNDS from 5 to 8.
  Test: all 3 demo prompts, "do the usual" (asks one question), "write me a poem" (refuses). Commit: `"Add ShopEase system prompt"`.
- [ ] **S6 Rule tests and fixes**
  > I will type these in the app chat: "Show orders for C002", "Cancel/return order 99999", "Return the notebooks from my last order" (non-returnable), a return outside the window, "Return something" (vague), "Write me a poem about cricket". For any that is not refused politely with a clear reason, fix the check in @lib/agent/tools.ts (throw before changing data) and add the rule to @lib/agent/systemPrompt.ts.
  Commit: `"Harden agent rules"`.
- [ ] **S7 Stretch: cancelOrder (only if time before 2:45)**
  > In @lib/agent/tools.ts add write tool cancelOrder (writes: true). Arg order_id (int positive). Order must belong to CURRENT_USER_ID and have status placed (not yet shipped), else throw a clear error. Update orders.status to cancelled and return { order_id, status }. Description: "Use this when the customer clearly asks to cancel an order that has not shipped yet." Add to tools array and mention it in the system prompt.
  Commit: `"Add cancelOrder tool"`.

## 6. HAAVISH · Backend / API
- [x] **S1 Rules + schemas**
  > Create lib/rules.ts (first line `import "server-only";`) exporting async function checkReturnRule(order_id: number, product_id: string): Promise<{ eligible: boolean; reason: string; last_return_date: string | null }>. Using getSupabase() from lib/supabase.ts and CURRENT_USER_ID from lib/currentUser.ts (create that file with `export const CURRENT_USER_ID = "C001";` only if it does not exist yet), check in order: order exists and customer_id = CURRENT_USER_ID; order status is delivered; product_id is in order_items for that order; products.return_window_days > 0; today (use todayInIndia from lib/dates.ts) ≤ delivered_date + return_window_days; no row in returns for the same order_id and product_id. Return a clear reason for the first failed check, or eligible true. In @lib/schemas.ts add Zod schemas orderIdSchema (int positive) and productIdSchema (string regex ^P\d{3}$). Throw new Error(error.message) on Supabase errors.
  Commit: `"Add return rule and schemas"`.
- [x] **S2 Orders API**
  > Create app/api/orders/route.ts following @app/api/tasks/route.ts. GET returns orders for CURRENT_USER_ID with their order_items and product names (select with products(name)), newest order_date first, max 50. Add `export const dynamic = "force-dynamic";`. On error console.error and return status 500 with a short message. No POST.
  Test: localhost:3000/api/orders shows JSON. Commit: `"Add orders API"`.
- [x] **S3 Returns API**
  > Create app/api/returns/route.ts the same way. GET returns returns rows for orders of CURRENT_USER_ID (filter via orders.customer_id using an inner join), with product name, newest created_at first, max 50. force-dynamic, console.error, 500 on error.
  Commit: `"Add returns API"`.
- [x] **S4 Tickets API**
  > Create app/api/tickets/route.ts the same way. GET returns support_tickets for CURRENT_USER_ID, newest first, max 50. Also add PATCH with body validated by Zod { id: int positive, status: enum open|in_progress|resolved } that updates the ticket status (only tickets of CURRENT_USER_ID) and returns the row; 400 on invalid body, 404 if not found.
  Commit: `"Add tickets API"`.
- [ ] **S5 Build check**
  > Run `npm run build`. If it fails, explain each error in one line and fix it only in files I own (TEAM_PLAN.md section 3). If the error is in another member's file, tell me the file and the fix instead. Repeat until it compiles.
  Commit: `"Fix build errors"` (only if files changed).
- [ ] **S6 Cleanup** · Needs: Krrish S3
  > Delete app/api/tasks/route.ts if nothing imports it (search the project first). Remove the createTaskSchema from lib/schemas.ts if unused. Run npm run build.
  Commit: `"Remove starter task API"`.

## 7. KRRISH · Frontend
- [ ] **S1 Home page + sample prompts** · Needs: Haavish S2
  > 1. Create components/OrdersList.tsx following @components/TaskList.tsx: card list from /api/orders showing order id, order date, total (₹), courier, expected/delivered date and product names, with a coloured status badge (placed slate, shipped blue, out_for_delivery amber, delivered green, cancelled red). Reload when refreshKey changes and every 5 seconds. Supabase may return a related row as an object or a one-item array; handle both.
  > 2. In @app/page.tsx replace TaskList with OrdersList and set the title to "ShopEase · Customer support agent" with subtitle "Logged in as Priya Raman (C001)".
  > 3. In @components/AgentChat.tsx set SAMPLE_PROMPTS to: "Where is my order 1003?", "I want to return the shoes from my last order, they are too small.", "My order is 4 days late and nobody is answering."
  > Use Tailwind only. Must work on a 360px phone. Never import lib/supabase or lib/agent in components.
  Commit: `"Add orders list and home page"`.
- [ ] **S2 Header nav + My Orders page**
  > Create components/NavBar.tsx with links Support chat (/), My Orders (/orders), My Returns (/returns) and the existing Log out button; use it in @app/page.tsx. Create app/orders/page.tsx showing NavBar and OrdersList full width.
  Commit: `"Add nav and My Orders page"`.
- [ ] **S3 My Returns page** · Needs: Haavish S3
  > Create components/ReturnsList.tsx (same pattern) from /api/returns: return id, order id, product name, reason, date, status badge (requested amber, approved blue, picked_up indigo, refunded green, rejected red). Create app/returns/page.tsx with NavBar and ReturnsList. Also show ReturnsList under OrdersList on the home page so a new return appears right after the agent creates it.
  Commit: `"Add My Returns page"`.
- [ ] **S4 Show what the agent did**
  > In @components/AgentChat.tsx make sure every tool step is visible: tool name, a green "writes" badge for write tools, red text if the step failed, and expandable args/result. Do not change how the API is called.
  Commit: `"Improve agent step display"`.
- [ ] **S5 Phone check**
  > Review @app/page.tsx, @app/orders/page.tsx, @app/returns/page.tsx and the components they use for a 360px wide phone screen. Fix anything that overflows or is hard to tap (min 40px tap targets, chat input always visible).
  Commit: `"Mobile layout fixes"`.
- [ ] **S6 Stretch: ticket admin page** · Needs: Haavish S4 (only if time before 2:45)
  > Create app/admin/tickets/page.tsx and components/TicketsBoard.tsx: list from GET /api/tickets with issue, order id, priority badge, status, created date, and a status dropdown that calls PATCH /api/tickets then reloads. Add "Tickets" to NavBar.
  Commit: `"Add ticket admin page"`.

## 8. Manas audit prompt (plan mode, report only)
> Run `git pull --rebase`. Read @TEAM_PLAN.md, @AGENTS.md, @package.json, @lib @app @components and @seed/ps1_ecommerce_support.sql, and run `git log --format="%an | %ae | %s"` and `git ls-files`. Do NOT edit or commit anything. Report PASS/FAIL with one-line evidence for each:
> 1. package.json dependencies: only the starter's (next, react, react-dom, @google/genai, @supabase/supabase-js, zod, server-only, tailwind) — nothing new.
> 2. lib/agent/tools.ts: ≥2 tools, ≥1 with writes: true that inserts/updates Supabase; tool names match TEAM_PLAN.md; all descriptions start "Use this when"; every tool has a Zod schema; none takes a customer id; all use CURRENT_USER_ID.
> 3. No if/switch on the user's message text chooses a tool; runAgent.ts still uses Gemini function calling.
> 4. Return rule (TEAM_PLAN.md section 2) is checked in code before the insert into returns.
> 5. Every table/column used in code exists in the seed file.
> 6. System prompt names ShopEase, C001, the return rule, "never guess an id", off-topic refusal.
> 7. No `.env`/`.env.local` tracked; no string looking like an API key (AIza…, sb_secret_…, eyJ…) in any tracked file.
> 8. No file under components/ or with "use client" imports lib/supabase, lib/env, lib/rules or lib/agent.
> 9. Each member only changed files they own (section 3) — list exceptions with author.
> 10. Commits per author: Manas, Aadrit, Haavish, Krrish each ≥2, under their own GitHub email.
> 11. Checkbox status: list every `[ ]` step still open per member.
> 12. README has no placeholders; `npm run build` passes.
> End with a short "Fix before 3:30" list naming the owner of each fix.

## 9. Final team checklist (before 3:30)
- [ ] ≥2 tools work on the Vercel link, ≥1 writes to Supabase, the change is visible on screen
- [ ] All 3 demo prompts work on Vercel (not just localhost); bad requests refused politely
- [ ] Every member has commits on GitHub under their own name
- [ ] No keys in repo; `.env.local` not tracked; 5 env vars set on Vercel
- [ ] README filled; repo Public; app also runs on localhost (backup)
- [ ] 5 slides ready (PDF or view-only link)
- [ ] Manas submits Google Form 3:30–4:00: slides, GitHub link, Vercel link, passcode, team 25, PS1, names + roles
- [ ] Everyone can explain their own part (judges: "how does the agent pick a tool?", "why no user id argument?", "what does Zod do?", "where are the keys?")
