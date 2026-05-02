import AppHeader from "@/components/AppHeader";
import { requireIocSession } from "@/lib/session";
import { getAdminLang } from "@/lib/admin-lang";
import { t } from "@/lib/i18n/admin";
import { IocNav } from "./nav";
import SudoModal from "./sudo/SudoModal";

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
  const lang = await getAdminLang();
  const s = t(lang);
  const showPrpAdmin = session.additionalRoles?.includes("prp_admin") ?? false;
  const additionalRoleLabels = (session.additionalRoles ?? []).map((r) =>
    r === "prp_admin" ? "PRP Admin" : r
  );
  return (
    <div>
      <AppHeader
        displayName={session.displayName}
        roleLabel="IOC Admin"
        additionalRoleLabels={additionalRoleLabels}
        lang={lang}
        showLangToggle={true}
        helpPath="/admin/ioc/help"
        helpAnchors={HELP_ANCHORS}
        actions={<SudoModal />}
      />
      <IocNav showPrpAdmin={showPrpAdmin} nav={s.nav} />
      <div className="max-w-6xl mx-auto p-6">{children}</div>
    </div>
  );
}
