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
  categoryPress: boolean;
  categoryPhoto: boolean;
  pressSlots: number;
  photoSlots: number;
  commonCodesId: string | null;
  eventId: string;
};

export interface AcrAdapter {
  /** Push approved org slot data to ACR. Returns number of records pushed. */
  pushOrgData(orgs: OrgExportRecord[]): Promise<{ pushed: number }>;
}
