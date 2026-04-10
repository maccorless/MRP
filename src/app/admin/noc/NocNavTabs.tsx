"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin/noc/home",        label: "Home" },
  { href: "/admin/noc/queue",       label: "EoI Queue" },
  { href: "/admin/noc/fast-track",  label: "Fast-Track Entry" },
  { href: "/admin/noc/pbn",         label: "PbN Allocations" },
  { href: "/admin/noc/enr",         label: "ENR Requests" },
  { href: "/admin/noc/settings",    label: "Settings" },
  { href: "/admin/noc/audit",       label: "Audit Trail" },
  { href: "/admin/noc/help",        label: "Help & Guide" },
];

export function NocNavTabs() {
  const pathname = usePathname();
  return (
    <nav className="bg-white border-b border-gray-200 px-6">
      <div className="max-w-5xl mx-auto flex gap-0">
        {NAV.map(({ href, label }) => {
          const active = pathname === href || (href !== "/admin/noc/home" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                active
                  ? "border-[#0057A8] text-[#0057A8]"
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
