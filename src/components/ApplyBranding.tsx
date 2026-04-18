"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { makeT, parseLang } from "@/lib/i18n";
import { LanguageToggle } from "@/components/LanguageToggle";

export function ApplyHeader() {
  const sp = useSearchParams();
  const lang = parseLang(sp.get("lang") ?? undefined);
  const t = makeT(lang);
  const statusHref = lang === "fr" ? "/apply/status?lang=fr" : "/apply/status";

  return (
    <header className="bg-brand-blue text-white px-6 py-4">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center shrink-0">
            <span className="font-bold text-sm">P</span>
          </div>
          <div>
            <div className="font-semibold text-sm leading-tight">
              {t("layout.header.title")}
            </div>
            <div className="text-xs text-blue-200 leading-tight">
              {t("layout.header.subtitle")}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <Link href={statusHref} className="text-xs text-blue-200 hover:text-white transition-colors">
            {t("layout.header.checkStatus")}
          </Link>
        </div>
      </div>
    </header>
  );
}

export function ApplyFooter() {
  const sp = useSearchParams();
  const lang = parseLang(sp.get("lang") ?? undefined);
  const t = makeT(lang);

  return (
    <footer className="px-6 py-4 text-center text-xs text-gray-600 border-t border-gray-200">
      {t("layout.footer")}
    </footer>
  );
}
