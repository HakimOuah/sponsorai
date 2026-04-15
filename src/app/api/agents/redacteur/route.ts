import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runRedacteur } from "@/lib/agents/redacteur";

export async function POST(request: NextRequest) {
  const { prospectId, emailType } = await request.json();

  if (!prospectId || !emailType) {
    return NextResponse.json(
      { error: "prospectId and emailType required" },
      { status: 400 }
    );
  }

  const validTypes = ["first_contact", "followup_1", "followup_2"];
  if (!validTypes.includes(emailType)) {
    return NextResponse.json(
      { error: "Invalid emailType" },
      { status: 400 }
    );
  }

  const prospect = await prisma.prospect.findUnique({
    where: { id: prospectId },
    include: {
      player: true,
      company: true,
    },
  });

  if (!prospect) {
    return NextResponse.json(
      { error: "Prospect not found" },
      { status: 404 }
    );
  }

  try {
    const generated = await runRedacteur(
      prospect.player,
      prospect.company,
      prospect,
      emailType as "first_contact" | "followup_1" | "followup_2"
    );

    // Save as draft email
    const email = await prisma.email.create({
      data: {
        prospectId: prospect.id,
        companyId: prospect.companyId,
        type: emailType,
        subject: generated.subject,
        body: generated.body,
        status: "draft",
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        type: "email_sent",
        message: `Email ${emailType} généré pour ${prospect.company.name}`,
        metadata: {
          emailId: email.id,
          prospectId: prospect.id,
          emailType,
        },
      },
    });

    return NextResponse.json({
      success: true,
      email: {
        id: email.id,
        subject: generated.subject,
        body: generated.body,
      },
    });
  } catch (error) {
    console.error("Rédacteur error:", error);
    return NextResponse.json(
      { error: "Failed to generate email" },
      { status: 500 }
    );
  }
}
