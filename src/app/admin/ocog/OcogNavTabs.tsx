"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin/ocog",               label: "Home" },
  { href: "/admin/ocog/pbn",           label: "PbN Approvals" },
  { href: "/admin/ocog/eoi",           label: "EoI Summary" },
  { href: "/admin/ocog/windows",       label: "EoI Windows" },
  { href: "/admin/ocog/duplicates",    label: "Duplicates" },
  { href: "/admin/ocog/audit",         label: "Audit Trail" },
  { href: "/admin/ocog/master",        label: "Master Allocations" },
];

export function OcogNavTabs() {
  const pathname = usePathname();
  return (
    <nav className="bg-white border-b border-gray-200 px-6">
      <div className="max-w-5xl mx-auto flex gap-0">
        {NAV.map(({ href, label }) => {
          const active = pathname === href || (href !== "/admin/ocog" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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
