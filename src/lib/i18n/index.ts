import { en, type TranslationKey } from "./en";
import { fr } from "./fr";
import { es } from "./es";

export type { TranslationKey };

export type Lang = "en" | "fr" | "es";

const dictionaries: Record<Lang, Record<TranslationKey, string>> = {
  en,
  fr,
  es,
};

export function makeT(lang: Lang): (key: TranslationKey) => string {
  const dict = dictionaries[lang];
  return (key: TranslationKey) => dict[key] ?? en[key] ?? key;
}

export function parseLang(raw: string | undefined): Lang {
  if (raw === "fr") return "fr";
  if (raw === "es") return "es";
  return "en";
}
