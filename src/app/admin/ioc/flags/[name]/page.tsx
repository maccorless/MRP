import { notFound } from "next/navigation";

// Feature-flag admin capability is deferred. This route returns 404 until
// the capability is re-enabled behind a DTEC.SYSADMIN role gate. The prior
// implementation (state transitions, per-user/NOC canary enrolment) is
// preserved in git history — restore from the commit that introduced this
// stub when re-enabling.
export default async function FlagDetailPage(): Promise<never> {
  notFound();
}
