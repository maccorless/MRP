import { cookies } from "next/headers";
import type { Lang } from "@/lib/i18n";

const COOKIE_NAME = "admin_lang";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Read the admin language preference from the request cookie. Defaults to "en". */
export async function getAdminLang(): Promise<Lang> {
  const store = await cookies();
  const val = store.get(COOKIE_NAME)?.value;
  if (val === "fr" || val === "es") return val;
  return "en";
}

/** Set the admin_lang cookie (call from server actions). */
export async function setAdminLangCookie(lang: Lang): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, lang, {
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
  });
}

/** Convert DB enum value ("EN"/"FR"/"ES") to app Lang ("en"/"fr"/"es"). */
export function dbLangToLang(dbVal: string | null | undefined): Lang {
  if (dbVal === "FR") return "fr";
  if (dbVal === "ES") return "es";
  return "en";
}

/** Convert app Lang to DB enum value. */
export function langToDbLang(lang: Lang): "EN" | "FR" | "ES" {
  if (lang === "fr") return "FR";
  if (lang === "es") return "ES";
  return "EN";
}
