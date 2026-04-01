"use server";

import { redirect } from "next/navigation";
import { db } from "@/db";
import { magicLinkTokens } from "@/db/schema";
import { generateToken, hashToken } from "@/lib/tokens";

export async function requestStatusToken(formData: FormData) {
  const email = (formData.get("email") as string)?.trim().toLowerCase();

  if (!email || !email.includes("@") || !email.includes(".")) {
    redirect("/apply/status?error=invalid_email");
  }

  const token = generateToken();
  const tokenHash = hashToken(token);
  const expiryHours = parseInt(process.env.TOKEN_EXPIRY_HOURS ?? "24", 10);
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

  await db.insert(magicLinkTokens).values({ email, tokenHash, expiresAt });

  redirect(`/apply/status/view?token=${token}&email=${encodeURIComponent(email)}`);
}
