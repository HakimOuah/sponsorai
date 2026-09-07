import { timingSafeEqual } from "node:crypto";
import { pollLinkedinJob, finishLinkedinJob, validateDirectResult } from "@/lib/contacts/linkedin-worker-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  const token = process.env.LINKEDIN_WORKER_TOKEN || "";
  const received = request.headers.get("authorization") || "";
  const expected = `Bearer ${token}`;
  if (token.length < 32 || Buffer.byteLength(received) !== Buffer.byteLength(expected) || !timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  try {
    const text = await request.text();
    if (text.length > 25_000) return Response.json({ error: "Too large" }, { status: 413, headers });
    const body = JSON.parse(text);
    if (body.action === "poll" && typeof body.ready === "boolean") {
      return Response.json({ job: await pollLinkedinJob(body.ready && process.env.LINKEDIN_DIRECT_ENABLED === "true") }, { headers });
    }
    const result = validateDirectResult(body.result);
    if (body.action === "complete" && typeof body.id === "string" && /^linkedin-direct:[a-f0-9-]{36}$/.test(body.id) &&
      typeof body.claim === "string" && /^[a-f0-9-]{36}$/.test(body.claim) && result) {
      return Response.json({ accepted: await finishLinkedinJob(body.id, body.claim, result) }, { headers });
    }
    return Response.json({ error: "Invalid request" }, { status: 400, headers });
  } catch {
    return Response.json({ error: "Worker temporarily unavailable" }, { status: 503, headers });
  }
}
