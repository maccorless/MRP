import type { Lang } from "@/lib/i18n";
import { en } from "./en";
import type { AdminStrings } from "./en";
import { fr } from "./fr";
import { es } from "./es";

const translations: Record<Lang, AdminStrings> = { en, fr, es };

export function t(lang: Lang): AdminStrings {
  return translations[lang] ?? en;
}

export type { AdminStrings };
