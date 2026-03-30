import AppHeader from "@/components/AppHeader";
import { requireIocSession } from "@/lib/session";
import { IocNav } from "./nav";

export default async function IocLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireIocSession();
  return (
    <div>
      <AppHeader displayName={session.displayName} roleLabel="IOC Admin" />
      <IocNav />
      <div className="max-w-6xl mx-auto p-6">{children}</div>
    </div>
  );
}
