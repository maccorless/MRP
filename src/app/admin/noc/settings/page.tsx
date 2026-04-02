import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { nocEoiWindows } from "@/db/schema";
import { requireNocSession } from "@/lib/session";
import { toggleEoiWindow } from "./actions";

export default async function NocSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await requireNocSession();
  const nocCode = session.nocCode;
  const { success } = await searchParams;

  const [windowRow] = await db
    .select()
    .from(nocEoiWindows)
    .where(and(eq(nocEoiWindows.nocCode, nocCode), eq(nocEoiWindows.eventId, "LA28")));

  // Absence of a row means the window is OPEN (safe default)
  const isOpen = windowRow ? windowRow.isOpen : true;
  const toggledAt = windowRow?.toggledAt ?? null;
  const toggledBy = windowRow?.toggledBy ?? null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Settings — {nocCode}</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your NOC&apos;s EoI submission window.</p>
      </div>

      {success === "window_opened" && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded text-green-800 text-sm">
          EoI window is now open. Applicants can submit.
        </div>
      )}
      {success === "window_closed" && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
          EoI window is now closed. New applications will be blocked.
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">EoI Submission Window</h2>

        <div className="flex items-center gap-3 mb-4">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isOpen
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {isOpen ? "Open" : "Closed"}
          </span>
          <span className="text-sm text-gray-600">
            {isOpen
              ? "Applicants from your NOC can submit new EoIs."
              : "New applications from your NOC are currently blocked."}
          </span>
        </div>

        {toggledAt && (
          <p className="text-xs text-gray-400 mb-4">
            Last changed{toggledBy ? ` by ${toggledBy}` : ""} on{" "}
            {new Date(toggledAt).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}

        <form action={toggleEoiWindow}>
          <input type="hidden" name="set_open" value={isOpen ? "false" : "true"} />
          <button
            type="submit"
            className={`px-4 py-2 text-sm font-semibold rounded transition-colors cursor-pointer ${
              isOpen
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isOpen ? "Close EoI Window" : "Open EoI Window"}
          </button>
          {isOpen && (
            <p className="mt-2 text-xs text-gray-400">
              Closing the window will immediately prevent new applications. You can re-open it at any time.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
