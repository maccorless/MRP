"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { nocEoiWindows, auditLog } from "@/db/schema";
import { requireNocSession, requireWritable } from "@/lib/session";

export async function toggleEoiWindow(formData: FormData) {
  await requireWritable();
  const session = await requireNocSession();
  const nocCode = session.nocCode;
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
    actorType: "noc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "eoi_window_toggled",
    detail: `EoI window ${targetOpen ? "opened" : "closed"} by ${session.displayName}`,
  });

  redirect(`/admin/noc/settings?success=window_${targetOpen ? "opened" : "closed"}`);
}
