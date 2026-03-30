import AppHeader from "@/components/AppHeader";
import { requireNocSession } from "@/lib/session";
import { NocNavTabs } from "./NocNavTabs";

export default async function NocLayout({ children }: { children: React.ReactNode }) {
  const session = await requireNocSession();
  return (
    <div className="min-h-screen">
      <AppHeader displayName={session.displayName} roleLabel={`NOC Admin · ${session.nocCode}`} />
      <NocNavTabs />
      <div>{children}</div>
    </div>
  );
}
