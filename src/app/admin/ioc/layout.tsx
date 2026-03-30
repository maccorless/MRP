import { requireIocSession } from "@/lib/session";
import { IocNav } from "./nav";

export default async function IocLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireIocSession();
  return (
    <div>
      <IocNav />
      <div className="max-w-6xl mx-auto p-6">{children}</div>
    </div>
  );
}
