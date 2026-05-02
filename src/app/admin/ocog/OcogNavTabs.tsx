"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminStrings } from "@/lib/i18n/admin";

type NavStrings = AdminStrings["nav"];

export function OcogNavTabs({ showPrpAdmin = false, nav }: { showPrpAdmin?: boolean; nav: NavStrings }) {
  const pathname = usePathname();
  const NAV = [
    { href: "/admin/ocog",            label: nav.dashboard },
    { href: "/admin/ocog/pbn",        label: nav.pbn_approvals },
    { href: "/admin/ocog/eoi",        label: nav.eoi_summary },
    { href: "/admin/ocog/windows",    label: nav.eoi_windows },
    { href: "/admin/ocog/duplicates", label: nav.duplicates },
    { href: "/admin/ocog/audit",      label: nav.audit_trail },
    { href: "/admin/ocog/master",     label: nav.master_alloc },
  ];
  const fullNav = showPrpAdmin ? [...NAV, { href: "/admin/prp", label: nav.prp_admin }] : NAV;
  return (
    <nav className="bg-white border-b border-gray-200 px-6">
      <div className="max-w-5xl mx-auto flex gap-0">
        {fullNav.map(({ href, label }) => {
          const active = pathname === href || (href !== "/admin/ocog" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue ${
                active
                  ? "border-brand-blue text-brand-blue"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
