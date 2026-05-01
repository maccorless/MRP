/**
 * Unit tests for api-key management server actions.
 * Mocks DB and session — no live database required.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/db", () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([{ id: "key-1" }]),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

vi.mock("@/lib/session", () => ({
  requireIocAdminSession: vi.fn().mockResolvedValue({
    userId: "ioc-1",
    displayName: "IOC Admin",
    role: "ioc_admin",
    nocCode: null,
    ifCode: null,
    isSudo: false,
  }),
  requireWritable: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { createApiKey, revokeApiKey } from "@/app/admin/ioc/api-keys/actions";
import { db } from "@/db";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createApiKey", () => {
  it("returns error when user_email is missing", async () => {
    const fd = new FormData();
    fd.set("label", "Claude Desktop");
    const result = await createApiKey(fd);
    expect(result).toMatchObject({ error: expect.stringContaining("email") });
  });

  it("returns error when label is missing", async () => {
    const fd = new FormData();
    fd.set("user_email", "noc@usa.example");
    const result = await createApiKey(fd);
    expect(result).toMatchObject({ error: expect.stringContaining("label") });
  });

  it("returns error when user is not found in DB", async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    });

    const fd = new FormData();
    fd.set("user_email", "nobody@example.com");
    fd.set("label", "Test key");
    const result = await createApiKey(fd);
    expect(result).toMatchObject({ error: expect.stringContaining("No admin user") });
  });

  it("returns rawKey when inputs are valid and user exists", async () => {
    (db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: "user-1", role: "noc_admin", nocCode: "USA" }]),
    });

    const fd = new FormData();
    fd.set("user_email", "noc@usa.example");
    fd.set("label", "Claude Desktop");
    const result = await createApiKey(fd);
    expect(result).toMatchObject({ rawKey: expect.stringMatching(/^prp_[a-f0-9]{32}$/) });
  });
});

describe("revokeApiKey", () => {
  it("calls redirect with error when key_id is missing", async () => {
    const { redirect } = await import("next/navigation");
    const fd = new FormData();
    await revokeApiKey(fd);
    expect(redirect).toHaveBeenCalledWith(expect.stringContaining("error=missing_id"));
  });
});
