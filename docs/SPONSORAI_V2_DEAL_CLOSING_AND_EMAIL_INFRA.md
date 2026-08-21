# SponsorAI V2 — Deal closing visibility & Email Infrastructure

## 1. Product objective

SponsorAI should keep end-to-end visibility from opportunity discovery through signed deal, even when some steps happen outside the platform (video call, physical meeting, external contract workflow).

The goal is not to force every interaction into SponsorAI at any cost. The goal is to preserve:
- attribution
- status visibility
- deal history
- learning signals
- success-fee eligibility

## 2. Deal lifecycle model

Recommended canonical stages:

```text
MATCHED
CONTACT_SELECTED
OUTREACH_APPROVED
CONTACTED
REPLIED
QUALIFIED
MEETING_SCHEDULED
MEETING_COMPLETED
PROPOSAL_REQUESTED
PROPOSAL_SENT
NEGOTIATION
CONTRACT_SENT
CONTRACT_VIEWED
CONTRACT_SIGNED
WON
LOST
```

Each stage transition should be backed by an immutable DealEvent / OutreachEvent.

## 3. Meetings: do not require SponsorAI to host video calls

SponsorAI does not need to build its own Zoom/Meet replacement.

Recommended approach:
- allow meeting creation from SponsorAI
- integrate user calendar later (Google Calendar / Microsoft 365)
- store meeting metadata in SponsorAI
- meeting can point to Google Meet, Microsoft Teams, Zoom or a physical location
- after meeting time, ask for outcome or sync outcome when an integration can provide metadata

Suggested model:

```prisma
model Meeting {
  id          String   @id @default(cuid())
  prospectId  String
  contactId   String?
  type        String   // video | phone | physical
  provider    String?  // google_meet | zoom | teams | other
  externalId  String?
  joinUrl     String?
  location    String?
  startsAt    DateTime
  endsAt      DateTime?
  status      String   // scheduled | completed | cancelled | no_show
  outcome     String?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

SponsorAI does not need the video content in V2. The commercially useful signal is that a meeting happened, with whom, when, and its outcome.

Optional future capabilities:
- calendar sync
- meeting transcription when consented and technically available
- AI meeting summary
- next-step extraction
- automatic pipeline progression

## 4. Contracts: integrate e-signature instead of rebuilding DocuSign

Do NOT build a proprietary e-signature system in V2. Electronic signatures have legal, identity, audit and security requirements that are better delegated to a specialist provider.

Recommended architecture:

```text
SponsorAI Deal
    ↓
Generate / upload agreement
    ↓
E-signature provider API
    ↓
Envelope / signature request created
    ↓
Webhook events
    ↓
SponsorAI Contract status updated
    ↓
SIGNED event
    ↓
Deal = WON
```

DocuSign is a strong candidate because its API supports embedded signing and webhook status notifications. Other providers can later be implemented behind an abstraction.

Use a provider interface:

```ts
interface SignatureProvider {
  createEnvelope(...): Promise<SignatureEnvelope>
  getStatus(...): Promise<SignatureStatus>
  createSigningSession?(...): Promise<string>
  handleWebhook(...): Promise<SignatureEvent>
}
```

Possible implementations:
- DocuSignProvider
- DropboxSignProvider
- YousignProvider
- future provider

## 5. Contract entity

```prisma
model Contract {
  id                String   @id @default(cuid())
  dealId            String
  provider          String?
  externalEnvelopeId String?
  status            String   // draft | sent | viewed | partially_signed | signed | declined | voided
  documentUrl       String?
  amount             Float?
  currency           String?
  sentAt             DateTime?
  viewedAt           DateTime?
  signedAt           DateTime?
  source             String   // sponsorai | external
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt
}
```

## 6. What if the brand sends its own DocuSign / contract?

This is unavoidable. SponsorAI must support external closing evidence.

Three mechanisms:

### A. Email ingestion
If the brand sends a DocuSign/Yousign/Adobe Sign link or signed PDF into the SponsorAI-managed email conversation, the inbound email is captured and classified.

SponsorAI can detect likely signals:
- signature request
- contract attached
- signed agreement
- countersigned agreement
- legal/procurement handoff

The system proposes a stage update but should require confirmation for high-value transitions during the pilot.

### B. User confirmation
The representative can click:

```text
Mark contract as sent
Mark contract as signed
Mark deal as won
```

Require:
- deal value
- signed date
- optional agreement upload
- reason/source

Manual confirmation is legitimate; the important part is structured data and attribution.

### C. Connected mailbox / document detection
Later, connected Gmail/Microsoft accounts can allow SponsorAI to identify a contract-related thread or attachment and propose linking it to the opportunity.

## 7. Success-fee protection

No architecture can guarantee that a user never closes a sourced opportunity outside SponsorAI.

Therefore success-fee attribution must use a combination of:
- technical evidence (matching, outreach, replies, meetings)
- contractual attribution terms
- convenient in-platform closing workflow

Recommended attribution rule concept:
A deal is SponsorAI-originated if SponsorAI sourced the company and/or initiated the first contact, with an attribution window defined commercially.

Store an immutable attribution trail.

## 8. Email strategy: every license should NOT automatically get a brand-new cold mailbox

Creating one arbitrary mailbox per license does not automatically improve deliverability. New mailboxes/domains have no reputation and aggressive sending can make deliverability worse.

Deliverability depends heavily on:
- domain reputation
- authentication (SPF, DKIM, DMARC)
- sending volume and ramp
- bounce rate
- complaint rate
- recipient engagement
- list/contact quality
- copy and sending patterns

A dedicated IP is generally useful only at sufficiently high, stable volume. Domain reputation remains critical.

## 9. Recommended email architecture: customer-owned identity, SponsorAI-managed workflow

Preferred long-term model:

### Option A — Connect the agency/user's professional mailbox (preferred for high-trust outreach)

Example:

```text
User: agent@agency.com
        ↓ OAuth / provider integration
SponsorAI composer + sequencing
        ↓
Send through connected mailbox or authorized sending infrastructure
        ↓
Reply returns to agent@agency.com
        ↓
SponsorAI synchronizes thread
```

Advantages:
- authentic sender identity
- recipient sees a real representative/agency domain
- reply naturally belongs to the agent
- SponsorAI can still keep the thread and attribution in-platform

This is ideal for low-volume, high-value sponsorship outreach.

### Option B — Dedicated sending identity provisioned by SponsorAI

For customers who do not want to connect their mailbox, SponsorAI can provision an identity such as:

```text
firstname.lastname@outreach.customer-domain.com
```

or a controlled branded subdomain after DNS verification.

Do not send all customers from one visible `@sponsorai.ai` mailbox pool if the email is supposed to look like personal representation from the athlete's agent. That reduces authenticity and creates reputation coupling.

## 10. Separate application email from cold/outbound prospecting infrastructure

Never mix:
- password reset
- product notifications
- billing emails

with:
- sponsor prospecting outreach

Use separate domains/subdomains and provider streams.

Example:

```text
notifications@sponsorai.ai        -> transactional
updates@sponsorai.ai              -> product/broadcast
agent@outreach.agency-domain.com  -> sponsorship outreach
```

This protects core SponsorAI mail reputation.

## 11. SendingProvider abstraction

The existing SMTP implementation should evolve behind a provider abstraction.

```ts
interface SendingProvider {
  send(message: OutboundMessage): Promise<SendResult>
  getDeliveryStatus?(providerMessageId: string): Promise<DeliveryStatus>
}

interface MailboxProvider {
  send(...): Promise<SendResult>
  syncThread(...): Promise<Thread>
  getReplies(...): Promise<InboundMessage[]>
}
```

Possible implementations:
- Gmail / Google Workspace connected mailbox
- Microsoft 365 connected mailbox
- generic SMTP/IMAP for pilot
- specialist outbound provider if compliant with the intended use

Provider policy must be checked before using any email API for unsolicited prospecting; not all transactional providers permit cold outreach.

## 12. Important provider-policy constraint

Do not assume Resend/Postmark/etc. can be used as a cold-email engine.

For example, provider acceptable-use rules can require opt-in recipients. SponsorAI must select infrastructure whose terms explicitly support the actual sponsorship outreach use case and comply with applicable laws.

Architecture must therefore keep email provider replaceable.

## 13. Inbound email routing

Every outbound message must carry identifiers that let SponsorAI map replies back to:
- account/user
- athlete
- prospect
- contact
- campaign
- email sequence

Implementation options:
- provider message/thread IDs
- unique Reply-To aliases
- plus-addressing or generated inbound aliases
- connected mailbox thread synchronization

Example internal alias:

```text
reply+campaign_abc123@inbound.sponsorai.ai
```

The customer never needs to see the contact's raw address. SponsorAI stores it server-side, sends to it, and routes the response into the correct CRM thread.

## 14. User experience for email

From the user's perspective SponsorAI should look like a focused sponsorship inbox:

```text
Brand: Example Brand
Target: Head of Sports Partnerships (verified)

SponsorAI:
✓ First email sent Aug 21
✓ Opened Aug 22
✓ Reply received Aug 23

Brand reply:
"Interested. Can we schedule a call next week?"

[Reply]
[Schedule meeting]
[Mark not interested]
```

The raw recipient email remains hidden.

## 15. Sending identity shown to the brand

The brand must receive mail from a credible human/business identity, not an opaque bot identity.

Recommended From:

```text
Hakim / Vectis Agency <hakim@agency-domain.com>
```

or another authorized representative identity.

SponsorAI is the infrastructure/operator behind the conversation, not necessarily the visible sender brand.

Potential footer can disclose the representative and legally required information without exposing SponsorAI's internal mechanics.

## 16. Licensing model implications

A SponsorAI license/account should contain one or more `SendingIdentity` records, not automatically create a mailbox.

```prisma
model SendingIdentity {
  id              String   @id @default(cuid())
  userId          String
  type            String   // connected_google | connected_microsoft | smtp | managed
  email           String
  displayName     String?
  domain          String?
  status          String   // pending | active | restricted
  dailyLimit      Int?
  warmupState     String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

Different pricing tiers can support different identity counts/team members.

## 17. Deliverability engine (V2/P2)

SponsorAI should collect deliverability metrics per sending identity:
- sends
- delivered
- bounced
- blocked
- replies
- spam complaints where available
- domain authentication status

Implement guardrails:
- daily send caps
- gradual ramp for new identities
- hard stop on high bounce rate
- suppression list
- do-not-contact state
- deduplication

Do not optimize for volume. Sponsorship is a high-value, low-volume sales motion; 20 excellent approaches are more valuable than 1,000 automated cold emails.

## 18. Deal closing closed-loop

Target end-to-end flow:

```text
Brand matched
↓
Decision maker found (hidden)
↓
User approves outreach
↓
Email sent from authorized representative identity
↓
Reply synchronized inside SponsorAI
↓
Meeting scheduled (external provider allowed)
↓
Meeting completed + outcome captured
↓
Proposal generated/uploaded
↓
Negotiation tracked
↓
Contract created in SponsorAI OR external contract detected
↓
E-signature webhook / manual verified status
↓
Contract signed
↓
Deal marked WON
↓
Value + SponsorAI attribution locked
↓
Success fee record created
↓
Learning events update brand/contact models
```

## 19. Suggested new entities

Add over the V2 roadmap:
- Meeting
- Proposal
- Contract
- DealEvent
- SendingIdentity
- MailThread / Conversation
- InboundMessage (or unify with enhanced Email)
- DeliverabilityStat
- AttributionRecord / SuccessFeeRecord

## 20. Implementation priorities

### Pilot / P0
1. Keep existing SMTP mailbox working.
2. Ensure every outbound/reply maps reliably to Prospect.
3. Hide raw target coordinates from customer UI.
4. Add Meeting + manual outcome tracking.
5. Add Contract state + manual signed/won confirmation.
6. Add explicit deal value + attribution state.

### P1
7. Connected Gmail / Microsoft mailbox architecture.
8. Calendar/meeting sync.
9. E-signature provider abstraction + first integration (DocuSign/Yousign/etc.).
10. Signature webhooks auto-update Contract/Deal.
11. Proposal document workflow.

### P2
12. External contract detection from inbound email.
13. Meeting summaries where integrations and consent allow.
14. Deliverability optimization engine.
15. Success-fee billing automation.

## 21. Core principle

SponsorAI needs visibility, not absolute control.

A meeting can happen on Zoom. A contract can originate from the sponsor's legal team. A signature can happen in the sponsor's DocuSign account.

SponsorAI remains valuable if it reliably captures the commercial state transitions and ties them to the original SponsorAI opportunity.

Do not over-engineer by rebuilding Zoom or DocuSign. Integrate specialist services and provide strong manual fallbacks for steps controlled by the sponsor.