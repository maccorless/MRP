import { readFileSync } from "fs";
import path from "path";
import { en, type TranslationKey } from "./en";
import { fr } from "./fr";
import { es } from "./es";

export type { TranslationKey };

export type Lang = "en" | "fr" | "es";

const VOLUME_PATH = process.env.CONTENT_VOLUME_PATH ?? "/data/i18n";

function loadVolumeStrings(lang: Lang): Record<string, string> {
  try {
    const filePath = path.join(VOLUME_PATH, `${lang}.json`);
    const raw = readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function makeT(lang: Lang): (key: TranslationKey) => string {
  const base: Record<string, string> = lang === "fr" ? fr : lang === "es" ? es : en;
  const volume = loadVolumeStrings(lang);
  return (key: TranslationKey) => volume[key] ?? base[key] ?? en[key] ?? key;
}

export function parseLang(raw: string | undefined): Lang {
  if (raw === "fr") return "fr";
  if (raw === "es") return "es";
  return "en";
}
