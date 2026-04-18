import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

const ROLES = [
  {
    key: "noc_admin",
    title: "NOC Admin",
    subtitle: "National Olympic Committee",
    href: "/admin/login?role=noc_admin",
    color: "border-brand-blue",
    hoverTitle: "group-hover:text-brand-blue",
    cta: "text-brand-blue",
    iconBg: "bg-blue-50",
    dotColor: "bg-brand-blue",
    icon: (
      <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5" aria-hidden="true">
        <path d="M4 3v16M4 5l10-2v7L4 12" stroke="var(--color-brand-blue)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    tasks: [
      "Review and approve EoI applications from media organisations",
      "Allocate press and photo slots (Press by Number)",
      "Submit ENR organisation nominations to IOC",
    ],
  },
  {
    key: "ocog_admin",
    title: "OCOG Admin",
    subtitle: "LA28 Organising Committee",
    href: "/admin/login?role=ocog_admin",
    color: "border-orange-400",
    hoverTitle: "group-hover:text-orange-600",
    cta: "text-orange-600",
    iconBg: "bg-orange-50",
    dotColor: "bg-orange-500",
    icon: (
      <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5" aria-hidden="true">
        <rect x="3" y="10" width="4" height="9" rx="1" stroke="#f97316" strokeWidth="1.75"/>
        <rect x="9" y="6" width="4" height="13" rx="1" stroke="#f97316" strokeWidth="1.75"/>
        <rect x="15" y="8" width="4" height="11" rx="1" stroke="#f97316" strokeWidth="1.75"/>
      </svg>
    ),
    tasks: [
      "Review NOC slot allocations before finalisation",
      "Adjust and approve PbN submissions",
      "Push approved allocations to the Accreditation system",
    ],
  },
  {
    key: "if_admin",
    title: "IF Admin",
    subtitle: "International Federation",
    href: "/admin/login?role=if_admin",
    color: "border-purple-400",
    hoverTitle: "group-hover:text-purple-700",
    cta: "text-purple-700",
    iconBg: "bg-purple-50",
    dotColor: "bg-purple-600",
    icon: (
      <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5" aria-hidden="true">
        <path d="M11 3v12M8 18h6M6 3h10l-1.5 8a3.5 3.5 0 01-7 0L6 3z" stroke="#7c3aed" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M6 6H3a2 2 0 002 4" stroke="#7c3aed" strokeWidth="1.75" strokeLinecap="round"/>
        <path d="M16 6h3a2 2 0 01-2 4" stroke="#7c3aed" strokeWidth="1.75" strokeLinecap="round"/>
      </svg>
    ),
    tasks: [
      "Review ENR accreditation requests for your sport",
      "Grant, partially grant, or deny per-organisation slots",
      "Track holdback pool usage across your NOCs",
    ],
  },
  {
    key: "ioc_admin",
    title: "IOC Admin",
    subtitle: "International Olympic Committee",
    href: "/admin/login?role=ioc_admin",
    color: "border-green-400",
    hoverTitle: "group-hover:text-green-700",
    cta: "text-green-700",
    iconBg: "bg-green-50",
    dotColor: "bg-green-600",
    icon: (
      <svg viewBox="0 0 22 22" fill="none" className="w-5 h-5" aria-hidden="true">
        <circle cx="11" cy="11" r="8" stroke="#16a34a" strokeWidth="1.75"/>
        <path d="M3 11h16M11 3c-2.5 2-4 4.8-4 8s1.5 6 4 8M11 3c2.5 2 4 4.8 4 8s-1.5 6-4 8" stroke="#16a34a" strokeWidth="1.75" strokeLinecap="round"/>
      </svg>
    ),
    tasks: [
      "Set and manage quota allocations per NOC",
      "Review and decide on ENR accreditation requests",
      "Export approved PbN data for ACR integration",
    ],
  },
] as const;

export default async function AdminPortalPage() {
  const session = await getSession();

  if (session) {
    if (session.role === "noc_admin" || session.role === "if_admin") {
      redirect("/admin/noc/home");
    } else if (session.role === "ocog_admin") {
      redirect("/admin/ocog");
    } else {
      redirect("/admin/ioc");
    }
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9]">
      {/* Header */}
      <header className="bg-brand-blue">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white/15 border border-white/20 rounded-md flex items-center justify-center">
              <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4" aria-hidden="true">
                <circle cx="5" cy="8" r="3.25" stroke="white" strokeWidth="1.25"/>
                <circle cx="11" cy="8" r="3.25" stroke="white" strokeWidth="1.25"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-white leading-tight">Press Registration Portal</div>
              <div className="text-xs text-white/60 leading-tight">LA 2028</div>
            </div>
          </div>
          <span className="text-xs font-semibold text-white bg-white/15 border border-white/20 px-2.5 py-1 rounded-full">
            Admin Access
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-3xl mx-auto px-6 pt-12 pb-16">
        <div className="text-center mb-10">
          <h1 className="text-xl font-bold text-gray-900">Select your role to sign in</h1>
          <p className="text-sm text-gray-500 mt-2">
            Each role has a dedicated workflow. Media organisations use the separate{" "}
            <Link href="/apply" className="text-brand-blue hover:underline">
              application form
            </Link>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ROLES.map((role) => (
            <Link
              key={role.key}
              href={role.href}
              className={`bg-white rounded-xl border-2 ${role.color} p-5 hover:shadow-md transition-all group`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 ${role.iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                  {role.icon}
                </div>
                <div>
                  <div className={`font-semibold text-gray-900 ${role.hoverTitle} transition-colors text-sm`}>
                    {role.title}
                  </div>
                  <div className="text-xs text-gray-400">{role.subtitle}</div>
                </div>
              </div>
              <ul className="space-y-1.5">
                {role.tasks.map((task) => (
                  <li key={task} className="flex items-start gap-2 text-xs text-gray-600">
                    <span className={`w-1.5 h-1.5 rounded-full ${role.dotColor} mt-1 shrink-0`} aria-hidden="true" />
                    {task}
                  </li>
                ))}
              </ul>
              <div className={`mt-4 text-xs font-semibold ${role.cta}`}>
                Sign in as {role.title} →
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-8 text-xs text-gray-400 text-center">
          PRP v0.1 · Credentials are managed by your IOC liaison.
        </p>
      </main>
    </div>
  );
}
