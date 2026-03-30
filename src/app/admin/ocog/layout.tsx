import AppHeader from "@/components/AppHeader";
import { requireOcogSession } from "@/lib/session";
import { OcogNavTabs } from "./OcogNavTabs";

export default async function OcogLayout({ children }: { children: React.ReactNode }) {
  const session = await requireOcogSession();
  return (
    <div className="min-h-screen">
      <AppHeader displayName={session.displayName} roleLabel="OCOG Admin" />
      <OcogNavTabs />
      <div>{children}</div>
    </div>
  );
}
