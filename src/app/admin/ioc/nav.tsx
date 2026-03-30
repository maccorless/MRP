"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin/ioc", label: "Dashboard" },
  { href: "/admin/ioc/orgs", label: "Org Directory" },
  { href: "/admin/ioc/audit", label: "Audit Trail" },
  { href: "/admin/ioc/export", label: "PBN Export" },
];

export function IocNav() {
  const pathname = usePathname();
  return (
    <nav className="bg-white border-b border-gray-200 px-6">
      <div className="max-w-6xl mx-auto flex gap-0">
        {NAV.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
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
