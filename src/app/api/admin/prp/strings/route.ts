/**
 * POST /api/admin/prp/strings
 * Save a draft content string for a section/key/language.
 * Body: { section, key, language, value }
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { contentStrings } from "@/db/schema";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.additionalRoles?.includes("prp_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { section?: string; key?: string; language?: string; value?: string };
  const { section, key, language, value } = body;

  if (!section || !key || !language || value === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: contentStrings.id })
    .from(contentStrings)
    .where(and(
      eq(contentStrings.section, section),
      eq(contentStrings.key, key),
      eq(contentStrings.language, language),
    ));

  if (existing) {
    await db.update(contentStrings)
      .set({ value, status: "draft", updatedAt: new Date(), updatedBy: session.userId })
      .where(eq(contentStrings.id, existing.id));
  } else {
    await db.insert(contentStrings).values({
      section, key, language, value,
      status: "draft",
      updatedBy: session.userId,
    });
  }

  return NextResponse.json({ ok: true });
}
