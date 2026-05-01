import { exitSudo } from "./ioc/sudo/actions";
import { getSession } from "@/lib/session";
import { PrpAdminBarServer } from "@/components/prp/PrpAdminBarServer";

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

      <PrpAdminBarServer section="portal">
        <main id="main-content" className="flex-1">{children}</main>
      </PrpAdminBarServer>
    </div>
  );
}
