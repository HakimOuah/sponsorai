import { NextResponse } from "next/server";
import { getCurrentUserAccess } from "@/lib/auth/access";
import { syncMailbox } from "@/lib/email/mailbox-sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function safeResult(result: Awaited<ReturnType<typeof syncMailbox>>) {
  return {
    checked: result.checked,
    matched: result.matched,
    imported: result.imported,
    analyzed: result.analyzed,
    skipped: result.skipped,
    failed: result.failed,
  };
}

export async function POST() {
  const access = await getCurrentUserAccess();
  if (!access.authenticated) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!access.canOperate) {
    return NextResponse.json({ error: "Accès en lecture seule" }, { status: 403 });
  }

  try {
    return NextResponse.json(safeResult(await syncMailbox()));
  } catch (error) {
    console.error("Mailbox sync failed", error);
    return NextResponse.json(
      { error: "La relève de la boîte mail a échoué" },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");
  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  try {
    return NextResponse.json(safeResult(await syncMailbox()));
  } catch (error) {
    console.error("Scheduled mailbox sync failed", error);
    return NextResponse.json(
      { error: "La relève programmée a échoué" },
      { status: 500 },
    );
  }
}
