/**
 * Issues a fresh unused magic link token for demo@test.com so we can
 * walk the EoI form for screenshots without consuming the seeded K7M2 token.
 */
import { db } from "@/db";
import { magicLinkTokens } from "@/db/schema";
import crypto from "crypto";

const TOKEN = process.argv[2] || "DEMO";
const EMAIL = "demo@test.com";

function hash(t: string) {
  return crypto.createHash("sha256").update(t).digest("hex");
}

(async () => {
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1h
  await db.insert(magicLinkTokens).values({
    email: EMAIL,
    tokenHash: hash(TOKEN),
    expiresAt: expires,
    ipAddress: "127.0.0.1",
  });
  console.log(`Issued token ${TOKEN} for ${EMAIL}, expires ${expires.toISOString()}`);
  process.exit(0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
