// Server-only: do not import from client components.
// Uses Node.js fs to merge published CMS strings from the Railway volume over bundled defaults.
import { readFileSync } from "fs";
import path from "path";
import { makeT, parseLang, type Lang, type TranslationKey } from ".";

export type { TranslationKey, Lang };
export { parseLang };

const VOLUME_PATH = process.env.CONTENT_VOLUME_PATH ?? "/data/i18n";

function loadVolumeStrings(lang: Lang): Record<string, string> {
  try {
    const raw = readFileSync(path.join(VOLUME_PATH, `${lang}.json`), "utf-8");
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function makeServerT(lang: Lang): (key: TranslationKey) => string {
  return makeT(lang, loadVolumeStrings(lang));
}
