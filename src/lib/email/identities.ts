import { prisma } from "@/lib/prisma";

export interface ResolvedSendingIdentity {
  id: string | null;
  provider: string;
  email: string;
  displayName: string | null;
}

export async function resolveOutreachSendingIdentity(
  identityId?: string | null
): Promise<ResolvedSendingIdentity> {
  const identity = identityId
    ? await prisma.sendingIdentity.findFirst({
        where: {
          id: identityId,
          purpose: "outreach",
          status: "active",
        },
      })
    : await prisma.sendingIdentity.findFirst({
        where: { purpose: "outreach", status: "active" },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      });

  if (identity) {
    return {
      id: identity.id,
      provider: identity.provider,
      email: identity.email,
      displayName: identity.displayName,
    };
  }

  const email = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!email) {
    throw new Error("No active outreach sending identity is configured");
  }

  return {
    id: null,
    provider: "smtp",
    email,
    displayName: process.env.MAIL_FROM_NAME || null,
  };
}

export function formatSendingIdentity(identity: ResolvedSendingIdentity): string {
  if (!identity.displayName) return identity.email;
  return `"${identity.displayName.replace(/"/g, "")}" <${identity.email}>`;
}
