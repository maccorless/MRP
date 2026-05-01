"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { logout } from "@/app/admin/login/actions";

export default function AppHeader({
  displayName,
  roleLabel,
  additionalRoleLabels = [],
  helpPath,
  helpAnchors,
  actions,
}: {
  displayName: string;
  roleLabel: string;
  additionalRoleLabels?: string[];
  helpPath?: string;
  helpAnchors?: Record<string, string>;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();
  const anchor = helpAnchors?.[pathname] ?? "";
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const allRoles = [roleLabel, ...additionalRoleLabels];

  return (
    <header className="bg-brand-blue">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white/15 border border-white/20 rounded-md flex items-center justify-center">
            <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
              <circle cx="5" cy="8" r="3.25" stroke="white" strokeWidth="1.25"/>
              <circle cx="11" cy="8" r="3.25" stroke="white" strokeWidth="1.25"/>
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-white leading-tight">Press Registration Portal</div>
            <div className="text-xs text-white/90 leading-tight">LA 2028</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {actions}
          {helpPath && (
            <Link
              href={helpPath + (anchor ? "#" + anchor : "")}
              className="text-xs text-white/75 hover:text-white transition-colors"
            >
              ? Help
            </Link>
          )}

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-1 text-sm text-white/85 hover:text-white transition-colors cursor-pointer"
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              {displayName}
              <svg className="w-3 h-3 text-white/60" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Roles</p>
                  {allRoles.map((r) => (
                    <p key={r} className="text-xs font-medium text-gray-700">{r}</p>
                  ))}
                </div>
                <form action={logout} className="px-1 pt-1">
                  <button
                    type="submit"
                    className="w-full text-left px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
