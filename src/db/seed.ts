/**
 * Seed script — v0.09 prototype test data
 * Run: npm run db:seed
 *
 * Covers:
 *   - 5 admin users (IOC admin, IOC readonly, 3 NOC admins)
 *   - 8 organizations across 5 NOCs and all org types
 *   - 12 applications spanning all status states
 *   - Audit log entries tracking state transitions
 *   - 2 magic link tokens (1 valid, 1 expired)
 */

import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { db } from "./index";
import {
  adminUsers,
  organizations,
  applications,
  auditLog,
  magicLinkTokens,
  nocQuotas,
  orgSlotAllocations,
} from "./schema";
import { createHash } from "crypto";

// bcrypt hash of "Password1!" — prototype only, replaced by SSO at v1.0
const PROTO_PW_HASH =
  "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhu2";

function sha256(val: string) {
  return createHash("sha256").update(val).digest("hex");
}

async function main() {
  console.log("Clearing existing data...");

  // Delete in FK-safe order
  await db.delete(auditLog);
  await db.delete(magicLinkTokens);
  await db.delete(orgSlotAllocations);
  await db.delete(applications);
  await db.delete(organizations);
  await db.delete(nocQuotas);
  await db.delete(adminUsers);

  // ─── Admin Users ────────────────────────────────────────────────────────────

  console.log("Seeding admin users...");

  const [iocAdmin] = await db
    .insert(adminUsers)
    .values({
      email: "ioc.admin@olympics.org",
      role: "ioc_admin",
      displayName: "IOC Admin",
      passwordHash: PROTO_PW_HASH,
    })
    .returning();

  const [iocReadonly] = await db
    .insert(adminUsers)
    .values({
      email: "ioc.readonly@olympics.org",
      role: "ioc_readonly",
      displayName: "IOC Viewer",
      passwordHash: PROTO_PW_HASH,
    })
    .returning();

  const [nocAdminUS] = await db
    .insert(adminUsers)
    .values({
      email: "noc.admin@usopc.org",
      role: "noc_admin",
      nocCode: "USA",
      displayName: "S. Kim (USOPC)",
      passwordHash: PROTO_PW_HASH,
    })
    .returning();

  const [nocAdminGB] = await db
    .insert(adminUsers)
    .values({
      email: "noc.admin@teamgb.org",
      role: "noc_admin",
      nocCode: "GBR",
      displayName: "R. Clarke (Team GB)",
      passwordHash: PROTO_PW_HASH,
    })
    .returning();

  const [nocAdminFR] = await db
    .insert(adminUsers)
    .values({
      email: "noc.admin@franceolympique.fr",
      role: "noc_admin",
      nocCode: "FRA",
      displayName: "M. Dupont (CNOSF)",
      passwordHash: PROTO_PW_HASH,
    })
    .returning();

  await db.insert(adminUsers).values({
    email: "ocog.admin@la28.org",
    role: "ocog_admin",
    displayName: "LA28 OCOG Admin",
    passwordHash: PROTO_PW_HASH,
  });

  await db.insert(adminUsers).values({
    email: "if.admin@worldathletics.org",
    role: "if_admin",
    ifCode: "ATH",
    displayName: "World Athletics IF Admin",
    passwordHash: PROTO_PW_HASH,
  });

  // ─── Organizations ───────────────────────────────────────────────────────────

  console.log("Seeding organizations...");

  const [apUS] = await db
    .insert(organizations)
    .values({
      name: "Associated Press (US)",
      country: "US",
      nocCode: "USA",
      orgType: "news_agency",
      website: "https://apnews.com",
      emailDomain: "ap.org",
    })
    .returning();

  const [nytUS] = await db
    .insert(organizations)
    .values({
      name: "The New York Times",
      country: "US",
      nocCode: "USA",
      orgType: "media_print_online",
      website: "https://nytimes.com",
      emailDomain: "nytimes.com",
    })
    .returning();

  const [nbcUS] = await db
    .insert(organizations)
    .values({
      name: "NBC Sports",
      country: "US",
      nocCode: "USA",
      orgType: "media_broadcast",
      website: "https://nbcsports.com",
      emailDomain: "nbcuni.com",
    })
    .returning();

  const [bbcGB] = await db
    .insert(organizations)
    .values({
      name: "BBC Sport",
      country: "GB",
      nocCode: "GBR",
      orgType: "media_broadcast",
      website: "https://bbc.co.uk/sport",
      emailDomain: "bbc.co.uk",
    })
    .returning();

  const [guardianGB] = await db
    .insert(organizations)
    .values({
      name: "The Guardian",
      country: "GB",
      nocCode: "GBR",
      orgType: "media_print_online",
      website: "https://theguardian.com",
      emailDomain: "theguardian.com",
    })
    .returning();

  const [lequipeFR] = await db
    .insert(organizations)
    .values({
      name: "L'Équipe",
      country: "FR",
      nocCode: "FRA",
      orgType: "media_print_online",
      website: "https://lequipe.fr",
      emailDomain: "lequipe.fr",
    })
    .returning();

  // Multi-territory: Reuters covers multiple NOCs
  const [reutersUS] = await db
    .insert(organizations)
    .values({
      name: "Reuters (North America)",
      country: "US",
      nocCode: "USA",
      orgType: "news_agency",
      website: "https://reuters.com",
      emailDomain: "reuters.com",
      isMultiTerritoryFlag: true,
    })
    .returning();

  const [reutersGB] = await db
    .insert(organizations)
    .values({
      name: "Reuters (UK)",
      country: "GB",
      nocCode: "GBR",
      orgType: "news_agency",
      website: "https://reuters.com",
      emailDomain: "reuters.com",
      isMultiTerritoryFlag: true,
    })
    .returning();

  // ─── Applications ────────────────────────────────────────────────────────────

  console.log("Seeding applications...");

  // PENDING — awaiting NOC review
  const [app01] = await db
    .insert(applications)
    .values({
      referenceNumber: "APP-2028-USA-00001",
      organizationId: apUS.id,
      nocCode: "USA",
      contactName: "Jane Holloway",
      contactEmail: "j.holloway@ap.org",
      categoryE: true, categoryEs: false, categoryEp: false,
      categoryEps: false, categoryEt: false, categoryEc: false,
      requestedE: 8,
      categoryPress: true, categoryPhoto: false,
      about:
        "AP has covered every Olympic Games since 1896. Requesting 8 E (journalist) accreditations covering athletics, swimming, and gymnastics.",
      status: "pending",
    })
    .returning();

  const [app02] = await db
    .insert(applications)
    .values({
      referenceNumber: "APP-2028-USA-00002",
      organizationId: nytUS.id,
      nocCode: "USA",
      contactName: "Marcus Webb",
      contactEmail: "m.webb@nytimes.com",
      categoryE: true, categoryEs: false, categoryEp: true,
      categoryEps: false, categoryEt: false, categoryEc: false,
      requestedE: 5, requestedEp: 3,
      categoryPress: true, categoryPhoto: true,
      about:
        "The New York Times sports desk requests 5 E and 3 EP accreditations for a team covering all major Olympic venues.",
      status: "pending",
    })
    .returning();

  const [app03] = await db
    .insert(applications)
    .values({
      referenceNumber: "APP-2028-GBR-00001",
      organizationId: guardianGB.id,
      nocCode: "GBR",
      contactName: "Priya Nair",
      contactEmail: "p.nair@theguardian.com",
      categoryE: true, categoryEs: true, categoryEp: false,
      categoryEps: false, categoryEt: false, categoryEc: false,
      requestedE: 4, requestedEs: 2,
      categoryPress: true, categoryPhoto: false,
      about:
        "The Guardian requests 4 E (general journalist) and 2 Es (sport-specific, athletics) accreditations for our Olympic coverage team.",
      status: "pending",
    })
    .returning();

  // APPROVED
  const [app04] = await db
    .insert(applications)
    .values({
      referenceNumber: "APP-2028-USA-00003",
      organizationId: nbcUS.id,
      nocCode: "USA",
      contactName: "Dana Kowalski",
      contactEmail: "d.kowalski@nbcuni.com",
      categoryE: false, categoryEs: false, categoryEp: true,
      categoryEps: true, categoryEt: false, categoryEc: false,
      requestedEp: 6, requestedEps: 2,
      categoryPress: false, categoryPhoto: true,
      about:
        "NBC Sports requests 6 EP (general photographer) and 2 EPs (swimming specialist) accreditations for our production team.",
      status: "approved",
      reviewedBy: nocAdminUS.id,
      reviewedAt: new Date("2026-02-15T10:30:00Z"),
    })
    .returning();

  const [app05] = await db
    .insert(applications)
    .values({
      referenceNumber: "APP-2028-GBR-00002",
      organizationId: bbcGB.id,
      nocCode: "GBR",
      contactName: "Tom Ashford",
      contactEmail: "t.ashford@bbc.co.uk",
      categoryE: true, categoryEs: false, categoryEp: true,
      categoryEps: false, categoryEt: true, categoryEc: true,
      requestedE: 6, requestedEp: 4, requestedEt: 2, requestedEc: 2,
      categoryPress: true, categoryPhoto: true,
      about:
        "BBC Sport requests 6 E journalists, 4 EP photographers, 2 ET technicians, and 2 EC support staff for full Games coverage.",
      status: "approved",
      reviewedBy: nocAdminGB.id,
      reviewedAt: new Date("2026-02-20T09:00:00Z"),
    })
    .returning();

  const [app06] = await db
    .insert(applications)
    .values({
      referenceNumber: "APP-2028-FRA-00001",
      organizationId: lequipeFR.id,
      nocCode: "FRA",
      contactName: "Claire Fontaine",
      contactEmail: "c.fontaine@lequipe.fr",
      categoryE: false, categoryEs: false, categoryEp: true,
      categoryEps: true, categoryEt: false, categoryEc: false,
      requestedEp: 4, requestedEps: 2,
      categoryPress: false, categoryPhoto: true,
      about:
        "L'Équipe requests 4 EP photographers and 2 EPs (athletics specialist) for our team covering athletics, cycling, and team sports.",
      status: "approved",
      reviewedBy: nocAdminFR.id,
      reviewedAt: new Date("2026-02-22T14:15:00Z"),
    })
    .returning();

  // RETURNED — sent back for corrections
  const [app07] = await db
    .insert(applications)
    .values({
      referenceNumber: "APP-2028-USA-00004",
      organizationId: reutersUS.id,
      nocCode: "USA",
      contactName: "Sam Okafor",
      contactEmail: "s.okafor@reuters.com",
      categoryE: true, categoryEs: false, categoryEp: false,
      categoryEps: false, categoryEt: false, categoryEc: false,
      requestedE: 3,
      categoryPress: true, categoryPhoto: false,
      about: "Reuters newswire coverage.",
      status: "returned",
      reviewNote:
        "Application incomplete. Please expand the 'About' section to describe the specific events and venues your team will cover, and confirm the number of journalists.",
      reviewedBy: nocAdminUS.id,
      reviewedAt: new Date("2026-02-18T11:00:00Z"),
    })
    .returning();

  const [app08] = await db
    .insert(applications)
    .values({
      referenceNumber: "APP-2028-GBR-00003",
      organizationId: reutersGB.id,
      nocCode: "GBR",
      contactName: "Helen Brooks",
      contactEmail: "h.brooks@reuters.com",
      categoryE: false, categoryEs: false, categoryEp: true,
      categoryEps: false, categoryEt: false, categoryEc: false,
      requestedEp: 5,
      categoryPress: false, categoryPhoto: true,
      about: "Reuters photo desk.",
      status: "returned",
      reviewNote:
        "Please provide more detail on the number of photographers and the specific venues they will need access to.",
      reviewedBy: nocAdminGB.id,
      reviewedAt: new Date("2026-02-19T16:30:00Z"),
    })
    .returning();

  // RESUBMITTED — applicant corrected and resubmitted
  const [app09] = await db
    .insert(applications)
    .values({
      referenceNumber: "APP-2028-USA-00005",
      organizationId: apUS.id,
      nocCode: "USA",
      contactName: "Jane Holloway",
      contactEmail: "j.holloway@ap.org",
      categoryE: true, categoryEs: false, categoryEp: true,
      categoryEps: false, categoryEt: false, categoryEc: false,
      requestedE: 8, requestedEp: 4,
      categoryPress: true, categoryPhoto: true,
      about:
        "AP requests 8 E journalists and 4 EP photographers covering athletics and aquatics at SoFi Stadium and the Olympic Aquatics Center. Updated from original submission with full venue breakdown.",
      status: "resubmitted",
      resubmissionCount: 1,
      reviewNote:
        "Original submission lacked venue detail. Resubmitted 2026-03-01 with full venue breakdown.",
      reviewedAt: new Date("2026-02-25T13:00:00Z"),
      reviewedBy: nocAdminUS.id,
    })
    .returning();

  // REJECTED
  const [app10] = await db
    .insert(applications)
    .values({
      referenceNumber: "APP-2028-FRA-00002",
      organizationId: lequipeFR.id,
      nocCode: "FRA",
      contactName: "Pierre Martin",
      contactEmail: "p.martin@lequipe.fr",
      categoryE: true, categoryEs: false, categoryEp: false,
      categoryEps: false, categoryEt: false, categoryEc: false,
      requestedE: 2,
      categoryPress: true, categoryPhoto: false,
      about: "Additional press pass request.",
      status: "rejected",
      reviewNote:
        "L'Équipe already has an approved application for this Games (APP-2028-FRA-00001). Duplicate applications are not permitted. Please amend your existing application if you need to add team members.",
      reviewedBy: nocAdminFR.id,
      reviewedAt: new Date("2026-03-01T10:00:00Z"),
    })
    .returning();

  // ─── Audit Log ───────────────────────────────────────────────────────────────

  console.log("Seeding audit log...");

  await db.insert(auditLog).values([
    // Submissions
    {
      actorType: "applicant",
      actorId: "j.holloway@ap.org",
      actorLabel: "Jane Holloway (AP)",
      action: "application_submitted",
      applicationId: app01.id,
      organizationId: apUS.id,
    },
    {
      actorType: "applicant",
      actorId: "m.webb@nytimes.com",
      actorLabel: "Marcus Webb (NYT)",
      action: "application_submitted",
      applicationId: app02.id,
      organizationId: nytUS.id,
    },
    {
      actorType: "applicant",
      actorId: "p.nair@theguardian.com",
      actorLabel: "Priya Nair (The Guardian)",
      action: "application_submitted",
      applicationId: app03.id,
      organizationId: guardianGB.id,
    },
    {
      actorType: "applicant",
      actorId: "d.kowalski@nbcuni.com",
      actorLabel: "Dana Kowalski (NBC)",
      action: "application_submitted",
      applicationId: app04.id,
      organizationId: nbcUS.id,
    },
    {
      actorType: "applicant",
      actorId: "t.ashford@bbc.co.uk",
      actorLabel: "Tom Ashford (BBC)",
      action: "application_submitted",
      applicationId: app05.id,
      organizationId: bbcGB.id,
    },
    {
      actorType: "applicant",
      actorId: "c.fontaine@lequipe.fr",
      actorLabel: "Claire Fontaine (L'Équipe)",
      action: "application_submitted",
      applicationId: app06.id,
      organizationId: lequipeFR.id,
    },
    {
      actorType: "applicant",
      actorId: "s.okafor@reuters.com",
      actorLabel: "Sam Okafor (Reuters)",
      action: "application_submitted",
      applicationId: app07.id,
      organizationId: reutersUS.id,
    },
    {
      actorType: "applicant",
      actorId: "h.brooks@reuters.com",
      actorLabel: "Helen Brooks (Reuters)",
      action: "application_submitted",
      applicationId: app08.id,
      organizationId: reutersGB.id,
    },

    // Approvals
    {
      actorType: "noc_admin",
      actorId: nocAdminUS.id,
      actorLabel: "S. Kim (USOPC)",
      action: "application_approved",
      applicationId: app04.id,
      organizationId: nbcUS.id,
    },
    {
      actorType: "noc_admin",
      actorId: nocAdminGB.id,
      actorLabel: "R. Clarke (Team GB)",
      action: "application_approved",
      applicationId: app05.id,
      organizationId: bbcGB.id,
    },
    {
      actorType: "noc_admin",
      actorId: nocAdminFR.id,
      actorLabel: "M. Dupont (CNOSF)",
      action: "application_approved",
      applicationId: app06.id,
      organizationId: lequipeFR.id,
    },

    // Returns
    {
      actorType: "noc_admin",
      actorId: nocAdminUS.id,
      actorLabel: "S. Kim (USOPC)",
      action: "application_returned",
      applicationId: app07.id,
      organizationId: reutersUS.id,
      detail:
        "Application incomplete — missing venue details and team size confirmation.",
    },
    {
      actorType: "noc_admin",
      actorId: nocAdminGB.id,
      actorLabel: "R. Clarke (Team GB)",
      action: "application_returned",
      applicationId: app08.id,
      organizationId: reutersGB.id,
      detail: "Insufficient detail on photographer count and venue access needs.",
    },

    // Resubmission
    {
      actorType: "applicant",
      actorId: "j.holloway@ap.org",
      actorLabel: "Jane Holloway (AP)",
      action: "application_resubmitted",
      applicationId: app09.id,
      organizationId: apUS.id,
      detail: "Added venue breakdown and confirmed team of 4 photographers.",
    },

    // Rejection
    {
      actorType: "noc_admin",
      actorId: nocAdminFR.id,
      actorLabel: "M. Dupont (CNOSF)",
      action: "application_rejected",
      applicationId: app10.id,
      organizationId: lequipeFR.id,
      detail: "Duplicate application — org already has APP-2028-FRA-00001.",
    },

    // Email verifications
    {
      actorType: "applicant",
      actorId: "j.holloway@ap.org",
      actorLabel: "Jane Holloway (AP)",
      action: "email_verified",
      applicationId: app01.id,
    },
    {
      actorType: "applicant",
      actorId: "d.kowalski@nbcuni.com",
      actorLabel: "Dana Kowalski (NBC)",
      action: "email_verified",
      applicationId: app04.id,
    },

    // Admin logins
    {
      actorType: "noc_admin",
      actorId: nocAdminUS.id,
      actorLabel: "S. Kim (USOPC)",
      action: "admin_login",
    },
    {
      actorType: "ioc_admin",
      actorId: iocAdmin.id,
      actorLabel: "IOC Admin",
      action: "admin_login",
    },
  ]);

  // ─── Magic Link Tokens ───────────────────────────────────────────────────────

  console.log("Seeding magic link tokens...");

  await db.insert(magicLinkTokens).values([
    {
      // Valid token: K7M2 (as shown in the email-verify prototype)
      email: "demo@test.com",
      tokenHash: sha256("K7M2"),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    {
      // Expired token for testing the expired-link state
      email: "expired@test.com",
      tokenHash: sha256("XXXX"),
      expiresAt: new Date("2026-01-01T00:00:00Z"),
    },
  ]);

  // ─── NOC Quota Fixtures (Paris 2024 comparison data) ─────────────────────────

  console.log("Seeding NOC quota fixtures...");

  // Per-category quotas. Press-side: E + Es + ET + EC. Photo-side: EP + EPs.
  // Tier 1 NOCs have larger Es/EPs allocations; smaller NOCs often have 0 for specialist categories.
  const quotaFixtures = [
    // Tier 1
    { nocCode: "USA", eTotal: 80, esTotal: 20, epTotal: 30, epsTotal: 10, etTotal: 25, ecTotal: 25 },
    { nocCode: "GBR", eTotal: 50, esTotal: 15, epTotal: 20, epsTotal:  8, etTotal: 15, ecTotal: 15 },
    { nocCode: "GER", eTotal: 44, esTotal: 12, epTotal: 18, epsTotal:  6, etTotal: 12, ecTotal: 14 },
    { nocCode: "FRA", eTotal: 46, esTotal: 14, epTotal: 19, epsTotal:  7, etTotal: 13, ecTotal: 15 },
    { nocCode: "JPN", eTotal: 46, esTotal: 14, epTotal: 19, epsTotal:  7, etTotal: 13, ecTotal: 15 },
    { nocCode: "AUS", eTotal: 38, esTotal: 10, epTotal: 15, epsTotal:  5, etTotal: 10, ecTotal:  9 },
    { nocCode: "CAN", eTotal: 34, esTotal:  8, epTotal: 14, epsTotal:  4, etTotal:  9, ecTotal: 10 },
    { nocCode: "ITA", eTotal: 36, esTotal: 10, epTotal: 14, epsTotal:  5, etTotal: 10, ecTotal: 10 },
    // Tier 2
    { nocCode: "NED", eTotal: 28, esTotal:  6, epTotal: 12, epsTotal:  3, etTotal:  6, ecTotal: 10 },
    { nocCode: "ESP", eTotal: 30, esTotal:  8, epTotal: 12, epsTotal:  4, etTotal:  7, ecTotal: 11 },
    { nocCode: "BRA", eTotal: 32, esTotal:  8, epTotal: 13, epsTotal:  4, etTotal:  8, ecTotal: 12 },
    { nocCode: "CHN", eTotal: 48, esTotal: 14, epTotal: 20, epsTotal:  6, etTotal: 14, ecTotal: 14 },
    { nocCode: "KOR", eTotal: 28, esTotal:  8, epTotal: 12, epsTotal:  4, etTotal:  7, ecTotal: 10 },
    { nocCode: "SWE", eTotal: 22, esTotal:  5, epTotal:  9, epsTotal:  2, etTotal:  6, ecTotal:  9 },
    { nocCode: "NOR", eTotal: 20, esTotal:  4, epTotal:  9, epsTotal:  2, etTotal:  5, ecTotal:  9 },
    // Tier 3
    { nocCode: "KEN", eTotal: 10, esTotal:  2, epTotal:  0, epsTotal:  0, etTotal:  0, ecTotal:  0 },
    { nocCode: "NZL", eTotal: 12, esTotal:  3, epTotal:  5, epsTotal:  2, etTotal:  2, ecTotal:  3 },
    { nocCode: "POR", eTotal: 10, esTotal:  2, epTotal:  4, epsTotal:  1, etTotal:  2, ecTotal:  2 },
  ];

  await db.insert(nocQuotas).values(
    quotaFixtures.map((q) => ({
      nocCode: q.nocCode,
      eventId: "LA28",
      // Per-category totals
      eTotal:   q.eTotal,
      esTotal:  q.esTotal,
      epTotal:  q.epTotal,
      epsTotal: q.epsTotal,
      etTotal:  q.etTotal,
      ecTotal:  q.ecTotal,
      // Legacy aggregates kept in sync
      pressTotal: q.eTotal + q.esTotal + q.etTotal + q.ecTotal,
      photoTotal: q.epTotal + q.epsTotal,
      setBy: iocAdmin.id,
      notes: "Paris 2024 fixture data — replace with real IOC import before July 2026",
    }))
  );

  console.log("✓ Seed complete.");
  console.log("");
  console.log("Admin accounts (all password: Password1!):");
  console.log("  ioc.admin@olympics.org        — IOC Admin");
  console.log("  ioc.readonly@olympics.org     — IOC Viewer");
  console.log("  noc.admin@usopc.org           — NOC Admin (USA)");
  console.log("  noc.admin@teamgb.org          — NOC Admin (GBR)");
  console.log("  noc.admin@franceolympique.fr  — NOC Admin (FRA)");
  console.log("  ocog.admin@la28.org           — OCOG Admin");
  console.log("  if.admin@worldathletics.org   — IF Admin (ATH)");
  console.log("");
  console.log("Magic link tokens:");
  console.log("  K7M2 — valid 24h  (demo@test.com)");
  console.log("  XXXX — expired    (expired@test.com)");

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
