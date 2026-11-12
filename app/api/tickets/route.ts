import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabase } from "@/lib/supabase";
import { CURRENT_USER_ID } from "@/lib/currentUser";

export const dynamic = "force-dynamic";

const patchTicketSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(["open", "in_progress", "resolved"]),
});

export async function GET() {
  try {
    const { data, error } = await getSupabase()
      .from("support_tickets")
      .select("id, customer_id, order_id, issue, priority, status, created_at")
      .eq("customer_id", CURRENT_USER_ID)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching tickets:", error);
      return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
    }

    return NextResponse.json({ tickets: data });
  } catch (err) {
    console.error("Unexpected error in GET /api/tickets:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = patchTicketSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid ticket update body", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { id, status } = parsed.data;

    const { data, error } = await getSupabase()
      .from("support_tickets")
      .update({ status })
      .eq("id", id)
      .eq("customer_id", CURRENT_USER_ID)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error updating ticket:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: `Ticket ${id} not found in your account` }, { status: 404 });
    }

    return NextResponse.json({ ticket: data });
  } catch (err) {
    console.error("Unexpected error in PATCH /api/tickets:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
