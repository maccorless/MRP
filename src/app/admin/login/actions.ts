"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers, auditLog } from "@/db/schema";
import { setSession } from "@/lib/session";

// Prototype only — replaced by D.TEC/DGP SSO at v1.0
const PROTO_PASSWORD = "Password1!";

export async function login(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/admin/login?error=missing_fields");
  }

  const [user] = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email));

  // Hardcoded prototype check: any seeded admin with passwordHash set can log in with PROTO_PASSWORD
  if (!user || !user.passwordHash || password !== PROTO_PASSWORD) {
    redirect("/admin/login?error=invalid_credentials");
  }

  await setSession({
    userId: user.id,
    email: user.email,
    role: user.role as import("@/lib/session").AdminRole,
    nocCode: user.nocCode ?? null,
    ifCode: user.ifCode ?? null,
    displayName: user.displayName,
    canaryFlags: Array.isArray(user.canaryFlags) ? (user.canaryFlags as string[]) : [],
  });

  // Audit log
  const actorType =
    user.role === "ocog_admin" ? "ocog_admin"
    : user.role === "if_admin"   ? "if_admin"
    : user.role.startsWith("ioc_") ? "ioc_admin"
    : "noc_admin";
  await db.insert(auditLog).values({
    actorType,
    actorId: user.id,
    actorLabel: user.displayName,
    action: "admin_login",
  });

  // Route to the right dashboard
  if (user.role === "noc_admin" || user.role === "if_admin") {
    redirect("/admin/noc");
  } else if (user.role === "ocog_admin") {
    redirect("/admin/ocog/pbn");
  } else {
    redirect("/admin/ioc");
  }
}

export async function logout() {
  const { clearSession } = await import("@/lib/session");
  await clearSession();
  redirect("/admin/login");
}
