---
title: "feat: Email infrastructure + daily anomaly digest (TODO-006)"
type: feat
status: active
date: 2026-04-10
---

# feat: Email Infrastructure + Daily Anomaly Digest (TODO-006)

## Overview

There is currently zero email sending in the MRP codebase — magic links and status tokens are shown in the browser only (prototype mode). This plan introduces a minimal email layer (Resend SDK) and builds the first consumer: a daily anomaly digest sent to IOC Media Ops.

**Depends on:** `2026-04-10-003-feat-ioc-anomaly-detection-banners-plan.md` — the anomaly detection logic must be built first.

## Problem Statement

Three features need real email delivery for v1.0:
1. **Daily anomaly digest** (TODO-006) — IOC gets a once-daily summary of open anomalies so issues are caught even without logging into the dashboard
2. **Magic-link tokens** — applicants need their access codes emailed, not displayed in the browser
3. **Invitation links** (MISS-05) — NOC admins need to email invite links to orgs

This plan delivers the shared email infrastructure and the digest. Magic links and invite links will wire into the same infrastructure but are tracked in their own plans.

## Proposed Solution

### Email provider: Resend

Resend is chosen over nodemailer/SMTP because:
- Single SDK install, zero transport configuration
- Excellent Next.js + React Email integration
- Generous free tier (3,000 emails/month)
- Simple API key authentication (one env var)
- Used by the majority of modern Next.js projects

Alternative (nodemailer + D.TEC SMTP relay) is available if D.TEC has an existing relay — the `sendEmail` wrapper hides the provider, so swapping is a one-file change.

### Architecture

**New env vars:**
```
RESEND_API_KEY=re_...
EMAIL_FROM=noreply@la28.media.dtec.com
IOC_DIGEST_EMAIL=media.ops@la28.org   # IOC Media Ops recipient(s); comma-separated for multiple
```

**`src/lib/email.ts`** — thin wrapper:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
}): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    // Dev/prototype fallback: log to console, don't throw
    console.log('[EMAIL STUB]', opts.subject, '→', opts.to);
    return;
  }
  await resend.emails.send({ from: process.env.EMAIL_FROM!, ...opts });
}
```

The `if (!RESEND_API_KEY)` guard means the stub behaviour is preserved in dev/prototype environments — no code change is needed to run without email.

### Cron route: `/api/cron/anomaly-digest`

A Next.js route handler that runs the anomaly detection queries and sends the digest email.

```typescript
// src/app/api/cron/anomaly-digest/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Verify cron secret to prevent unauthorised triggering
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const anomalies = await computeAllAnomalies();  // re-uses lib from MISS-07 plan
  if (anomalies.total === 0) return NextResponse.json({ sent: false, reason: 'no anomalies' });

  await sendEmail({
    to: process.env.IOC_DIGEST_EMAIL!.split(','),
    subject: `[MRP] ${anomalies.total} anomaly${anomalies.total > 1 ? 'ies' : ''} — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`,
    html: renderDigestHtml(anomalies),
    text: renderDigestText(anomalies),
  });

  return NextResponse.json({ sent: true, anomalyCount: anomalies.total });
}
```

**New env var:** `CRON_SECRET=<random-secret>` — prevents anyone from triggering the digest by hitting the URL without the header.

### Email template

Plain HTML, no React Email for this first template (keep dependencies minimal). Inline styles for email client compatibility.

Structure:
```
Subject: [MRP] 3 anomalies — 10 Apr

LA28 Media Registration Portal — Daily Anomaly Digest
10 April 2026

CONCENTRATION RISK (1)
  • New York Times (USA) — requesting 45% of USA quota (157 of 348 slots)

NOC INACTIVITY (2)
  • RSA — no approvals in 8 days (window open since 2 Apr)
  • BRA — no approvals in 11 days (window open since 30 Mar)

Review all anomalies → https://mrp.la28.org/admin/ioc

---
You are receiving this because you are listed as IOC_DIGEST_EMAIL.
To unsubscribe, remove your address from IOC_DIGEST_EMAIL in the deployment config.
```

### Scheduler

The route is scheduler-agnostic. Recommended callers in priority order:

1. **GitHub Actions** (simplest, no infrastructure change):
   ```yaml
   # .github/workflows/anomaly-digest.yml
   on:
     schedule:
       - cron: '0 7 * * *'   # 07:00 UTC daily (08:00 CET / appropriate for LA28 IOC hours)
   jobs:
     digest:
       runs-on: ubuntu-latest
       steps:
         - run: |
             curl -X POST \
               -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
               ${{ secrets.MRP_BASE_URL }}/api/cron/anomaly-digest
   ```
2. **Railway Cron** — if Railway is the production host, use the Railway Cron service pointing at the same endpoint
3. **Vercel Cron** — if migrating to Vercel, add `vercel.json` cron config

## Acceptance Criteria

- [ ] `sendEmail()` logs to console when `RESEND_API_KEY` is not set (dev/prototype behaviour preserved)
- [ ] `sendEmail()` sends via Resend when `RESEND_API_KEY` is set
- [ ] `POST /api/cron/anomaly-digest` returns 401 without the correct `x-cron-secret` header
- [ ] `POST /api/cron/anomaly-digest` returns `{ sent: false, reason: 'no anomalies' }` when no anomalies exist
- [ ] `POST /api/cron/anomaly-digest` sends the digest email and returns `{ sent: true, anomalyCount: N }` when anomalies exist
- [ ] Digest email subject line includes the anomaly count and date
- [ ] Digest email body lists each anomaly type with names, NOC codes, and values
- [ ] Digest email includes a direct link to the IOC dashboard
- [ ] GitHub Actions workflow file is committed and the digest fires daily at 07:00 UTC
- [ ] Magic-link token emails (post-v1.0 wiring) can call `sendEmail()` with no code changes to the infrastructure

## Phasing

- **Phase 1 (this plan):** `src/lib/email.ts` + cron route + digest template + GitHub Actions workflow
- **Phase 2 (magic links):** Update `/apply/actions.ts` `requestToken()` to call `sendEmail()` with the token — single function call, `console.log` fallback already in place if key is absent
- **Phase 3 (invite emails):** Update `createInvitation()` in the invited-org plan to call `sendEmail()` with the invite link

## Files to Create / Modify

| File | Change |
|---|---|
| `package.json` | Add `resend` to dependencies |
| `src/lib/email.ts` | New — `sendEmail()` wrapper with stub fallback |
| `src/app/api/cron/anomaly-digest/route.ts` | New — POST handler: anomaly detection + email send |
| `src/lib/anomaly-digest-template.ts` | New — `renderDigestHtml()`, `renderDigestText()` |
| `.github/workflows/anomaly-digest.yml` | New — daily cron trigger |
| `.env.local` (docs) | Document `RESEND_API_KEY`, `EMAIL_FROM`, `IOC_DIGEST_EMAIL`, `CRON_SECRET` |

## Sources & References

- Anomaly detection logic: `src/lib/anomaly-detect.ts` (from MISS-07 plan)
- Token generation: `src/app/apply/actions.ts:32` (shows the existing stub pattern to match)
- Resend SDK docs: https://resend.com/docs/send-with-nextjs
- TODO-006: `TODOS.md:65`
