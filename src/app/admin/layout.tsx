import { logout } from "./login/actions";
import { getSession } from "@/lib/session";

const ROLE_LABELS: Record<string, string> = {
  ioc_admin:    "IOC Admin",
  ioc_readonly: "IOC Viewer",
  noc_admin:    "NOC Admin",
  ocog_admin:   "OCOG Admin",
  if_admin:     "IF Admin",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-[#0057A8] text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center shrink-0">
            <span className="font-bold text-xs">M</span>
          </div>
          <div>
            <span className="font-semibold text-sm">
              Media Registration Portal
            </span>
            <span className="text-blue-200 text-xs ml-2">Admin</span>
          </div>
        </div>

        {session && (
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium leading-tight">
                {session.displayName}
              </div>
              <div className="text-xs text-blue-200 leading-tight">
                {ROLE_LABELS[session.role] ?? session.role}
                {session.nocCode ? ` · ${session.nocCode}` : ""}
              </div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                className="text-xs text-blue-200 hover:text-white transition-colors cursor-pointer bg-transparent border-0 px-0 py-0"
              >
                Sign out
              </button>
            </form>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
