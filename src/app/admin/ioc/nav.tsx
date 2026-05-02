"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AdminStrings } from "@/lib/i18n/admin";

type NavStrings = AdminStrings["nav"];

export function IocNav({ showPrpAdmin = false, nav }: { showPrpAdmin?: boolean; nav: NavStrings }) {
  const pathname = usePathname();
  const NAV = [
    { href: "/admin/ioc",        label: nav.dashboard },
    { href: "/admin/ioc/master", label: nav.master_alloc },
    { href: "/admin/ioc/quotas", label: nav.quotas },
    { href: "/admin/ioc/direct", label: nav.ioc_direct },
    { href: "/admin/ioc/enr",    label: nav.enr },
    { href: "/admin/ioc/orgs",   label: nav.org_directory },
    { href: "/admin/ioc/audit",  label: nav.audit_trail },
    { href: "/admin/ioc/export", label: nav.pbn_export },
  ];
  const fullNav = showPrpAdmin ? [...NAV, { href: "/admin/prp", label: nav.prp_admin }] : NAV;
  return (
    <nav className="bg-white border-b border-gray-200 px-6">
      <div className="max-w-6xl mx-auto flex gap-0">
        {fullNav.map(({ href, label }) => {
          const active = href === "/admin/ioc"
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
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
