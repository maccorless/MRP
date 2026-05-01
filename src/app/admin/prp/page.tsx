import { requirePrpAdminSession } from "@/lib/session";

/**
 * PRP Admin settings panel — B4.
 * Currently a stub; capabilities to be added per plan B4.
 */
export default async function PrpAdminPage() {
  await requirePrpAdminSession();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">PRP Admin Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Platform-wide controls for PRP admins.
        </p>
      </div>

      <div className="grid gap-4">
        {/* Date management */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Date Management</h2>
          <p className="text-xs text-gray-500">Re-open EoI windows; set or extend PbN deadlines per NOC or IF.</p>
          <p className="text-xs text-gray-400 mt-2 italic">Coming soon.</p>
        </div>

        {/* Workflow controls */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Workflow Controls</h2>
          <p className="text-xs text-gray-500">Re-enable push-to-ACR for a specific NOC or IF.</p>
          <p className="text-xs text-gray-400 mt-2 italic">Coming soon.</p>
        </div>

        {/* Country eligibility */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Country Eligibility</h2>
          <p className="text-xs text-gray-500">Manage ineligible countries (RUS, BLR, others). Blocked pending stakeholder decision on hard-block vs soft-flag behaviour.</p>
          <p className="text-xs text-gray-400 mt-2 italic">Blocked — awaiting A11 decision.</p>
        </div>

        {/* Feature flags */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Feature Flags</h2>
          <p className="text-xs text-gray-500">Toggle feature flags across the portal.</p>
          <p className="text-xs text-gray-400 mt-2 italic">Coming soon.</p>
        </div>

        {/* Content editor */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Content Editor</h2>
          <p className="text-xs text-gray-500">
            Use the PRP Admin bar (purple bar at the top of each page) to edit strings inline.
            Toggle to Draft mode, click any highlighted string, and save your changes. Use the Publish
            button to push changes to the live site.
          </p>
        </div>
      </div>
    </div>
  );
}
