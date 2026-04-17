"use server";

import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireOcogSession } from "@/lib/session";
import { requireWritable } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function publishPbnResults(): Promise<void> {
  await requireOcogSession();
  await requireWritable();

  await db
    .insert(featureFlags)
    .values({
      name: "pbn_results_published",
      state: "on",
      description: "When on, applicants can see their true PbN status (approved/rejected). Until toggled on, all non-returned statuses show as 'Application Under Review'.",
    })
    .onConflictDoUpdate({
      target: featureFlags.name,
      set: { state: "on", updatedAt: new Date() },
    });

  revalidatePath("/admin/ocog");
  revalidatePath("/apply/status/view");
}

export async function unpublishPbnResults(): Promise<void> {
  await requireOcogSession();
  await requireWritable();

  await db
    .insert(featureFlags)
    .values({
      name: "pbn_results_published",
      state: "off",
      description: "When on, applicants can see their true PbN status (approved/rejected). Until toggled on, all non-returned statuses show as 'Application Under Review'.",
    })
    .onConflictDoUpdate({
      target: featureFlags.name,
      set: { state: "off", updatedAt: new Date() },
    });

  revalidatePath("/admin/ocog");
  revalidatePath("/apply/status/view");
}
