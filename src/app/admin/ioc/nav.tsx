"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin/ioc", label: "Dashboard" },
  { href: "/admin/ioc/master", label: "Master Allocations" },
  { href: "/admin/ioc/quotas", label: "Quotas" },
  { href: "/admin/ioc/direct", label: "IOC Direct" },
  { href: "/admin/ioc/enr", label: "ENR Review" },
  { href: "/admin/ioc/orgs", label: "Org Directory" },
  { href: "/admin/ioc/audit", label: "Audit Trail" },
  { href: "/admin/ioc/export", label: "PBN Export" },
  { href: "/admin/ioc/flags", label: "Flags" },
];

export function IocNav() {
  const pathname = usePathname();
  return (
    <nav className="bg-white border-b border-gray-200 px-6">
      <div className="max-w-6xl mx-auto flex gap-0">
        {NAV.map(({ href, label }) => {
          const active = href === "/admin/ioc"
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
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
