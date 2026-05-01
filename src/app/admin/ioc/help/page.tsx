import Link from "next/link";
import { requireIocAdminSession } from "@/lib/session";

export default async function IocHelpPage() {
  await requireIocAdminSession();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Help &amp; Guide — IOC Admin</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          How the LA 2028 Press Registration Portal works for IOC admins.
        </p>
      </div>

      <div className="flex gap-8">
        <nav className="w-48 shrink-0 sticky top-4 self-start">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Contents</p>
          <ul className="space-y-1 text-sm">
            <li><a href="#overview" className="text-brand-blue hover:underline">Overview</a></li>
            <li>
              <p className="text-xs font-medium text-gray-500 mt-2 mb-1">Key Screens</p>
              <ul className="space-y-1 pl-2">
                <li><a href="#master-allocations" className="text-brand-blue hover:underline">Master Allocations</a></li>
                <li><a href="#quotas" className="text-brand-blue hover:underline">Quotas</a></li>
                <li><a href="#ioc-direct" className="text-brand-blue hover:underline">IOC Direct</a></li>
                <li><a href="#enr-review" className="text-brand-blue hover:underline">ENR Review</a></li>
                <li><a href="#audit" className="text-brand-blue hover:underline">Audit Trail</a></li>
              </ul>
            </li>
          </ul>
        </nav>

        <div className="flex-1 min-w-0">
          <div id="overview" className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Your role</h2>
            <p className="text-sm text-gray-600 mb-3">
              As an IOC admin, you hold final authority over the accreditation quota framework for
              LA 2028. You set the per-NOC per-category quotas that govern how many accreditation
              slots each territory receives, review and approve OCOG's master allocations, manage
              IOC direct entries, and review Non-Media Rights-Holder (ENR) nominations.
            </p>
            <p className="text-sm text-gray-600">
              You have read access to the full system and write authority over quotas, IOC direct
              entries, and ENR approvals.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-5">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Key screens</h2>
            <dl className="space-y-4">
              {[
                {
                  id: "master-allocations",
                  label: "Master Allocations",
                  href: "/admin/ioc/master",
                  desc: "Full cross-NOC view of all accreditation slot allocations by category. The definitive record used to verify that total allocations remain within agreed limits.",
                },
                {
                  id: "quotas",
                  label: "Quotas",
                  href: "/admin/ioc/quotas",
                  desc: "Set and adjust per-NOC per-category quota limits. Quotas gate the PbN phase — NOCs cannot allocate more slots than their IOC-assigned quota for each category.",
                },
                {
                  id: "ioc-direct",
                  label: "IOC Direct",
                  href: "/admin/ioc/direct",
                  desc: "Add accreditation entries directly on behalf of the IOC — for IOC staff, rights-holders, and other entities that fall outside the standard NOC-based process.",
                },
                {
                  id: "enr-review",
                  label: "ENR Review",
                  href: "/admin/ioc/enr",
                  desc: "Review Non-Media Rights-Holder (ENR) nominations submitted by NOCs. Approve or decline each nomination from the IOC holdback pool.",
                },
                {
                  id: "audit",
                  label: "Audit Trail",
                  href: "/admin/ioc/audit",
                  desc: "Complete history of all system actions — quota changes, IOC direct entries, ENR decisions — with actor, timestamp, and detail.",
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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-5">
            <h2 className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-3">How quotas work</h2>
            <p className="text-sm text-blue-800 mb-3">
              Quotas are set per NOC per accreditation category (E, Es, EP, EPs, ET, EC). Once set,
              they become the ceiling for that NOC's PbN allocation phase.
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc pl-4">
              <li>Quotas can be adjusted at any point before the PbN window closes.</li>
              <li>Reducing a quota below an already-allocated amount will flag a shortfall — NOC will need to revise their allocation.</li>
              <li>The ENR pool is managed separately and does not consume PbN quota.</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">Frequently asked questions</h2>
            <dl className="space-y-5">
              {[
                {
                  q: "What is the difference between IOC Direct and NOC Direct Entry?",
                  a: "NOC Direct Entry is used by NOC admins to add known organisations from their territory without going through the public EoI form. IOC Direct is used by IOC admins to add entities that sit outside the NOC framework entirely — such as IOC staff, international federations, or rights-holders.",
                },
                {
                  q: "What is ENR?",
                  a: "Non-Media Rights-Holders (ENR) are broadcasters that do not hold Olympic media rights but may receive limited accreditation from the IOC's separate holdback pool. NOCs nominate candidates; IOC admins review and approve from this screen.",
                },
                {
                  q: "Can I see what NOC admins have done?",
                  a: "Yes — the Audit Trail captures all actions across all roles. Filter by actor type to see NOC-specific actions.",
                },
              ].map(({ q, a }) => (
                <div key={q}>
                  <dt className="font-medium text-gray-900 mb-1">{q}</dt>
                  <dd className="text-sm text-gray-600">{a}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Link href="/admin/ioc" className="text-sm text-brand-blue hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
