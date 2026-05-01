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
    d
      ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "—";

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
