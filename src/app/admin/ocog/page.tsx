import Link from "next/link";
import { eq } from "drizzle-orm";
import { Icon } from "@/components/Icon";
import { db } from "@/db";
import { nocQuotas, orgSlotAllocations, featureFlags } from "@/db/schema";
import { requireOcogSession } from "@/lib/session";
import { PbnPublishToggle } from "./PbnPublishToggle";

// LA28 — Key Milestones for the OCOG (LA28) coordinator role.
// Source of truth: docs/process-timeline-2026-04-26.md +
// docs/LA28 PRP Integrated Timeline.html (Strategic Plan Feb 2026 FINAL +
// Emma 2026-04-24 corrections).
//
// Per the 2026-04-26 §2 reframe captured in the integrated timeline:
// "OCOG is a coordinator (not an approver), IOC is a compliance reviewer
// (not an approver), NOC is the arbiter of slot allocation within their
// quota." Wording here reflects that — OCOG does NOT have a formal
// "approval deadline" of its own.
type MilestoneState = "done" | "active" | "upcoming";
type Milestone = {
  label: string;
  date: string;
  startsAt?: Date;
  endsAt: Date;
};

const MILESTONES: readonly Milestone[] = [
  { label: "Open per-NOC EoI windows",            date: "Jul 2026",         startsAt: new Date("2026-07-01"), endsAt: new Date("2026-07-31") },
  { label: "EoI window live (public /apply)",     date: "31 Aug – 30 Oct 2026", startsAt: new Date("2026-08-31"), endsAt: new Date("2026-10-30") },
  { label: "NOC PbN submissions due",             date: "18 Dec 2026",      startsAt: new Date("2026-10-05"), endsAt: new Date("2026-12-18") },
  { label: "OCOG quota-compliance / push to ACR", date: "Oct–Dec 2026",     startsAt: new Date("2026-10-05"), endsAt: new Date("2026-12-31") },
  { label: "IF PbN deadline",                     date: "12 Feb 2027",      startsAt: new Date("2027-01-18"), endsAt: new Date("2027-02-12") },
] as const;

function milestoneState(m: Milestone, now: Date): MilestoneState {
  if (m.endsAt < now) return "done";
  if (m.startsAt && m.startsAt <= now && now <= m.endsAt) return "active";
  return "upcoming";
}

export default async function OcogHomePage() {
  const session = await requireOcogSession();

  const quotas = await db.select({ nocCode: nocQuotas.nocCode }).from(nocQuotas).where(eq(nocQuotas.eventId, "LA28"));

  const [pbnFlag] = await db
    .select()
    .from(featureFlags)
    .where(eq(featureFlags.name, "pbn_results_published"));

  const allAllocs = await db
    .select({ nocCode: orgSlotAllocations.nocCode, pbnState: orgSlotAllocations.pbnState })
    .from(orgSlotAllocations)
    .where(eq(orgSlotAllocations.eventId, "LA28"));

  // Per-NOC status
  const nocStateMap: Record<string, string> = {};
  for (const alloc of allAllocs) {
    const cur = nocStateMap[alloc.nocCode];
    // Priority: ocog_approved > noc_submitted > draft
    if (!cur || (alloc.pbnState === "noc_submitted" && cur === "draft") || alloc.pbnState === "ocog_approved") {
      nocStateMap[alloc.nocCode] = alloc.pbnState;
    }
  }

  const submitted = Object.values(nocStateMap).filter((s) => s === "noc_submitted").length;
  const approved  = Object.values(nocStateMap).filter((s) => s === "ocog_approved").length;
  const notStarted = quotas.length - Object.keys(nocStateMap).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {session.displayName}</h1>
        <p className="text-sm text-gray-500 mt-1">OCOG Admin · LA 2028</p>
      </div>

      {/* Attention banner */}
      {submitted > 0 && (
        <div className="mb-5 flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-900">
          <Icon name="warning" label="Warning" className="shrink-0 mt-0.5 w-4 h-4 text-yellow-700" />
          <span>
            <strong>{submitted} NOC{submitted !== 1 ? "s" : ""} {submitted === 1 ? "has" : "have"} submitted PbN allocations awaiting your approval.</strong>
            {" "}Review them in PbN Approvals.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5">
        {/* PbN Approvals card */}
        <Link href="/admin/ocog/pbn" className="group block bg-white rounded-xl border-2 border-gray-200 hover:border-orange-500 p-6 transition-all hover:shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">PbN</span>
                </div>
                <h2 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                  Press by Number Approvals
                </h2>
              </div>
              <p className="text-xs text-gray-500 ml-10">
                Review, adjust, and approve NOC slot allocations before sending to ACR
              </p>
            </div>
            {submitted > 0 ? (
              <span className="shrink-0 px-3 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-800">
                {submitted} awaiting approval
              </span>
            ) : (
              <span className="shrink-0 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                All clear
              </span>
            )}
          </div>
          <div className="mt-4 ml-10 flex gap-6 text-xs text-gray-500">
            <span><strong className="text-yellow-700">{submitted}</strong> submitted by NOC</span>
            <span><strong className="text-green-700">{approved}</strong> approved</span>
            <span><strong className="text-gray-400">{notStarted}</strong> not started</span>
          </div>
        </Link>
      </div>

      {/* PbN Results publish toggle */}
      <PbnPublishToggle isPublished={pbnFlag?.state === "on"} />

      {/* Phase timeline */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">LA 2028 — Key Milestones</h2>
        <div className="flex flex-col gap-3">
          {MILESTONES.map((m) => {
            const state = milestoneState(m, new Date());
            return (
              <div key={m.label} className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full shrink-0 ${
                  state === "done"   ? "bg-green-500" :
                  state === "active" ? "bg-orange-500 ring-2 ring-orange-200" :
                  "bg-gray-200"
                }`} />
                <span className={`text-sm flex-1 ${state === "active" ? "font-medium text-gray-900" : "text-gray-500"}`}>
                  {m.label}
                </span>
                <span className={`text-xs ${state === "active" ? "font-semibold text-orange-600" : "text-gray-400"}`}>
                  {m.date}
                </span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-gray-400">Dates per IOC Press Accreditation Strategic Plan (Feb 2026 FINAL) + Emma 2026-04-24 corrections.</p>
      </div>
    </div>
  );
}
