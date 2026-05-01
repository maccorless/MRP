/**
 * Unit tests: agent permission scoping and command authorization.
 *
 * These tests cover pure logic — no DB required. Integration tests that
 * verify actual query scoping require a live database and are out of scope here.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SessionPayload } from "@/lib/session";

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const nocAdmin: SessionPayload = {
  userId: "user-1",
  email: "noc@usa.example",
  role: "noc_admin",
  nocCode: "USA",
  ifCode: null,
  displayName: "Test NOC Admin",
  isSudo: false,
};

const iocAdmin: SessionPayload = {
  userId: "user-2",
  email: "ioc@la28.example",
  role: "ioc_admin",
  nocCode: null,
  ifCode: null,
  displayName: "Test IOC Admin",
  isSudo: false,
};

const iocReadonly: SessionPayload = {
  userId: "user-3",
  email: "readonly@la28.example",
  role: "ioc_readonly",
  nocCode: null,
  ifCode: null,
  displayName: "Test IOC Readonly",
  isSudo: false,
};

const sudoSession: SessionPayload = {
  userId: "user-4",
  email: "noc@ger.example",
  role: "noc_admin",
  nocCode: "GER",
  ifCode: null,
  displayName: "Test Sudo Session",
  isSudo: true,
};

// ─── Mock the noc-ops module ──────────────────────────────────────────────────

vi.mock("@/lib/agent/noc-ops", () => ({
  approveEoiDb: vi.fn().mockResolvedValue({}),
  returnEoiDb: vi.fn().mockResolvedValue({}),
  rejectEoiDb: vi.fn().mockResolvedValue({}),
}));

import { approveEoi, returnEoi, rejectEoi } from "@/lib/agent/commands";
import { approveEoiDb, returnEoiDb, rejectEoiDb } from "@/lib/agent/noc-ops";

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── NOC Admin Role Guard ─────────────────────────────────────────────────────

describe("approveEoi — role guard", () => {
  it("rejects a non-noc_admin session", async () => {
    const result = await approveEoi(iocAdmin, "app-1");
    expect(result.error).toBeDefined();
    expect(approveEoiDb).not.toHaveBeenCalled();
  });

  it("rejects a sudo session", async () => {
    const result = await approveEoi(sudoSession, "app-1");
    expect(result.error).toBeDefined();
    expect(approveEoiDb).not.toHaveBeenCalled();
  });

  it("passes through for a valid noc_admin session", async () => {
    await approveEoi(nocAdmin, "app-1");
    expect(approveEoiDb).toHaveBeenCalledWith(
      "USA",
      "app-1",
      expect.objectContaining({ actorType: "api_key" }),
      undefined,
    );
  });

  it("uses api_key actor type, not noc_admin", async () => {
    await approveEoi(nocAdmin, "app-1");
    const [, , actor] = (approveEoiDb as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(actor.actorType).toBe("api_key");
  });
});

describe("returnEoi — role guard", () => {
  it("rejects a non-noc_admin session", async () => {
    const result = await returnEoi(iocReadonly, "app-1", "some note");
    expect(result.error).toBeDefined();
    expect(returnEoiDb).not.toHaveBeenCalled();
  });

  it("rejects a sudo session", async () => {
    const result = await returnEoi(sudoSession, "app-1", "some note");
    expect(result.error).toBeDefined();
  });

  it("calls returnEoiDb with the NOC's own nocCode", async () => {
    await returnEoi(nocAdmin, "app-1", "needs corrections");
    expect(returnEoiDb).toHaveBeenCalledWith(
      "USA",
      "app-1",
      "needs corrections",
      expect.objectContaining({ actorType: "api_key", userId: "user-1" }),
    );
  });
});

describe("rejectEoi — role guard", () => {
  it("rejects a non-noc_admin session", async () => {
    const result = await rejectEoi(iocAdmin, "app-1", "some note");
    expect(result.error).toBeDefined();
    expect(rejectEoiDb).not.toHaveBeenCalled();
  });

  it("calls rejectEoiDb with the NOC's own nocCode", async () => {
    await rejectEoi(nocAdmin, "app-1", "incomplete credentials");
    expect(rejectEoiDb).toHaveBeenCalledWith(
      "USA",
      "app-1",
      "incomplete credentials",
      expect.objectContaining({ actorType: "api_key" }),
    );
  });
});

// ─── Eligibility Flag Handling ────────────────────────────────────────────────

describe("approveEoi — eligibility flag surfacing", () => {
  it("surfaces flags as a structured error when eligibility check fails", async () => {
    (approveEoiDb as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      error: "eligibility_ack_required:gov_domain",
    });

    const result = await approveEoi(nocAdmin, "app-2");
    expect(result.error).toContain("eligibility flags");
    expect(result.flags).toEqual(["gov_domain"]);
  });

  it("passes overrideFlags through to approveEoiDb", async () => {
    await approveEoi(nocAdmin, "app-2", { overrideFlags: true });
    const [, , , opts] = (approveEoiDb as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(opts.overrideFlags).toBe(true);
  });
});
