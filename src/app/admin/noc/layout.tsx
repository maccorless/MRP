import AppHeader from "@/components/AppHeader";
import { requireNocSession } from "@/lib/session";
import { getAdminLang } from "@/lib/admin-lang";
import { t } from "@/lib/i18n/admin";
import { NocNavTabs } from "./NocNavTabs";

const HELP_ANCHORS: Record<string, string> = {
  "/admin/noc/home": "overview",
  "/admin/noc/queue": "eoi-queue",
  "/admin/noc/direct-entry": "direct-entry",
  "/admin/noc/invite": "invite-org",
  "/admin/noc/pbn": "pbn",
  "/admin/noc/enr": "enr",
  "/admin/noc/audit": "audit",
};

export default async function NocLayout({ children }: { children: React.ReactNode }) {
  const session = await requireNocSession();
  const lang = await getAdminLang();
  const s = t(lang);
  const showPrpAdmin = session.additionalRoles?.includes("prp_admin") ?? false;
  const additionalRoleLabels = (session.additionalRoles ?? []).map((r) =>
    r === "prp_admin" ? "PRP Admin" : r
  );
  return (
    <div className="min-h-screen">
      <AppHeader
        displayName={session.displayName}
        roleLabel={`NOC Admin · ${session.nocCode}`}
        additionalRoleLabels={additionalRoleLabels}
        lang={lang}
        showLangToggle={true}
        helpPath="/admin/noc/help"
        helpAnchors={HELP_ANCHORS}
      />
      <NocNavTabs showPrpAdmin={showPrpAdmin} nav={s.nav} />
      <div>{children}</div>
    </div>
  );
}
