"use server";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { getSession } from "@/lib/session";
import { setAdminLangCookie, langToDbLang } from "@/lib/admin-lang";
import type { Lang } from "@/lib/i18n";

export async function setAdminLanguage(lang: Lang): Promise<void> {
  const session = await getSession();
  if (!session) return;

  await db
    .update(adminUsers)
    .set({ preferredLanguage: langToDbLang(lang) })
    .where(eq(adminUsers.id, session.userId));

  await setAdminLangCookie(lang);
}
