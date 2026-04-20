"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { magicLinkTokens } from "@/db/schema";
import { generateToken, hashToken } from "@/lib/tokens";

export async function requestStatusToken(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email || !email.includes("@") || !email.includes(".")) {
    redirect("/applyb/status?error=invalid_email");
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  // Status tokens last 90 days so applicants can return to check their
  // application over the weeks/months of the review period.
  // Override via STATUS_TOKEN_EXPIRY_HOURS env var if needed.
  const statusExpiryHours = parseInt(
    process.env.STATUS_TOKEN_EXPIRY_HOURS ?? String(90 * 24),
    10
  );
  const expiresAt = new Date(Date.now() + statusExpiryHours * 60 * 60 * 1000);

  await db.insert(magicLinkTokens).values({ email, tokenHash, expiresAt });

  redirect(`/applyb/status/view?token=${token}&email=${encodeURIComponent(email)}`);
}
