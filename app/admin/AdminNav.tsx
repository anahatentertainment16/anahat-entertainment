"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, Briefcase, Globe, LayoutDashboard, ListChecks, Receipt, Users, Wallet } from "lucide-react";

const ICONS = { overview: LayoutDashboard, clients: Briefcase, todos: ListChecks, site: Globe, staff: Users, archive: Archive, invoices: Receipt, payouts: Wallet };

export type NavItem = { href: string; title: string; icon: keyof typeof ICONS; count?: number; flag?: boolean };

// Sidebar on desktop, a scrollable strip on mobile. Active = exact match for Overview, prefix for the rest.
export default function AdminNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {items.map((item) => {
          const active = item.href === "/admin" ? path === "/admin" : path.startsWith(item.href);
          const Icon = ICONS[item.icon];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 whitespace-nowrap rounded-full px-4 py-2 text-sm transition-colors ${active ? "bg-ink text-paper" : "text-ink hover:bg-surface"}`}
              >
                <Icon size={16} strokeWidth={1.75} className="shrink-0" />
                <span className="flex-1">{item.title}</span>
                {!!item.count && (
                  <span className={`rounded-full px-2 py-0.5 font-mono text-xs ${item.flag ? "bg-accent text-on-accent" : active ? "text-paper/70" : "text-muted"}`}>{item.count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
