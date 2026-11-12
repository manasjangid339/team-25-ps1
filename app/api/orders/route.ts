import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { CURRENT_USER_ID } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("orders")
      .select(`
        id,
        customer_id,
        order_date,
        status,
        expected_delivery,
        delivered_date,
        total_amount,
        courier,
        tracking_number,
        order_items (
          id,
          product_id,
          quantity,
          unit_price,
          products (
            name
          )
        )
      `)
      .eq("customer_id", CURRENT_USER_ID)
      .order("order_date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching orders:", error);
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }

    return NextResponse.json({ orders: data });
  } catch (err) {
    console.error("Unexpected error in GET /api/orders:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

