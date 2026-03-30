import type { AcrAdapter, OrgExportRecord } from "./adapter";

/**
 * Stub ACR client for development / v0.1 testing.
 * Logs the payload and returns success. Replaced by real ACR client at Gate 0 (Jun 2026).
 */
export class AcrStubClient implements AcrAdapter {
  async pushOrgData(orgs: OrgExportRecord[]): Promise<{ pushed: number }> {
    console.log(`[ACR STUB] pushOrgData called with ${orgs.length} records`);
    for (const org of orgs) {
      console.log(`[ACR STUB]  ${org.nocCode} / ${org.orgName} — press:${org.pressSlots} photo:${org.photoSlots}`);
    }
    return { pushed: orgs.length };
  }
}

export const acrClient: AcrAdapter = new AcrStubClient();
