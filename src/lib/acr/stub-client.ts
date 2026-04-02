import type { AcrAdapter, OrgExportRecord } from "./adapter";

/**
 * Stub ACR client for development / v0.1 testing.
 * Logs the payload and returns success. Replaced by real ACR client at Gate 0 (Jun 2026).
 */
export class AcrStubClient implements AcrAdapter {
  async pushOrgData(orgs: OrgExportRecord[]): Promise<{ pushed: number }> {
    console.log(`[ACR STUB] pushOrgData called with ${orgs.length} records`);
    for (const org of orgs) {
      const total = org.eSlots + org.esSlots + org.epSlots + org.epsSlots + org.etSlots + org.ecSlots + org.nocESlots + (org.enrSlotsGranted ?? 0);
      const enrTag = org.enrSlotsGranted != null ? ` ENR:${org.enrSlotsGranted}` : "";
      console.log(`[ACR STUB]  ${org.nocCode} / ${org.orgName} — E:${org.eSlots} Es:${org.esSlots} EP:${org.epSlots} EPs:${org.epsSlots} ET:${org.etSlots} EC:${org.ecSlots} NocE:${org.nocESlots}${enrTag} (total:${total})`);
    }
    return { pushed: orgs.length };
  }
}

export const acrClient: AcrAdapter = new AcrStubClient();
