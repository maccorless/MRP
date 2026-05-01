import { requirePrpAdminSession } from "@/lib/session";
import AppHeader from "@/components/AppHeader";

export default async function PrpAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePrpAdminSession();
  return (
    <div>
      <AppHeader
        displayName={session.displayName}
        roleLabel="PRP Admin"
      />
      <div className="max-w-4xl mx-auto p-6">{children}</div>
    </div>
  );
}
