import { eq } from "drizzle-orm";
import { db } from "@/db";
import { nocQuotas, orgSlotAllocations, enrRequests, eventSettings, organizations } from "@/db/schema";
import { requireIocSession } from "@/lib/session";
import { derivePbnStatus } from "@/lib/quota-calc";
import {
  MasterAllocationClient,
  addSlots,
  ZERO_SLOTS,
  type CategorySlots,
  type NocRow,
  type EnrSummary,
  type IocDirectRow,
  type OrgAllocRow,
  type EventCapacity,
  type GrandTotals,
} from "./MasterAllocationClient";

const EVENT_ID = "LA28";
const IOC_DIRECT = "IOC_DIRECT";

function allocRowToSlots(row: {
  eSlots: number; esSlots: number; epSlots: number; epsSlots: number;
  etSlots: number; ecSlots: number; nocESlots: number;
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

  const [quotas, allocs, enrs, settingsRows, orgAllocData] = await Promise.all([
    db.select().from(nocQuotas).where(eq(nocQuotas.eventId, EVENT_ID)).orderBy(nocQuotas.nocCode),
    db.select().from(orgSlotAllocations).where(eq(orgSlotAllocations.eventId, EVENT_ID)),
    db.select().from(enrRequests).where(eq(enrRequests.eventId, EVENT_ID)),
    db.select().from(eventSettings).where(eq(eventSettings.eventId, EVENT_ID)),
    db.select({
      orgId: orgSlotAllocations.organizationId,
      orgName: organizations.name,
      nocCode: orgSlotAllocations.nocCode,
      pbnState: orgSlotAllocations.pbnState,
      eSlots: orgSlotAllocations.eSlots,
      esSlots: orgSlotAllocations.esSlots,
      epSlots: orgSlotAllocations.epSlots,
      epsSlots: orgSlotAllocations.epsSlots,
      etSlots: orgSlotAllocations.etSlots,
      ecSlots: orgSlotAllocations.ecSlots,
      nocESlots: orgSlotAllocations.nocESlots,
    }).from(orgSlotAllocations)
      .innerJoin(organizations, eq(orgSlotAllocations.organizationId, organizations.id))
      .where(eq(orgSlotAllocations.eventId, EVENT_ID)),
  ]);

  const eventCapacity: EventCapacity = {
    capacity:     settingsRows[0]?.capacity    ?? 6000,
    iocHoldback:  settingsRows[0]?.iocHoldback ?? 0,
  };

  // Bucket all allocations by nocCode (all states count toward "allocated")
  const allocatedByNoc = new Map<string, CategorySlots>();
  const statesByNoc    = new Map<string, string[]>();

  for (const a of allocs) {
    allocatedByNoc.set(a.nocCode, addSlots(allocatedByNoc.get(a.nocCode) ?? ZERO_SLOTS, allocRowToSlots(a)));
    const states = statesByNoc.get(a.nocCode) ?? [];
    states.push(a.pbnState);
    statesByNoc.set(a.nocCode, states);
  }

  // Build NOC + IF rows
  const nocRows: NocRow[] = quotas
    .filter((q) => q.nocCode !== IOC_DIRECT)
    .map((q) => ({
      nocCode:    q.nocCode,
      entityType: (q.entityType ?? "noc") as "noc" | "if",
      quota: {
        e:    q.eTotal   ?? 0,
        es:   q.esTotal  ?? 0,
        ep:   q.epTotal  ?? 0,
        eps:  q.epsTotal ?? 0,
        et:   q.etTotal  ?? 0,
        ec:   q.ecTotal  ?? 0,
        nocE: q.nocETotal ?? 0,
      },
      allocated:  allocatedByNoc.get(q.nocCode) ?? ZERO_SLOTS,
      pbnStatus:  derivePbnStatus(statesByNoc.get(q.nocCode) ?? []),
    }));

  // Surface NOCs/IFs with allocations but no quota row
  const quotaSet = new Set(quotas.map((q) => q.nocCode));
  for (const noc of statesByNoc.keys()) {
    if (noc === IOC_DIRECT || quotaSet.has(noc)) continue;
    nocRows.push({
      nocCode: noc, entityType: "noc",
      quota: ZERO_SLOTS,
      allocated: allocatedByNoc.get(noc) ?? ZERO_SLOTS,
      pbnStatus: derivePbnStatus(statesByNoc.get(noc) ?? []),
    });
  }
  nocRows.sort((a, b) => a.nocCode.localeCompare(b.nocCode));

  // IOC Direct row
  const iocDQ = quotas.find((q) => q.nocCode === IOC_DIRECT);
  const iocDirectRow: IocDirectRow = {
    label: "IOC Direct",
    quota: iocDQ ? {
      e: iocDQ.eTotal ?? 0, es: iocDQ.esTotal ?? 0, ep: iocDQ.epTotal ?? 0,
      eps: iocDQ.epsTotal ?? 0, et: iocDQ.etTotal ?? 0, ec: iocDQ.ecTotal ?? 0,
      nocE: iocDQ.nocETotal ?? 0,
    } : ZERO_SLOTS,
    allocated:  allocatedByNoc.get(IOC_DIRECT) ?? ZERO_SLOTS,
    pbnStatus:  derivePbnStatus(statesByNoc.get(IOC_DIRECT) ?? []),
  };

  // ENR summary
  const enrSummary: EnrSummary = {
    totalRequests: enrs.length,
    pending:       enrs.filter((r) => r.decision === null).length,
    decided:       enrs.filter((r) => r.decision !== null).length,
    slotsRequested: enrs.reduce((s, r) => s + (r.slotsRequested ?? 0), 0),
    slotsGranted:  enrs.reduce((s, r) =>
      r.decision === "granted" || r.decision === "partial" ? s + (r.slotsGranted ?? 0) : s, 0),
  };

  // Grand totals (NOC rows + IF rows + IOC Direct; not holdback — that's capacity-side)
  const grandQuota     = nocRows.reduce((s, r) => addSlots(s, r.quota),     iocDirectRow.quota);
  const grandAllocated = nocRows.reduce((s, r) => addSlots(s, r.allocated), iocDirectRow.allocated);
  const grandTotals: GrandTotals = { quota: grandQuota, allocated: grandAllocated };

  // Org allocation rows for expandable sub-tables
  const orgAllocRows: OrgAllocRow[] = orgAllocData.map((r) => ({
    orgId:    r.orgId,
    orgName:  r.orgName,
    nocCode:  r.nocCode,
    pbnState: r.pbnState,
    slots:    allocRowToSlots(r),
  }));

  return (
    <MasterAllocationClient
      rows={nocRows}
      iocDirectRow={iocDirectRow}
      enrSummary={enrSummary}
      grandTotals={grandTotals}
      eventCapacity={eventCapacity}
      orgAllocRows={orgAllocRows}
    />
  );
}
