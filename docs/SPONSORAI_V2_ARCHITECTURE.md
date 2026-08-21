# SponsorAI V2 — Data Architecture & Contact Intelligence Plan

## Objective

Transform SponsorAI from an AI-assisted sponsorship CRM into a data-driven sponsorship intelligence platform that improves with every athlete, brand, contact, outreach, reply, meeting and signed deal.

Core principle:

> Every search, contact, message, response and outcome must create reusable structured data that improves future matching and outreach.

The current product already has the right operating loop:

Athlete → intelligence → brand discovery → scoring → prospect → contact enrichment → outreach → deal pipeline.

V2 should preserve this workflow while adding a durable proprietary data layer.

---

## 1. Product architecture target

SponsorAI V2 should be organized conceptually around five engines:

1. **Athlete Intelligence Engine**
   - public image
   - audience
   - interests
   - values
   - momentum
   - partnerships
   - brand conflicts
   - commercial angles

2. **Sponsorship Data Graph**
   - athletes
   - brands
   - parent companies
   - sponsorships
   - contacts
   - markets
   - opportunity signals
   - evidence / sources

3. **Discovery + Matching Engine**
   - discover candidate brands
   - retrieve known brands from SponsorAI database first
   - use web discovery to expand the universe
   - score Athlete × Brand opportunities

4. **Outreach Engine**
   - identify decision makers
   - verify professional contact information
   - generate tailored outreach
   - sequence follow-ups
   - classify replies

5. **Learning Engine**
   - human relevance feedback
   - delivery/open/reply outcomes
   - positive/negative response
   - meeting
   - proposal
   - signed/lost deal
   - signed value

The Learning Engine must feed the Sponsorship Data Graph and future scoring.

---

## 2. Migration strategy

Do **not** rewrite SponsorAI from scratch.

Do **not** remove the existing `Player`, `Company`, `Prospect`, `Deal`, `Email`, `Scan` models immediately.

The V2 data architecture should be introduced additively and migrated progressively.

Recommended implementation sequence:

- PR1: Data foundation
- PR2: Sponsorship intelligence
- PR3: Athlete intelligence history
- PR4: Matchmaker V2
- PR5: Learning loop
- PR6: Intelligence ingestion / Veille V2

All changes should remain backwards compatible until each migration is proven in production.

---

# PR1 — Data Foundation

## 3. Brand vs Company

The current `Company` model mixes corporate entity, consumer brand and sponsorship intelligence.

Introduce a distinct `Brand` entity.

Example:

LVMH
- Louis Vuitton
- Dior
- Givenchy
- TAG Heuer

A sponsorship opportunity normally targets a brand or business unit, not necessarily the parent company.

Suggested model:

```prisma
model Brand {
  id          String   @id @default(cuid())
  companyId   String?
  name        String
  website     String?
  sector      String?
  description String?
  country     String?
  active      Boolean  @default(true)

  company     Company? @relation(fields: [companyId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([name])
}
```

Initial migration rule:

- every current Company can temporarily map 1:1 to one Brand
- later enrichment can link several Brands to a parent Company

---

## 4. Contacts must not live directly on Company

The current fields such as `contactName`, `contactRole`, `contactEmail`, `contactLinkedin` are useful for MVP but insufficient for a real sponsorship intelligence system.

One company has many relevant people, and a person can move between employers.

Add:

```prisma
model Contact {
  id          String   @id @default(cuid())
  firstName   String?
  lastName    String?
  fullName    String
  linkedinUrl String?

  employments Employment[]
  emails      ContactEmail[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Employment {
  id          String   @id @default(cuid())
  contactId   String
  companyId   String

  role        String
  department  String?
  seniority   String?

  isCurrent   Boolean  @default(true)
  startedAt   DateTime?
  endedAt     DateTime?

  relevance   Float?
  verifiedAt  DateTime?

  contact     Contact @relation(fields: [contactId], references: [id])
  company     Company @relation(fields: [companyId], references: [id])

  @@index([companyId, isCurrent])
}

model ContactEmail {
  id          String   @id @default(cuid())
  contactId   String
  email       String

  status      String
  confidence  Float?
  source      String?
  verifiedAt  DateTime?

  contact     Contact @relation(fields: [contactId], references: [id])

  @@unique([email])
}
```

Important: guessed email candidates must never be treated as verified sendable addresses.

---

## 5. Evidence / provenance layer

Important claims must be traceable.

Examples:

- athlete partnership
- brand sponsorship history
- current employment
- marketing campaign
- contract end date
- opportunity signal

Add:

```prisma
model Evidence {
  id          String   @id @default(cuid())
  entityType  String
  entityId    String

  claimType   String
  claim       String

  sourceUrl   String?
  sourceTitle String?
  sourceDate  DateTime?

  confidence  Float?
  observedAt  DateTime @default(now())

  @@index([entityType, entityId])
}
```

SponsorAI should increasingly be able to answer:

> Why do we believe this?

---

# PR2 — Sponsorship Intelligence

## 6. Create a first-class Sponsorship entity

SponsorAI currently stores much sponsorship history as strings or scan JSON. This should become durable structured data.

Suggested model:

```prisma
model Sponsorship {
  id                String   @id @default(cuid())
  brandId           String

  athleteName       String?
  athleteId         String?
  organization      String?
  eventName         String?

  sport             String?
  country           String?
  region            String?

  sponsorshipType   String?
  category          String?

  estimatedValue    Float?
  currency          String?

  startDate         DateTime?
  endDate           DateTime?
  active            Boolean?

  sourceUrl         String?
  sourceTitle       String?
  sourcePublishedAt DateTime?

  confidence        Float?
  evidence          String?

  discoveredAt      DateTime @default(now())
  updatedAt         DateTime @updatedAt

  brand             Brand    @relation(fields: [brandId], references: [id])

  @@index([brandId])
  @@index([sport])
  @@index([athleteId])
}
```

Every confirmed sponsorship found by Scout or Veille should be inserted/upserted instead of remaining only inside model output.

---

## 7. Opportunity Signals

A good brand-athlete fit is not enough. Timing matters.

Add a structured signal layer:

```prisma
model OpportunitySignal {
  id          String   @id @default(cuid())
  brandId     String

  type        String
  title       String
  description String?

  strength    Float?
  expiresAt   DateTime?

  sourceUrl   String?
  observedAt  DateTime @default(now())

  brand       Brand @relation(fields: [brandId], references: [id])

  @@index([brandId, type])
}
```

Suggested signal types:

- `NEW_MARKET_ENTRY`
- `NEW_MARKETING_DIRECTOR`
- `FUNDRAISING`
- `NEW_PRODUCT`
- `NEW_SPORT_CAMPAIGN`
- `SPONSORSHIP_ENDING`
- `COMPETITOR_SPONSORSHIP`
- `ATHLETE_CAMPAIGN`
- `MAJOR_EVENT`
- `BUDGET_SEASON`

SponsorAI should eventually answer both:

1. Is this brand relevant?
2. Is this a good moment to approach it?

---

# PR3 — Athlete Intelligence History

## 8. Athlete Intelligence Snapshots

Current player intelligence should not live only inside `Scan.playerIntelligence` JSON.

Create snapshots so commercial positioning can be tracked over time.

```prisma
model AthleteIntelligenceSnapshot {
  id              String   @id @default(cuid())
  playerId        String

  publicImage     String?
  audienceSummary String?
  contentStyle    String?
  recentStats     String?
  recentNews      String?
  momentumScore   Float?

  rawData         Json?
  sourceScanId    String?

  generatedAt     DateTime @default(now())

  player          Player @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@index([playerId, generatedAt])
}
```

---

## 9. Athlete traits

Values and interests should be queryable, not only strings in JSON.

```prisma
model AthleteTrait {
  id         String @id @default(cuid())
  playerId   String
  type       String
  value      String
  confidence Float?
  source     String?

  player Player @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@index([type, value])
}
```

Example traits:

- `value: family`
- `value: excellence`
- `interest: gaming`
- `interest: fashion`
- `interest: cars`
- `audience_market: france`
- `audience_market: germany`
- `image: premium`
- `image: family-friendly`

---

## 10. Social account history

Add structured platform data rather than keeping all social metrics on `Player` forever.

```prisma
model AthleteSocialAccount {
  id           String   @id @default(cuid())
  playerId     String
  platform     String
  handle       String?
  url          String?
  followers    Int?
  engagement   Float?
  lastMeasured DateTime?

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  player       Player @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@unique([playerId, platform])
}
```

Future extension: separate time-series metrics if follower growth becomes commercially useful.

---

# PR4 — Matchmaker V2

## 11. Keep Prospect as Athlete × Brand opportunity

The current `Prospect` abstraction is good.

Extend it rather than replace it.

Suggested fields:

```prisma
dataScore         Float?
aiScore           Float?
finalScore        Float?
expectedValue     Float?
probability       Float?
opportunityReason String?
firstSeenAt       DateTime?
lastScoredAt      DateTime?
scoreVersion      String?
outcome           String?
outcomeReason     String?
```

`scoreVersion` is essential for comparing future scoring systems.

---

## 12. Hybrid scoring strategy

The current score axes are useful and should remain:

- image coherence
- audience fit
- sponsorship history
- conversion potential
- accessibility
- timing
- exclusivity risk
- brand momentum

But factual dimensions should progressively become data-driven.

Target architecture:

```text
Final Score
├── sponsorship history
├── sport affinity
├── geographic fit
├── audience fit
├── category affinity
├── contact accessibility
├── historical SponsorAI response rate
├── timing / opportunity signals
└── qualitative LLM judgment
```

At launch, LLM reasoning may still represent most of the score.

As SponsorAI accumulates data, the weighting should shift toward proprietary historical and behavioral data.

Never hardcode a final weighting as permanent. Version every scoring model.

---

# PR5 — Learning Loop

## 13. Outreach events

Do not reduce outreach history to only the current email status.

Create event-level behavioral data.

```prisma
model OutreachEvent {
  id          String   @id @default(cuid())
  prospectId  String
  emailId     String?
  event       String
  metadata    Json?
  occurredAt  DateTime @default(now())

  @@index([prospectId, occurredAt])
}
```

Suggested event taxonomy:

- `EMAIL_SENT`
- `DELIVERED`
- `OPENED`
- `CLICKED`
- `REPLIED`
- `POSITIVE_REPLY`
- `NEGATIVE_REPLY`
- `INTRO_REQUESTED`
- `MEETING_BOOKED`
- `PROPOSAL_REQUESTED`
- `PROPOSAL_SENT`
- `NEGOTIATION_STARTED`
- `SIGNED`
- `LOST`

Suggested lost reasons:

- `budget`
- `timing`
- `no_fit`
- `already_sponsored`
- `exclusivity`
- `no_interest`
- `no_response`

Negative outcomes are valuable training data and should never be discarded.

---

## 14. Human relevance feedback

During the pilot, the athlete representative should validate every proposed opportunity before outreach.

Add:

```prisma
model ProspectFeedback {
  id          String   @id @default(cuid())
  prospectId  String
  reviewerId  String?
  verdict     String
  score       Int?
  reason      String?
  createdAt   DateTime @default(now())

  @@index([prospectId])
}
```

Recommended UX:

- Excellent / pursue
- Maybe
- Bad fit

This creates supervised human relevance data for Matchmaker V2.

During the pilot, **human approval should remain mandatory before sending outreach**.

---

# PR6 — Intelligence Engine / Veille V2

## 15. Fix current Veille behavior

The existing Veille code logs that it performs web search but its Anthropic request currently does not attach the web search tool.

Fix this first.

More importantly, Veille should no longer only return human-readable alerts.

New pipeline:

```text
Search
→ Extract entities
→ Resolve Brand / Athlete / Company
→ Store Evidence
→ Upsert Sponsorship / OpportunitySignal
→ Identify impacted Athlete × Brand opportunities
→ Re-score relevant prospects
```

Veille becomes a data ingestion engine.

---

## 16. Change Scout deduplication behavior

Current scan logic excludes every Company already known globally.

This should change.

Wrong behavior:

> A brand was discovered once → never propose it again.

Target behavior:

- exclude brands already fully evaluated for the **same athlete** when appropriate
- do **not** exclude brands because they are already known for another athlete
- preferably favor known brands because SponsorAI already owns useful data about them

Eventually the search order should be:

1. SponsorAI internal brand universe
2. existing sponsorship graph
3. opportunity signals
4. candidate retrieval
5. web discovery only to expand / refresh

---

# Contact Intelligence Architecture

## 17. Main challenge

One of the hardest practical problems is not generating an email. It is reliably identifying:

1. the right company / brand
2. the correct decision maker currently employed there
3. their professional contact channel
4. the reliability of that contact data

This should be treated as its own product subsystem rather than a small helper inside `Enrichisseur`.

---

## 18. Do not make LinkedIn scraping a hard dependency

SponsorAI should **not** depend on automated scraping of logged-in LinkedIn pages as its core production data source.

Reasons:

- platform / account dependency
- frequent UI changes
- anti-automation controls
- difficult reliability guarantees
- potential ToS / account risk
- hard to scale as a SaaS backend

LinkedIn is still valuable as:

- identity confirmation
- employment confirmation
- profile URL stored on Contact
- human validation surface

But the production contact engine should rely first on structured B2B data providers and public/company sources.

---

## 19. Recommended contact discovery waterfall

Implement a provider-agnostic waterfall.

### Step A — Resolve company identity

Input:

- brand name
- company name
- website/domain
- geography

Normalize to a canonical company/domain before searching people.

### Step B — Search decision makers by role

Priority role families for sponsorship outreach:

Tier 1:

- Sponsorship
- Partnerships
- Brand Partnerships
- Sports Marketing
- Athlete Marketing

Tier 2:

- Brand Director
- Marketing Director
- Head of Marketing
- CMO
- Communications / PR Director

Tier 3 for smaller companies:

- Founder
- CEO
- Country Manager

Role priority should depend on company size and sector.

### Step C — Structured B2B people provider

Primary current candidate: **Apollo**.

SponsorAI already includes an Apollo integration, so extend this before adding browser automation.

Use Apollo for:

- company/domain based people search
- role/title filtering
- current employment
- profile / LinkedIn metadata when supplied
- professional email enrichment / verification where available

### Step D — Secondary provider abstraction

Create an interface so additional providers can be plugged in later:

```ts
interface ContactProvider {
  searchPeople(input: ContactSearchInput): Promise<ContactCandidate[]>;
  enrichPerson(input: ContactEnrichmentInput): Promise<EnrichedContact>;
}
```

Possible future providers should be benchmarked by geography and hit rate rather than hardcoded into product strategy.

The provider order may vary by region.

### Step E — Public web / company site fallback

Search:

- company leadership/team pages
- press releases
- sponsorship announcements
- conference speaker bios
- professional association pages
- corporate press contacts

Use LLM/web search for discovery, but store the evidence URL and confidence.

### Step F — Email verification

Never send to guessed addresses simply because a pattern looks plausible.

Statuses should remain explicit:

- verified
- public_source
- guessed
- missing
- invalid / bounced

Guessed addresses may be kept as candidates for further verification but not marked outreach-ready.

---

## 20. Contact relevance scoring

Each Contact candidate should receive its own score.

Example:

```text
Contact relevance score
├── title relevance
├── department fit
├── seniority
├── current employment confidence
├── geography responsibility
├── sponsorship / sports responsibility
├── email quality
└── source confidence
```

Output example:

```text
Jane Doe
Head of Sports Partnerships
Relevance: 96/100
Employment confidence: 99%
Email: verified
LinkedIn: known
```

SponsorAI should rank contacts rather than simply save the first person found.

---

## 21. Multi-contact outreach strategy

Do not assume one contact per company.

Store 3–5 qualified contacts when possible, but avoid simultaneously blasting all of them.

Suggested sequence:

1. primary decision maker
2. wait for defined sequence outcome
3. secondary decision maker / adjacent role if appropriate
4. escalation only when justified

Track which roles generate the best response rates over time.

This becomes part of SponsorAI's proprietary data:

> For sports sponsorship at companies of this size, Head of Partnerships responds 2.3× more often than CMO.

---

# Pilot Strategy

## 22. Use the initial professional football portfolio as a data lab

Do not start by maximizing SaaS customer count.

Use the first 10–15 professional players to validate the intelligence engine.

Recommended initial scope:

- 20–30 high-quality opportunities per athlete
- manually reviewed before outreach
- record every human relevance judgment
- verify contacts carefully
- track every campaign outcome

A portfolio of 10 players × 25 opportunities already creates roughly 250 labeled Athlete × Brand observations.

---

## 23. Pilot KPIs

Track at least:

1. `Precision@20`
   - percentage of top-20 recommended brands judged relevant by the representative

2. `ContactCoverage`
   - percentage of qualified brands for which SponsorAI identifies a relevant decision maker

3. `VerifiedEmailRate`
   - percentage with a verified or trustworthy professional contact channel

4. `DeliveryRate`

5. `ResponseRate`

6. `PositiveResponseRate`

7. `MeetingRate`

8. `SignedDealRate`

9. `GeneratedSponsorshipValue`

Primary north-star business metric:

> Sponsorship revenue generated through SponsorAI.

---

# Codex execution rules

## 24. Implementation constraints

When Codex implements this architecture:

- preserve the existing working UI and MVP workflows
- implement schema changes additively
- create Prisma migrations for every schema change
- avoid destructive migration until replacement data has been validated
- do not remove legacy fields before all reads/writes have migrated
- add indexes for frequently queried relationships
- maintain source provenance and confidence for external data
- do not mark guessed emails as outreach-ready
- make external data providers interchangeable behind internal interfaces
- version scoring logic
- keep human approval required before bulk send during pilot
- add tests around deduplication, contact quality and score calculation

---

# Recommended immediate tasks for Codex

## P0 — first engineering pass

1. Fix `Veille` so its claimed web search actually uses web search.
2. Change global brand exclusion in Scan to athlete-specific exclusion/deduplication.
3. Add `Brand`, `Contact`, `Employment`, `ContactEmail`, `Evidence` models.
4. Migrate Enrichisseur persistence to the new Contact architecture while retaining legacy Company contact fields temporarily.
5. Add `Sponsorship` and `OpportunitySignal`.
6. Persist verified real-world sponsorship discoveries from Scout/Veille.
7. Add `ProspectFeedback` and human validation UI before outreach.
8. Add `OutreachEvent` and explicit positive/negative outcome capture.
9. Introduce `scoreVersion`, `dataScore`, `aiScore`, `finalScore` on Prospect.
10. Create a Contact Intelligence service abstraction around Apollo + fallback web discovery.

Do not attempt to complete all items in one PR.

Start with the data foundation, migration safety and tests.

---

# Definition of success for SponsorAI V2

SponsorAI V1:

> AI finds brands and writes outreach emails.

SponsorAI V2:

> SponsorAI knows the sponsorship market, identifies the best current opportunities for each athlete, finds the right decision makers, manages outreach and becomes more accurate after every campaign.

Long-term moat:

> A proprietary Sports Sponsorship Graph built from real sponsorship market data and real outreach/deal outcomes.
