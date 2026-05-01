# Agent Interface Phase 4 — API Key Management UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `/admin/ioc/api-keys` page where IOC admins can generate, label, and revoke API keys for any admin user — replacing the CLI-only workflow with a self-service UI.

**Architecture:** Server component page reads all keys (joined to admin users) and renders a table. A client modal handles key creation using a server action, showing the raw key exactly once after creation. Revocation is a plain server action triggered by an inline form. Two new audit action enum values (`api_key_created`, `api_key_revoked`) require a migration before the actions file can reference them.

**Tech Stack:** Next.js 16 App Router · Drizzle ORM · PostgreSQL · Tailwind CSS 4 · TypeScript · Vitest (unit tests) · `@testing-library/react` is NOT available — UI tests use Playwright e2e or are skipped in favour of server action unit tests.

**Branch:** All work must be done on the `agent` branch (`git checkout agent` before starting).

---

## File Map

| File | Create / Modify | Responsibility |
|---|---|---|
| `src/db/migrations/0037_api_key_audit_actions.sql` | Create | Adds `api_key_created` and `api_key_revoked` to the `audit_action` enum |
| `src/db/schema.ts` | Modify | Add the two new values to `auditActionEnum` so Drizzle types stay in sync |
| `src/app/admin/ioc/api-keys/actions.ts` | Create | `createApiKey` and `revokeApiKey` server actions |
| `src/app/admin/ioc/api-keys/CreateKeyModal.tsx` | Create | Client component — form + shows raw key once |
| `src/app/admin/ioc/api-keys/page.tsx` | Create | Server component — table of all keys |
| `src/app/admin/ioc/nav.tsx` | Modify | Add "API Keys" nav item |
| `src/test/agent-api-key-actions.test.ts` | Create | Unit tests for `createApiKey` and `revokeApiKey` |

---

## Task 1: Switch to the agent branch

- [ ] **Step 1.1: Check out the agent branch**

```bash
git checkout agent
```

Expected output: `Switched to branch 'agent'`

- [ ] **Step 1.2: Verify the apiKeys table exists in schema**

```bash
grep -n "export const apiKeys" src/db/schema.ts
```

Expected: a line like `export const apiKeys = pgTable("api_keys", {`

If that line is not present, the Phase 1 work has not been merged and this plan cannot proceed. Stop and consult.

---

## Task 2: Migration — new audit action enum values

Two new values (`api_key_created`, `api_key_revoked`) are needed in the `audit_action` PostgreSQL enum before the server actions can log those events. The existing migration runner at `src/db/migrate.ts` handles `ALTER TYPE ADD VALUE` statements without a transaction wrapper.

- [ ] **Step 2.1: Create the migration file**

Create `src/db/migrations/0037_api_key_audit_actions.sql`:

```sql
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'api_key_created';
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'api_key_revoked';
```

- [ ] **Step 2.2: Update the Drizzle schema to match**

In `src/db/schema.ts`, find `auditActionEnum` and add the two new values. The enum currently ends with `"excel_reimport"`. Add after it:

```typescript
// 2026-05-01 — agent interface API key management
"api_key_created",
"api_key_revoked",
```

The full pgEnum call should now include those two strings in its array.

- [ ] **Step 2.3: Apply the migration**

```bash
bun db:migrate
```

Expected: migration 0037 runs, no errors.

- [ ] **Step 2.4: Verify type-check passes**

```bash
bun run tsc --noEmit 2>&1 | grep "schema.ts"
```

Expected: no output (no errors in schema.ts).

- [ ] **Step 2.5: Commit**

```bash
git add src/db/migrations/0037_api_key_audit_actions.sql src/db/schema.ts
git commit -m "feat(agent): add api_key_created / api_key_revoked audit action enum values"
```

---

## Task 3: Server actions

- [ ] **Step 3.1: Write the failing tests first**

Create `src/test/agent-api-key-actions.test.ts`:

```typescript
/**
 * Unit tests for api-key management server actions.
 * These tests mock the DB and session so no live database is needed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ────────────────────────────────────────────────────────────────────

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
    // select().from().where().limit() returns empty array = user not found
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    } as unknown as ReturnType<typeof db.select>);

    const fd = new FormData();
    fd.set("user_email", "nobody@example.com");
    fd.set("label", "Test key");
    const result = await createApiKey(fd);
    expect(result).toMatchObject({ error: expect.stringContaining("No admin user") });
  });

  it("returns rawKey when all inputs are valid and user exists", async () => {
    // First select = user lookup → returns a user
    vi.mocked(db.select).mockReturnValueOnce({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ id: "user-1", role: "noc_admin", nocCode: "USA" }]),
    } as unknown as ReturnType<typeof db.select>);

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
```

- [ ] **Step 3.2: Run tests to confirm they fail**

```bash
bun test src/test/agent-api-key-actions.test.ts 2>&1 | tail -10
```

Expected: import errors or "createApiKey is not a function" — the file doesn't exist yet.

- [ ] **Step 3.3: Create the server actions file**

Create `src/app/admin/ioc/api-keys/actions.ts`:

```typescript
"use server";

import { redirect } from "next/navigation";
import { createHash, randomBytes } from "crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, auditLog, adminUsers } from "@/db/schema";
import { requireIocAdminSession, requireWritable } from "@/lib/session";

export async function createApiKey(
  formData: FormData,
): Promise<{ error: string } | { rawKey: string }> {
  await requireWritable();
  const session = await requireIocAdminSession();

  const userEmail = (formData.get("user_email") as string)?.trim().toLowerCase();
  const label = (formData.get("label") as string)?.trim();
  const expiresStr = (formData.get("expires_at") as string)?.trim();

  if (!userEmail) return { error: "User email is required." };
  if (!label) return { error: "Label is required." };

  const [user] = await db
    .select({ id: adminUsers.id, role: adminUsers.role, nocCode: adminUsers.nocCode })
    .from(adminUsers)
    .where(eq(adminUsers.email, userEmail))
    .limit(1);

  if (!user) return { error: `No admin user found for "${userEmail}".` };

  const rawKey = `prp_${randomBytes(16).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 8);
  const expiresAt = expiresStr ? new Date(expiresStr) : null;

  await db.insert(apiKeys).values({
    keyHash,
    keyPrefix,
    userId: user.id,
    label,
    expiresAt,
  });

  await db.insert(auditLog).values({
    actorType: "ioc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "api_key_created",
    detail: `API key "${label}" created for ${userEmail}`,
  });

  return { rawKey };
}

export async function revokeApiKey(formData: FormData): Promise<void> {
  await requireWritable();
  const session = await requireIocAdminSession();

  const keyId = formData.get("key_id") as string;
  if (!keyId) redirect("/admin/ioc/api-keys?error=missing_id");

  const now = new Date();
  const [updated] = await db
    .update(apiKeys)
    .set({ revokedAt: now })
    .where(and(eq(apiKeys.id, keyId), isNull(apiKeys.revokedAt)))
    .returning({ id: apiKeys.id });

  if (!updated) redirect("/admin/ioc/api-keys?error=not_found");

  await db.insert(auditLog).values({
    actorType: "ioc_admin",
    actorId: session.userId,
    actorLabel: session.displayName,
    action: "api_key_revoked",
    detail: `API key ${keyId} revoked`,
  });

  redirect("/admin/ioc/api-keys?success=revoked");
}
```

- [ ] **Step 3.4: Run tests — they should pass**

```bash
bun test src/test/agent-api-key-actions.test.ts 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 3.5: Type-check the actions file**

```bash
bun run tsc --noEmit 2>&1 | grep "api-keys/actions"
```

Expected: no output.

- [ ] **Step 3.6: Commit**

```bash
git add src/app/admin/ioc/api-keys/actions.ts src/test/agent-api-key-actions.test.ts
git commit -m "feat(agent): api-key server actions — create and revoke with audit log"
```

---

## Task 4: Create key modal (client component)

The modal handles the creation form and displays the raw key exactly once after creation. It lives in the same folder as the page.

- [ ] **Step 4.1: Create the modal component**

Create `src/app/admin/ioc/api-keys/CreateKeyModal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createApiKey } from "./actions";

export function CreateKeyModal() {
  const [open, setOpen] = useState(false);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const result = await createApiKey(fd);
    setLoading(false);
    if ("error" in result) {
      setError(result.error);
    } else {
      setRawKey(result.rawKey);
    }
  }

  function handleClose() {
    setOpen(false);
    setRawKey(null);
    setError(null);
    // Reload page so the new key appears in the table without full navigation
    window.location.reload();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-brand-blue text-white rounded text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        Generate API Key
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            {rawKey ? (
              // ── Step 2: Show the raw key once ───────────────────────────────
              <>
                <h2 className="text-base font-semibold text-gray-900">Key created</h2>
                <p className="text-sm text-gray-600">
                  Copy this key now. It will not be shown again.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm break-all select-all">
                  {rawKey}
                </div>
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Done — I've copied the key
                </button>
              </>
            ) : (
              // ── Step 1: Creation form ─────────────────────────────────────
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-base font-semibold text-gray-900">Generate API Key</h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin user email
                  </label>
                  <input
                    name="user_email"
                    type="email"
                    required
                    placeholder="noc@example.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label
                  </label>
                  <input
                    name="label"
                    type="text"
                    required
                    placeholder="Claude Desktop"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    A name to identify where this key is used.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expires (optional)
                  </label>
                  <input
                    name="expires_at"
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave blank for no expiry.
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-brand-blue text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {loading ? "Generating…" : "Generate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4.2: Type-check the modal**

```bash
bun run tsc --noEmit 2>&1 | grep "api-keys/CreateKeyModal"
```

Expected: no output.

- [ ] **Step 4.3: Commit**

```bash
git add src/app/admin/ioc/api-keys/CreateKeyModal.tsx
git commit -m "feat(agent): CreateKeyModal — generate key form with one-time display"
```

---

## Task 5: Page component

The server component queries all keys joined to admin users, ordered by created date descending. The revoke button is an inline form (no client component needed).

- [ ] **Step 5.1: Create the page**

Create `src/app/admin/ioc/api-keys/page.tsx`:

```tsx
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { apiKeys, adminUsers } from "@/db/schema";
import { requireIocAdminSession } from "@/lib/session";
import { CreateKeyModal } from "./CreateKeyModal";
import { revokeApiKey } from "./actions";

export default async function ApiKeysPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  await requireIocAdminSession();
  const { success, error } = await searchParams;

  const rows = await db
    .select({
      id: apiKeys.id,
      keyPrefix: apiKeys.keyPrefix,
      label: apiKeys.label,
      createdAt: apiKeys.createdAt,
      lastUsedAt: apiKeys.lastUsedAt,
      expiresAt: apiKeys.expiresAt,
      revokedAt: apiKeys.revokedAt,
      userEmail: adminUsers.email,
      userRole: adminUsers.role,
      userNocCode: adminUsers.nocCode,
    })
    .from(apiKeys)
    .innerJoin(adminUsers, eq(apiKeys.userId, adminUsers.id))
    .orderBy(desc(apiKeys.createdAt));

  const fmt = (d: Date | null) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">API Keys</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            Manage Bearer tokens for agent integrations (Claude Desktop, ChatGPT, Copilot, Gemini).
          </p>
        </div>
        <CreateKeyModal />
      </div>

      {success === "revoked" && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          Key revoked successfully.
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error === "missing_id" ? "No key ID provided." : "Key not found or already revoked."}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-5 py-8 text-sm text-gray-500 text-center">
            No API keys yet. Generate one above.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Key</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Label</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Created</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Last used</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Expires</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => {
                const isExpired = row.expiresAt && new Date(row.expiresAt) < new Date();
                const isRevoked = !!row.revokedAt;
                const statusLabel = isRevoked ? "Revoked" : isExpired ? "Expired" : "Active";
                const statusClass = isRevoked
                  ? "bg-red-100 text-red-700"
                  : isExpired
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700";
                return (
                  <tr key={row.id} className={isRevoked ? "opacity-50" : ""}>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{row.keyPrefix}…</td>
                    <td className="px-5 py-3 text-gray-900">{row.label}</td>
                    <td className="px-5 py-3">
                      <div className="text-gray-900">{row.userEmail}</div>
                      <div className="text-xs text-gray-500">
                        {row.userRole}{row.userNocCode ? ` · ${row.userNocCode}` : ""}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmt(row.createdAt)}</td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmt(row.lastUsedAt)}</td>
                    <td className="px-5 py-3 text-gray-600 whitespace-nowrap">{fmt(row.expiresAt)}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!isRevoked && (
                        <form action={revokeApiKey}>
                          <input type="hidden" name="key_id" value={row.id} />
                          <button
                            type="submit"
                            className="text-xs text-red-600 hover:text-red-800 font-medium"
                            onClick={(e) => {
                              if (!confirm(`Revoke key "${row.label}"? This cannot be undone.`)) {
                                e.preventDefault();
                              }
                            }}
                          >
                            Revoke
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 5.2: Type-check the page**

```bash
bun run tsc --noEmit 2>&1 | grep "api-keys/page"
```

Expected: no output.

- [ ] **Step 5.3: Commit**

```bash
git add src/app/admin/ioc/api-keys/page.tsx
git commit -m "feat(agent): api-keys page — list with revoke, success/error banners"
```

---

## Task 6: Add nav item

- [ ] **Step 6.1: Add "API Keys" to the IOC nav**

In `src/app/admin/ioc/nav.tsx`, find the `NAV` array and add the new item at the end, before the closing `]`:

```typescript
{ href: "/admin/ioc/api-keys", label: "API Keys" },
```

The full array after the edit:

```typescript
const NAV = [
  { href: "/admin/ioc", label: "Dashboard" },
  { href: "/admin/ioc/master", label: "Master Allocations" },
  { href: "/admin/ioc/quotas", label: "Quotas" },
  { href: "/admin/ioc/direct", label: "IOC Direct" },
  { href: "/admin/ioc/enr", label: "ENR Review" },
  { href: "/admin/ioc/orgs", label: "Org Directory" },
  { href: "/admin/ioc/audit", label: "Audit Trail" },
  { href: "/admin/ioc/export", label: "PBN Export" },
  { href: "/admin/ioc/api-keys", label: "API Keys" },
];
```

- [ ] **Step 6.2: Type-check**

```bash
bun run tsc --noEmit 2>&1 | grep "ioc/nav"
```

Expected: no output.

- [ ] **Step 6.3: Commit**

```bash
git add src/app/admin/ioc/nav.tsx
git commit -m "feat(agent): add API Keys nav item to IOC admin nav"
```

---

## Task 7: Smoke test in the browser

- [ ] **Step 7.1: Start the dev server on the agent branch**

```bash
bun dev
```

Open `http://localhost:3000` in a browser and log in as an IOC admin.

- [ ] **Step 7.2: Verify the nav item appears**

Navigate to `/admin/ioc`. Confirm "API Keys" appears in the nav bar.

- [ ] **Step 7.3: Create a key**

Click "API Keys" → "Generate API Key". Enter any admin user email and label. Submit. Confirm the raw key is displayed in the modal. Click "Done".

- [ ] **Step 7.4: Verify the key appears in the table**

Confirm a row with the correct label, user email, prefix (`prp_…`), and "Active" status appears.

- [ ] **Step 7.5: Revoke the key**

Click "Revoke" on the row. Confirm the confirmation dialog fires, the key disappears (or shows "Revoked"), and a green success banner appears.

- [ ] **Step 7.6: Verify the key no longer authenticates**

Generate a new test key. Use it to call the MCP endpoint:

```bash
curl -X POST http://localhost:3000/api/mcp \
  -H "Authorization: Bearer <raw-key>" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

Expected: a valid JSON-RPC response listing the 11 tools.

Now revoke that key and repeat the curl. Expected: `401 Unauthorized`.

---

## Task 8: Run full test suite and push

- [ ] **Step 8.1: Run unit tests**

```bash
bun test
```

Expected: all tests pass. The `agent-permissions.test.ts` (11 tests) and `agent-api-key-actions.test.ts` should both pass.

- [ ] **Step 8.2: Type-check one more time**

```bash
bun run tsc --noEmit 2>&1 | grep -v "auth-boundaries\|validator.ts" | grep "error"
```

Expected: no output (no new errors beyond the two pre-existing files).

- [ ] **Step 8.3: Push the agent branch**

```bash
git push origin agent
```

---

## Self-Review Notes

**Spec coverage:**
- Migration for new enum values: Task 2 ✓
- `createApiKey` server action: Task 3 ✓
- `revokeApiKey` server action: Task 3 ✓
- Create Key Modal (one-time key display): Task 4 ✓
- API Keys page (table + banners): Task 5 ✓
- Nav item: Task 6 ✓
- Browser smoke test (including curl auth check): Task 7 ✓

**Out of scope (per design):** Rate limiting (noted as stretch in plan), Phase 1–3 already implemented on `agent` branch and not repeated here.

**Merge to main:** Intentionally not included. The design plan specifies the agent branch does not merge to main until the full MCP surface is verified end-to-end. That decision belongs to the human.
