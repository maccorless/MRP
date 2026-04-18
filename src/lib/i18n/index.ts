/**
 * Lightweight i18n for the public /apply form.
 *
 * Usage:
 *   const t = useTranslations();
 *   t("apply.title")  // → "Apply for Media Accreditation" | "Demander une accréditation média"
 *
 * Language is determined by the `lang` URL search param (?lang=fr).
 * English is the default.
 */

"use client";

import { createContext, useContext, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { en, type TranslationKey } from "./en";
import { fr } from "./fr";

export type { TranslationKey };

export type Lang = "en" | "fr";

const dictionaries: Record<Lang, Record<TranslationKey, string>> = {
  en,
  fr,
};

/** Resolve the active language from URL search params. Falls back to "en". */
export function resolveLang(searchParams: URLSearchParams): Lang {
  const raw = searchParams.get("lang");
  if (raw === "fr") return "fr";
  return "en";
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const LangContext = createContext<Lang>("en");

/** Access the current language string (e.g. to pass to server components via props). */
export function useLang(): Lang {
  return useContext(LangContext);
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns a `t` translate function scoped to the current language.
 *
 * In client components, reads the `lang` search param directly via
 * `useSearchParams()` so language changes are reactive.
 *
 * Falls back gracefully to the English string if a key is missing in `fr`.
 */
export function useTranslations(): (key: TranslationKey) => string {
  const searchParams = useSearchParams();
  const lang = resolveLang(searchParams);

  return useMemo(() => {
    const dict = dictionaries[lang];
    return (key: TranslationKey) => dict[key] ?? en[key] ?? key;
  }, [lang]);
}

/**
 * Server-side translate helper — call with a `lang` value derived from
 * request search params (passed down as a prop from a server component).
 */
export function makeT(lang: Lang): (key: TranslationKey) => string {
  const dict = dictionaries[lang];
  return (key: TranslationKey) => dict[key] ?? en[key] ?? key;
}

/** Resolve a Lang from a raw string (safe to call anywhere). */
export function parseLang(raw: string | undefined): Lang {
  if (raw === "fr") return "fr";
  return "en";
}
