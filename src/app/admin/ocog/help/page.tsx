import Link from "next/link";
import { requireOcogSession } from "@/lib/session";

export default async function OcogHelpPage() {
  await requireOcogSession();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Help &amp; Guide — OCOG Admin</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          How the LA 2028 Press Registration Portal works for OCOG admins.
        </p>
      </div>

      <div className="flex gap-8">
        <nav className="w-48 shrink-0 sticky top-4 self-start">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contents</p>
          <ul className="space-y-1 text-sm">
            <li><a href="#overview" className="text-brand-blue hover:underline">Overview</a></li>
            <li><a href="#workflow" className="text-brand-blue hover:underline">Workflow</a></li>
            <li>
              <p className="text-xs font-medium text-gray-500 mt-2 mb-1">Key Screens</p>
              <ul className="space-y-1 pl-2">
                <li><a href="#eoi-summary" className="text-brand-blue hover:underline">EoI Summary</a></li>
                <li><a href="#pbn-approvals" className="text-brand-blue hover:underline">PbN Approvals</a></li>
                <li><a href="#eoi-windows" className="text-brand-blue hover:underline">EoI Windows</a></li>
                <li><a href="#duplicates" className="text-brand-blue hover:underline">Duplicates</a></li>
                <li><a href="#master-allocations" className="text-brand-blue hover:underline">Master Allocations</a></li>
                <li><a href="#audit" className="text-brand-blue hover:underline">Audit Trail</a></li>
              </ul>
            </li>
          </ul>
        </nav>

        <div className="flex-1 min-w-0">
          <div id="overview" className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Your role</h2>
            <p className="text-sm text-gray-600 mb-3">
              As an OCOG admin, you oversee the entire media accreditation process for LA 2028. You manage
              the EoI acceptance windows for each NOC, monitor application progress across all territories,
              approve Press by Number (PbN) allocations, and review the master accreditation picture.
            </p>
            <p className="text-sm text-gray-600">
              You have visibility across all NOCs and can intervene at any stage of the workflow. You act
              as the bridge between NOC-level decisions and the IOC's final sign-off on quota allocations.
            </p>
          </div>

          <div id="workflow" className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Workflow timeline</h2>
            <ol className="space-y-5">
              {[
                {
                  date: "Jul 2026",
                  title: "Open EoI windows",
                  body: "Use the EoI Windows screen to open acceptance windows for each NOC (or all at once). Public EoI form goes live 31 Aug 2026 — windows must be open before then for applications in that territory to be accepted.",
                },
                {
                  date: "31 Aug – 30 Oct 2026",
                  title: "Monitor EoI progress",
                  body: "Track application counts per NOC via the EoI Summary. Flag any NOCs with low candidate rates or outstanding issues. Applicant deadline 23 Oct 2026; platform hard close 30 Oct 2026 (IOC-owned).",
                },
                {
                  date: "Oct – Dec 2026",
                  title: "Quota-compliance review of PbN allocations",
                  body: "As NOCs complete their PbN phase (allocating IOC-assigned quota slots to approved organisations), review their submissions in the PbN Approvals screen for quota-compliance issues. Per Strategic Plan §2 reframe, OCOG coordinates and flags anomalies — IOC retains final approval authority. NOC PbN deadline 18 Dec 2026.",
                },
                {
                  date: "Oct – Dec 2026",
                  title: "Push approved allocations to ACR",
                  body: "Once NOC allocations clear quota-compliance review, push them to ACR (the downstream accreditation system). The Master Allocations view gives you the full cross-NOC picture; flag anomalies before the IOC review.",
                },
                {
                  date: "Jan – Feb 2027",
                  title: "IF PbN coordination",
                  body: "International Federations allocate sport-specialist quota (Es / EPs) to specialists not chosen by their NOC. IF PbN window 18 Jan – 12 Feb 2027 (proposed; Strategic Plan §2.6 — pending confirmation).",
                },
                {
                  date: "Ongoing",
                  title: "Manage duplicates and audit",
                  body: "Use the Duplicates screen to detect organisations appearing across multiple NOCs. Review the Audit Trail to track all actions taken across the system.",
                },
              ].map(({ date, title, body }) => (
                <li key={title} className="flex gap-4">
                  <div className="flex-shrink-0 w-20 text-xs font-medium text-gray-400 pt-0.5">{date}</div>
                  <div>
                    <div className="font-medium text-gray-900 mb-0.5">{title}</div>
                    <p className="text-sm text-gray-600">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Key screens</h2>
            <dl className="space-y-4">
              {[
                {
                  id: "eoi-summary",
                  label: "EoI Summary",
                  href: "/admin/ocog/eoi",
                  desc: "Application counts per NOC broken down by status (Pending, Candidate, Returned, Rejected). Quickly spot NOCs with unreviewed applications or no candidates.",
                },
                {
                  id: "pbn-approvals",
                  label: "PbN Approvals",
                  href: "/admin/ocog/pbn",
                  desc: "Review and approve NOC PbN allocation submissions. NOCs allocate their quota slots to approved organisations; you formally sign off on each NOC's submission.",
                },
                {
                  id: "eoi-windows",
                  label: "EoI Windows",
                  href: "/admin/ocog/windows",
                  desc: "Open or close the EoI acceptance window per NOC. Use bulk actions to open or close all windows simultaneously. Closing a window blocks new public applications from that territory.",
                },
                {
                  id: "duplicates",
                  label: "Duplicates",
                  href: "/admin/ocog/duplicates",
                  desc: "Cross-NOC duplicate detection. Identifies organisations that appear to have submitted EoI applications under multiple NOCs based on name or contact email similarity.",
                },
                {
                  id: "master-allocations",
                  label: "Master Allocations",
                  href: "/admin/ocog/master",
                  desc: "Full view of accreditation slot allocations across all NOCs and categories. The definitive reference for the total accreditation picture going into the IOC review.",
                },
                {
                  id: "audit",
                  label: "Audit Trail",
                  href: "/admin/ocog/audit",
                  desc: "Complete history of all actions taken across the system — NOC decisions, OCOG changes, window toggles — with actor, timestamp, and detail.",
                },
              ].map(({ id, label, href, desc }) => (
                <div key={label} id={id} className="flex gap-3">
                  <Link
                    href={href}
                    className="shrink-0 text-sm font-medium text-brand-blue hover:underline w-36"
                  >
                    {label}
                  </Link>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </dl>
          </div>

          <Link href="/admin/ocog" className="text-sm text-brand-blue hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
