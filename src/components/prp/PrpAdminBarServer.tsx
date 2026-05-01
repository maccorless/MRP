import { getSession } from "@/lib/session";
import { PrpEditProvider } from "./PrpEditContext";
import { PrpAdminBar } from "./PrpAdminBar";

/**
 * Drop into any page layout. Renders the PRP admin bar only when the active
 * session holds the prp_admin additional role.
 */
export async function PrpAdminBarServer({
  section,
  children,
}: {
  section: string;
  children: React.ReactNode;
}) {
  const session = await getSession();
  const isPrpAdmin = session?.additionalRoles?.includes("prp_admin") ?? false;

  if (!isPrpAdmin) return <>{children}</>;

  return (
    <PrpEditProvider section={section}>
      <div className="pt-8">
        <PrpAdminBar />
        {children}
      </div>
    </PrpEditProvider>
  );
}
