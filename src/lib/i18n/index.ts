import { en, type TranslationKey } from "./en";
import { fr } from "./fr";
import { es } from "./es";

export type { TranslationKey };

export type Lang = "en" | "fr" | "es";

export function makeT(lang: Lang, volumeOverrides: Record<string, string> = {}): (key: TranslationKey) => string {
  const base: Record<string, string> = lang === "fr" ? fr : lang === "es" ? es : en;
  return (key: TranslationKey) => volumeOverrides[key] ?? base[key] ?? en[key] ?? key;
}

export function parseLang(raw: string | undefined): Lang {
  if (raw === "fr") return "fr";
  if (raw === "es") return "es";
  return "en";
}
