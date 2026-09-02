"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { sendOutreachEmail } from "@/lib/email/send-outreach";
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
  const pipeline = await sendOutreachEmail(emailId);
  revalidatePath("/emails");
  revalidatePath(`/emails/${emailId}`);
  revalidatePath("/prospection");
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath(`/companies/${pipeline.companyId}`);
  if (pipeline.playerId) revalidatePath(`/players/${pipeline.playerId}`);
  if (pipeline.dealId) revalidatePath(`/pipeline/${pipeline.dealId}`);
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
