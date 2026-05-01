/**
 * POST /api/admin/prp/publish
 * Publish all draft strings for a (section, language) pair.
 * Writes merged JSON to the Railway persistent volume at CONTENT_VOLUME_PATH.
 * Body: { section, language }
 */

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";
import { db } from "@/db";
import { contentStrings, sectionPublishState } from "@/db/schema";
import { getSession } from "@/lib/session";

const VOLUME_PATH = process.env.CONTENT_VOLUME_PATH ?? "/data/i18n";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session?.additionalRoles?.includes("prp_admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as { section?: string; language?: string };
  const { section, language } = body;

  if (!section || !language) {
    return NextResponse.json({ error: "Missing section or language" }, { status: 400 });
  }

  // Promote draft strings for this section+language to published
  await db.update(contentStrings)
    .set({ status: "published", updatedAt: new Date() })
    .where(and(
      eq(contentStrings.section, section),
      eq(contentStrings.language, language),
      eq(contentStrings.status, "draft"),
    ));

  // Re-fetch all published strings (now including the just-promoted ones)
  const freshPublished = await db
    .select({ key: contentStrings.key, value: contentStrings.value })
    .from(contentStrings)
    .where(and(
      eq(contentStrings.language, language),
      eq(contentStrings.status, "published"),
    ));

  // Write merged JSON to volume
  const merged: Record<string, string> = {};
  for (const { key, value } of freshPublished) merged[key] = value;

  try {
    await fs.mkdir(VOLUME_PATH, { recursive: true });
    await fs.writeFile(
      path.join(VOLUME_PATH, `${language.toLowerCase()}.json`),
      JSON.stringify(merged, null, 2),
    );
  } catch (err) {
    console.warn("[prp/publish] Could not write to volume — dev mode:", err);
  }

  // Update section publish state
  const [existingState] = await db
    .select({ id: sectionPublishState.id })
    .from(sectionPublishState)
    .where(and(eq(sectionPublishState.section, section), eq(sectionPublishState.language, language)));

  if (existingState) {
    await db.update(sectionPublishState)
      .set({ status: "published", publishedAt: new Date(), publishedBy: session.userId })
      .where(eq(sectionPublishState.id, existingState.id));
  } else {
    await db.insert(sectionPublishState).values({
      section, language, status: "published",
      publishedAt: new Date(), publishedBy: session.userId,
    });
  }

  return NextResponse.json({ ok: true, published: freshPublished.length });
}
