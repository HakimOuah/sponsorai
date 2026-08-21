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

export async function getEmails(filters?: {
  status?: string;
  companyId?: string;
  prospectId?: string;
}) {
  return prisma.email.findMany({
    where: {
      ...(filters?.status && { status: filters.status }),
      ...(filters?.companyId && { companyId: filters.companyId }),
      ...(filters?.prospectId && { prospectId: filters.prospectId }),
    },
    include: {
      company: { select: { name: true } },
      prospect: {
        select: {
          player: { select: { firstName: true, lastName: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEmail(id: string) {
  return prisma.email.findUnique({
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
          contactRole: true,
          contactEmailStatus: true,
          outreachReady: true,
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
}

export async function updateEmail(
  id: string,
  data: { subject?: string; body?: string; status?: string }
) {
  await prisma.email.update({
    where: { id },
    data,
  });

  revalidatePath("/emails");
}

export async function deleteEmail(id: string) {
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
  await prisma.emailTemplate.create({ data });
  revalidatePath("/emails/templates");
}

export async function updateEmailTemplate(
  id: string,
  data: { name?: string; type?: string; subject?: string; body?: string; active?: boolean }
) {
  await prisma.emailTemplate.update({ where: { id }, data });
  revalidatePath("/emails/templates");
}

export async function deleteEmailTemplate(id: string) {
  await prisma.emailTemplate.delete({ where: { id } });
  revalidatePath("/emails/templates");
}

export async function sendEmail(emailId: string) {
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
