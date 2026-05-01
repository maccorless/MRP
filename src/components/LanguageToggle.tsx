"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";

export function LanguageToggle() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const raw = searchParams.get("lang");
  const current: Lang = raw === "fr" ? "fr" : raw === "es" ? "es" : "en";

  function switchTo(lang: Lang) {
    const params = new URLSearchParams(searchParams.toString());
    if (lang === "en") {
      params.delete("lang");
    } else {
      params.set("lang", lang);
    }
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }

  const langs: { code: Lang; label: string }[] = [
    { code: "en", label: "EN" },
    { code: "fr", label: "FR" },
    { code: "es", label: "ES" },
  ];

  return (
    <div className="flex items-center gap-1 text-xs" role="group" aria-label="Language">
      {langs.map(({ code, label }, i) => (
        <span key={code} className="contents">
          {i > 0 && <span className="text-blue-300" aria-hidden="true">|</span>}
          <button
            type="button"
            onClick={() => switchTo(code)}
            aria-pressed={current === code}
            className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
              current === code
                ? "bg-white/20 text-white"
                : "text-blue-200 hover:text-white"
            }`}
          >
            {label}
          </button>
        </span>
      ))}
    </div>
  );
}
