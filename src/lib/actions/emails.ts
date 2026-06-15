"use server";

import { prisma } from "@/lib/prisma";
import { getMailFrom, mailer } from "@/lib/mailer";
import { revalidatePath } from "next/cache";
import { canSendOutreach } from "@/lib/agents/contact-quality";

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
    include: {
      company: true,
      prospect: {
        include: {
          player: true,
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
        include: { player: true },
      },
    },
  });

  if (!email) throw new Error("Email not found");
  if (!email.company.contactEmail) throw new Error("No contact email for this company");
  if (!canSendOutreach(email.company)) {
    throw new Error(
      "Contact email is not verified enough for outreach. Run the enricher first."
    );
  }

  const info = await mailer.sendMail({
    from: getMailFrom(),
    replyTo: process.env.SMTP_REPLY_TO || process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email.company.contactEmail,
    subject: email.subject,
    text: email.body,
  });

  await prisma.email.update({
    where: { id: emailId },
    data: {
      status: "sent",
      sentAt: new Date(),
      messageId: info.messageId || null,
    },
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
      metadata: { emailId, to: email.company.contactEmail },
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
