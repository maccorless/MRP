import type { AuditRow } from "@/lib/audit-query";
import { ACTION_LABEL, ACTION_BADGE } from "@/lib/audit-query";
import { Icon } from "@/components/Icon";

const PAGE_SIZE = 200;

type Props = {
  logs: AuditRow[];
  total: number;
  page: number;
  totalPages: number;
  q: string;
  filterDescription: string;
  basePath: string;   // e.g. "/admin/ioc/audit"
  exportHref: string;
};

function pageHref(basePath: string, q: string, p: number): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (p > 1) params.set("page", String(p));
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function AuditTrailView({
  logs,
  total,
  page,
  totalPages,
  q,
  filterDescription,
  basePath,
  exportHref,
}: Props) {
  const rowStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rowEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Trail</h1>
          <p className="text-sm text-gray-600 mt-0.5">
            {total.toLocaleString()} {total === 1 ? "entry" : "entries"}{" "}
            {filterDescription}
          </p>
        </div>
        <a
          href={exportHref}
          className="shrink-0 px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Export CSV <Icon name="download" className="inline w-3.5 h-3.5 ml-0.5 -mt-0.5" />
        </a>
      </div>

      {/* Search bar */}
      <form method="GET" action={basePath}>
        <div className="flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="actor:kim  action:approved  type:noc_admin  from:2025-01-01  to:2025-12-31  date:2025-11-04"
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-brand-blue text-white rounded-md text-sm font-medium hover:bg-blue-800 transition-colors"
          >
            Search
          </button>
          {q && (
            <a
              href={basePath}
              className="px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Clear
            </a>
          )}
        </div>
        <p className="mt-1.5 text-xs text-gray-600">
          Tokens: <span className="font-mono">actor:</span> <span className="font-mono">action:</span> <span className="font-mono">type:</span> <span className="font-mono">date:</span> <span className="font-mono">from:</span> <span className="font-mono">to:</span> — or type freely to search actor name &amp; detail
        </p>
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No entries match your search.</div>
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
              {logs.map((log) => (
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
                    <div className="text-xs text-gray-500 capitalize">{log.actorType.replace(/_/g, " ")}</div>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 text-xs">
            Showing {rowStart.toLocaleString()}–{rowEnd.toLocaleString()} of {total.toLocaleString()}
          </span>
          <div className="flex items-center gap-3">
            {page > 1 ? (
              <a href={pageHref(basePath, q, page - 1)} className="text-brand-blue hover:underline text-xs">
                ← Previous
              </a>
            ) : (
              <span className="text-gray-600 text-xs">← Previous</span>
            )}
            <span className="text-xs text-gray-600">Page {page} of {totalPages}</span>
            {page < totalPages ? (
              <a href={pageHref(basePath, q, page + 1)} className="text-brand-blue hover:underline text-xs">
                Next →
              </a>
            ) : (
              <span className="text-gray-600 text-xs">Next →</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
