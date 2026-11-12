"use client";

import NavBar from "@/components/NavBar";
import ReturnsList from "@/components/ReturnsList";
import { ThemeProvider } from "@/components/ThemeProvider";

/**
 * Full-width My Returns page showing live return requests from /api/returns.
 */
export default function ReturnsPage() {
  return (
    <ThemeProvider>
      <main className="mx-auto max-w-6xl p-3 sm:p-4 md:p-6">
        <NavBar />
        <ReturnsList refreshKey={0} />
      </main>
    </ThemeProvider>
  );
}
