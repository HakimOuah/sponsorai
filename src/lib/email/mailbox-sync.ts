import crypto from "node:crypto";
import { ImapFlow } from "imapflow";
import PostalMime, { type Email as ParsedEmail } from "postal-mime";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { processInboundReply } from "@/lib/email/process-inbound-reply";

const DEFAULT_LOOKBACK_DAYS = 14;
const DEFAULT_MAX_CANDIDATES = 60;
const DEFAULT_MAX_REPLIES = 3;
const MAX_MESSAGE_BYTES = 2_000_000;

export interface MailboxSyncResult {
  checked: number;
  matched: number;
  imported: number;
  analyzed: number;
  skipped: number;
  failed: number;
  errors: string[];
}

interface MailboxConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export function getMailboxConfig(): MailboxConfig {
  const user = process.env.IMAP_USER || process.env.SMTP_USER;
  const pass = process.env.IMAP_PASS || process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error("IMAP credentials are not configured");
  }

  return {
    host: process.env.IMAP_HOST || "imap.ionos.fr",
    port: Number(process.env.IMAP_PORT) || 993,
    secure: process.env.IMAP_SECURE !== "false",
    user,
    pass,
  };
}

export function normalizeMessageId(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  const unwrapped = trimmed.replace(/^<|>$/g, "").trim();
  return unwrapped ? `<${unwrapped}>` : null;
}

export function collectThreadMessageIds(message: {
  inReplyTo?: string | null;
  references?: string | string[] | null;
}) {
  const rawValues = [
    message.inReplyTo || "",
    ...(Array.isArray(message.references)
      ? message.references
      : [message.references || ""]),
  ];
  const ids = new Set<string>();

  for (const rawValue of rawValues) {
    const matches = rawValue.match(/<[^>]+>/g) || [rawValue];
    for (const match of matches) {
      const normalized = normalizeMessageId(match);
      if (normalized) ids.add(normalized);
    }
  }

  return Array.from(ids);
}

export function messageIdVariants(messageId: string) {
  const normalized = normalizeMessageId(messageId);
  if (!normalized) return [];
  return [normalized, normalized.slice(1, -1)];
}

export function extractReplyText(rawText: string | null | undefined) {
  const lines = (rawText || "").replace(/\r\n/g, "\n").split("\n");
  let end = lines.length;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    const nextLine = lines[index + 1]?.trim() || "";
    if (
      /^On .+ wrote:$/i.test(line) ||
      /^Le .+ a écrit\s*:$/i.test(line) ||
      (/^Le .+ a$/i.test(line) && /^écrit\s*:$/i.test(nextLine)) ||
      /^(From|De)\s*:/i.test(line) ||
      /^-{2,}\s*(Original Message|Message d'origine)\s*-{2,}$/i.test(line)
    ) {
      end = index;
      break;
    }
  }

  return lines
    .slice(0, end)
    .filter((line) => !line.trimStart().startsWith(">"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 20_000);
}

export function normalizeReplyBody(value: string | null | undefined) {
  return (value || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function getEventStatus(metadata: Prisma.JsonValue | null) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }
  const status = (metadata as Record<string, unknown>).status;
  return typeof status === "string" ? status : null;
}

function safeError(error: unknown) {
  if (!(error instanceof Error)) return "Erreur inconnue";
  return error.message.replace(/\s+/g, " ").slice(0, 240);
}

async function claimInboundMessage(outboundEmailId: string, messageId: string) {
  const providerEventId = `imap:${crypto
    .createHash("sha256")
    .update(messageId)
    .digest("hex")}`;
  const existing = await prisma.outreachEvent.findUnique({
    where: { providerEventId },
  });

  if (existing) {
    const status = getEventStatus(existing.metadata);
    const stale = Date.now() - existing.createdAt.getTime() > 5 * 60_000;
    if (status !== "failed" && !(status === "processing" && stale)) {
      return null;
    }
    return prisma.outreachEvent.update({
      where: { id: existing.id },
      data: {
        metadata: { status: "processing", retriedAt: new Date().toISOString() },
      },
    });
  }

  try {
    return await prisma.outreachEvent.create({
      data: {
        emailId: outboundEmailId,
        type: "INBOUND_RECEIVED",
        provider: "imap",
        providerEventId,
        metadata: { status: "processing" },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return null;
    }
    throw error;
  }
}

async function findOutboundEmail(parsed: ParsedEmail) {
  const threadIds = collectThreadMessageIds({
    inReplyTo: parsed.inReplyTo,
    references: parsed.references,
  });
  if (threadIds.length === 0) return null;
  const storedMessageIds = Array.from(
    new Set(threadIds.flatMap(messageIdVariants)),
  );

  return prisma.email.findFirst({
    where: {
      direction: "outbound",
      messageId: { in: storedMessageIds },
      status: { notIn: ["draft", "failed"] },
    },
    orderBy: { sentAt: "desc" },
  });
}

export async function syncMailbox({
  maxCandidates = DEFAULT_MAX_CANDIDATES,
  maxReplies = DEFAULT_MAX_REPLIES,
}: {
  maxCandidates?: number;
  maxReplies?: number;
} = {}): Promise<MailboxSyncResult> {
  const config = getMailboxConfig();
  const result: MailboxSyncResult = {
    checked: 0,
    matched: 0,
    imported: 0,
    analyzed: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.pass },
    logger: false,
    disableAutoIdle: true,
    connectionTimeout: 10_000,
    greetingTimeout: 8_000,
    socketTimeout: 30_000,
    maxLiteralSize: MAX_MESSAGE_BYTES,
    maxResponseSize: MAX_MESSAGE_BYTES + 250_000,
  });

  try {
    await client.connect();
    await client.mailboxOpen("INBOX", { readOnly: true });
    const since = new Date(
      Date.now() - DEFAULT_LOOKBACK_DAYS * 24 * 60 * 60 * 1_000,
    );
    const searchResult = await client.search({ since }, { uid: true });
    const uids = Array.isArray(searchResult)
      ? searchResult.slice(-Math.max(1, Math.min(maxCandidates, 100)))
      : [];

    if (uids.length === 0) return result;

    for await (const message of client.fetch(
      uids,
      {
        uid: true,
        envelope: true,
        source: { maxLength: MAX_MESSAGE_BYTES },
      },
      { uid: true },
    )) {
      result.checked += 1;
      if (!message.source) {
        result.skipped += 1;
        continue;
      }

      let claimId: string | null = null;
      try {
        const parsed = await PostalMime.parse(message.source, {
          maxHeadersSize: 64_000,
          maxNestingDepth: 30,
          maxRfc822NestingDepth: 2,
        });
        const messageId = normalizeMessageId(
          parsed.messageId || message.envelope?.messageId,
        );
        if (!messageId) {
          result.skipped += 1;
          continue;
        }

        const outbound = await findOutboundEmail(parsed);
        if (!outbound) {
          result.skipped += 1;
          continue;
        }
        result.matched += 1;

        const existingInbound = await prisma.email.findFirst({
          where: { direction: "inbound", messageId },
        });
        if (existingInbound?.status === "replied") {
          const claim = await claimInboundMessage(outbound.id, messageId);
          if (claim) {
            await prisma.outreachEvent.update({
              where: { id: claim.id },
              data: {
                metadata: {
                  status: "processed",
                  inboundEmailId: existingInbound.id,
                  deduplicated: true,
                  processedAt: new Date().toISOString(),
                },
              },
            });
          }
          result.skipped += 1;
          continue;
        }

        const replyContent = extractReplyText(parsed.text);
        if (!replyContent) throw new Error("Le contenu de la réponse est vide");

        const historicalCandidates = await prisma.email.findMany({
          where: {
            direction: "inbound",
            status: "replied",
            ...(outbound.mailThreadId
              ? { mailThreadId: outbound.mailThreadId }
              : outbound.prospectId
                ? {
                    prospectId: outbound.prospectId,
                    companyId: outbound.companyId,
                  }
                : { companyId: "__no_match__" }),
          },
          select: { id: true, body: true, messageId: true },
          orderBy: { createdAt: "desc" },
          take: 20,
        });
        const historicalDuplicate = historicalCandidates.find(
          (candidate) =>
            normalizeReplyBody(candidate.body) === normalizeReplyBody(replyContent),
        );
        if (historicalDuplicate) {
          const claim = await claimInboundMessage(outbound.id, messageId);
          if (claim) {
            await prisma.$transaction([
              prisma.email.update({
                where: { id: historicalDuplicate.id },
                data: { messageId },
              }),
              prisma.outreachEvent.update({
                where: { id: claim.id },
                data: {
                  metadata: {
                    status: "processed",
                    inboundEmailId: historicalDuplicate.id,
                    deduplicated: true,
                    processedAt: new Date().toISOString(),
                  },
                },
              }),
            ]);
          }
          result.skipped += 1;
          continue;
        }

        const claim = await claimInboundMessage(outbound.id, messageId);
        if (!claim) {
          result.skipped += 1;
          continue;
        }
        claimId = claim.id;

        const parsedDate = parsed.date ? new Date(parsed.date) : null;
        const receivedAt =
          parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate
            : new Date();
        const inbound =
          existingInbound ||
          (await prisma.email.create({
            data: {
              prospectId: outbound.prospectId,
              companyId: outbound.companyId,
              contactId: outbound.contactId,
              sendingIdentityId: outbound.sendingIdentityId,
              mailThreadId: outbound.mailThreadId,
              type: "reply",
              direction: "inbound",
              provider: "imap",
              subject: parsed.subject || `Re: ${outbound.subject}`,
              body: replyContent,
              status: "received",
              repliedAt: receivedAt,
              messageId,
            },
          }));
        if (!existingInbound) result.imported += 1;

        const processed = await processInboundReply({
          outboundEmailId: outbound.id,
          replyContent,
          provider: "imap",
          messageId,
          subject: parsed.subject,
          receivedAt,
          inboundEmailId: inbound.id,
          source: "mailbox",
        });
        result.analyzed += 1;

        await prisma.outreachEvent.update({
          where: { id: claim.id },
          data: {
            metadata: {
              status: "processed",
              inboundEmailId: processed.inboundEmailId,
              sentiment: processed.analysis.sentiment,
              category: processed.analysis.category,
              urgency: processed.analysis.urgency,
              processedAt: new Date().toISOString(),
            },
          },
        });

        if (result.analyzed >= Math.max(1, Math.min(maxReplies, 20))) break;
      } catch (error) {
        const message = safeError(error);
        result.failed += 1;
        result.errors.push(message);
        if (claimId) {
          await prisma.outreachEvent
            .update({
              where: { id: claimId },
              data: {
                metadata: {
                  status: "failed",
                  error: message,
                  failedAt: new Date().toISOString(),
                },
              },
            })
            .catch(() => undefined);
        }
      }
    }

    if (result.imported > 0 || result.failed > 0) {
      await prisma.activityLog.create({
        data: {
          type: "mailbox_sync",
          message:
            result.failed > 0
              ? `Boîte synchronisée : ${result.analyzed} réponse(s) analysée(s), ${result.failed} échec(s)`
              : `Boîte synchronisée : ${result.analyzed} nouvelle(s) réponse(s) analysée(s)`,
          metadata: {
            checked: result.checked,
            matched: result.matched,
            imported: result.imported,
            analyzed: result.analyzed,
            skipped: result.skipped,
            failed: result.failed,
          },
        },
      });
    }

    return result;
  } finally {
    if (client.usable) await client.logout().catch(() => undefined);
  }
}
