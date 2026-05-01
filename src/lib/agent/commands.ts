import type { SessionPayload } from "@/lib/session";
import { approveEoiDb, returnEoiDb, rejectEoiDb } from "./noc-ops";

function requireNocAdmin(ctx: SessionPayload): { nocCode: string } | { error: string } {
  if (ctx.role !== "noc_admin" || !ctx.nocCode) {
    return { error: "Only NOC admins can perform this action." };
  }
  if (ctx.isSudo) {
    return { error: "Write operations are not available in read-only (sudo) mode." };
  }
  return { nocCode: ctx.nocCode };
}

/**
 * Approve an EOI. NOC admin only. Returns error if eligibility flags are present
 * and overrideFlags is not set — the caller must surface flags and get explicit
 * confirmation before re-calling with overrideFlags: true.
 */
export async function approveEoi(
  ctx: SessionPayload,
  id: string,
  opts?: { overrideFlags?: boolean },
): Promise<{ error?: string; flags?: string[] }> {
  const check = requireNocAdmin(ctx);
  if ("error" in check) return check;

  const result = await approveEoiDb(check.nocCode, id, {
    userId: ctx.userId,
    displayName: ctx.displayName,
    actorType: "api_key",
  }, opts);

  if (result.error?.startsWith("eligibility_ack_required:")) {
    const codes = result.error.replace("eligibility_ack_required:", "").split(",");
    return {
      error: "This application has eligibility flags. Call approveEoi again with overrideFlags: true to proceed.",
      flags: codes,
    };
  }

  return result;
}

/**
 * Return an EOI for revision. Note is required. NOC admin only.
 * This action is reversible (an un-return sets status back to pending).
 */
export async function returnEoi(
  ctx: SessionPayload,
  id: string,
  note: string,
): Promise<{ error?: string }> {
  const check = requireNocAdmin(ctx);
  if ("error" in check) return check;

  return returnEoiDb(check.nocCode, id, note, {
    userId: ctx.userId,
    displayName: ctx.displayName,
    actorType: "api_key",
  });
}

/**
 * Reject an EOI. Note is required. NOC admin only.
 * WARNING: rejections are permanent from the applicant's perspective.
 * They can only be reversed by an IOC admin. Provide a clear note.
 */
export async function rejectEoi(
  ctx: SessionPayload,
  id: string,
  note: string,
): Promise<{ error?: string }> {
  const check = requireNocAdmin(ctx);
  if ("error" in check) return check;

  return rejectEoiDb(check.nocCode, id, note, {
    userId: ctx.userId,
    displayName: ctx.displayName,
    actorType: "api_key",
  });
}
