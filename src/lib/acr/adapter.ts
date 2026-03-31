/** ACR (Accreditation System) adapter interface. */

export type OrgExportRecord = {
  nocCode: string;
  organizationId: string;
  orgName: string;
  country: string;
  orgType: string;
  emailDomain: string;
  contactName: string;
  contactEmail: string;
  // Per-category flags (requested in EoI)
  categoryE:   boolean;
  categoryEs:  boolean;
  categoryEp:  boolean;
  categoryEps: boolean;
  categoryEt:  boolean;
  categoryEc:  boolean;
  // Per-category allocated slots
  eSlots:   number;
  esSlots:  number;
  epSlots:  number;
  epsSlots: number;
  etSlots:  number;
  ecSlots:  number;
  commonCodesId: string | null;
  eventId: string;
};

export interface AcrAdapter {
  /** Push approved org slot data to ACR. Returns number of records pushed. */
  pushOrgData(orgs: OrgExportRecord[]): Promise<{ pushed: number }>;
}
