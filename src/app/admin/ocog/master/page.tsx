import { eq } from "drizzle-orm";
import { db } from "@/db";
import { nocQuotas, orgSlotAllocations, enrRequests } from "@/db/schema";
import { requireOcogSession } from "@/lib/session";
import { derivePbnStatus } from "@/lib/quota-calc";
import {
  MasterAllocationClient,
  type CategorySlots,
  type NocRow,
  type EnrSummary,
  type IocDirectRow,
} from "@/app/admin/ioc/master/MasterAllocationClient";

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

export default async function OcogMasterAllocationPage() {
  await requireOcogSession();

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

  const submittedByNoc = new Map<string, CategorySlots>();
  const approvedByNoc = new Map<string, CategorySlots>();
  const statesByNoc = new Map<string, string[]>();

  for (const a of allocs) {
    const slots: CategorySlots = {
      e:    a.eSlots   ?? 0,
      es:   a.esSlots  ?? 0,
      ep:   a.epSlots  ?? 0,
      eps:  a.epsSlots ?? 0,
      et:   a.etSlots  ?? 0,
      ec:   a.ecSlots  ?? 0,
      nocE: a.nocESlots ?? 0,
    };
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

  const nocRows: NocRow[] = quotas
    .filter((q) => q.nocCode !== IOC_DIRECT)
    .map((q) => ({
      nocCode: q.nocCode,
      quota: {
        e:    q.eTotal   ?? 0,
        es:   q.esTotal  ?? 0,
        ep:   q.epTotal  ?? 0,
        eps:  q.epsTotal ?? 0,
        et:   q.etTotal  ?? 0,
        ec:   q.ecTotal  ?? 0,
        nocE: q.nocETotal ?? 0,
      },
      submitted: submittedByNoc.get(q.nocCode) ?? ZERO_SLOTS,
      approved:  approvedByNoc.get(q.nocCode)  ?? ZERO_SLOTS,
      pbnStatus: derivePbnStatus(statesByNoc.get(q.nocCode) ?? []),
    }));

  const quotaNocSet = new Set(quotas.map((q) => q.nocCode));
  for (const noc of statesByNoc.keys()) {
    if (noc === IOC_DIRECT) continue;
    if (quotaNocSet.has(noc)) continue;
    nocRows.push({
      nocCode: noc,
      quota: ZERO_SLOTS,
      submitted: submittedByNoc.get(noc) ?? ZERO_SLOTS,
      approved:  approvedByNoc.get(noc)  ?? ZERO_SLOTS,
      pbnStatus: derivePbnStatus(statesByNoc.get(noc) ?? []),
    });
  }
  nocRows.sort((a, b) => a.nocCode.localeCompare(b.nocCode));

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
    approved:  approvedByNoc.get(IOC_DIRECT)  ?? ZERO_SLOTS,
    pbnStatus: derivePbnStatus(statesByNoc.get(IOC_DIRECT) ?? []),
  };

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

  const grandQuota     = nocRows.reduce((s, r) => addSlots(s, r.quota),     iocDirectRow.quota);
  const grandSubmitted = nocRows.reduce((s, r) => addSlots(s, r.submitted), iocDirectRow.submitted);
  const grandApproved  = nocRows.reduce((s, r) => addSlots(s, r.approved),  iocDirectRow.approved);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <MasterAllocationClient
        rows={nocRows}
        iocDirectRow={iocDirectRow}
        enrSummary={enrSummary}
        grandTotals={{ quota: grandQuota, submitted: grandSubmitted, approved: grandApproved }}
      />
    </div>
  );
}
