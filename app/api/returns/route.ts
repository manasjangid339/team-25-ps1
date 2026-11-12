import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { CURRENT_USER_ID } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("returns")
      .select(`
        id,
        order_id,
        product_id,
        reason,
        status,
        created_at,
        orders!inner (
          customer_id
        ),
        products (
          name
        )
      `)
      .eq("orders.customer_id", CURRENT_USER_ID)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching returns:", error);
      return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
    }

    return NextResponse.json({ returns: data });
  } catch (err) {
    console.error("Unexpected error in GET /api/returns:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

