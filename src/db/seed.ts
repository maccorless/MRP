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
  await db.delete(applications);
  await db.delete(organizations);
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
      category: "press",
      about:
        "AP has covered every Olympic Games since 1896. We are requesting accreditation for 12 journalists and photographers covering athletics, swimming, and gymnastics.",
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
      category: "press",
      about:
        "The New York Times sports desk requests accreditation for coverage across all major Olympic venues. Our team of 8 includes 5 writers and 3 photographers.",
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
      category: "press",
      about:
        "The Guardian requests accreditation for our Olympic coverage team. We have attended every Summer Olympics since 1988 with full editorial and photographic teams.",
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
      category: "enr",
      about:
        "NBC holds exclusive US broadcast rights. This application covers our technical and production team requesting ENR accreditation across all competition venues.",
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
      category: "enr",
      about:
        "BBC holds UK broadcast rights for the 2028 Games. Application covers broadcasting team and technical crew requiring ENR accreditation.",
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
      category: "photographer",
      about:
        "L'Équipe requests photographer accreditation for our team of 6 sports photographers covering athletics, cycling, and team sports.",
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
      category: "press",
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
      category: "photographer",
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
      category: "photographer",
      about:
        "AP photo desk requests photographer accreditation for 4 photographers covering athletics and aquatics at SoFi Stadium and the Olympic Aquatics Center. Updated from original submission to reflect confirmed venue assignments.",
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
      category: "press",
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

  console.log("✓ Seed complete.");
  console.log("");
  console.log("Admin accounts (all password: Password1!):");
  console.log("  ioc.admin@olympics.org      — IOC Admin");
  console.log("  ioc.readonly@olympics.org   — IOC Viewer");
  console.log("  noc.admin@usopc.org         — NOC Admin (USA)");
  console.log("  noc.admin@teamgb.org        — NOC Admin (GBR)");
  console.log("  noc.admin@franceolympique.fr — NOC Admin (FRA)");
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
