import Link from "next/link";
import { requireNocSession } from "@/lib/session";

export default async function NocHelpPage() {
  const session = await requireNocSession();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Help &amp; Guide</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          How the LA 2028 Press Registration Portal works for NOC admins.
        </p>
      </div>

      <div className="flex gap-8">
        <nav className="w-48 shrink-0 sticky top-4 self-start">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contents</p>
          <ul className="space-y-1 text-sm">
            <li><a href="#overview" className="text-[#0057A8] hover:underline">Overview</a></li>
            <li><a href="#workflow" className="text-[#0057A8] hover:underline">Workflow</a></li>
            <li>
              <p className="text-xs font-medium text-gray-500 mt-2 mb-1">Key Screens</p>
              <ul className="space-y-1 pl-2">
                <li><a href="#eoi-queue" className="text-[#0057A8] hover:underline">EoI Queue</a></li>
                <li><a href="#direct-entry" className="text-[#0057A8] hover:underline">Direct Entry</a></li>
                <li><a href="#invite-org" className="text-[#0057A8] hover:underline">Invite Org</a></li>
                <li><a href="#pbn" className="text-[#0057A8] hover:underline">PbN Allocations</a></li>
                <li><a href="#enr" className="text-[#0057A8] hover:underline">ENR Requests</a></li>
                <li><a href="#audit" className="text-[#0057A8] hover:underline">Audit Trail</a></li>
              </ul>
            </li>
            <li className="mt-2"><a href="#direct-entry-explained" className="text-[#0057A8] hover:underline">Direct Entry Explained</a></li>
            <li><a href="#faq" className="text-[#0057A8] hover:underline">FAQ</a></li>
          </ul>
        </nav>

        <div className="flex-1 min-w-0">
          <div id="overview" className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Your role ({session.nocCode})</h2>
            <p className="text-sm text-gray-600">
              As a NOC admin, you manage media accreditation for organisations in your territory. You review
              Expression of Interest (EoI) applications, approve or return them, and then formally allocate
              accreditation slot numbers to approved organisations during the Press by Number (PbN) phase.
              This portal replaces the previous Excel-based process.
            </p>
          </div>

          <div id="workflow" className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Workflow timeline</h2>
            <ol className="space-y-5">
              {[
                {
                  date: "Aug 2026",
                  title: "EoI window opens",
                  body: "Media organisations in your territory can submit Expressions of Interest through the public form. Applications appear in your EoI Queue for review.",
                },
                {
                  date: "Aug – Oct 2026",
                  title: "Review applications",
                  body: "For each application: Approve (passes to PbN), Return (sends back to applicant with your notes for corrections), or Reject (permanent — use sparingly). You can also add known organisations directly using Direct Entry.",
                },
                {
                  date: "Oct 2026",
                  title: "Press by Number (PbN)",
                  body: "The IOC assigns your territory a quota of accreditation slots per category (E, Es, EP, EPs, ET, EC). You allocate those slots to your approved organisations. OCOG formally approves your allocations.",
                },
                {
                  date: "Oct – Dec 2026",
                  title: "ENR requests",
                  body: "If applicable, nominate Extended Non-Rights Broadcasters from your territory. These are submitted separately to the IOC for approval from their holdback pool.",
                },
                {
                  date: "2027",
                  title: "Press by Name",
                  body: "Individual credentialing (not managed in this portal) — handled separately in the ACR accreditation system.",
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
                  id: "eoi-queue",
                  label: "EoI Queue",
                  href: "/admin/noc/queue",
                  desc: "All applications from your territory. Filter by status, search by org name. Click any application to review and act on it.",
                },
                {
                  id: "direct-entry",
                  label: "Direct Entry",
                  href: "/admin/noc/direct-entry",
                  desc: "Submit an application on behalf of a known organisation — bypasses the public form and auto-approves immediately. Use for organisations you already know and trust.",
                },
                {
                  id: "invite-org",
                  label: "Invite Org",
                  href: "/admin/noc/invite",
                  desc: "Send an invitation link to an organisation so they can complete the public EoI form.",
                },
                {
                  id: "pbn",
                  label: "PbN Allocations",
                  href: "/admin/noc/pbn",
                  desc: "Allocate your IOC-assigned quota slots to approved organisations. Only available once the IOC has set your quotas and the PbN window is open.",
                },
                {
                  id: "enr",
                  label: "ENR Requests",
                  href: "/admin/noc/enr",
                  desc: "Submit your prioritised list of Extended Non-Rights Broadcaster nominations to the IOC.",
                },
                {
                  id: "audit",
                  label: "Audit Trail",
                  href: "/admin/noc/audit",
                  desc: "Full history of every action taken on applications in your territory, including who did what and when.",
                },
              ].map(({ id, label, href, desc }) => (
                <div key={label} id={id} className="flex gap-3">
                  <Link
                    href={href}
                    className="shrink-0 text-sm font-medium text-[#0057A8] hover:underline w-36"
                  >
                    {label}
                  </Link>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              ))}
            </dl>
          </div>

          <div id="direct-entry-explained" className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-5">
            <h2 className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-3">Direct Entry explained</h2>
            <p className="text-sm text-blue-800 mb-3">
              Use Direct Entry for organisations you already know — media outlets your territory works with regularly,
              or your own NOC communications staff who need E-category (NOC E) credentials.
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc pl-4">
              <li>The application is immediately approved — no review step.</li>
              <li>Required: organisation name, type, country, contact name and email, and at least one category.</li>
              <li>Optional: website, requested slot counts, internal notes (not shown to the organisation).</li>
              <li>To credential your own communications staff: create a direct entry for your NOC communications team and select category E.</li>
            </ul>
          </div>

          <div id="faq" className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Frequently asked questions</h2>
            <dl className="space-y-5">
              {[
                {
                  q: "What does 'Return' do?",
                  a: "Returning an application sends it back to the applicant with your note explaining what needs to be corrected. The applicant receives a link to reopen the form, make changes, and resubmit. The corrected application re-enters your queue with status 'Resubmitted'.",
                },
                {
                  q: "Can I edit an application I've already approved?",
                  a: "You cannot change an approved application yourself. Contact your OCOG admin — they can adjust the record if needed.",
                },
                {
                  q: "How do I add my own NOC communications staff?",
                  a: "Use Direct Entry. Create an entry for your NOC communications team (e.g. 'USA Communications Staff'), select category E, and enter the number of staff. This will be allocated from your E quota during PbN.",
                },
                {
                  q: "What is Press by Number (PbN)?",
                  a: "PbN is the second phase after EoI. The IOC assigns your territory a fixed number of accreditation slots per category. During PbN, you decide which approved organisations receive those slots and how many. OCOG reviews and formally approves your allocation.",
                },
                {
                  q: "What is ENR?",
                  a: "Extended Non-Rights Broadcasters (ENR) are broadcasters who don't hold Olympic media rights but may receive limited accreditation from the IOC's holdback pool. ENR nominations are separate from the EoI/PbN process and submitted directly to the IOC.",
                },
              ].map(({ q, a }) => (
                <div key={q}>
                  <dt className="font-medium text-gray-900 mb-1">{q}</dt>
                  <dd className="text-sm text-gray-600">{a}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Link href="/admin/noc/home" className="text-sm text-[#0057A8] hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
