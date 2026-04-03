"use server";

import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import {
  organizations,
  orgSlotAllocations,
  reservedOrganizations,
  nocQuotas,
  auditLog,
} from "@/db/schema";
import { requireIocAdminSession, requireWritable } from "@/lib/session";
import { ACCRED_CATEGORIES, type AccredCategory } from "@/lib/category";

const IOC_DIRECT = "IOC_DIRECT";
const EVENT_ID   = "LA28";

type CategorySlots = Record<AccredCategory, number>;

function parseCategorySlots(formData: FormData, orgId: string): CategorySlots {
  const out = {} as CategorySlots;
  for (const cat of ACCRED_CATEGORIES) {
    const raw = formData.get(`${cat.value.toLowerCase()}_${orgId}`) as string | null;
    const n = raw !== null ? parseInt(raw, 10) : 0;
    out[cat.value] = isNaN(n) ? 0 : Math.max(0, n);
  }
  return out;
}

/** Add an org to the IOC-Direct reserved list and create an org record for PbN. */
export async function addIocDirectOrg(formData: FormData) {
  await requireWritable();
  const session = await requireIocAdminSession();

  const name       = ((formData.get("name")        as string | null) ?? "").trim();
  const orgType    = ((formData.get("orgType")      as string | null) ?? "");
  const country    = ((formData.get("country")      as string | null) ?? "").trim() || null;
  const website    = ((formData.get("website")      as string | null) ?? "").trim() || null;
  const emailDomain = ((formData.get("emailDomain") as string | null) ?? "").trim() || null;
  const notes      = ((formData.get("notes")        as string | null) ?? "").trim() || null;

  if (!name || !orgType) redirect("/admin/ioc/direct?error=missing_fields");

  // Create the org record (used for PbN allocation)
  const [org] = await db
    .insert(organizations)
    .values({
      name,
      nocCode: IOC_DIRECT,
      orgType: orgType as "media_print_online" | "media_broadcast" | "news_agency" | "enr",
      ...(country      ? { country }      : {}),
      ...(website      ? { website }      : {}),
      ...(emailDomain  ? { emailDomain }  : {}),
      status: "active",
    })
    .returning({ id: organizations.id });

  // Also add to reserved list for dedup blocking
  await db.insert(reservedOrganizations).values({
    name,
    emailDomain,
    website,
    country,
    notes,
    addedBy: session.userId,
    eventId: EVENT_ID,
  });

  // Create a draft allocation row at zero
  await db.insert(orgSlotAllocations).values({
    organizationId: org.id,
    nocCode: IOC_DIRECT,
    eventId: EVENT_ID,
    eSlots: 0, esSlots: 0, epSlots: 0,
    epsSlots: 0, etSlots: 0, ecSlots: 0,
    pressSlots: 0, photoSlots: 0,
    allocatedBy: session.userId,
    pbnState: "draft",
  });

  await db.insert(auditLog).values({
    actorType: "ioc_admin",
    actorId:    session.userId,
    actorLabel: session.displayName,
    action:     "noc_direct_entry",
    detail:     `IOC-Direct: ${name} added`,
  });

  redirect("/admin/ioc/direct?success=org_added");
}

/** Save draft PbN allocations for IOC-Direct orgs. */
export async function saveIocDirectAllocations(formData: FormData) {
  await requireWritable();
  const session = await requireIocAdminSession();

  const orgs = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(and(eq(organizations.nocCode, IOC_DIRECT), eq(organizations.eventId, EVENT_ID)));

  for (const org of orgs) {
    const slots = parseCategorySlots(formData, org.id);

    const [existing] = await db
      .select()
      .from(orgSlotAllocations)
      .where(
        and(
          eq(orgSlotAllocations.organizationId, org.id),
          eq(orgSlotAllocations.nocCode, IOC_DIRECT),
          eq(orgSlotAllocations.eventId, EVENT_ID),
        )
      );

    if (existing) {
      if (existing.pbnState !== "draft") continue;
      await db.update(orgSlotAllocations).set({
        eSlots:   slots.E,  esSlots:  slots.Es,
        epSlots:  slots.EP, epsSlots: slots.EPs,
        etSlots:  slots.ET, ecSlots:  slots.EC,
        pressSlots: slots.E + slots.Es + slots.ET + slots.EC,
        photoSlots: slots.EP + slots.EPs,
        allocatedBy: session.userId,
        allocatedAt: new Date(),
      }).where(eq(orgSlotAllocations.id, existing.id));
    } else {
      await db.insert(orgSlotAllocations).values({
        organizationId: org.id,
        nocCode: IOC_DIRECT, eventId: EVENT_ID,
        eSlots:   slots.E,  esSlots:  slots.Es,
        epSlots:  slots.EP, epsSlots: slots.EPs,
        etSlots:  slots.ET, ecSlots:  slots.EC,
        pressSlots: slots.E + slots.Es + slots.ET + slots.EC,
        photoSlots: slots.EP + slots.EPs,
        allocatedBy: session.userId,
        pbnState: "draft",
      });
    }
  }

  redirect("/admin/ioc/direct?success=saved");
}

/** Submit IOC-Direct PbN allocations to OCOG for approval. */
export async function submitIocDirectToOcog(formData: FormData) {
  await requireWritable();
  const session = await requireIocAdminSession();

  // Validate quota
  const [quota] = await db
    .select()
    .from(nocQuotas)
    .where(and(eq(nocQuotas.nocCode, IOC_DIRECT), eq(nocQuotas.eventId, EVENT_ID)));

  if (quota) {
    const orgs = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(and(eq(organizations.nocCode, IOC_DIRECT), eq(organizations.eventId, EVENT_ID)));

    const totals: CategorySlots = { E: 0, Es: 0, EP: 0, EPs: 0, ET: 0, EC: 0 };
    for (const org of orgs) {
      const slots = parseCategorySlots(formData, org.id);
      for (const cat of ACCRED_CATEGORIES) totals[cat.value] += slots[cat.value];
    }

    const catMap: Partial<Record<AccredCategory, number>> = {
      E: quota.eTotal ?? 0, Es: quota.esTotal ?? 0,
      EP: quota.epTotal ?? 0, EPs: quota.epsTotal ?? 0,
      ET: quota.etTotal ?? 0, EC: quota.ecTotal ?? 0,
    };
    for (const cat of ACCRED_CATEGORIES) {
      const q = catMap[cat.value] ?? 0;
      if (q > 0 && totals[cat.value] > q) {
        redirect(`/admin/ioc/direct?error=over_${cat.value.toLowerCase()}_quota`);
      }
    }
  }

  // Save first, then transition draft → noc_submitted (IOC acts as the NOC here)
  await saveIocDirectAllocations(formData);

  await db.update(orgSlotAllocations)
    .set({ pbnState: "noc_submitted" })
    .where(
      and(
        eq(orgSlotAllocations.nocCode, IOC_DIRECT),
        eq(orgSlotAllocations.eventId, EVENT_ID),
        eq(orgSlotAllocations.pbnState, "draft"),
      )
    );

  await db.insert(auditLog).values({
    actorType: "ioc_admin",
    actorId:    session.userId,
    actorLabel: session.displayName,
    action:     "pbn_submitted",
    detail:     "IOC-Direct allocation submitted to OCOG",
  });

  redirect("/admin/ioc/direct?success=submitted");
}
