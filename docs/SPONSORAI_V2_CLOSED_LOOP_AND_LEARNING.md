# SponsorAI V2 — Closed-loop business model & Learning Engine

## 1. Product rule: contacts stay inside SponsorAI

SponsorAI should not expose raw contact coordinates by default. If the business model includes a success fee, revealing the email/phone/LinkedIn of the decision maker creates immediate disintermediation risk.

Recommended UX:
- Show the company/brand.
- Show the target role and a masked/qualified contact card (for example: “Head of Sports Partnerships — verified — high relevance”).
- Show confidence, seniority, department, market relevance and verification status.
- Do not expose the raw professional email or direct contact URL in the normal workflow.
- All outreach is sent through SponsorAI infrastructure.
- Replies are ingested into SponsorAI and attached to the opportunity.
- Meetings, proposals, negotiations and deal outcomes remain tracked inside SponsorAI.
- Admin/internal roles may retain access to raw contact data for support and compliance, but this is not exposed to standard customers.

This makes SponsorAI a closed-loop sponsorship execution platform rather than a lead database.

## 2. Recommended business model

Preferred model: subscription + success fee.

Subscription pays for recurring intelligence and workflow value:
- athlete intelligence
- brand discovery
- matching
- contact research
- outreach generation
- campaign execution
- CRM and analytics

Success fee aligns SponsorAI with commercial results:
- fee on sponsorship agreements sourced and/or materially originated by SponsorAI
- attribution must be explicit in the data model

Do not rely only on a success fee during the MVP because sales cycles can be long and cash flow unpredictable.

Possible future packaging:
- Starter: fixed monthly subscription, limited athletes/campaigns
- Agency/Pro: higher subscription, multi-athlete portfolio, intelligence and automation
- Success fee: percentage or negotiated fee on closed deals originating from SponsorAI

Exact pricing is a commercial experiment, not an architecture assumption.

## 3. Deal attribution

SponsorAI must be able to prove that a deal originated through the platform.

Suggested fields/events:
- `origin = SPONSORAI | MANUAL | IMPORT`
- first matching timestamp
- first outreach timestamp
- first reply timestamp
- meeting booked
- proposal sent
- signed date
- deal value
- attribution status

A deal should remain linked to its originating Prospect/Opportunity and campaign history.

## 4. Contact Intelligence — no LinkedIn scraping dependency

LinkedIn should not be the core data acquisition mechanism.

Preferred waterfall:
1. Resolve company + domain.
2. Search structured B2B data providers (Apollo first in current implementation).
3. Retrieve multiple candidate employees for relevant title families.
4. Normalize titles into canonical role categories.
5. Rank candidates using SponsorAI Contact Score.
6. Enrich/verify professional email.
7. Keep raw coordinates private server-side.
8. Present only qualified contact metadata to the customer.
9. Send outreach through SponsorAI.

Canonical role categories should include at least:
- SPORTS_PARTNERSHIPS
- SPONSORSHIP
- ATHLETE_PARTNERSHIPS
- BRAND_PARTNERSHIPS
- SPORTS_MARKETING
- BRAND_MARKETING
- MARKETING_LEADERSHIP
- COMMUNICATIONS_PR
- COUNTRY_MANAGEMENT
- EXECUTIVE

The same title can have a different value depending on company size, sector, geography and historical SponsorAI outcomes.

## 5. What “learning” concretely means

SponsorAI should not rely on a vague LLM memory. Learning is implemented as structured event collection + aggregated statistics + ranking features + versioned scoring.

### 5.1 Every campaign produces immutable events

For every attempted contact store events such as:
- CONTACT_SELECTED
- EMAIL_SENT
- DELIVERED
- OPENED
- REPLIED
- POSITIVE_REPLY
- NEGATIVE_REPLY
- MEETING_BOOKED
- PROPOSAL_REQUESTED
- PROPOSAL_SENT
- NEGOTIATION_STARTED
- SIGNED
- LOST

Every event should carry context that existed at decision time:
- player/athlete id
- brand/company id
- contact id
- canonical role category
- raw title
- company size bucket if known
- sector
- country/market
- athlete sport
- athlete audience/follower bucket
- brand score
- contact score
- template/sequence version
- matchmaker version
- timestamp

This becomes the training/learning dataset.

## 6. Aggregate memory tables

Add materialized/derived statistics such as `RolePerformanceStat`.

Conceptual Prisma model:

```prisma
model RolePerformanceStat {
  id                String   @id @default(cuid())
  roleCategory      String
  sector            String?
  companySizeBucket String?
  country           String?
  sport             String?

  attempts          Int      @default(0)
  delivered         Int      @default(0)
  replies           Int      @default(0)
  positiveReplies   Int      @default(0)
  meetings          Int      @default(0)
  proposals         Int      @default(0)
  signedDeals       Int      @default(0)
  signedValue       Float    @default(0)

  replyRate         Float?
  positiveReplyRate Float?
  meetingRate       Float?
  closeRate         Float?

  confidence        Float?
  updatedAt         DateTime @updatedAt

  @@index([roleCategory])
  @@index([sector, companySizeBucket])
}
```

The source of truth remains raw outreach events; this table is a computed summary for fast scoring.

## 7. Example: “80% of CMOs reply”

Suppose historical campaigns show:

- CMO: 100 attempts, 80 replies, 30 positive replies, 12 meetings
- Sports Partnerships Director: 20 attempts, 12 replies, 9 positive replies, 7 meetings

SponsorAI must NOT blindly decide that CMO is better because 80% > 60%.

The system should optimize for the business outcome, not only reply rate. A role can reply often but produce poor-quality conversations.

Recommended role utility:

```text
roleUtility =
  0.15 * replyRate
+ 0.30 * positiveReplyRate
+ 0.30 * meetingRate
+ 0.25 * closeRate
```

Weights are versioned and can evolve.

Also apply sample-size confidence. A statistic based on 5 contacts should not override one based on 500 contacts.

Use Bayesian smoothing / priors rather than raw percentages.

Example smoothed reply rate:

```text
smoothedReplyRate = (replies + priorReplies) / (attempts + priorAttempts)
```

This prevents early random results from destabilizing rankings.

## 8. Contextual role performance

Do not learn only one global statement such as “CMOs work well”. Learn contextual statements:

- CMO × company < 100 employees
- CMO × company > 5,000 employees
- Sports Partnerships × sportswear
- Brand Partnerships × luxury
- Country Manager × MENA
- Athlete Marketing × football equipment brands

Selection should fall back through levels when data is sparse:

1. exact context statistic
2. sector + company-size statistic
3. role + sector statistic
4. global role statistic
5. static expert prior

This lets SponsorAI learn quickly without requiring millions of campaigns.

## 9. Contact Score V2

Candidate contacts receive a deterministic/data-assisted score before outreach.

Example:

```text
ContactScore =
  25% role relevance
  15% seniority fit
  10% current employment confidence
  10% geography/market responsibility
  10% verified contactability
  30% historical role utility for this context
```

At MVP launch, historical role utility has low confidence and therefore low effective influence.
As data grows, its influence increases.

Store:
- `contactScore`
- `scoreVersion`
- `scoreComponents`
- `selectedBecause`

Never overwrite historical score snapshots. We need to know why a contact was selected at the time.

## 10. Selection algorithm example

For a 12,000-employee sportswear company, Apollo returns:

1. CMO — 91 static relevance
2. Sports Partnerships Director — 96 static relevance
3. Brand Marketing Director — 82 static relevance

Historical SponsorAI data for large sportswear companies:
- CMO utility: 0.31
- Sports Partnerships utility: 0.74
- Brand Marketing utility: 0.41

The Contact Ranking Service blends current relevance + historical utility and selects Sports Partnerships Director.

The chosen `contactId`, role category and scoring snapshot are persisted with the campaign.

If that person does not respond after the configured sequence, the escalation engine can select candidate #2 and create another experiment/event series.

## 11. Learning job

Implement a deterministic aggregation job/service, not LLM memory.

Conceptual service structure:

```text
src/lib/intelligence/
  role-performance.ts
  contact-ranking.ts
  outcome-aggregation.ts
  score-version.ts
```

`outcome-aggregation.ts`:
- reads OutreachEvent rows
- groups outcomes by canonical context
- computes smoothed metrics
- upserts RolePerformanceStat

Run initially:
- after meaningful campaign outcomes OR
- scheduled periodically

Do not retrain a machine-learning model in V2. Structured statistics + Bayesian smoothing + weighted ranking are simpler, explainable and sufficient for the initial dataset.

## 12. Later machine learning

Only after SponsorAI has enough labelled outcomes should we introduce an ML ranking model.

Training row example:

```text
athlete features
brand features
contact features
role category
company features
campaign features
market signals
-> positive_reply
-> meeting
-> signed_deal
-> deal_value
```

Possible later models:
- logistic regression as transparent baseline
- gradient boosted trees / ranking model
- contextual bandit for contact selection experiments

LLMs continue to handle qualitative reasoning and communication; they are not the long-term statistical memory.

## 13. Exploration vs exploitation

If SponsorAI always contacts the historically best role, it can create a feedback loop and never discover better alternatives.

Use controlled exploration.

Example policy after sufficient volume:
- 85-90% campaigns: best predicted contact
- 10-15% campaigns: safe alternative candidate when confidence permits

Human approval remains mandatory during the pilot.

This produces new learning data while protecting valuable brand relationships.

## 14. Customer-facing explainability

The user should see why SponsorAI selected a contact without seeing contact coordinates.

Example card:

```text
Primary decision maker
Head of Sports Partnerships
Current role verified
Contactability: verified
Relevance: 96/100
Why selected:
- owns sports partnership scope
- correct regional responsibility
- historically strong outcome for similar brands

[Approve outreach]
```

Internal raw data remains private.

## 15. Closed-loop email/reply architecture

To preserve attribution and learning, outbound and inbound communication must pass through SponsorAI.

Target flow:

```text
SponsorAI contact intelligence
        ↓
contact selected
        ↓
user approves campaign
        ↓
SponsorAI sends email
        ↓
provider/message IDs stored
        ↓
reply received / synchronized
        ↓
reply classification
        ↓
user responds inside SponsorAI
        ↓
meeting / proposal / negotiation
        ↓
deal signed or lost
        ↓
outcome stored
        ↓
learning aggregation
        ↓
future ranking improves
```

For early MVP, replies may still arrive in the connected mailbox, but they must be synchronized into SponsorAI and mapped to the prospect/contact/campaign.

## 16. Commission model consequence

If SponsorAI charges a success fee, product architecture must discourage leakage without making the product hostile.

Do:
- keep raw decision-maker data private
- make SponsorAI communication easier than external communication
- offer reply management, reminders, pipeline, proposals and analytics inside platform
- record attribution clearly
- provide meaningful ongoing value after first introduction

Do not rely only on hiding an email address. A determined user may eventually identify the person elsewhere. The real defense is to make leaving SponsorAI less useful than staying in it and to have clear contractual attribution for opportunities originated by SponsorAI.

## 17. Required V2 implementation additions

Add to the existing roadmap:

### Data
- Contact + Employment + ContactEmail remain internal entities.
- Add canonical `roleCategory` to Employment or a related role-normalization entity.
- Add OutreachEvent.
- Add RolePerformanceStat (derived statistics).
- Add score snapshots/version fields.
- Add deal attribution fields.

### Services
- ContactProvider interface.
- Apollo provider.
- Role normalization service.
- Contact ranking service.
- Outcome aggregation service.
- Reply classification service.
- Escalation strategy service.

### UI
- Never render raw contact email/phone for standard users.
- Render masked qualified contact cards.
- Add “Approve outreach”.
- Show why this role/contact was selected.
- Add campaign/outcome timeline.

### Pilot policy
- Human approval mandatory before every first outreach.
- No automatic escalation until enough tests have been reviewed.
- Capture human feedback on company relevance AND contact relevance.

## 18. Success criterion

SponsorAI has learned something only if new decisions are measurably different because of historical outcomes.

Example:

```text
Month 1:
static expert prior selects Marketing Director

Month 4:
SponsorAI has 430 comparable attempts
Sports Partnerships shows materially higher meeting/close utility

New campaign:
Contact Ranking Service retrieves those statistics
→ increases Sports Partnerships candidate score
→ selects that role first
→ persists scoring explanation/version
```

That is the concrete closed learning loop.