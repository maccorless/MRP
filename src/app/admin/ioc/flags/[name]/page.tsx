import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { featureFlags, adminUsers } from "@/db/schema";
import { requireIocAdminSession } from "@/lib/session";
import {
  setFlagState,
  enrollUserByEmail,
  enrollNocUsers,
  unenrollUser,
} from "../actions";

const STATE_BADGE: Record<string, string> = {
  off:    "bg-gray-100 text-gray-600",
  canary: "bg-yellow-100 text-yellow-800",
  on:     "bg-green-100 text-green-800",
};

const STATE_LABEL: Record<string, string> = {
  off: "Off", canary: "Canary", on: "On",
};

export default async function FlagDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ success?: string; error?: string; count?: string }>;
}) {
  await requireIocAdminSession();

  const { name: flagName } = await params;
  const sp = await searchParams;

  const [flag] = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.name, flagName));

  if (!flag) notFound();

  // Find all users enrolled in this flag
  const allUsers = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      displayName: adminUsers.displayName,
      role: adminUsers.role,
      nocCode: adminUsers.nocCode,
      canaryFlags: adminUsers.canaryFlags,
    })
    .from(adminUsers);

  const enrolledUsers = allUsers.filter((u) => {
    const cf = u.canaryFlags;
    return Array.isArray(cf) && (cf as string[]).includes(flagName);
  });

  const successMsg: Record<string, string> = {
    created:       "Flag created.",
    state_changed: "Flag state updated.",
    enrolled:      "User enrolled in canary.",
    unenrolled:    "User removed from canary.",
    noc_enrolled:  `${sp.count ?? "0"} user(s) enrolled from NOC.`,
  };
  const errorMsg: Record<string, string> = {
    not_found:       "Flag not found.",
    not_off:         "Flag must be 'off' to delete.",
    user_not_found:  "No user found with that email address.",
    already_enrolled:"User is already enrolled in this flag.",
    noc_not_found:   "No users found for that NOC code.",
  };

  // Available state transitions
  const transitions: { label: string; next: "off" | "canary" | "on"; style: string; confirm?: string }[] = [];
  if (flag.state === "off") {
    transitions.push({
      label: "Start Canary",
      next: "canary",
      style: "bg-yellow-500 text-white hover:bg-yellow-600",
      confirm: `Move "${flagName}" to canary? Only enrolled users will see this feature.`,
    });
  }
  if (flag.state === "canary") {
    transitions.push({
      label: "Graduate to Everyone",
      next: "on",
      style: "bg-green-600 text-white hover:bg-green-700",
      confirm: `Graduate "${flagName}" to ON? This will immediately affect ALL users — no deployment needed.`,
    });
    transitions.push({
      label: "Disable",
      next: "off",
      style: "bg-gray-200 text-gray-700 hover:bg-gray-300",
      confirm: `Disable "${flagName}"? Canary users will lose access immediately.`,
    });
  }
  if (flag.state === "on") {
    transitions.push({
      label: "Return to Canary",
      next: "canary",
      style: "bg-yellow-500 text-white hover:bg-yellow-600",
      confirm: `Return "${flagName}" to canary? This will immediately hide the feature from non-enrolled users.`,
    });
    transitions.push({
      label: "Disable",
      next: "off",
      style: "bg-red-600 text-white hover:bg-red-700",
      confirm: `Disable "${flagName}"? This will immediately remove access for ALL users.`,
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <a href="/admin/ioc/flags" className="text-xs text-gray-400 hover:text-gray-600">
              ← Flags
            </a>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-xl font-bold font-mono text-gray-900">{flag.name}</h1>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STATE_BADGE[flag.state]}`}>
              {STATE_LABEL[flag.state]}
            </span>
          </div>
          {flag.description && (
            <p className="text-sm text-gray-500 mt-0.5">{flag.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            Created {new Date(flag.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {" · "}Updated {new Date(flag.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {sp.success && successMsg[sp.success] && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
          {successMsg[sp.success]}
        </div>
      )}
      {sp.error && errorMsg[sp.error] && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          {errorMsg[sp.error]}
        </div>
      )}

      {/* State controls */}
      {transitions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">State Transition</h2>
          <div className="flex gap-3 flex-wrap">
            {transitions.map((t) => (
              <form key={t.next} action={setFlagState.bind(null, flagName, t.next)}>
                <button
                  type="submit"
                  className={`px-4 py-2 text-sm font-medium rounded transition-colors ${t.style}`}
                  data-confirm={t.confirm}
                >
                  {t.label}
                </button>
              </form>
            ))}
          </div>
          {flag.state === "canary" && (
            <p className="text-xs text-gray-400 mt-3">
              Currently in canary — {enrolledUsers.length} user{enrolledUsers.length !== 1 ? "s" : ""} enrolled.
              Graduating to ON will make this feature available to all users immediately.
            </p>
          )}
          {flag.state === "on" && (
            <p className="text-xs text-amber-600 mt-3 font-medium">
              This flag is ON for all users. Remember to clean up old code paths and delete this flag in the next deploy.
            </p>
          )}
        </div>
      )}

      {/* Enrolled users */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-700">Canary Enrolment</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {enrolledUsers.length} user{enrolledUsers.length !== 1 ? "s" : ""} enrolled
              {flag.state === "on" ? " (flag is ON — everyone has access regardless)" : ""}
            </p>
          </div>
        </div>

        {/* Add by email */}
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <p className="text-xs font-medium text-gray-600 mb-3">Add users to canary:</p>
          <div className="flex gap-4 flex-wrap">
            <form action={enrollUserByEmail.bind(null, flagName)} className="flex gap-2 items-end flex-wrap">
              <div>
                <label className="block text-xs text-gray-500 mb-1">By email address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="admin@example.com"
                  required
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent w-60"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#0057A8] text-white text-xs font-medium rounded hover:bg-[#004a90] transition-colors"
              >
                Enrol
              </button>
            </form>
            <form action={enrollNocUsers.bind(null, flagName)} className="flex gap-2 items-end flex-wrap">
              <div>
                <label className="block text-xs text-gray-500 mb-1">By NOC code (all users in that NOC)</label>
                <input
                  type="text"
                  name="nocCode"
                  placeholder="e.g. USA"
                  required
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#0057A8] focus:border-transparent w-32 uppercase"
                />
              </div>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#0057A8] text-white text-xs font-medium rounded hover:bg-[#004a90] transition-colors"
              >
                Enrol NOC
              </button>
            </form>
          </div>
        </div>

        {/* Enrolled user list */}
        {enrolledUsers.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">
            No users enrolled yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">User</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">Role</th>
                <th className="text-left px-5 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">NOC</th>
                <th className="px-5 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {enrolledUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-5 py-2.5">
                    <div className="font-medium text-gray-900">{user.displayName}</div>
                    <div className="text-xs text-gray-400">{user.email}</div>
                  </td>
                  <td className="px-5 py-2.5 text-xs text-gray-500">{user.role}</td>
                  <td className="px-5 py-2.5 font-mono text-xs text-gray-600">
                    {user.nocCode ?? <span className="italic text-gray-400">–</span>}
                  </td>
                  <td className="px-5 py-2.5 text-right">
                    <form action={unenrollUser.bind(null, flagName, user.id)}>
                      <button
                        type="submit"
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Remove
                      </button>
                    </form>
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
