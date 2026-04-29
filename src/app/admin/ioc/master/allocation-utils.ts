export type CategorySlots = {
  e: number;
  es: number;
  ep: number;
  eps: number;
  et: number;
  ec: number;
  nocE: number;
};

export type PbnStatus = "not_started" | "draft" | "noc_submitted" | "ocog_approved" | "sent_to_acr";

export type NocRow = {
  nocCode: string;
  entityType: "noc" | "if";
  quota: CategorySlots;
  allocated: CategorySlots;
  pbnStatus: string;
};

export type IocDirectRow = {
  label: string;
  quota: CategorySlots;
  allocated: CategorySlots;
  pbnStatus: string;
};

export type OrgAllocRow = {
  orgId: string;
  orgName: string;
  nocCode: string;
  pbnState: string;
  slots: CategorySlots;
};

export type EnrSummary = {
  totalRequests: number;
  pending: number;
  decided: number;
  slotsRequested: number;
  slotsGranted: number;
};

export type GrandTotals = {
  quota: CategorySlots;
  allocated: CategorySlots;
};

export type EventCapacity = {
  capacity: number;
  iocHoldback: number;
};

export const ZERO_SLOTS: CategorySlots = { e: 0, es: 0, ep: 0, eps: 0, et: 0, ec: 0, nocE: 0 };

export function addSlots(a: CategorySlots, b: CategorySlots): CategorySlots {
  return {
    e:    a.e    + b.e,
    es:   a.es   + b.es,
    ep:   a.ep   + b.ep,
    eps:  a.eps  + b.eps,
    et:   a.et   + b.et,
    ec:   a.ec   + b.ec,
    nocE: a.nocE + b.nocE,
  };
}
