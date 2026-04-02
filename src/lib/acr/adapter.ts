/** ACR (Accreditation System) adapter interface. */

export type OrgExportRecord = {
  nocCode: string;
  organizationId: string;
  orgName: string;
  country: string | null;
  orgType: string;
  emailDomain: string | null;
  contactName: string;
  contactEmail: string;
  // Per-category flags (requested in EoI)
  categoryE:   boolean;
  categoryEs:  boolean;
  categoryEp:  boolean;
  categoryEps: boolean;
  categoryEt:  boolean;
  categoryEc:  boolean;
  // Per-category allocated slots (PbN)
  eSlots:   number;
  esSlots:  number;
  epSlots:  number;
  epsSlots: number;
  etSlots:  number;
  ecSlots:  number;
  nocESlots: number;        // NOC-attached press attachés (separate quota pool)
  // ENR (Extended Non-Rights Broadcaster) — null for regular EoI orgs
  enrSlotsGranted: number | null;
  commonCodesId: string | null;
  eventId: string;
};

export interface AcrAdapter {
  /** Push approved org slot data to ACR. Returns number of records pushed. */
  pushOrgData(orgs: OrgExportRecord[]): Promise<{ pushed: number }>;
}
