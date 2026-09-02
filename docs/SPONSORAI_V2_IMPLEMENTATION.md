# SponsorAI V2 — implementation notes

## Scope implemented

This repository keeps `Company` as the canonical brand/company node instead of duplicating it with a new `Brand` table. The graph is extended additively with contacts, employments, evidence, sponsorships, opportunity signals, athlete snapshots, learning events and closed-loop deal objects.

The V2 flow now supports:

1. Scout and Matchmaker with per-athlete deduplication.
2. Monid-first contact discovery (LinkedIn company employees + Hunter email finding/verification), with Apollo and public-web fallbacks behind `ContactProvider`. See [Monid setup](MONID_ENRICHMENT_SETUP.md).
3. Private server-side contact coordinates and public role/contactability summaries.
4. Mandatory human approval before a first outreach.
5. Outreach through a purpose-scoped `SendingIdentity` and `SendingProvider`.
6. Provider events and inbound replies recorded as conversations and learning events.
7. Deterministic Bayesian role statistics and versioned contact/match scores.
8. External meetings, proposals and contracts tracked through an immutable deal timeline.
9. SponsorAI origin attribution, with an optional success-fee record when a deal is eligible.
10. Veille alerts feeding evidence, opportunity signals and observed sponsorships for known companies.
11. Company size buckets retained in campaign context and role-performance dimensions.

## Deliberate boundaries

- No browser-based LinkedIn automation, session cookies or private-message access. Monid calls a public-profile provider only after the company LinkedIn URL is linked from an official company source. Former employees, ambiguous entities and incomplete identities are excluded.
- Non-admin contact summaries exclude names, email addresses, evidence containing coordinates and direct profile URLs at the server boundary. Administrators can inspect email and profile sources in the enrichment result and company detail page.
- Company CSV export contains only a role/contactability summary, never raw decision-maker coordinates.
- No automatic mailbox creation. Google Workspace, Microsoft 365 and IMAP remain future `MailboxProvider` implementations.
- SMTP remains the MVP sending provider. A sending identity becomes active only when its address matches the server SMTP configuration.
- No delivery or open event is inferred from an SMTP send. Those outcomes require an authenticated provider webhook.
- No Zoom, Meet, DocuSign or signature clone. SponsorAI stores external URLs and manual outcomes.
- No complex machine learning. Scores use deterministic weighting, historical context and Bayesian smoothing.
- The future post-deal protection/guarantee service is not implemented. It remains a P2/P3 product option.

## Score versions

- Brand/match score: `matchmaker-v2-learning-v1`
- Contact score: `contact-score-v2-contextual`
- Role statistics: `role-performance-v1`
- Athlete intelligence: `athlete-intelligence-v1`

Historical score versions and the full decision context are retained on `Prospect`, `Scan` and `LearningEvent`.

## Provider webhook

`POST /api/outreach/events` accepts `DELIVERED`, `OPENED` and `BOUNCED` only. The caller must send the `x-sponsorai-webhook-secret` header matching `OUTREACH_WEBHOOK_SECRET`.

The webhook records the transport event first, then creates the corresponding learning event. A successful SMTP call records `EMAIL_SENT`, not `DELIVERED`.
