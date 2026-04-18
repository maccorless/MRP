import { db } from "@/db";
import { featureFlags, adminUsers } from "@/db/schema";
import { requireIocAdminSession } from "@/lib/session";
import { asc } from "drizzle-orm";
import { createFlag, deleteFlag } from "./actions";

const STATE_BADGE: Record<string, string> = {
  off:    "bg-gray-100 text-gray-600",
  canary: "bg-yellow-100 text-yellow-800",
  on:     "bg-green-100 text-green-800",
};

const STATE_LABEL: Record<string, string> = {
  off: "Off", canary: "Canary", on: "On",
};

export default async function FlagsListPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await requireIocAdminSession();

  const params = await searchParams;

  const flags = await db
    .select()
    .from(featureFlags)
    .orderBy(asc(featureFlags.createdAt));

  // Build enrolled user count per flag
  const allUsers = await db
    .select({ id: adminUsers.id, canaryFlags: adminUsers.canaryFlags })
    .from(adminUsers);

  const enrolledCounts: Record<string, number> = {};
  for (const flag of flags) {
    enrolledCounts[flag.name] = allUsers.filter((u) => {
      const cf = u.canaryFlags;
      return Array.isArray(cf) && (cf as string[]).includes(flag.name);
    }).length;
  }

  const successMsg: Record<string, string> = {
    deleted: "Flag deleted.",
  };
  const errorMsg: Record<string, string> = {
    not_found:    "Flag not found.",
    not_off:      "Flag must be in 'off' state to delete.",
    missing_name: "Flag name is required.",
    invalid_name: "Flag name must contain only lowercase letters, numbers, and underscores.",
    name_taken:   "A flag with that name already exists.",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Feature Flags</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {flags.length} flag{flags.length !== 1 ? "s" : ""} registered
          </p>
        </div>
      </div>

      {params.success && successMsg[params.success] && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
          {successMsg[params.success]}
        </div>
      )}
      {params.error && errorMsg[params.error] && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          {errorMsg[params.error]}
        </div>
      )}

      {/* Create flag */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Create New Flag</h2>
        <form action={createFlag} className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Flag name <span className="text-gray-400">(lowercase, underscores only)</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. new_pbn_ui"
              pattern="[a-z0-9_]+"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
          <div className="flex-1 min-w-64">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Description
            </label>
            <input
              type="text"
              name="description"
              placeholder="Short description of what this flag controls"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-brand-blue text-white text-sm font-medium rounded hover:bg-[#004a90] transition-colors whitespace-nowrap"
          >
            Create flag
          </button>
        </form>
      </div>

      {/* Flag list */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {flags.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No feature flags yet. Create one above.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Flag</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">State</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Enrolled</th>
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Created</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {flags.map((flag) => (
                <tr key={flag.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <a
                      href={`/admin/ioc/flags/${flag.name}`}
                      className="font-mono font-semibold text-brand-blue hover:underline"
                    >
                      {flag.name}
                    </a>
                    {flag.description && (
                      <div className="text-xs text-gray-500 mt-0.5">{flag.description}</div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATE_BADGE[flag.state]}`}>
                      {STATE_LABEL[flag.state]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-gray-700">
                    {enrolledCounts[flag.name] ?? 0}
                    {flag.state === "on" && (
                      <span className="text-xs text-gray-400 ml-1">(all)</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {new Date(flag.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-3 text-right">
                    {flag.state === "off" && (
                      <form action={deleteFlag.bind(null, flag.name)}>
                        <button
                          type="submit"
                          className="text-xs text-red-600 hover:text-red-800 font-medium"
                          data-confirm={`Delete flag "${flag.name}"? This cannot be undone.`}
                        >
                          Delete
                        </button>
                      </form>
                    )}
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
