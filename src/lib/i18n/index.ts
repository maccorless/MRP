import { en, type TranslationKey } from "./en";
import { fr } from "./fr";

export type { TranslationKey };

export type Lang = "en" | "fr";

const dictionaries: Record<Lang, Record<TranslationKey, string>> = {
  en,
  fr,
};

export function resolveLang(searchParams: URLSearchParams): Lang {
  const raw = searchParams.get("lang");
  if (raw === "fr") return "fr";
  return "en";
}

export function makeT(lang: Lang): (key: TranslationKey) => string {
  const dict = dictionaries[lang];
  return (key: TranslationKey) => dict[key] ?? en[key] ?? key;
}

export function parseLang(raw: string | undefined): Lang {
  if (raw === "fr") return "fr";
  return "en";
}
