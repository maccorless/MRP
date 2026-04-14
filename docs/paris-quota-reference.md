**Created: 13-Apr-2026 21:35 CEST**

# Paris 2024 IOC Master Allocation Table — Reference

Extracted from `46_IOC Master Allocation Table Paris 10.6.24.xlsb` sent by Emma Morris (IOC) on 2026-04-13 as ground-truth for how the IOC actually operates the quota process. This is **the working document** between IOC and Paris 2024.

Raw CSV exports live in `/tmp/paris2024_*.csv` (regenerable from the xlsb).

---

## Workbook structure

13 sheets total. Real data in 8 tabs that mirror the **Summary pivot**:

| Tab | Contents |
|-----|----------|
| 1 NOCs Paris | Main per-NOC allocation (206 rows × 57 cols) |
| 2 Int. Agencies | AFP, AP, Reuters, Xinhua, Getty |
| 3 IOC News Orgs | International news orgs outside NOC territories |
| 4 Sports Specialists | Sport-specific Es/EPs |
| 5 IFs | International Federation allocations |
| 6 IOC Misc | IOC contingency / miscellaneous reserve |
| 7 ENRs | Non-MRH broadcasters (Non-media rights-holding) |
| 8 Ex, EPxs | Venue extras for host + co-host (Châteauroux, Tahiti, Marseilles, etc.) |

Plus `NOC Official`, `Sheet1`, `Sheet4`, `cancelled` — scratch/reference.

---

## Tab 1 shape — this is what NOCs see

- 206 NOC rows
- Keys: Ordinal, NOC name, 3-letter Code, Continent
- **9 quota columns: NOC E, NOC Es, E, Es, EP, Eps, ET, EC + computed Total**
- **The 9-column block is repeated 5 times horizontally** — one block per allocation revision, each with its own comments column

This means: the IOC tracks the **full allocation history inline** in the same row, not in separate log tables. Our MRP schema needs an `allocation_revisions` timeline to mirror this — overwriting an allocation would destroy audit trail the IOC expects to keep.

---

## Totals (Paris 2024)

**Per-category across 206 NOCs (Tab 1):**

| NOC E | NOC Es | E | Es | EP | Eps | ET | EC | **Total** |
|-------|--------|---|----|----|-----|----|----|----|
| 334 | 109 | 2,339 | 187 | 864 | 131 | 51 | 28 | **4,043** |

**Grand total across all 8 tabs:** E 2,883 · Es 375 · EP 1,312 · Eps 285 · ET 152 · EC 56 · ENR 533 · NOC E 334 · NOC Es 109 → **6,039** (vs 6,000 quota cap, with a 7% cancellation reserve modelled that brings it to 5,616, leaving 384 unallocated).

So ~67% of the press accreditation pool is NOC-allocated. ~33% is non-NOC (agencies, IOC direct, IFs, sport specialists, ENRs, contingency) — all of which MRP currently models thinly or not at all.

---

## Top 10 NOCs by total allocation (Paris 2024)

| # | Code | NOC | Total | NOC E | NOC Es | E | Es | EP | Eps | ET | EC |
|---|------|------|-------|-------|--------|---|----|----|-----|----|----|
| 1 | FRA (host) | France | 451 | 25 | 20 | 262 | 27 | 93 | 18 | 5 | 1 |
| 2 | USA | United States | 439 | 55 | 13 | 275 | 9 | 70 | 9 | 5 | 3 |
| 3 | GER | Germany | 280 | 10 | 16 | 164 | 17 | 51 | 12 | 10 | 0 |
| 4 | JPN | Japan | 252 | 5 | 2 | 136 | 14 | 52 | 12 | 19 | 12 |
| 5 | GBR | Great Britain | 200 | 18 | 2 | 119 | 15 | 37 | 7 | 1 | 1 |
| 6 | ITA | Italy | 168 | 9 | 9 | 116 | 6 | 20 | 6 | 2 | 0 |
| 7 | CHN | China | 143 | 2 | 0 | 100 | 0 | 34 | 0 | 2 | 5 |
| 8 | ESP | Spain | 130 | 14 | 11 | 74 | 5 | 20 | 6 | 0 | 0 |
| 9 | BRA | Brazil | 116 | 8 | 11 | 40 | 20 | 17 | 16 | 0 | 4 |
| 10 | AUS | Australia | 115 | 16 | 0 | 76 | 4 | 16 | 3 | 0 | 0 |

**Important host-uplift signal**: FRA (host) gets 25 NOC E slots — nearly 2× USA's 13 despite USA having a larger overall allocation. For LA28, USA will be host and USOPC's NOC E quota should reflect the same uplift.

**Tail**: the median NOC is in single digits. **24 NOCs had zero allocation** in Paris (mostly small islands, or suspended NOCs like ROC/Russia).

---

## Findings that matter for MRP design

1. **Nine categories, not one bucket.** The MRP schema must carry per-category slots: NOC E, NOC Es, E, Es, EP, Eps, ET, EC, ENR — plus venue-scoped Ex/EPx for co-host cities (100 total in Paris's Tab 8). ✅ Our schema already has most of these; verify Ex/EPx is there.
2. **Allocation is versioned.** Paris stored 5 side-by-side snapshots with per-block comments. MRP must log allocations as revisions, not overwrite. Confirm our audit log captures enough to reconstruct any prior version.
3. **Free-text "Comments" per revision.** Captures provenance (e.g. "Changed 1 E to 1 NOC E - 7 Dec 23, all quota given to NOC. No reply"). Our schema's `internal_note` field on allocations should make this routine, not exceptional.
4. **Non-NOC quota pools are first-class.** ~2,000 of the 6,039 total allocations are non-NOC (agencies, news orgs, sport specialists, IFs, ENRs, IOC contingency). MRP currently has IOC-Direct for a subset of this; other pools (IF sport-specialist, Miscellaneous contingency) are thinner. LA28 is likely to follow the same structure.
5. **7% cancellation reserve is modelled, not ad-hoc.** Summary tab explicitly computes it (Summary row 16). Worth surfacing in MRP reports.
6. **Returns/cancellations tracked separately** (`cancelled` sheet exists but is nearly empty for Paris — suggests a workflow field that becomes relevant during the Games).
7. **Host NOC gets ~1.5–2× uplift** on NOC-official flavours. LA28 logic for USA as host will mirror this — quota templates should allow host-uplift.
8. **No rights-holding broadcasters (RHBs)** in this workbook at all — those are tracked separately from press quota. MRP is press-only, which aligns.

---

## Ground-truth numbers for MRP quota tests

Use these as fixtures in `src/lib/quota-calc.ts` tests to sanity-check the math:

- Top 10 NOC totals above
- Per-category grand totals (4,043 NOC grand; 6,039 all-tabs grand)
- Paris 2024 E-quota cap = 6,000
- 24 zero-allocation NOCs (mostly small islands, unattended NOCs, or suspended like ROC)
- Cancellation reserve: 7% of the per-NOC total, subtracted from the allocation before deeming it "final"

---

## Links between this table and the Strategic Plan

This spreadsheet is almost certainly what the Strategic Plan refers to as:

> "The IOC Master E Accreditation tracking database" (Strategic Plan §4.1) and the "IOC Master DB tabs 1–8" (referenced in working procedures)

It's also almost certainly the file structure USOPC uses offline — the 9-category-block pattern is exactly what Emma described.

**Implication for PbN Excel question**: "Excel import/sync" likely means: MRP needs to produce a spreadsheet in **this exact shape** on export, and potentially accept one on import.
