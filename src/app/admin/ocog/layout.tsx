import AppHeader from "@/components/AppHeader";
import { requireOcogSession } from "@/lib/session";
import { getAdminLang } from "@/lib/admin-lang";
import { t } from "@/lib/i18n/admin";
import { OcogNavTabs } from "./OcogNavTabs";

const HELP_ANCHORS: Record<string, string> = {
  "/admin/ocog": "overview",
  "/admin/ocog/eoi": "eoi-summary",
  "/admin/ocog/pbn": "pbn-approvals",
  "/admin/ocog/windows": "eoi-windows",
  "/admin/ocog/duplicates": "duplicates",
  "/admin/ocog/audit": "audit",
  "/admin/ocog/master": "master-allocations",
};

export default async function OcogLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOcogSession();
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
        roleLabel="OCOG Admin"
        additionalRoleLabels={additionalRoleLabels}
        lang={lang}
        showLangToggle={true}
        helpPath="/admin/ocog/help"
        helpAnchors={HELP_ANCHORS}
      />
      <OcogNavTabs showPrpAdmin={showPrpAdmin} nav={s.nav} />
      <div>{children}</div>
    </div>
  );
}
