"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import type { Lang } from "@/lib/i18n";

/**
 * EN | FR language toggle for the public /apply form.
 * Switches language by setting the `?lang=` URL search param,
 * preserving all other params so form state is not lost.
 */
export function LanguageToggle() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const current: Lang = searchParams.get("lang") === "fr" ? "fr" : "en";

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

  return (
    <div className="flex items-center gap-1 text-xs" role="group" aria-label="Language">
      <button
        type="button"
        onClick={() => switchTo("en")}
        aria-pressed={current === "en"}
        className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
          current === "en"
            ? "bg-white/20 text-white"
            : "text-blue-200 hover:text-white"
        }`}
      >
        EN
      </button>
      <span className="text-blue-300" aria-hidden="true">|</span>
      <button
        type="button"
        onClick={() => switchTo("fr")}
        aria-pressed={current === "fr"}
        className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
          current === "fr"
            ? "bg-white/20 text-white"
            : "text-blue-200 hover:text-white"
        }`}
      >
        FR
      </button>
    </div>
  );
}
