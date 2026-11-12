import "server-only";
import { z } from "zod";
import { defineTool, type AgentTool } from "./defineTool";
import { getSupabase } from "../supabase";
import { CURRENT_USER_ID } from "../currentUser";
import { todayInIndia } from "../dates";
import { checkReturnRule } from "../rules";

export const getMyOrders = defineTool({
  name: "getMyOrders",
  description:
    "Use this when the customer asks to see their orders, order list, or order history. Returns orders for the logged-in customer.",
  schema: z.object({}),
  run: async () => {
    const { data, error } = await getSupabase()
      .from("orders")
      .select("id, order_date, status, expected_delivery, delivered_date, total_amount, courier, tracking_number")
      .eq("customer_id", CURRENT_USER_ID)
      .order("order_date", { ascending: false })
      .limit(20);

    if (error) throw new Error(error.message);
    return { count: data.length, orders: data };
  },
});

export const getOrderDetails = defineTool({
  name: "getOrderDetails",
  description:
    "Use this when the customer asks for details, items, courier, delivery status, or tracking for a specific order number.",
  schema: z.object({
    order_id: z.number().int().positive().describe("order number, for example 1003"),
  }),
  run: async ({ order_id }) => {
    const supabase = getSupabase();

    const { data: order, error: orderErr } = await supabase
      .from("orders")
      .select("id, customer_id, order_date, status, expected_delivery, delivered_date, total_amount, courier, tracking_number")
      .eq("id", order_id)
      .maybeSingle();

    if (orderErr) throw new Error(orderErr.message);
    if (!order || order.customer_id !== CURRENT_USER_ID) {
      throw new Error(`Order ${order_id} was not found in your account`);
    }

    const { data: items, error: itemsErr } = await supabase
      .from("order_items")
      .select("product_id, quantity, unit_price, products(name, category, return_window_days)")
      .eq("order_id", order_id);

    if (itemsErr) throw new Error(itemsErr.message);

    const today = todayInIndia();
    let days_late = 0;
    if (
      order.status !== "delivered" &&
      order.status !== "cancelled" &&
      order.expected_delivery &&
      today > order.expected_delivery
    ) {
      const [ey, em, ed] = order.expected_delivery.split("-").map(Number);
      const [ty, tm, td] = today.split("-").map(Number);
      const expUtc = Date.UTC(ey, em - 1, ed);
      const todayUtc = Date.UTC(ty, tm - 1, td);
      const diff = Math.floor((todayUtc - expUtc) / (1000 * 60 * 60 * 24));
      days_late = diff > 0 ? diff : 0;
    }

    const formattedItems = (items ?? []).map((item) => {
      const prod = Array.isArray(item.products) ? item.products[0] : item.products;
      return {
        product_id: item.product_id,
        name: prod?.name ?? "Unknown",
        category: prod?.category ?? "Unknown",
        quantity: item.quantity,
        unit_price: item.unit_price,
        return_window_days: prod?.return_window_days ?? 0,
      };
    });

    return {
      order_id: order.id,
      order_date: order.order_date,
      status: order.status,
      expected_delivery: order.expected_delivery,
      delivered_date: order.delivered_date,
      total_amount: order.total_amount,
      courier: order.courier,
      tracking_number: order.tracking_number,
      days_late,
      items: formattedItems,
    };
  },
});

export const checkReturnEligibility = defineTool({
  name: "checkReturnEligibility",
  description:
    "Use this when checking if an item or product from an order is eligible for return before creating a return request.",
  schema: z.object({
    order_id: z.number().int().positive().describe("order number, for example 1003"),
    product_id: z.string().describe("product id like P101"),
  }),
  run: async ({ order_id, product_id }) => {
    return await checkReturnRule(order_id, product_id);
  },
});

/** Every tool in this list is given to Gemini. */
export const tools: AgentTool[] = [getMyOrders, getOrderDetails, checkReturnEligibility];
