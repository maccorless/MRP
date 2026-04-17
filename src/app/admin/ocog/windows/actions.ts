"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { nocEoiWindows, applications, auditLog } from "@/db/schema";
import { requireOcogSession, requireWritable } from "@/lib/session";

export async function toggleNocWindow(formData: FormData) {
  await requireWritable();
  const session = await requireOcogSession();
  const nocCode = formData.get("nocCode") as string;
  const targetOpen = formData.get("set_open") === "true";

  const now = new Date();

  const [existing] = await db
    .select()
    .from(nocEoiWindows)
    .where(and(eq(nocEoiWindows.nocCode, nocCode), eq(nocEoiWindows.eventId, "LA28")));

  if (existing) {
    await db
      .update(nocEoiWindows)
      .set({
        isOpen: targetOpen,
        closedAt: targetOpen ? null : now,
        openedAt: targetOpen ? now : existing.openedAt,
        toggledBy: session.userId,
        toggledAt: now,
      })
      .where(eq(nocEoiWindows.id, existing.id));
  } else {
    await db.insert(nocEoiWindows).values({
      nocCode,
      eventId: "LA28",
      isOpen: targetOpen,
      closedAt: targetOpen ? null : now,
      toggledBy: session.userId,
      toggledAt: now,
    });
  }

  await db.insert(auditLog).values({
    actorType: "ocog_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "eoi_window_toggled",
    detail: `EoI window for ${nocCode} ${targetOpen ? "opened" : "closed"} by ${session.displayName}`,
  });

  redirect(`/admin/ocog/windows?success=window_${targetOpen ? "opened" : "closed"}`);
}

export async function toggleAllWindows(formData: FormData) {
  await requireWritable();
  const session = await requireOcogSession();
  const targetOpen = formData.get("set_open") === "true";

  const now = new Date();

  const existingRows = await db
    .select()
    .from(nocEoiWindows)
    .where(eq(nocEoiWindows.eventId, "LA28"));

  const existingNocCodes = new Set(existingRows.map((r) => r.nocCode));

  const allNocCodes = await db
    .selectDistinct({ nocCode: applications.nocCode })
    .from(applications)
    .where(eq(applications.eventId, "LA28"));

  const missingNocCodes = allNocCodes
    .map((r) => r.nocCode)
    .filter((code) => !existingNocCodes.has(code));

  for (const row of existingRows) {
    await db
      .update(nocEoiWindows)
      .set({
        isOpen: targetOpen,
        closedAt: targetOpen ? null : now,
        openedAt: targetOpen ? now : row.openedAt,
        toggledBy: session.userId,
        toggledAt: now,
      })
      .where(eq(nocEoiWindows.id, row.id));
  }

  for (const nocCode of missingNocCodes) {
    await db.insert(nocEoiWindows).values({
      nocCode,
      eventId: "LA28",
      isOpen: targetOpen,
      closedAt: targetOpen ? null : now,
      toggledBy: session.userId,
      toggledAt: now,
    });
  }

  await db.insert(auditLog).values({
    actorType: "ocog_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "eoi_window_toggled",
    detail: `All EoI windows ${targetOpen ? "opened" : "closed"} by ${session.displayName}`,
  });

  redirect(`/admin/ocog/windows?success=all_${targetOpen ? "opened" : "closed"}`);
}
