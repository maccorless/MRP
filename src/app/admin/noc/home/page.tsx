import Link from "next/link";
import { eq, and } from "drizzle-orm";
import { db } from "@/db";
import { applications, orgSlotAllocations, enrRequests, nocQuotas } from "@/db/schema";
import { requireNocSession } from "@/lib/session";

const MILESTONES = [
  { label: "EoI application window opens",  date: "Feb 2028",  state: "done"     },
  { label: "NOC EoI review deadline",        date: "Apr 2028",  state: "active"   },
  { label: "PbN submission deadline",        date: "May 2028",  state: "upcoming" },
  { label: "ENR nominations deadline",       date: "Jun 2028",  state: "upcoming" },
  { label: "Final accreditation confirmed",  date: "Jan 2028",  state: "upcoming" },
] as const;

export default async function NocHomePage() {
  const session = await requireNocSession();
  const nocCode = session.nocCode;

  // EoI stats
  const apps = await db
    .select({ status: applications.status })
    .from(applications)
    .where(eq(applications.nocCode, nocCode));

  const appCounts = apps.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    return acc;
  }, {});
  const pendingReview = (appCounts.pending ?? 0) + (appCounts.resubmitted ?? 0);

  // PbN status
  const quota = await db
    .select()
    .from(nocQuotas)
    .where(and(eq(nocQuotas.nocCode, nocCode), eq(nocQuotas.eventId, "LA28")))
    .then((r) => r[0] ?? null);

  const allocs = await db
    .select({ pbnState: orgSlotAllocations.pbnState, pressSlots: orgSlotAllocations.pressSlots, photoSlots: orgSlotAllocations.photoSlots })
    .from(orgSlotAllocations)
    .where(and(eq(orgSlotAllocations.nocCode, nocCode), eq(orgSlotAllocations.eventId, "LA28")));

  const pbnStatus = (() => {
    if (allocs.length === 0) return "not_started";
    if (allocs.some((a) => a.pbnState === "ocog_approved")) return "approved";
    if (allocs.some((a) => a.pbnState === "noc_submitted")) return "submitted";
    return "draft";
  })();
  const pbnAllocatedPress = allocs.reduce((s, a) => s + a.pressSlots, 0);
  const pbnAllocatedPhoto = allocs.reduce((s, a) => s + a.photoSlots, 0);

  // ENR status
  const enrList = await db
    .select({ submittedAt: enrRequests.submittedAt, decision: enrRequests.decision, slotsRequested: enrRequests.slotsRequested, slotsGranted: enrRequests.slotsGranted })
    .from(enrRequests)
    .where(and(eq(enrRequests.nocCode, nocCode), eq(enrRequests.eventId, "LA28")));

  const enrStatus = (() => {
    if (enrList.length === 0) return "not_started";
    if (enrList.every((e) => e.decision !== null)) return "decided";
    if (enrList.some((e) => e.submittedAt !== null)) return "submitted";
    return "draft";
  })();
  const enrTotalRequested = enrList.reduce((s, e) => s + e.slotsRequested, 0);
  const enrTotalGranted   = enrList.reduce((s, e) => s + (e.slotsGranted ?? 0), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {session.displayName}</h1>
        <p className="text-sm text-gray-500 mt-1">NOC Admin · {nocCode} · LA 2028</p>
      </div>

      <div className="grid grid-cols-1 gap-5">
        {/* EoI Queue card */}
        <Link href="/admin/noc/queue" className="group block bg-white rounded-xl border-2 border-gray-200 hover:border-[#0057A8] p-6 transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-[#0057A8] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">EoI</span>
                </div>
                <h2 className="font-semibold text-gray-900 group-hover:text-[#0057A8] transition-colors">
                  Expression of Interest Queue
                </h2>
              </div>
              <p className="text-xs text-gray-500 ml-10">Review and action media org applications</p>
            </div>
            {pendingReview > 0 ? (
              <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                {pendingReview} to review
              </span>
            ) : (
              <span className="shrink-0 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                All clear
              </span>
            )}
          </div>
          <div className="mt-4 ml-10 flex gap-6 text-xs text-gray-500">
            <span><strong className="text-gray-900">{appCounts.approved ?? 0}</strong> approved</span>
            <span><strong className="text-yellow-700">{appCounts.pending ?? 0}</strong> pending</span>
            <span><strong className="text-blue-700">{appCounts.resubmitted ?? 0}</strong> resubmitted</span>
            <span><strong className="text-orange-600">{appCounts.returned ?? 0}</strong> returned</span>
          </div>
        </Link>

        {/* PbN card */}
        <Link href="/admin/noc/pbn" className="group block bg-white rounded-xl border-2 border-gray-200 hover:border-[#0057A8] p-6 transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">PbN</span>
                </div>
                <h2 className="font-semibold text-gray-900 group-hover:text-[#0057A8] transition-colors">
                  Press by Number — Slot Allocations
                </h2>
              </div>
              <p className="text-xs text-gray-500 ml-10">Assign press and photo slots to approved orgs</p>
            </div>
            <PbnStatusBadge status={pbnStatus} />
          </div>
          <div className="mt-4 ml-10 flex gap-6 text-xs text-gray-500">
            {quota ? (
              <>
                <span><strong className="text-gray-900">{pbnAllocatedPress}</strong> / {quota.pressTotal} press allocated</span>
                <span><strong className="text-gray-900">{pbnAllocatedPhoto}</strong> / {quota.photoTotal} photo allocated</span>
              </>
            ) : (
              <span className="text-yellow-600">No quota assigned yet — contact IOC</span>
            )}
          </div>
        </Link>

        {/* ENR card */}
        <Link href="/admin/noc/enr" className="group block bg-white rounded-xl border-2 border-gray-200 hover:border-[#0057A8] p-6 transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">ENR</span>
                </div>
                <h2 className="font-semibold text-gray-900 group-hover:text-[#0057A8] transition-colors">
                  ENR Nominations
                </h2>
              </div>
              <p className="text-xs text-gray-500 ml-10">Submit non-rights broadcaster nominations to IOC</p>
            </div>
            <EnrStatusBadge status={enrStatus} />
          </div>
          <div className="mt-4 ml-10 flex gap-6 text-xs text-gray-500">
            {enrList.length > 0 ? (
              <>
                <span><strong className="text-gray-900">{enrList.length}</strong> org{enrList.length !== 1 ? "s" : ""} on list</span>
                <span><strong className="text-gray-900">{enrTotalRequested}</strong> slots requested</span>
                {enrStatus === "decided" && (
                  <span><strong className="text-green-700">{enrTotalGranted}</strong> slots granted</span>
                )}
              </>
            ) : (
              <span className="text-gray-400">No orgs added yet</span>
            )}
          </div>
        </Link>
      </div>

      {/* Phase timeline */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">LA 2028 — Key Milestones</h2>
        <div className="flex flex-col gap-3">
          {MILESTONES.map((m) => (
            <div key={m.label} className="flex items-center gap-3">
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                m.state === "done"    ? "bg-green-500" :
                m.state === "active"  ? "bg-[#0057A8] ring-2 ring-blue-200" :
                "bg-gray-200"
              }`} />
              <span className={`text-sm flex-1 ${m.state === "active" ? "font-medium text-gray-900" : "text-gray-500"}`}>
                {m.label}
              </span>
              <span className={`text-xs ${m.state === "active" ? "font-semibold text-[#0057A8]" : "text-gray-400"}`}>
                {m.date}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-400">Dates are indicative — confirm with your IOC liaison.</p>
      </div>
    </div>
  );
}

function PbnStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "approved":    return <span className="shrink-0 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">Approved</span>;
    case "submitted":   return <span className="shrink-0 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Submitted to OCOG</span>;
    case "draft":       return <span className="shrink-0 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">Draft</span>;
    default:            return <span className="shrink-0 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-400">Not started</span>;
  }
}

function EnrStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "decided":     return <span className="shrink-0 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">Decided</span>;
    case "submitted":   return <span className="shrink-0 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Awaiting IOC</span>;
    case "draft":       return <span className="shrink-0 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">Draft</span>;
    default:            return <span className="shrink-0 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-400">Not started</span>;
  }
}
