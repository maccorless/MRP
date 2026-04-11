"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { featureFlags, adminUsers, auditLog } from "@/db/schema";
import { requireIocAdminSession, requireWritable } from "@/lib/session";

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createFlag(formData: FormData): Promise<void> {
  await requireWritable();
  const session = await requireIocAdminSession();

  const name = ((formData.get("name") as string | null) ?? "").trim().toLowerCase().replace(/\s+/g, "_");
  const description = ((formData.get("description") as string | null) ?? "").trim();

  if (!name) redirect("/admin/ioc/flags?error=missing_name");

  // Validate name format: alphanumeric + underscores only
  if (!/^[a-z0-9_]+$/.test(name)) redirect("/admin/ioc/flags?error=invalid_name");

  const [existing] = await db
    .select({ id: featureFlags.id })
    .from(featureFlags)
    .where(eq(featureFlags.name, name));

  if (existing) redirect("/admin/ioc/flags?error=name_taken");

  await db.transaction(async (tx) => {
    await tx.insert(featureFlags).values({ name, description, state: "off" });
    await tx.insert(auditLog).values({
      actorType: "ioc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "feature_flag_state_changed",
      detail: `Created feature flag "${name}" (state: off)`,
    });
  });

  redirect(`/admin/ioc/flags/${name}?success=created`);
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteFlag(flagName: string): Promise<void> {
  await requireWritable();
  const session = await requireIocAdminSession();

  const [flag] = await db
    .select({ id: featureFlags.id, state: featureFlags.state })
    .from(featureFlags)
    .where(eq(featureFlags.name, flagName));

  if (!flag) redirect("/admin/ioc/flags?error=not_found");
  if (flag.state !== "off") redirect(`/admin/ioc/flags/${flagName}?error=not_off`);

  await db.transaction(async (tx) => {
    await tx.delete(featureFlags).where(eq(featureFlags.name, flagName));
    await tx.insert(auditLog).values({
      actorType: "ioc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "feature_flag_state_changed",
      detail: `Deleted feature flag "${flagName}"`,
    });
  });

  redirect("/admin/ioc/flags?success=deleted");
}

// ─── State transitions ────────────────────────────────────────────────────────

export async function setFlagState(flagName: string, newState: "off" | "canary" | "on"): Promise<void> {
  await requireWritable();
  const session = await requireIocAdminSession();

  const [flag] = await db
    .select({ id: featureFlags.id, state: featureFlags.state })
    .from(featureFlags)
    .where(eq(featureFlags.name, flagName));

  if (!flag) redirect(`/admin/ioc/flags?error=not_found`);

  const oldState = flag.state;

  await db.transaction(async (tx) => {
    await tx
      .update(featureFlags)
      .set({ state: newState, updatedAt: new Date() })
      .where(eq(featureFlags.name, flagName));

    await tx.insert(auditLog).values({
      actorType: "ioc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "feature_flag_state_changed",
      detail: `Flag "${flagName}": ${oldState} → ${newState}`,
    });
  });

  redirect(`/admin/ioc/flags/${flagName}?success=state_changed`);
}

// ─── Canary enrolment ─────────────────────────────────────────────────────────

export async function enrollUserByEmail(flagName: string, formData: FormData): Promise<void> {
  await requireWritable();
  const session = await requireIocAdminSession();

  const [flag] = await db
    .select({ id: featureFlags.id })
    .from(featureFlags)
    .where(eq(featureFlags.name, flagName));

  if (!flag) redirect(`/admin/ioc/flags?error=not_found`);

  const email = ((formData.get("email") as string | null) ?? "");
  const normalised = email.trim().toLowerCase();
  const [user] = await db
    .select({ id: adminUsers.id, displayName: adminUsers.displayName, canaryFlags: adminUsers.canaryFlags })
    .from(adminUsers)
    .where(eq(adminUsers.email, normalised));

  if (!user) redirect(`/admin/ioc/flags/${flagName}?error=user_not_found`);

  const current = Array.isArray(user.canaryFlags) ? (user.canaryFlags as string[]) : [];
  if (current.includes(flagName)) redirect(`/admin/ioc/flags/${flagName}?error=already_enrolled`);

  const updated = [...current, flagName];

  await db.transaction(async (tx) => {
    await tx
      .update(adminUsers)
      .set({ canaryFlags: updated })
      .where(eq(adminUsers.id, user.id));

    await tx.insert(auditLog).values({
      actorType: "ioc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "feature_flag_enrollment_changed",
      detail: `Enrolled "${normalised}" in canary flag "${flagName}"`,
    });
  });

  redirect(`/admin/ioc/flags/${flagName}?success=enrolled`);
}

export async function enrollNocUsers(flagName: string, formData: FormData): Promise<void> {
  await requireWritable();
  const session = await requireIocAdminSession();

  const [flag] = await db
    .select({ id: featureFlags.id })
    .from(featureFlags)
    .where(eq(featureFlags.name, flagName));

  if (!flag) redirect(`/admin/ioc/flags?error=not_found`);

  const nocCode = ((formData.get("nocCode") as string | null) ?? "");
  const code = nocCode.trim().toUpperCase();
  const nocUsers = await db
    .select({ id: adminUsers.id, email: adminUsers.email, canaryFlags: adminUsers.canaryFlags })
    .from(adminUsers)
    .where(eq(adminUsers.nocCode, code));

  if (nocUsers.length === 0) redirect(`/admin/ioc/flags/${flagName}?error=noc_not_found`);

  let enrolled = 0;
  await db.transaction(async (tx) => {
    for (const user of nocUsers) {
      const current = Array.isArray(user.canaryFlags) ? (user.canaryFlags as string[]) : [];
      if (current.includes(flagName)) continue;
      const updated = [...current, flagName];
      await tx
        .update(adminUsers)
        .set({ canaryFlags: updated })
        .where(eq(adminUsers.id, user.id));
      enrolled++;
    }

    if (enrolled > 0) {
      await tx.insert(auditLog).values({
        actorType: "ioc_admin",
        actorId: session.userId,
        actorLabel: session.displayName,
        action: "feature_flag_enrollment_changed",
        detail: `Enrolled ${enrolled} NOC ${code} user(s) in canary flag "${flagName}"`,
      });
    }
  });

  redirect(`/admin/ioc/flags/${flagName}?success=noc_enrolled&count=${enrolled}`);
}

export async function unenrollUser(flagName: string, userId: string): Promise<void> {
  await requireWritable();
  const session = await requireIocAdminSession();

  const [user] = await db
    .select({ id: adminUsers.id, email: adminUsers.email, canaryFlags: adminUsers.canaryFlags })
    .from(adminUsers)
    .where(eq(adminUsers.id, userId));

  if (!user) redirect(`/admin/ioc/flags/${flagName}?error=user_not_found`);

  const current = Array.isArray(user.canaryFlags) ? (user.canaryFlags as string[]) : [];
  const updated = current.filter((f) => f !== flagName);

  await db.transaction(async (tx) => {
    await tx
      .update(adminUsers)
      .set({ canaryFlags: updated })
      .where(eq(adminUsers.id, userId));

    await tx.insert(auditLog).values({
      actorType: "ioc_admin",
      actorId: session.userId,
      actorLabel: session.displayName,
      action: "feature_flag_enrollment_changed",
      detail: `Unenrolled "${user.email}" from canary flag "${flagName}"`,
    });
  });

  redirect(`/admin/ioc/flags/${flagName}?success=unenrolled`);
}
