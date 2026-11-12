"use client";

import NavBar from "@/components/NavBar";
import OrdersList from "@/components/OrdersList";

/**
 * Full-width My Orders page showing live orders from /api/orders.
 */
export default function OrdersPage() {
  return (
    <main className="mx-auto max-w-6xl p-3 sm:p-4 md:p-6">
      <NavBar />
      <OrdersList refreshKey={0} />
    </main>
  );
}
