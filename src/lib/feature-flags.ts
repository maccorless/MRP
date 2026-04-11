/**
 * Feature flag helpers — two-tier canary rollout system.
 *
 * Global flag state is read live from the DB on every request (memoised per
 * request via React cache). Per-user canary membership is baked into the
 * session cookie at login and does not refresh mid-session.
 */

import { cache } from "react";
import { db } from "@/db";
import { featureFlags } from "@/db/schema";
import type { SessionPayload } from "@/lib/session";

/**
 * Returns a map of flag name → state for all known flags.
 * Memoised per-request so all hasFlag() calls in one request share one DB query.
 * Returns {} on DB failure so all flags default to 'off' (safe).
 */
export const getGlobalFlagStates = cache(async (): Promise<Record<string, "off" | "canary" | "on">> => {
  try {
    const rows = await db.select({ name: featureFlags.name, state: featureFlags.state }).from(featureFlags);
    return Object.fromEntries(rows.map((r) => [r.name, r.state]));
  } catch {
    return {};
  }
});

/**
 * Returns true if the given session should see the named feature.
 * - state 'off'    → always false
 * - state 'on'     → always true
 * - state 'canary' → true only if the user is in the canary enrolment list
 *
 * Returns false for unknown flag names (safe default).
 */
export async function hasFlag(session: SessionPayload, flagName: string): Promise<boolean> {
  const states = await getGlobalFlagStates();
  const state = states[flagName];
  if (!state || state === "off") return false;
  if (state === "on") return true;
  // canary — check per-user membership baked into session
  return session.canaryFlags?.includes(flagName) ?? false;
}
