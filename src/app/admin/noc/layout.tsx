"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin/noc", label: "EoI Queue" },
  { href: "/admin/noc/pbn", label: "PbN Allocations" },
  { href: "/admin/noc/enr", label: "ENR Requests" },
];

export default function NocLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen">
      <nav className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-5xl mx-auto flex gap-0">
          {NAV.map(({ href, label }) => {
            // Active if exact match or (for non-root) pathname starts with href
            const active = href === "/admin/noc"
              ? pathname === "/admin/noc" || pathname.startsWith("/admin/noc/") && !pathname.startsWith("/admin/noc/pbn")
              : pathname.startsWith(href);
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
      <div>{children}</div>
    </div>
  );
}
