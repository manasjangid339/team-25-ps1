# ShopEase: E-commerce Customer Support Agent

Team 25 | PS1 | SRM Agentic AI Hackathon

## The problem

Online-store customers wait hours for simple answers about order status, returns, and late deliveries. Support teams spend all day answering the same repetitive order and policy questions by hand.

## What our app does

- Answers customer questions in plain English for logged-in customer Priya Raman (`C001`) using Gemini function calling.
- Checks real-time order status, tracking details, items, and how many days an order is late from Supabase.
- Enforces ShopEase's return policy in code (delivered orders only, within `return_window_days`, no duplicate returns) before creating a return request.
- Escalates late orders or unresolved issues by creating a prioritized support ticket for a human agent, and supports cancelling unshipped (`placed`) orders.
- Displays live Orders, Returns, and Ticket Admin views alongside the chat so every database change appears on screen.

## Live demo

- Vercel link: https://team-25-ps1.vercel.app
- Passcode: `team25ps1`
- Try: `"I want to return the shoes from my last order, they are too small."`

## Agent tools

| Tool | What it does | Reads or writes |
| --- | --- | --- |
| `getMyOrders` | Use this when the customer asks to see their orders, order list, or order history. Returns orders for the logged-in customer. | Reads |
| `getOrderDetails` | Use this when the customer asks for details, items, courier, delivery status, or tracking for a specific order number. | Reads |
| `checkReturnEligibility` | Use this when checking if an item or product from an order is eligible for return before creating a return request. | Reads |
| `createReturnRequest` | Use this when the customer clearly asks to return a product from a delivered order. Call `getOrderDetails` first to get the real `product_id`. | Writes |
| `escalateToHuman` | Use this when the agent cannot solve the problem itself, the order is late, or the customer asks for a human. | Writes |
| `cancelOrder` | Use this when the customer clearly asks to cancel an order that has not shipped yet. | Writes |

## Database tables

- `customers`: Customer profiles (`id`, `name`, `email`, `phone`, `city`)
- `products`: Product catalog with `price` and `return_window_days` (`0` = non-returnable)
- `orders`: Customer orders with `status`, `expected_delivery`, `delivered_date`, `total_amount`, `courier`, `tracking_number`
- `order_items`: Order line items linking `orders` and `products` with `quantity` and `unit_price`
- `returns`: Return requests with `reason` and `status` (`requested`, `approved`, `picked_up`, `refunded`, `rejected`)
- `support_tickets`: Human-escalated support tickets with `issue`, `priority`, and `status`

## Tech stack

Next.js, React, TypeScript, Tailwind CSS, Supabase, Gemini API (function calling), Zod, Vercel

## Team

| Name | Role |
| --- | --- |
| Manas | Team Lead + Database |
| Aadrit | AI / Agent |
| Haavish | Backend / API |
| Krrish | Frontend |

## Run it locally

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in the keys
3. `npm run dev`
