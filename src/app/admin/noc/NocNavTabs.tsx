"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminStrings } from "@/lib/i18n/admin";

type NavStrings = AdminStrings["nav"];

export function NocNavTabs({
  showPrpAdmin = false,
  nav,
}: {
  showPrpAdmin?: boolean;
  nav: NavStrings;
}) {
  const pathname = usePathname();

  const tabs = [
    { href: "/admin/noc/home",         label: nav.dashboard },
    { href: "/admin/noc/queue",        label: nav.eoi_queue },
    { href: "/admin/noc/direct-entry", label: nav.direct_entry },
    { href: "/admin/noc/invite",       label: nav.invite_org },
    { href: "/admin/noc/pbn",          label: nav.pbn },
    { href: "/admin/noc/enr",          label: nav.enr },
    { href: "/admin/noc/audit",        label: nav.audit_trail },
  ];

  const fullTabs = showPrpAdmin
    ? [...tabs, { href: "/admin/prp", label: nav.prp_admin }]
    : tabs;

  return (
    <nav className="bg-white border-b border-gray-200 px-6">
      <div className="max-w-5xl mx-auto flex gap-0">
        {fullTabs.map(({ href, label }) => {
          const active = pathname === href || (href !== "/admin/noc/home" && pathname.startsWith(href));
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
