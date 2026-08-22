"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { canSendOutreach } from "@/lib/agents/contact-quality";
import { getSendingProvider } from "@/lib/email/providers";
import {
  formatSendingIdentity,
  resolveOutreachSendingIdentity,
} from "@/lib/email/identities";
import { recordLearningEvent } from "@/lib/learning/events";
import {
  getCurrentUserAccess,
  requireOperationalAccess,
} from "@/lib/auth/access";
import { redactRecipientIdentity } from "@/lib/privacy/contact-redaction";

export async function getEmails(filters?: {
  status?: string;
  companyId?: string;
  prospectId?: string;
}) {
  const access = await getCurrentUserAccess();
  const emails = await prisma.email.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.companyId && { companyId: filters.companyId }),
      ...(filters?.prospectId && { prospectId: filters.prospectId }),
    },
    select: {
      id: true,
      type: true,
      subject: true,
      status: true,
      sentAt: true,
      createdAt: true,
      company: { select: { name: true } },
      contact: { select: { fullName: true } },
      prospect: {
        select: {
          player: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return emails.map((email) => ({
    ...email,
    subject: access.isAdmin
      ? email.subject
      : redactRecipientIdentity(email.subject, email.contact?.fullName),
    contact: undefined,
  }));
}

export async function getEmail(id: string) {
  const access = await getCurrentUserAccess();
  const email = await prisma.email.findUnique({
    where: { id },
    select: {
      id: true,
      subject: true,
      body: true,
      status: true,
      type: true,
      sentAt: true,
      createdAt: true,
      company: {
        select: {
          name: true,
          contactName: true,
          contactRole: true,
          contactEmail: true,
          contactEmailStatus: true,
          contactSource: true,
          contactEvidence: true,
          outreachReady: true,
        },
      },
      contact: {
        select: {
          fullName: true,
          roleRaw: true,
          contactability: true,
          contactEmails: {
            where: { status: { in: ["verified", "public_source"] } },
            orderBy: [{ isPrimary: "desc" }, { verifiedAt: "desc" }],
            take: 1,
            select: {
              email: true,
              status: true,
              source: true,
              evidence: true,
            },
          },
        },
      },
      prospect: {
        select: {
          outreachApprovedAt: true,
          player: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!email) return null;

  const contactEmail = email.contact?.contactEmails[0];
  const recipientEmail = contactEmail?.email || email.company.contactEmail;
  const recipientEvidence =
    contactEmail?.evidence || email.company.contactEvidence;
  const recipientName =
    email.contact?.fullName || email.company.contactName || null;

  return {
    ...email,
    subject: access.isAdmin
      ? email.subject
      : redactRecipientIdentity(email.subject, recipientName),
    body: access.isAdmin
      ? email.body
      : redactRecipientIdentity(email.body, recipientName),
    contact: undefined,
    company: {
      ...email.company,
      contactEmail: undefined,
      contactName: undefined,
      contactEvidence: undefined,
      contactSource: undefined,
    },
    contactReady: Boolean(recipientEmail),
    canViewContactDetails: access.isAdmin,
    recipient: {
      name: access.isAdmin
        ? recipientName
        : null,
      role: email.contact?.roleRaw || email.company.contactRole,
      email: access.isAdmin ? recipientEmail || null : null,
      status:
        contactEmail?.status || email.company.contactEmailStatus || "missing",
      source: access.isAdmin
        ? contactEmail?.source || email.company.contactSource
        : null,
      evidence: access.isAdmin ? recipientEvidence || null : null,
      kind: classifyRecipientEmail(recipientEmail, recipientEvidence),
    },
  };
}

function classifyRecipientEmail(
  email?: string | null,
  evidence?: string | null,
): "personal_professional" | "functional_generic" | "unknown" {
  if (!email) return "unknown";
  if (evidence?.toLowerCase().includes("boîte fonctionnelle")) {
    return "functional_generic";
  }

  const localPart = email.split("@")[0]?.toLowerCase() || "";
  return /^(contact|info|hello|marketing|communication|communications|partnerships|partenariats|sponsoring|sponsorship|press|presse|media)([._-]|$)/.test(
    localPart,
  )
    ? "functional_generic"
    : "personal_professional";
}

export async function updateEmail(
  id: string,
  data: { subject?: string; body?: string; status?: string }
) {
  await requireOperationalAccess();
  await prisma.email.update({
    where: { id },
    data,
  });

  revalidatePath("/emails");
}

export async function deleteEmail(id: string) {
  await requireOperationalAccess();
  await prisma.email.delete({ where: { id } });
  revalidatePath("/emails");
}

export async function getEmailTemplates() {
  return prisma.emailTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getEmailTemplate(id: string) {
  return prisma.emailTemplate.findUnique({ where: { id } });
}

export async function createEmailTemplate(data: {
  name: string;
  type: string;
  subject: string;
  body: string;
}) {
  await requireOperationalAccess();
  await prisma.emailTemplate.create({ data });
  revalidatePath("/emails/templates");
}

export async function updateEmailTemplate(
  id: string,
  data: { name?: string; type?: string; subject?: string; body?: string; active?: boolean }
) {
  await requireOperationalAccess();
  await prisma.emailTemplate.update({ where: { id }, data });
  revalidatePath("/emails/templates");
}

export async function deleteEmailTemplate(id: string) {
  await requireOperationalAccess();
  await prisma.emailTemplate.delete({ where: { id } });
  revalidatePath("/emails/templates");
}

export async function sendEmail(emailId: string) {
  await requireOperationalAccess();
  const email = await prisma.email.findUnique({
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
  const selectedContactReady = Boolean(
    email.prospect?.selectedContact &&
      email.prospect.selectedContact.active &&
      email.prospect.selectedContact.employmentStatus === "verified_current" &&
      email.prospect.selectedContact.contactEmails[0]
  );
  if (!selectedContactReady && !canSendOutreach(email.company)) {
    throw new Error(
      "Contact email is not verified enough for outreach. Run the enricher first."
    );
  }

  if (
    email.type === "first_contact" &&
    !email.prospect?.outreachApprovedAt
  ) {
    throw new Error("Human approval is required before first outreach");
  }

  const privateContactEmail =
    email.prospect?.selectedContact?.contactEmails[0]?.email ||
    email.company.contactEmail;

  if (!privateContactEmail) {
    throw new Error("No qualified contact email is available");
  }

  const identity = await resolveOutreachSendingIdentity(email.sendingIdentityId);
  const provider = getSendingProvider(identity.provider);

  const result = await provider.send({
    from: formatSendingIdentity(identity),
    replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM || process.env.SMTP_USER,
    to: privateContactEmail,
    subject: email.subject,
    text: email.body,
  });

  const thread = email.mailThreadId
    ? await prisma.mailThread.findUnique({ where: { id: email.mailThreadId } })
    : await prisma.mailThread.create({
        data: {
          prospectId: email.prospectId,
          companyId: email.companyId,
          contactId: email.prospect?.selectedContactId || null,
          sendingIdentityId: identity.id,
          subject: email.subject,
          lastMessageAt: new Date(),
        },
      });

  await prisma.email.update({
    where: { id: emailId },
    data: {
      status: "sent",
      sentAt: new Date(),
      messageId: result.messageId,
      provider: result.provider,
      sendingIdentityId: identity.id,
      contactId: email.prospect?.selectedContactId || null,
      mailThreadId: thread?.id || null,
    },
  });

  await prisma.outreachEvent.create({
    data: {
      emailId,
      type: "EMAIL_SENT",
      provider: result.provider,
      providerEventId: result.messageId,
      metadata: { accepted: result.accepted },
    },
  });

  await recordLearningEvent({
    type: "EMAIL_SENT",
    idempotencyKey: `email:${emailId}:sent`,
    prospectId: email.prospectId,
    emailId,
    contactId: email.prospect?.selectedContactId,
  });

  // Update prospect status if still "new"
  if (email.prospectId) {
    const prospect = await prisma.prospect.findUnique({
      where: { id: email.prospectId },
    });
    if (prospect && prospect.status === "new") {
      await prisma.prospect.update({
        where: { id: email.prospectId },
        data: { status: "contacted" },
      });
    }
  }

  await prisma.activityLog.create({
    data: {
      type: "email_sent",
      message: `Email envoyé à ${email.company.name}`,
      metadata: { emailId, provider: result.provider },
    },
  });

  revalidatePath("/emails");
  revalidatePath("/prospection");
  revalidatePath("/pipeline");
}

export async function bulkGenerateEmails(prospectIds: string[], emailType: string) {
  await requireOperationalAccess();
  const results: { prospectId: string; emailId: string; error?: string }[] = [];

  for (const prospectId of prospectIds) {
    try {
      const res = await fetch(
        `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/agents/redacteur`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prospectId, emailType }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        results.push({ prospectId, emailId: data.email.id });
      } else {
        results.push({ prospectId, emailId: "", error: "Generation failed" });
      }
    } catch {
      results.push({ prospectId, emailId: "", error: "Network error" });
    }
  }

  revalidatePath("/emails");
  revalidatePath("/prospection");
  return results;
}
