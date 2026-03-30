import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

const ROLES = [
  {
    key: "noc_admin",
    title: "NOC Admin",
    subtitle: "National Olympic Committee",
    color: "border-[#0057A8]",
    accent: "bg-[#0057A8]",
    tasks: [
      "Review and approve EoI applications from media orgs",
      "Allocate press and photo slots (Press by Number)",
      "Submit ENR organisation nominations to IOC",
    ],
  },
  {
    key: "ocog_admin",
    title: "OCOG Admin",
    subtitle: "LA28 Organising Committee",
    color: "border-orange-500",
    accent: "bg-orange-500",
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
    color: "border-purple-600",
    accent: "bg-purple-600",
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
    color: "border-green-600",
    accent: "bg-green-600",
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
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-start pt-12 px-6 pb-16">
      {/* Header */}
      <div className="text-center mb-10 max-w-xl">
        <h1 className="text-2xl font-bold text-gray-900">
          LA 2028 Media Registration Portal
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Select your role to sign in and access your workflow.
          Applicants use the separate{" "}
          <Link href="/apply" className="text-[#0057A8] hover:underline">
            media application form
          </Link>.
        </p>
      </div>

      {/* Role cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl">
        {ROLES.map((role) => (
          <Link
            key={role.key}
            href="/admin/login"
            className={`bg-white rounded-xl border-2 ${role.color} p-6 hover:shadow-md transition-all group`}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-9 h-9 ${role.accent} rounded-lg flex items-center justify-center shrink-0`}>
                <span className="text-white font-bold text-sm">
                  {role.title[0]}
                </span>
              </div>
              <div>
                <div className="font-semibold text-gray-900 group-hover:text-[#0057A8] transition-colors">
                  {role.title}
                </div>
                <div className="text-xs text-gray-500">{role.subtitle}</div>
              </div>
            </div>
            <ul className="space-y-1.5">
              {role.tasks.map((task) => (
                <li key={task} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-gray-300 mt-0.5 shrink-0">›</span>
                  {task}
                </li>
              ))}
            </ul>
            <div className="mt-4 text-xs font-semibold text-[#0057A8] group-hover:underline">
              Sign in as {role.title} →
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-xs text-gray-400 text-center">
        MRP v0.1 · Credentials are managed by your IOC liaison.
      </p>
    </div>
  );
}
