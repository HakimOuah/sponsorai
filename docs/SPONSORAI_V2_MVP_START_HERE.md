# SponsorAI V2 — MVP Start Here

This document is the operational entry point for Codex.

Read these documents first:
1. `docs/SPONSORAI_V2_ARCHITECTURE.md`
2. `docs/SPONSORAI_V2_CLOSED_LOOP_AND_LEARNING.md`
3. `docs/SPONSORAI_V2_DEAL_CLOSING_AND_EMAIL_INFRA.md`
4. this document

The goal is NOT to build every long-term idea now. The immediate objective is to make SponsorAI materially better at finding relevant sponsors, finding the right decision maker, executing outreach inside SponsorAI, learning from outcomes, and preserving attribution to the eventual deal.

## 1. MVP product promise

SponsorAI should let a representative:

1. select/create an athlete
2. enrich athlete intelligence
3. discover relevant brands
4. rank opportunities
5. validate which brands are relevant
6. find and rank the correct decision maker internally
7. keep raw contact coordinates hidden from the standard user
8. generate personalized outreach
9. approve the outreach
10. send from a connected/authorized professional mailbox
11. synchronize replies into SponsorAI
12. continue the email thread from SponsorAI
13. track meetings and their outcome
14. track proposal / negotiation / contract state
15. manually confirm signed/won when the final step happens externally
16. store deal value and SponsorAI attribution
17. feed the outcome back into SponsorAI learning data

This is enough for a strong MVP.

## 2. Email connection is part of the target workflow

Do not create a brand-new SponsorAI mailbox for every license by default.

Preferred model:
- the representative connects an existing professional sending identity
- examples: Google Workspace, Microsoft 365, or generic SMTP/IMAP during pilot
- SponsorAI stores the provider authorization securely server-side
- outbound messages are composed and approved in SponsorAI
- the recipient's raw email remains hidden from the standard customer UI
- SponsorAI sends through the authorized identity
- replies are synchronized back into SponsorAI and mapped to the correct Prospect/Campaign
- the representative replies from the SponsorAI inbox while the visible sender remains their legitimate professional identity

The standard user can see:
- target role
- company
- contact verification status
- relevance score
- communication thread

The standard user should NOT normally see:
- raw professional email
- phone number
- direct LinkedIn URL if exposing it creates obvious disintermediation risk

Admin/internal access can be different.

## 3. MVP email implementation order

### P0 — pilot
- preserve existing SMTP sending
- add `SendingIdentity`
- ensure outbound emails are linked to Prospect + selected Contact
- ingest replies reliably enough to attach them to the right Prospect
- build SponsorAI inbox/thread UX
- hide raw recipient coordinates in customer-facing routes/components
- keep send volume intentionally low
- add bounce/suppression safety

### P1
- Google Workspace OAuth connection
- Microsoft 365 OAuth connection
- provider-specific thread synchronization
- better delivery/reply event ingestion

The provider layer must remain abstract so the product is not locked into one mail vendor.

## 4. Closing flow for MVP

SponsorAI does not need to own the video call or electronic signature in MVP.

The MVP must capture the state of the deal.

Required deal stages/events:
- replied
- qualified
- meeting scheduled
- meeting completed
- proposal requested
- proposal sent
- negotiation
- contract sent
- contract signed
- won
- lost

For meetings:
- store date/type/provider/link/location
- allow manual outcome entry

For contracts:
- allow manual `contract sent`, `contract signed`, and `deal won`
- require final deal value and signed date for won deals
- optionally upload or reference supporting evidence

Later integrations can automate these transitions.

## 5. Future e-signature integration — NOT MVP blocker

Do not build a proprietary signature product.

Future architecture should support a `SignatureProvider` abstraction with providers such as DocuSign / Yousign / Dropbox Sign.

When SponsorAI initiates the signature request, webhook events can automatically update Contract and Deal status.

If the sponsor sends its own contract/signature flow, SponsorAI should support:
- inbound email detection
- manual confirmation
- optional agreement upload

The MVP should remain usable even when closing happens externally.

## 6. Future anti-disintermediation value: post-deal protection / guarantee

Strategic idea to preserve for later, but explicitly NOT required for MVP:

SponsorAI could offer a benefit that only applies when the deal is formally registered/closed through SponsorAI.

Possible future forms include:
- post-deal dispute support
- payment follow-up / collections assistance
- deliverables tracking
- campaign obligation reminders
- proof-of-performance archive
- renewal monitoring
- contract milestone monitoring
- sponsorship activation tracking
- structured evidence vault
- optional commercial protection / guarantee through an appropriate regulated/insured partner if legally viable
- payment escrow or staged release through a regulated payment provider if ever justified

The product goal is not to invent an insurance product prematurely. Any true financial guarantee, escrow, insurance or payment protection may create regulatory/legal obligations and must be designed with specialist counsel/providers.

The strategic principle is simpler:

> Closing through SponsorAI should unlock continuing value that disappears when the parties bypass the platform.

This can become an important anti-disintermediation mechanism later.

For MVP, do NOT spend engineering time here.

## 7. Business model assumption for architecture

The preferred hypothesis remains:
- recurring subscription
- plus success fee on deals attributable to SponsorAI

Therefore the system must preserve an attribution trail:
- who/what sourced the opportunity
- first match timestamp
- selected contact
- first outreach
- replies
- meetings
- proposal
- contract status
- signed date
- deal value

Do not rely only on hiding contact coordinates. Product value + attribution + future post-deal services are the stronger defense.

## 8. Learning remains deterministic in MVP

Do not build a custom ML model yet.

Every campaign must generate structured outcome data.

The MVP learning loop is:

```text
campaign/contact selected
→ events recorded
→ reply/positive reply/meeting/proposal/deal outcomes recorded
→ aggregation job updates contextual performance statistics
→ future contact/brand ranking reads those statistics
→ score version + explanation persisted
```

The tool has learned only when historical outcomes cause a measurable change in a future ranking/decision.

Use raw immutable events as source of truth and derived tables for fast scoring.

## 9. Recommended Codex implementation sequence

Implement in small, reviewable PRs. Do not rewrite the app from scratch.

### PR A — Immediate correctness
- fix Veille web-search mismatch
- change global brand exclusion so brands are excluded per-athlete, not globally
- preserve current behavior otherwise

### PR B — Data foundation
- Brand
- Contact
- Employment
- ContactEmail
- Evidence
- Sponsorship
- OpportunitySignal
- migrations/backfill without breaking current Company/Prospect workflow

### PR C — Contact Intelligence
- ContactProvider interface
- Apollo provider using the existing integration
- role normalization
- contact ranking
- persist multiple contacts per company
- hide raw coordinates from standard UI

### PR D — Closed-loop email MVP
- SendingIdentity
- provider abstraction
- existing SMTP behind provider layer
- prospect-linked outbound mail
- inbound/reply mapping
- SponsorAI inbox/thread
- low-volume deliverability guardrails

### PR E — Learning loop
- OutreachEvent
- ProspectFeedback
- RolePerformanceStat
- score snapshots/versioning
- aggregation service
- historical utility incorporated into Contact Score

### PR F — Deal visibility
- Meeting
- meeting outcomes
- Proposal/Contract minimal entities or equivalent structured state
- manual contract signed / won flow
- deal value
- attribution record

Do NOT start with:
- proprietary e-signature
- video hosting
- post-deal guarantee
- payment escrow
- marketplace
- mobile app
- custom ML model

## 10. Pilot definition of done

SponsorAI is ready for the professional-football pilot when, for a real athlete, it can:

- propose a Top 20 of plausible brands
- receive human relevance feedback
- find at least one credible decision maker for a useful share of those brands
- keep raw coordinates private
- send an approved personalized email from an authorized professional identity
- receive/map the reply inside SponsorAI
- track the opportunity through meeting/proposal/contract/won/lost
- store signed value and attribution
- use resulting outcomes in future ranking statistics

Optimization should focus on quality rather than outreach volume.
