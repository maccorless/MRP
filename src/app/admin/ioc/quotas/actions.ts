"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { nocQuotas, quotaChanges, auditLog } from "@/db/schema";
import { requireIocAdminSession, requireWritable } from "@/lib/session";

const CAT_LABEL: Record<string, string> = {
  e: "E", es: "Es", ep: "EP", eps: "EPs", et: "ET", ec: "EC", noc_e: "NocE",
};

function quotaDiffDetail(nocCode: string, diffs: { quotaType: string; oldValue: number; newValue: number }[], source: "import" | "manual"): string {
  const parts = diffs.map((d) => `${CAT_LABEL[d.quotaType] ?? d.quotaType}: ${d.oldValue}→${d.newValue}`);
  return `${nocCode} — ${parts.join(", ")} [${source}]`;
}

// All per-category quota keys in column order
const CAT_KEYS = ["e", "es", "ep", "eps", "et", "ec", "noc_e"] as const;
type CatKey = typeof CAT_KEYS[number];

function deriveRollups(vals: Record<CatKey, number>) {
  return {
    pressTotal: vals.e + vals.es + vals.et + vals.ec,
    photoTotal: vals.ep + vals.eps,
  };
}

/**
 * Import quotas from a CSV payload.
 * Format: NOC,E,Es,EP,EPs,ET,EC,NocE  (one row per line)
 * Upserts noc_quotas and writes quota_changes records for each changed value.
 */
export async function importQuotas(formData: FormData) {
  await requireWritable();
  const session = await requireIocAdminSession();
  const raw = (formData.get("csv") as string)?.trim();
  if (!raw) redirect("/admin/ioc/quotas?error=empty");

  const lines = raw.split(/\r?\n/).filter(Boolean);
  let imported = 0;

  for (const line of lines) {
    const parts = line.split(",").map((s) => s.trim());
    const nocCode = parts[0]?.toUpperCase();
    if (!nocCode) continue;

    const parse = (i: number) => {
      const v = parseInt(parts[i] ?? "0", 10);
      return isNaN(v) || v < 0 ? 0 : v;
    };

    const vals: Record<CatKey, number> = {
      e:     parse(1),
      es:    parse(2),
      ep:    parse(3),
      eps:   parse(4),
      et:    parse(5),
      ec:    parse(6),
      noc_e: parse(7),
    };
    const { pressTotal, photoTotal } = deriveRollups(vals);

    const [existing] = await db
      .select()
      .from(nocQuotas)
      .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));

    if (existing) {
      const prev: Record<CatKey, number> = {
        e:     existing.eTotal,
        es:    existing.esTotal,
        ep:    existing.epTotal,
        eps:   existing.epsTotal,
        et:    existing.etTotal,
        ec:    existing.ecTotal,
        noc_e: existing.nocETotal,
      };
      const changes = CAT_KEYS
        .filter((k) => prev[k] !== vals[k])
        .map((k) => ({ quotaType: k, oldValue: prev[k], newValue: vals[k] }));

      if (changes.length > 0) {
        await db.update(nocQuotas).set({
          eTotal: vals.e,   esTotal: vals.es,
          epTotal: vals.ep, epsTotal: vals.eps,
          etTotal: vals.et, ecTotal: vals.ec,
          nocETotal: vals.noc_e,
          pressTotal, photoTotal,
          setBy: session.userId, setAt: new Date(),
        }).where(eq(nocQuotas.id, existing.id));

        await db.insert(quotaChanges).values(
          changes.map((c) => ({
            nocCode, quotaType: c.quotaType,
            oldValue: c.oldValue, newValue: c.newValue,
            changedBy: session.userId, changeSource: "import" as const,
          }))
        );

        await db.insert(auditLog).values({
          actorType: "ioc_admin",
          actorId: session.userId,
          actorLabel: session.displayName,
          action: "quota_changed",
          detail: quotaDiffDetail(nocCode, changes, "import"),
        });
      }
    } else {
      await db.insert(nocQuotas).values({
        nocCode,
        eTotal: vals.e,   esTotal: vals.es,
        epTotal: vals.ep, epsTotal: vals.eps,
        etTotal: vals.et, ecTotal: vals.ec,
        nocETotal: vals.noc_e,
        pressTotal, photoTotal,
        setBy: session.userId, setAt: new Date(),
      });

      const initialChanges = CAT_KEYS
        .filter((k) => vals[k] !== 0)
        .map((k) => ({ quotaType: k, oldValue: 0, newValue: vals[k] }));

      await db.insert(quotaChanges).values(
        CAT_KEYS.map((k) => ({
          nocCode, quotaType: k,
          oldValue: 0, newValue: vals[k],
          changedBy: session.userId, changeSource: "import" as const,
        }))
      );

      if (initialChanges.length > 0) {
        await db.insert(auditLog).values({
          actorType: "ioc_admin",
          actorId: session.userId,
          actorLabel: session.displayName,
          action: "quota_changed",
          detail: quotaDiffDetail(nocCode, initialChanges, "import"),
        });
      }
    }

    imported++;
  }

  redirect(`/admin/ioc/quotas?success=imported&count=${imported}`);
}

/**
 * Save manual per-category edits from the edit form.
 * Form fields: e_{nocCode}, es_{nocCode}, ep_{nocCode}, eps_{nocCode},
 *              et_{nocCode}, ec_{nocCode}, noc_e_{nocCode}
 */
export async function saveQuotaEdits(formData: FormData) {
  await requireWritable();
  const session = await requireIocAdminSession();

  const entries = [...formData.entries()];
  const nocCodes = new Set<string>();
  for (const [key] of entries) {
    const m = key.match(/^(?:e|es|ep|eps|et|ec|noc_e)_(.+)$/);
    if (m) nocCodes.add(m[1]);
  }

  for (const nocCode of nocCodes) {
    const parse = (prefix: string) => {
      const v = parseInt(formData.get(`${prefix}_${nocCode}`) as string ?? "0", 10);
      return isNaN(v) || v < 0 ? 0 : v;
    };

    const vals: Record<CatKey, number> = {
      e:     parse("e"),
      es:    parse("es"),
      ep:    parse("ep"),
      eps:   parse("eps"),
      et:    parse("et"),
      ec:    parse("ec"),
      noc_e: parse("noc_e"),
    };
    const { pressTotal, photoTotal } = deriveRollups(vals);

    const [existing] = await db
      .select()
      .from(nocQuotas)
      .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")));

    if (!existing) continue;

    const prev: Record<CatKey, number> = {
      e:     existing.eTotal,
      es:    existing.esTotal,
      ep:    existing.epTotal,
      eps:   existing.epsTotal,
      et:    existing.etTotal,
      ec:    existing.ecTotal,
      noc_e: existing.nocETotal,
    };
    const changes = CAT_KEYS
      .filter((k) => prev[k] !== vals[k])
      .map((k) => ({ quotaType: k, oldValue: prev[k], newValue: vals[k] }));

    if (changes.length === 0) continue;

    await db.update(nocQuotas).set({
      eTotal: vals.e,   esTotal: vals.es,
      epTotal: vals.ep, epsTotal: vals.eps,
      etTotal: vals.et, ecTotal: vals.ec,
      nocETotal: vals.noc_e,
      pressTotal, photoTotal,
      setBy: session.userId, setAt: new Date(),
    }).where(eq(nocQuotas.id, existing.id));

    await db.insert(quotaChanges).values(
      changes.map((c) => ({
        nocCode, quotaType: c.quotaType,
        oldValue: c.oldValue, newValue: c.newValue,
        changedBy: session.userId, changeSource: "manual_edit" as const,
      }))
    );

    await db.insert(auditLog).values({
      actorType: "ioc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "quota_changed",
      detail: quotaDiffDetail(nocCode, changes, "manual"),
    });
  }

  redirect("/admin/ioc/quotas?success=saved");
}
