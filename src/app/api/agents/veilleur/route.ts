import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAccess } from "@/lib/auth/access";
import { processInboundReply } from "@/lib/email/process-inbound-reply";

export async function POST(request: NextRequest) {
  const access = await getCurrentUserAccess();
  if (!access.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!access.canOperate) {
    return NextResponse.json(
      { error: "Votre compte est en mode découverte." },
      { status: 403 },
    );
  }

  const { emailId, replyContent } = await request.json();

  if (!emailId || !replyContent) {
    return NextResponse.json(
      { error: "emailId and replyContent required" },
      { status: 400 }
    );
  }

  try {
    const result = await processInboundReply({
      outboundEmailId: emailId,
      replyContent,
      source: "manual",
    });

    return NextResponse.json({
      success: true,
      analysis: result.analysis,
      logs: result.logs,
    });
  } catch (error) {
    console.error("Veilleur error:", error);
    if (error instanceof Error && error.message === "Outbound email not found") {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to analyze reply" },
      { status: 500 }
    );
  }
}
