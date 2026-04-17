import { redirect } from "next/navigation";

/**
 * Backward-compat redirect: /admin/noc/fast-track → /admin/noc/direct-entry
 * The feature was renamed from "Fast-Track Entry" to "Direct Entry".
 */
export default function FastTrackRedirectPage() {
  redirect("/admin/noc/direct-entry");
}
