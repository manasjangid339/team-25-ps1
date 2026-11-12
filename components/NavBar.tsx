"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "Support chat" },
  { href: "/orders", label: "My Orders" },
  { href: "/returns", label: "My Returns" },
  { href: "/admin/tickets", label: "Tickets" },
];

/**
 * Shared top navigation bar for ShopEase pages with route links and logout.
 */
export default function NavBar() {
  const pathname = usePathname();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <header className="mb-3 space-y-2.5 border-b border-slate-200 pb-3 sm:mb-4 sm:space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-semibold leading-snug sm:text-xl">ShopEase · Customer support agent</h1>
          <p className="text-xs text-slate-500 sm:text-sm">Logged in as Priya Raman (C001)</p>
        </div>
        <button
          onClick={logout}
          className="min-h-[44px] shrink-0 rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        >
          Log out
        </button>
      </div>

      <nav aria-label="Primary" className="flex flex-wrap items-center gap-2">
        {NAV_LINKS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "inline-flex min-h-[44px] items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white"
                  : "inline-flex min-h-[44px] items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
