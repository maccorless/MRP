import { logout } from "./login/actions";
import { exitSudo } from "./ioc/sudo/actions";
import { getSession } from "@/lib/session";
import SudoModal from "./ioc/sudo/SudoModal";

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
  const isSudo = session?.isSudo === true;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Sudo banner — shown at the very top when acting as another user */}
      {isSudo && session && (
        <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <span className="font-bold text-amber-900">SUDO MODE</span>
            <span className="text-amber-900">
              Viewing as <strong>{session.displayName}</strong>
              {" "}({ROLE_LABELS[session.role] ?? session.role}
              {session.nocCode ? ` · ${session.nocCode}` : ""})
              {" "}— initiated by {session.sudoActorLabel}
            </span>
          </span>
          <form action={exitSudo}>
            <button
              type="submit"
              className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold px-3 py-1 rounded transition-colors cursor-pointer"
            >
              Exit sudo
            </button>
          </form>
        </div>
      )}

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
            {/* Act as user button — IOC admin only, not in sudo mode */}
            {session.role === "ioc_admin" && !isSudo && (
              <SudoModal />
            )}
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

      <main id="main-content" className="flex-1">{children}</main>
    </div>
  );
}
