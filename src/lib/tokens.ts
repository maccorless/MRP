import { createHash, randomBytes } from "crypto";

// No ambiguous characters (0/O, 1/I/L)
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateToken(length = 8): string {
  // Rejection sampling: discard bytes ≥ the largest multiple of CHARSET.length
  // that fits in 256, so every character of CHARSET is equally likely.
  const max = 256 - (256 % CHARSET.length); // 248 when CHARSET.length === 31
  const out: string[] = [];
  while (out.length < length) {
    const draw = randomBytes(length - out.length);
    for (const b of draw) {
      if (b < max) out.push(CHARSET[b % CHARSET.length]);
      if (out.length === length) break;
    }
  }
  return out.join("");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token.toUpperCase()).digest("hex");
}
