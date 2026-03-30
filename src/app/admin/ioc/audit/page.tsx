import { desc } from "drizzle-orm";
import { db } from "@/db";
import { auditLog } from "@/db/schema";

const ACTION_LABEL: Record<string, string> = {
  application_submitted:   "Application submitted",
  application_resubmitted: "Application resubmitted",
  application_approved:    "Application approved",
  application_returned:    "Application returned",
  application_rejected:    "Application rejected",
  email_verified:          "Email verified",
  admin_login:             "Admin sign-in",
  duplicate_flag_raised:   "Duplicate flag raised",
  export_generated:        "Export generated",
  pbn_submitted:           "PBN submitted",
};

const ACTION_BADGE: Record<string, string> = {
  application_submitted:   "bg-gray-100 text-gray-700",
  application_resubmitted: "bg-blue-100 text-blue-700",
  application_approved:    "bg-green-100 text-green-700",
  application_returned:    "bg-orange-100 text-orange-700",
  application_rejected:    "bg-red-100 text-red-700",
  email_verified:          "bg-gray-100 text-gray-600",
  admin_login:             "bg-slate-100 text-slate-600",
  duplicate_flag_raised:   "bg-purple-100 text-purple-700",
  export_generated:        "bg-teal-100 text-teal-700",
  pbn_submitted:           "bg-teal-100 text-teal-700",
};

export default async function AuditTrailPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const { action: actionFilter } = await searchParams;

  const logs = await db
    .select()
    .from(auditLog)
    .orderBy(desc(auditLog.createdAt))
    .limit(200);

  const filtered = actionFilter
    ? logs.filter((l) => l.action === actionFilter)
    : logs;

  const actionOptions = [
    "application_submitted", "application_resubmitted", "application_approved",
    "application_returned", "application_rejected", "email_verified", "admin_login",
    "export_generated", "pbn_submitted",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Append-only log — {filtered.length} entries{actionFilter ? ` filtered by "${ACTION_LABEL[actionFilter] ?? actionFilter}"` : " (latest 200)"}
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <a
          href="/admin/ioc/audit"
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            !actionFilter ? "bg-[#0057A8] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          All ({logs.length})
        </a>
        {actionOptions.map((action) => {
          const count = logs.filter((l) => l.action === action).length;
          if (count === 0) return null;
          return (
            <a
              key={action}
              href={`/admin/ioc/audit?action=${action}`}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                actionFilter === action
                  ? "bg-[#0057A8] text-white"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {ACTION_LABEL[action]} ({count})
            </a>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">No entries.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Timestamp</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Actor</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Application</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-5 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "numeric", minute: "2-digit",
                    })}
                  </td>
                  <td className="px-5 py-2.5">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${ACTION_BADGE[log.action] ?? "bg-gray-100 text-gray-600"}`}>
                      {ACTION_LABEL[log.action] ?? log.action}
                    </span>
                  </td>
                  <td className="px-5 py-2.5">
                    <div className="text-gray-900">{log.actorLabel ?? log.actorId ?? "—"}</div>
                    <div className="text-xs text-gray-400 capitalize">{log.actorType}</div>
                  </td>
                  <td className="px-5 py-2.5 font-mono text-xs text-gray-500">
                    {log.applicationId?.slice(0, 8) ?? "—"}
                  </td>
                  <td className="px-5 py-2.5 text-xs text-gray-500 max-w-xs truncate">
                    {log.detail ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
