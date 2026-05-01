"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin/noc/home",        label: "Home" },
  { href: "/admin/noc/queue",       label: "EoI Queue" },
  { href: "/admin/noc/direct-entry",  label: "Direct Entry" },
  { href: "/admin/noc/invite",      label: "Invite Org" },
  { href: "/admin/noc/pbn",         label: "PbN Allocations" },
  { href: "/admin/noc/enr",         label: "ENR Requests" },
  { href: "/admin/noc/audit",       label: "Audit Trail" },
];

export function NocNavTabs({ showPrpAdmin = false }: { showPrpAdmin?: boolean }) {
  const pathname = usePathname();
  const fullNav = showPrpAdmin ? [...NAV, { href: "/admin/prp", label: "PRP Admin" }] : NAV;
  return (
    <nav className="bg-white border-b border-gray-200 px-6">
      <div className="max-w-5xl mx-auto flex gap-0">
        {fullNav.map(({ href, label }) => {
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
