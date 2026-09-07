// Explicit operational smoke test: LinkedIn only, no email/provider enrichment.
import { config } from "dotenv";
import { prisma } from "../../src/lib/prisma";
import { requestLinkedinJob } from "../../src/lib/contacts/linkedin-worker-store";
import { selectDirectContacts } from "../../src/lib/contacts/linkedin-direct";
config({ path: ".env.production.local", quiet: true });
async function main() {
  if (!process.argv.includes("--production")) throw new Error("Explicit --production required");
  const heartbeat = await prisma.activityLog.findUnique({ where: { id: "linkedin-direct-worker" } });
  console.log({ heartbeat: heartbeat?.metadata });
  const started = Date.now();
  const url = "https://www.linkedin.com/company/air-up";
  const result = await requestLinkedinJob(url, "operational-smoke-air-up", { deadline: Date.now()+160_000 });
  const accepted = selectDirectContacts(result, url, "operational-smoke-air-up");
  console.log({ status: result.status, accepted: accepted.map(p => ({ name: p.name, role: p.role })), seconds: (Date.now()-started)/1000 });
  if (!accepted.length) process.exitCode = 1;
}
main().catch((error) => { console.log({ error: error.name }); process.exitCode = 1; }).finally(() => prisma.$disconnect());
