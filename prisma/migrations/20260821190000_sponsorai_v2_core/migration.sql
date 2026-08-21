-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "companySizeBucket" TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN     "employeeCount" INTEGER;

-- AlterTable
ALTER TABLE "Prospect" ADD COLUMN     "outreachApprovedAt" TIMESTAMP(3),
ADD COLUMN     "outreachApprovedBy" TEXT,
ADD COLUMN     "scoreVersion" TEXT NOT NULL DEFAULT 'matchmaker-v1',
ADD COLUMN     "selectedContactId" TEXT;

-- AlterTable
ALTER TABLE "Deal" ADD COLUMN     "origin" TEXT NOT NULL DEFAULT 'sponsorai',
ADD COLUMN     "successFeeEligible" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Email" ADD COLUMN     "contactId" TEXT,
ADD COLUMN     "direction" TEXT NOT NULL DEFAULT 'outbound',
ADD COLUMN     "mailThreadId" TEXT,
ADD COLUMN     "provider" TEXT,
ADD COLUMN     "sendingIdentityId" TEXT,
ADD COLUMN     "templateVersion" TEXT;

-- AlterTable
ALTER TABLE "EmailTemplate" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Scan" ADD COLUMN     "matchmakerVersion" TEXT NOT NULL DEFAULT 'matchmaker-v2',
ADD COLUMN     "scoutVersion" TEXT NOT NULL DEFAULT 'scout-v2';

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "roleRaw" TEXT NOT NULL,
    "roleNormalized" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerExternalId" TEXT,
    "employmentStatus" TEXT NOT NULL DEFAULT 'verified_current',
    "employmentConfidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "relevanceScore" INTEGER NOT NULL DEFAULT 0,
    "contactScore" DOUBLE PRECISION,
    "contactScoreVersion" TEXT NOT NULL DEFAULT 'contact-score-v1',
    "contactability" TEXT NOT NULL DEFAULT 'missing',
    "source" TEXT,
    "sourceUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employment" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "titleRaw" TEXT NOT NULL,
    "titleNormalized" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'current',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sourceUrl" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Employment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactEmail" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'missing',
    "source" TEXT,
    "evidence" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactEmail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "contactId" TEXT,
    "sponsorshipId" TEXT,
    "opportunitySignalId" TEXT,
    "evidenceType" TEXT NOT NULL,
    "claim" TEXT NOT NULL,
    "sourceName" TEXT,
    "sourceUrl" TEXT,
    "excerpt" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sponsorship" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "rightsHolder" TEXT NOT NULL,
    "athleteName" TEXT,
    "sport" TEXT,
    "category" TEXT,
    "territory" TEXT,
    "status" TEXT NOT NULL DEFAULT 'observed',
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "source" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsorship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunitySignal" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "status" TEXT NOT NULL DEFAULT 'unreviewed',
    "sourceUrl" TEXT,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpportunitySignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteIntelligenceSnapshot" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'athlete-intelligence-v1',
    "snapshot" JSONB NOT NULL,
    "sourceScanId" TEXT,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AthleteIntelligenceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteTrait" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "source" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteTrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AthleteSocialAccount" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "url" TEXT,
    "followers" INTEGER,
    "engagementRate" DOUBLE PRECISION,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteSocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningEvent" (
    "id" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prospectId" TEXT,
    "playerId" TEXT,
    "companyId" TEXT,
    "contactId" TEXT,
    "emailId" TEXT,
    "dealId" TEXT,
    "roleRaw" TEXT,
    "roleNormalized" TEXT,
    "sector" TEXT,
    "country" TEXT,
    "companySizeBucket" TEXT,
    "sport" TEXT,
    "audienceSize" INTEGER,
    "brandScore" DOUBLE PRECISION,
    "contactScore" DOUBLE PRECISION,
    "scoreVersion" TEXT,
    "templateVersion" TEXT,
    "matchmakerVersion" TEXT,
    "outcomeValue" DOUBLE PRECISION,
    "currency" TEXT,
    "context" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachEvent" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT,
    "metadata" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProspectFeedback" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "userId" TEXT,
    "brandRating" TEXT,
    "contactRating" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProspectFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePerformanceStat" (
    "id" TEXT NOT NULL,
    "roleNormalized" TEXT NOT NULL,
    "sector" TEXT NOT NULL DEFAULT 'unknown',
    "companySizeBucket" TEXT NOT NULL DEFAULT 'unknown',
    "sport" TEXT NOT NULL DEFAULT 'unknown',
    "country" TEXT NOT NULL DEFAULT 'unknown',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "deliveries" INTEGER NOT NULL DEFAULT 0,
    "replies" INTEGER NOT NULL DEFAULT 0,
    "positiveReplies" INTEGER NOT NULL DEFAULT 0,
    "meetings" INTEGER NOT NULL DEFAULT 0,
    "signedDeals" INTEGER NOT NULL DEFAULT 0,
    "signedValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "smoothedReplyRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "smoothedPositiveRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "smoothedMeetingRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "smoothedDealRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "contextualUtility" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priorStrength" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "scoringVersion" TEXT NOT NULL DEFAULT 'role-performance-v1',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePerformanceStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'scheduled',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "externalUrl" TEXT,
    "outcome" TEXT,
    "notes" TEXT,
    "attendees" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "amount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "summary" TEXT,
    "externalUrl" TEXT,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "externalUrl" TEXT,
    "sentAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealEvent" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "actor" TEXT,
    "immutableKey" TEXT,
    "data" JSONB,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SendingIdentity" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "purpose" TEXT NOT NULL DEFAULT 'outreach',
    "provider" TEXT NOT NULL DEFAULT 'smtp',
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "credentialRef" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SendingIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailThread" (
    "id" TEXT NOT NULL,
    "prospectId" TEXT,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT,
    "sendingIdentityId" TEXT,
    "externalThreadId" TEXT,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttributionRecord" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "prospectId" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'sponsorai',
    "initiatedBySponsorAI" BOOLEAN NOT NULL DEFAULT true,
    "immutableKey" TEXT NOT NULL,
    "firstTouchAt" TIMESTAMP(3) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AttributionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuccessFeeRecord" (
    "id" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "attributionRecordId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'not_applicable',
    "basisAmount" DOUBLE PRECISION,
    "feeRate" DOUBLE PRECISION,
    "feeAmount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuccessFeeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Contact_companyId_roleNormalized_idx" ON "Contact"("companyId", "roleNormalized");

-- CreateIndex
CREATE INDEX "Contact_contactScore_idx" ON "Contact"("contactScore");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_provider_providerExternalId_key" ON "Contact"("provider", "providerExternalId");

-- CreateIndex
CREATE INDEX "Employment_companyId_status_idx" ON "Employment"("companyId", "status");

-- CreateIndex
CREATE INDEX "Employment_contactId_status_idx" ON "Employment"("contactId", "status");

-- CreateIndex
CREATE INDEX "ContactEmail_emailHash_idx" ON "ContactEmail"("emailHash");

-- CreateIndex
CREATE UNIQUE INDEX "ContactEmail_contactId_emailHash_key" ON "ContactEmail"("contactId", "emailHash");

-- CreateIndex
CREATE INDEX "Evidence_companyId_evidenceType_idx" ON "Evidence"("companyId", "evidenceType");

-- CreateIndex
CREATE INDEX "Evidence_contactId_evidenceType_idx" ON "Evidence"("contactId", "evidenceType");

-- CreateIndex
CREATE INDEX "Sponsorship_companyId_status_idx" ON "Sponsorship"("companyId", "status");

-- CreateIndex
CREATE INDEX "Sponsorship_sport_category_idx" ON "Sponsorship"("sport", "category");

-- CreateIndex
CREATE INDEX "OpportunitySignal_companyId_status_idx" ON "OpportunitySignal"("companyId", "status");

-- CreateIndex
CREATE INDEX "OpportunitySignal_type_detectedAt_idx" ON "OpportunitySignal"("type", "detectedAt");

-- CreateIndex
CREATE INDEX "AthleteIntelligenceSnapshot_playerId_capturedAt_idx" ON "AthleteIntelligenceSnapshot"("playerId", "capturedAt");

-- CreateIndex
CREATE INDEX "AthleteTrait_playerId_active_idx" ON "AthleteTrait"("playerId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteTrait_playerId_type_value_key" ON "AthleteTrait"("playerId", "type", "value");

-- CreateIndex
CREATE INDEX "AthleteSocialAccount_playerId_platform_idx" ON "AthleteSocialAccount"("playerId", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteSocialAccount_playerId_platform_handle_key" ON "AthleteSocialAccount"("playerId", "platform", "handle");

-- CreateIndex
CREATE UNIQUE INDEX "LearningEvent_idempotencyKey_key" ON "LearningEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "LearningEvent_type_occurredAt_idx" ON "LearningEvent"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "LearningEvent_roleNormalized_sector_sport_idx" ON "LearningEvent"("roleNormalized", "sector", "sport");

-- CreateIndex
CREATE INDEX "LearningEvent_prospectId_occurredAt_idx" ON "LearningEvent"("prospectId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "OutreachEvent_providerEventId_key" ON "OutreachEvent"("providerEventId");

-- CreateIndex
CREATE INDEX "OutreachEvent_emailId_occurredAt_idx" ON "OutreachEvent"("emailId", "occurredAt");

-- CreateIndex
CREATE INDEX "OutreachEvent_type_occurredAt_idx" ON "OutreachEvent"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "ProspectFeedback_prospectId_createdAt_idx" ON "ProspectFeedback"("prospectId", "createdAt");

-- CreateIndex
CREATE INDEX "RolePerformanceStat_contextualUtility_idx" ON "RolePerformanceStat"("contextualUtility");

-- CreateIndex
CREATE UNIQUE INDEX "RolePerformanceStat_roleNormalized_sector_companySizeBucket_key" ON "RolePerformanceStat"("roleNormalized", "sector", "companySizeBucket", "sport", "country", "scoringVersion");

-- CreateIndex
CREATE INDEX "Meeting_dealId_scheduledAt_idx" ON "Meeting"("dealId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Meeting_status_scheduledAt_idx" ON "Meeting"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Proposal_dealId_status_idx" ON "Proposal"("dealId", "status");

-- CreateIndex
CREATE INDEX "Contract_dealId_status_idx" ON "Contract"("dealId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "DealEvent_immutableKey_key" ON "DealEvent"("immutableKey");

-- CreateIndex
CREATE INDEX "DealEvent_dealId_occurredAt_idx" ON "DealEvent"("dealId", "occurredAt");

-- CreateIndex
CREATE INDEX "DealEvent_type_occurredAt_idx" ON "DealEvent"("type", "occurredAt");

-- CreateIndex
CREATE INDEX "SendingIdentity_userId_purpose_status_idx" ON "SendingIdentity"("userId", "purpose", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SendingIdentity_email_purpose_key" ON "SendingIdentity"("email", "purpose");

-- CreateIndex
CREATE INDEX "MailThread_prospectId_lastMessageAt_idx" ON "MailThread"("prospectId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "MailThread_companyId_status_idx" ON "MailThread"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AttributionRecord_dealId_key" ON "AttributionRecord"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "AttributionRecord_immutableKey_key" ON "AttributionRecord"("immutableKey");

-- CreateIndex
CREATE INDEX "AttributionRecord_prospectId_firstTouchAt_idx" ON "AttributionRecord"("prospectId", "firstTouchAt");

-- CreateIndex
CREATE UNIQUE INDEX "SuccessFeeRecord_dealId_key" ON "SuccessFeeRecord"("dealId");

-- CreateIndex
CREATE UNIQUE INDEX "SuccessFeeRecord_attributionRecordId_key" ON "SuccessFeeRecord"("attributionRecordId");

-- CreateIndex
CREATE INDEX "Prospect_selectedContactId_idx" ON "Prospect"("selectedContactId");

-- CreateIndex
CREATE INDEX "Email_contactId_idx" ON "Email"("contactId");

-- CreateIndex
CREATE INDEX "Email_mailThreadId_idx" ON "Email"("mailThreadId");

-- AddForeignKey
ALTER TABLE "Prospect" ADD CONSTRAINT "Prospect_selectedContactId_fkey" FOREIGN KEY ("selectedContactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_sendingIdentityId_fkey" FOREIGN KEY ("sendingIdentityId") REFERENCES "SendingIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_mailThreadId_fkey" FOREIGN KEY ("mailThreadId") REFERENCES "MailThread"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employment" ADD CONSTRAINT "Employment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employment" ADD CONSTRAINT "Employment_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactEmail" ADD CONSTRAINT "ContactEmail_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_sponsorshipId_fkey" FOREIGN KEY ("sponsorshipId") REFERENCES "Sponsorship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_opportunitySignalId_fkey" FOREIGN KEY ("opportunitySignalId") REFERENCES "OpportunitySignal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sponsorship" ADD CONSTRAINT "Sponsorship_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunitySignal" ADD CONSTRAINT "OpportunitySignal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteIntelligenceSnapshot" ADD CONSTRAINT "AthleteIntelligenceSnapshot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteTrait" ADD CONSTRAINT "AthleteTrait_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteSocialAccount" ADD CONSTRAINT "AthleteSocialAccount_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningEvent" ADD CONSTRAINT "LearningEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachEvent" ADD CONSTRAINT "OutreachEvent_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectFeedback" ADD CONSTRAINT "ProspectFeedback_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProspectFeedback" ADD CONSTRAINT "ProspectFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealEvent" ADD CONSTRAINT "DealEvent_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SendingIdentity" ADD CONSTRAINT "SendingIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThread" ADD CONSTRAINT "MailThread_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThread" ADD CONSTRAINT "MailThread_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThread" ADD CONSTRAINT "MailThread_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailThread" ADD CONSTRAINT "MailThread_sendingIdentityId_fkey" FOREIGN KEY ("sendingIdentityId") REFERENCES "SendingIdentity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributionRecord" ADD CONSTRAINT "AttributionRecord_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttributionRecord" ADD CONSTRAINT "AttributionRecord_prospectId_fkey" FOREIGN KEY ("prospectId") REFERENCES "Prospect"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessFeeRecord" ADD CONSTRAINT "SuccessFeeRecord_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "Deal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuccessFeeRecord" ADD CONSTRAINT "SuccessFeeRecord_attributionRecordId_fkey" FOREIGN KEY ("attributionRecordId") REFERENCES "AttributionRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
