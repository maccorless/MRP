import { eq } from "drizzle-orm";
import { db } from "@/db";
import { nocQuotas, orgSlotAllocations, enrRequests } from "@/db/schema";
import { requireIocSession } from "@/lib/session";
import { derivePbnStatus } from "@/lib/quota-calc";
import {
  MasterAllocationClient,
  type CategorySlots,
  type NocRow,
  type EnrSummary,
  type IocDirectRow,
} from "./MasterAllocationClient";

const EVENT_ID = "LA28";
const IOC_DIRECT = "IOC_DIRECT";

const ZERO_SLOTS: CategorySlots = { e: 0, es: 0, ep: 0, eps: 0, et: 0, ec: 0, nocE: 0 };

function addSlots(a: CategorySlots, b: CategorySlots): CategorySlots {
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

function allocRowToSlots(row: {
  eSlots: number;
  esSlots: number;
  epSlots: number;
  epsSlots: number;
  etSlots: number;
  ecSlots: number;
  nocESlots: number;
}): CategorySlots {
  return {
    e:    row.eSlots   ?? 0,
    es:   row.esSlots  ?? 0,
    ep:   row.epSlots  ?? 0,
    eps:  row.epsSlots ?? 0,
    et:   row.etSlots  ?? 0,
    ec:   row.ecSlots  ?? 0,
    nocE: row.nocESlots ?? 0,
  };
}

export default async function MasterAllocationPage() {
  await requireIocSession();

  const [quotas, allocs, enrs] = await Promise.all([
    db
      .select()
      .from(nocQuotas)
      .where(eq(nocQuotas.eventId, EVENT_ID))
      .orderBy(nocQuotas.nocCode),
    db
      .select()
      .from(orgSlotAllocations)
      .where(eq(orgSlotAllocations.eventId, EVENT_ID)),
    db
      .select()
      .from(enrRequests)
      .where(eq(enrRequests.eventId, EVENT_ID)),
  ]);

  // Bucket allocations by NOC code
  const submittedByNoc = new Map<string, CategorySlots>();
  const approvedByNoc = new Map<string, CategorySlots>();
  const statesByNoc = new Map<string, string[]>();

  for (const a of allocs) {
    const slots = allocRowToSlots(a);
    // Track states for derivePbnStatus (for non-IOC NOCs)
    const states = statesByNoc.get(a.nocCode) ?? [];
    states.push(a.pbnState);
    statesByNoc.set(a.nocCode, states);

    if (a.pbnState === "noc_submitted") {
      submittedByNoc.set(a.nocCode, addSlots(submittedByNoc.get(a.nocCode) ?? ZERO_SLOTS, slots));
    }
    if (a.pbnState === "ocog_approved" || a.pbnState === "sent_to_acr") {
      approvedByNoc.set(a.nocCode, addSlots(approvedByNoc.get(a.nocCode) ?? ZERO_SLOTS, slots));
    }
  }

  // Build NOC rows (exclude IOC_DIRECT — that goes in its own section)
  const nocRows: NocRow[] = quotas
    .filter((q) => q.nocCode !== IOC_DIRECT)
    .map((q) => {
      const quota: CategorySlots = {
        e:    q.eTotal   ?? 0,
        es:   q.esTotal  ?? 0,
        ep:   q.epTotal  ?? 0,
        eps:  q.epsTotal ?? 0,
        et:   q.etTotal  ?? 0,
        ec:   q.ecTotal  ?? 0,
        nocE: q.nocETotal ?? 0,
      };
      const submitted = submittedByNoc.get(q.nocCode) ?? ZERO_SLOTS;
      const approved = approvedByNoc.get(q.nocCode) ?? ZERO_SLOTS;
      const pbnStatus = derivePbnStatus(statesByNoc.get(q.nocCode) ?? []);
      return { nocCode: q.nocCode, quota, submitted, approved, pbnStatus };
    });

  // Also surface NOCs that have allocations but no quota row (edge case)
  const quotaNocSet = new Set(quotas.map((q) => q.nocCode));
  for (const noc of statesByNoc.keys()) {
    if (noc === IOC_DIRECT) continue;
    if (quotaNocSet.has(noc)) continue;
    nocRows.push({
      nocCode: noc,
      quota: ZERO_SLOTS,
      submitted: submittedByNoc.get(noc) ?? ZERO_SLOTS,
      approved: approvedByNoc.get(noc) ?? ZERO_SLOTS,
      pbnStatus: derivePbnStatus(statesByNoc.get(noc) ?? []),
    });
  }
  nocRows.sort((a, b) => a.nocCode.localeCompare(b.nocCode));

  // IOC Direct: sum all allocations for IOC_DIRECT org, compare to IOC_DIRECT quota (if any)
  const iocDirectQuotaRow = quotas.find((q) => q.nocCode === IOC_DIRECT);
  const iocDirectQuota: CategorySlots = iocDirectQuotaRow
    ? {
        e:    iocDirectQuotaRow.eTotal   ?? 0,
        es:   iocDirectQuotaRow.esTotal  ?? 0,
        ep:   iocDirectQuotaRow.epTotal  ?? 0,
        eps:  iocDirectQuotaRow.epsTotal ?? 0,
        et:   iocDirectQuotaRow.etTotal  ?? 0,
        ec:   iocDirectQuotaRow.ecTotal  ?? 0,
        nocE: iocDirectQuotaRow.nocETotal ?? 0,
      }
    : ZERO_SLOTS;

  const iocDirectRow: IocDirectRow = {
    label: "IOC Direct",
    quota: iocDirectQuota,
    submitted: submittedByNoc.get(IOC_DIRECT) ?? ZERO_SLOTS,
    approved: approvedByNoc.get(IOC_DIRECT) ?? ZERO_SLOTS,
    pbnStatus: derivePbnStatus(statesByNoc.get(IOC_DIRECT) ?? []),
  };

  // ENR summary — slots requested (all submitted rows) and granted (decisioned rows)
  const enrRequested = enrs.reduce((s, r) => s + (r.slotsRequested ?? 0), 0);
  const enrGranted = enrs.reduce((s, r) => {
    if (r.decision === "granted" || r.decision === "partial") {
      return s + (r.slotsGranted ?? 0);
    }
    return s;
  }, 0);
  const enrPending = enrs.filter((r) => r.decision === null).length;
  const enrDecided = enrs.filter((r) => r.decision !== null).length;

  const enrSummary: EnrSummary = {
    totalRequests: enrs.length,
    pending: enrPending,
    decided: enrDecided,
    slotsRequested: enrRequested,
    slotsGranted: enrGranted,
  };

  // Grand totals — sum across NOC rows + IOC Direct
  const grandQuota = nocRows.reduce((s, r) => addSlots(s, r.quota), iocDirectRow.quota);
  const grandSubmitted = nocRows.reduce((s, r) => addSlots(s, r.submitted), iocDirectRow.submitted);
  const grandApproved = nocRows.reduce((s, r) => addSlots(s, r.approved), iocDirectRow.approved);

  return (
    <MasterAllocationClient
      rows={nocRows}
      iocDirectRow={iocDirectRow}
      enrSummary={enrSummary}
      grandTotals={{ quota: grandQuota, submitted: grandSubmitted, approved: grandApproved }}
    />
  );
}
