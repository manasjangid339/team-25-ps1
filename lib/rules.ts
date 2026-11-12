import "server-only";
import { getSupabase } from "./supabase";
import { CURRENT_USER_ID } from "./currentUser";
import { todayInIndia } from "./dates";

export async function checkReturnRule(
  order_id: number,
  product_id: string
): Promise<{ eligible: boolean; reason: string; last_return_date: string | null }> {
  const supabase = getSupabase();

  // 1. Order exists and customer_id = CURRENT_USER_ID
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, customer_id, status, delivered_date")
    .eq("id", order_id)
    .maybeSingle();

  if (orderError) throw new Error(orderError.message);
  if (!order || order.customer_id !== CURRENT_USER_ID) {
    return {
      eligible: false,
      reason: `Order ${order_id} was not found in your account.`,
      last_return_date: null,
    };
  }

  // 2. Order status is delivered
  if (order.status !== "delivered") {
    return {
      eligible: false,
      reason: `Order ${order_id} has not been delivered yet (current status: ${order.status}). Returns are only allowed for delivered orders.`,
      last_return_date: null,
    };
  }

  // 3. Product is in order_items for that order
  const { data: item, error: itemError } = await supabase
    .from("order_items")
    .select("id, product_id")
    .eq("order_id", order_id)
    .eq("product_id", product_id)
    .maybeSingle();

  if (itemError) throw new Error(itemError.message);
  if (!item) {
    return {
      eligible: false,
      reason: `Product ${product_id} is not part of order ${order_id}.`,
      last_return_date: null,
    };
  }

  // 4. products.return_window_days > 0
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, name, return_window_days")
    .eq("id", product_id)
    .maybeSingle();

  if (productError) throw new Error(productError.message);
  if (!product) {
    return {
      eligible: false,
      reason: `Product ${product_id} was not found in the catalog.`,
      last_return_date: null,
    };
  }

  if (product.return_window_days <= 0) {
    return {
      eligible: false,
      reason: `Product ${product.name} (${product_id}) is non-returnable.`,
      last_return_date: null,
    };
  }

  // 5. today <= delivered_date + return_window_days
  if (!order.delivered_date) {
    return {
      eligible: false,
      reason: `Order ${order_id} does not have a recorded delivery date.`,
      last_return_date: null,
    };
  }

  const [y, m, d] = order.delivered_date.split("-").map(Number);
  const delDate = new Date(Date.UTC(y, m - 1, d));
  delDate.setUTCDate(delDate.getUTCDate() + product.return_window_days);
  const last_return_date = delDate.toISOString().slice(0, 10);
  const today = todayInIndia();

  if (today > last_return_date) {
    return {
      eligible: false,
      reason: `The return window for product ${product.name} (${product_id}) closed on ${last_return_date} (delivered on ${order.delivered_date}).`,
      last_return_date,
    };
  }

  // 6. No row in returns for the same order_id and product_id
  const { data: existingReturn, error: returnError } = await supabase
    .from("returns")
    .select("id, status")
    .eq("order_id", order_id)
    .eq("product_id", product_id)
    .maybeSingle();

  if (returnError) throw new Error(returnError.message);
  if (existingReturn) {
    return {
      eligible: false,
      reason: `A return request for product ${product_id} in order ${order_id} has already been submitted (status: ${existingReturn.status}).`,
      last_return_date,
    };
  }

  return {
    eligible: true,
    reason: `Product ${product.name} (${product_id}) from order ${order_id} is eligible for return until ${last_return_date}.`,
    last_return_date,
  };
}

