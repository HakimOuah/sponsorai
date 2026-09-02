import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canSendOutreach } from "@/lib/agents/contact-quality";
import { getSendingProvider } from "@/lib/email/providers";
import { formatSendingIdentity, resolveOutreachSendingIdentity } from "@/lib/email/identities";
import { recordLearningEvent } from "@/lib/learning/events";
import { hasRecordedOutboundSend, syncSentEmailToPipeline } from "./pipeline-sync";

export interface SendOutreachDependencies {
  db: PrismaClient;
  resolveIdentity: typeof resolveOutreachSendingIdentity;
  getProvider: typeof getSendingProvider;
  recordLearning: typeof recordLearningEvent;
}

const dependencies: SendOutreachDependencies = {
  db: prisma,
  resolveIdentity: resolveOutreachSendingIdentity,
  getProvider: getSendingProvider,
  recordLearning: recordLearningEvent,
};

/** Called only after the server action has checked operational access. */
export async function sendOutreachEmail(emailId: string, deps = dependencies) {
  const { db } = deps;
  const email = await db.email.findUnique({
    where: { id: emailId },
    include: {
      company: true,
      prospect: {
        include: {
          player: true,
          selectedContact: {
            include: {
              contactEmails: {
                where: { status: { in: ["verified", "public_source"] } },
                orderBy: [{ isPrimary: "desc" }, { verifiedAt: "desc" }],
                take: 1,
              },
            },
          },
        },
      },
    },
  });
  if (!email) throw new Error("Email not found");
  if (hasRecordedOutboundSend(email)) {
    // A retry after persistence/refresh trouble repairs the pipeline, not SMTP.
    return syncSentEmailToPipeline(emailId, db);
  }
  if (email.direction !== "outbound" || email.status !== "draft" || email.sentAt) {
    throw new Error("Cet email est déjà en cours d’envoi ou ne peut pas être envoyé. Actualisez la page.");
  }

  const selectedContactReady = Boolean(
    email.prospect?.selectedContact &&
      email.prospect.selectedContact.active &&
      email.prospect.selectedContact.employmentStatus === "verified_current" &&
      email.prospect.selectedContact.contactEmails[0],
  );
  if (!selectedContactReady && !canSendOutreach(email.company)) {
    throw new Error("Contact email is not verified enough for outreach. Run the enricher first.");
  }
  if (email.type === "first_contact" && !email.prospect?.outreachApprovedAt) {
    throw new Error("Human approval is required before first outreach");
  }
  const privateContactEmail = email.prospect?.selectedContact?.contactEmails[0]?.email || email.company.contactEmail;
  if (!privateContactEmail) throw new Error("No qualified contact email is available");

  const identity = await deps.resolveIdentity(email.sendingIdentityId);
  const provider = deps.getProvider(identity.provider);
  const claimed = await db.email.updateMany({
    where: { id: emailId, direction: "outbound", status: "draft", sentAt: null },
    data: { status: "sending" },
  });
  if (!claimed.count) {
    throw new Error("Cet envoi est déjà en cours ou terminé. Actualisez la page.");
  }

  let result;
  try {
    result = await provider.send({
      from: formatSendingIdentity(identity),
      replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM || process.env.SMTP_USER,
      to: privateContactEmail,
      subject: email.subject,
      text: email.body,
    });
    if (!result.accepted) throw new Error("Le serveur mail n’a pas accepté le message. Aucun envoi n’a été enregistré.");
  } catch (error) {
    await db.email.updateMany({
      where: { id: emailId, status: "sending", sentAt: null },
      data: { status: "draft" },
    });
    throw error;
  }

  // Persist the provider receipt before any secondary work. If later work fails,
  // another click can reconcile it without sending the same email a second time.
  await db.email.update({
    where: { id: emailId },
    data: {
      status: "sent", sentAt: new Date(), messageId: result.messageId,
      provider: result.provider, sendingIdentityId: identity.id,
      contactId: email.prospect?.selectedContactId || null,
    },
  });
  const thread = email.mailThreadId
    ? await db.mailThread.findUnique({ where: { id: email.mailThreadId } })
    : await db.mailThread.create({
        data: {
          prospectId: email.prospectId, companyId: email.companyId,
          contactId: email.prospect?.selectedContactId || null,
          sendingIdentityId: identity.id, subject: email.subject, lastMessageAt: new Date(),
        },
      });
  await db.email.update({ where: { id: emailId }, data: { mailThreadId: thread?.id || null } });
  await db.outreachEvent.create({
    data: {
      emailId, type: "EMAIL_SENT", provider: result.provider,
      providerEventId: result.messageId, metadata: { accepted: result.accepted },
    },
  });
  const pipeline = await syncSentEmailToPipeline(emailId, db);
  await deps.recordLearning({
    type: "EMAIL_SENT", idempotencyKey: `email:${emailId}:sent`,
    prospectId: email.prospectId, emailId, dealId: pipeline.dealId,
    contactId: email.prospect?.selectedContactId,
  });
  await db.activityLog.create({
    data: {
      type: "email_sent", message: `Email envoyé à ${email.company.name}`,
      metadata: { emailId, provider: result.provider, dealId: pipeline.dealId ?? null },
    },
  });
  return pipeline;
}
