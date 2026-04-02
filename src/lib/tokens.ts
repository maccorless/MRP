import { createHash, randomBytes } from "crypto";

// No ambiguous characters (0/O, 1/I/L)
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateToken(length = 8): string {
  const bytes = randomBytes(length);
  return Array.from(bytes)
    .map((b) => CHARSET[b % CHARSET.length])
    .join("");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token.toUpperCase()).digest("hex");
}
