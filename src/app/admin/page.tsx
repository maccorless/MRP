import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";

export default async function AdminPage() {
  const session = await requireSession();

  if (session.role === "noc_admin") {
    redirect("/admin/noc");
  } else {
    redirect("/admin/ioc");
  }
}
