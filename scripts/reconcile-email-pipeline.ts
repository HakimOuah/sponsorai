import { createHash } from "node:crypto";
import { prisma } from "../src/lib/prisma";
import { dealStageAfterOutreach, hasRecordedOutboundSend, syncSentEmailToPipeline } from "../src/lib/email/pipeline-sync";

function parseArgs(args: string[]) {
  const emailIds: string[] = [];
  let apply = false;
  for (let index = 0; index < args.length; index++) {
    if (args[index] === "--apply") apply = true;
    else if (args[index] === "--email-id" && /^[a-zA-Z0-9_-]{1,200}$/.test(args[index + 1] || "")) {
      emailIds.push(args[++index]);
    } else throw new Error("Usage: tsx scripts/reconcile-email-pipeline.ts --email-id ID [--email-id ID] [--apply]");
  }
  if (!emailIds.length) throw new Error("At least one explicit --email-id is required. Dry-run is the default.");
  return { emailIds: Array.from(new Set(emailIds)), apply };
}

const snapshotSelect = {
  id: true, companyId: true, status: true, direction: true, type: true,
  sentAt: true, messageId: true, subject: true, body: true, updatedAt: true,
  _count: { select: { outreachEvents: true } },
  prospect: { select: { id: true, status: true, deal: { select: { id: true, stage: true, closedAt: true } } } },
} as const;

async function main() {
  const { emailIds, apply } = parseArgs(process.argv.slice(2));
  const result = [];
  for (const emailId of emailIds) {
    const before = await prisma.email.findUnique({ where: { id: emailId }, select: snapshotSelect });
    if (!before) throw new Error(`Email not found: ${emailId}`);
    const targetStage = before.prospect ? dealStageAfterOutreach(before.prospect.status) : null;
    const plan = !hasRecordedOutboundSend(before) ? "not_sent"
      : !before.prospect ? "no_prospect"
      : !before.prospect.deal ? "create"
      : before.prospect.deal.stage === "lead" && !before.prospect.deal.closedAt ? "advance_lead"
      : "unchanged";
    const reconciliation = apply ? await syncSentEmailToPipeline(emailId) : null;
    const after = apply
      ? await prisma.email.findUniqueOrThrow({ where: { id: emailId }, select: snapshotSelect })
      : before;
    const fingerprint = (email: typeof before) => createHash("sha256").update(JSON.stringify({
      status: email.status, sentAt: email.sentAt, messageId: email.messageId,
      subject: email.subject, body: email.body, updatedAt: email.updatedAt,
      outreachEvents: email._count.outreachEvents,
    })).digest("hex");
    const emailUnchanged = fingerprint(before) === fingerprint(after);
    if (!emailUnchanged) throw new Error(`Email changed concurrently; inspect before retrying: ${emailId}`);
    result.push({
      emailId, status: before.status, sentAt: before.sentAt, plan,
      previousStage: before.prospect?.deal?.stage ?? null, targetStage,
      reconciliation, emailUnchanged,
    });
  }
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", results: result }, null, 2));
}

main().catch((error: unknown) => {
  // Never print database URLs, email bodies or contact details on an admin CLI.
  console.error(error instanceof Error && !error.name.startsWith("Prisma") ? error.message : "Database reconciliation failed; inspect database availability.");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
