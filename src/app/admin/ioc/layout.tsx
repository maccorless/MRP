import AppHeader from "@/components/AppHeader";
import { requireIocSession } from "@/lib/session";
import { IocNav } from "./nav";

const HELP_ANCHORS: Record<string, string> = {
  "/admin/ioc": "overview",
  "/admin/ioc/master": "master-allocations",
  "/admin/ioc/quotas": "quotas",
  "/admin/ioc/direct": "ioc-direct",
  "/admin/ioc/enr": "enr-review",
  "/admin/ioc/audit": "audit",
};

export default async function IocLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireIocSession();
  return (
    <div>
      <AppHeader
        displayName={session.displayName}
        roleLabel="IOC Admin"
        helpPath="/admin/ioc/help"
        helpAnchors={HELP_ANCHORS}
      />
      <IocNav />
      <div className="max-w-6xl mx-auto p-6">{children}</div>
    </div>
  );
}
