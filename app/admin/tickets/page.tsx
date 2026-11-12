"use client";

import NavBar from "@/components/NavBar";
import { ThemeProvider } from "@/components/ThemeProvider";
import TicketsBoard from "@/components/TicketsBoard";

/**
 * Full-width ticket admin page backed by GET/PATCH /api/tickets.
 */
export default function AdminTicketsPage() {
  return (
    <ThemeProvider>
      <main className="mx-auto max-w-6xl p-3 sm:p-4 md:p-6">
        <NavBar />
        <TicketsBoard />
      </main>
    </ThemeProvider>
  );
}
