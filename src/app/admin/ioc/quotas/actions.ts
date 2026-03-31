"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { nocQuotas, quotaChanges } from "@/db/schema";
import { requireIocAdminSession, requireWritable } from "@/lib/session";

/**
 * Import quotas from a CSV payload (newline-separated rows: NOC,press,photo).
 * Upserts noc_quotas and writes a quota_changes record for each changed value.
 */
export async function importQuotas(formData: FormData) {
  await requireWritable();
  const session = await requireIocAdminSession();
  const raw = (formData.get("csv") as string)?.trim();
  if (!raw) redirect("/admin/ioc/quotas?error=empty");

  const lines = raw.split(/\r?\n/).filter(Boolean);
  let imported = 0;

  for (const line of lines) {
    const [nocRaw, pressRaw, photoRaw] = line.split(",").map((s) => s.trim());
    const nocCode = nocRaw?.toUpperCase();
    const pressTotal = parseInt(pressRaw, 10);
    const photoTotal = parseInt(photoRaw, 10);

    if (!nocCode || isNaN(pressTotal) || isNaN(photoTotal)) continue;

    const [existing] = await db
      .select()
      .from(nocQuotas)
      .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));

    if (existing) {
      const changes: Array<{ quotaType: string; oldValue: number; newValue: number }> = [];
      if (existing.pressTotal !== pressTotal) {
        changes.push({ quotaType: "press", oldValue: existing.pressTotal, newValue: pressTotal });
      }
      if (existing.photoTotal !== photoTotal) {
        changes.push({ quotaType: "photo", oldValue: existing.photoTotal, newValue: photoTotal });
      }

      if (changes.length > 0) {
        await db
          .update(nocQuotas)
          .set({ pressTotal, photoTotal, setBy: session.userId, setAt: new Date() })
          .where(eq(nocQuotas.id, existing.id));

        await db.insert(quotaChanges).values(
          changes.map((c) => ({
            nocCode,
            quotaType: c.quotaType,
            oldValue: c.oldValue,
            newValue: c.newValue,
            changedBy: session.userId,
            changeSource: "import" as const,
          }))
        );
      }
    } else {
      await db.insert(nocQuotas).values({
        nocCode,
        pressTotal,
        photoTotal,
        setBy: session.userId,
        setAt: new Date(),
      });

      await db.insert(quotaChanges).values([
        { nocCode, quotaType: "press", oldValue: 0, newValue: pressTotal, changedBy: session.userId, changeSource: "import" as const },
        { nocCode, quotaType: "photo", oldValue: 0, newValue: photoTotal, changedBy: session.userId, changeSource: "import" as const },
      ]);
    }

    imported++;
  }

  redirect(`/admin/ioc/quotas?success=imported&count=${imported}`);
}

/**
 * Save manual edits to one or more NOC quotas from the edit form.
 * Writes quota_changes records with changeSource="manual_edit".
 */
export async function saveQuotaEdits(formData: FormData) {
  await requireWritable();
  const session = await requireIocAdminSession();

  // Form fields are named press_{nocCode} and photo_{nocCode}
  const entries = [...formData.entries()];
  const nocCodes = new Set<string>();
  for (const [key] of entries) {
    const m = key.match(/^(?:press|photo)_(.+)$/);
    if (m) nocCodes.add(m[1]);
  }

  for (const nocCode of nocCodes) {
    const pressVal = parseInt(formData.get(`press_${nocCode}`) as string, 10);
    const photoVal = parseInt(formData.get(`photo_${nocCode}`) as string, 10);
    if (isNaN(pressVal) || isNaN(photoVal)) continue;

    const [existing] = await db
      .select()
      .from(nocQuotas)
      .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));

    if (!existing) continue;

    const changes: Array<{ quotaType: string; oldValue: number; newValue: number }> = [];
    if (existing.pressTotal !== pressVal) {
      changes.push({ quotaType: "press", oldValue: existing.pressTotal, newValue: pressVal });
    }
    if (existing.photoTotal !== photoVal) {
      changes.push({ quotaType: "photo", oldValue: existing.photoTotal, newValue: photoVal });
    }

    if (changes.length === 0) continue;

    await db
      .update(nocQuotas)
      .set({ pressTotal: pressVal, photoTotal: photoVal, setBy: session.userId, setAt: new Date() })
      .where(eq(nocQuotas.id, existing.id));

    await db.insert(quotaChanges).values(
      changes.map((c) => ({
        nocCode,
        quotaType: c.quotaType,
        oldValue: c.oldValue,
        newValue: c.newValue,
        changedBy: session.userId,
        changeSource: "manual_edit" as const,
      }))
    );
  }

  redirect("/admin/ioc/quotas?success=saved");
}
