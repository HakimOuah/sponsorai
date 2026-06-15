import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runRedacteur } from "@/lib/agents/redacteur";
import { runEnrichisseur } from "@/lib/agents/enrichisseur";
import { canSendOutreach, isUsableEmailStatus } from "@/lib/agents/contact-quality";

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
    let company = prospect.company;

    if (!canSendOutreach(company)) {
      const enrichment = await runEnrichisseur(company, () => undefined);
      const bestContact = enrichment.contacts[0];

      if (bestContact) {
        await prisma.company.update({
          where: { id: company.id },
          data: {
            contactName: bestContact.name || company.contactName,
            contactRole: bestContact.role || company.contactRole,
            contactEmail:
              bestContact.email && isUsableEmailStatus(bestContact.email_status)
                ? bestContact.email
                : company.contactEmail,
            contactLinkedin: bestContact.linkedin || company.contactLinkedin,
            contactVerificationStatus: bestContact.verification_status,
            contactEmailStatus: bestContact.email ? bestContact.email_status : "missing",
            contactRoleRelevance: bestContact.role_relevance || "medium",
            contactEvidence: bestContact.evidence,
            contactSource: bestContact.source,
            outreachReady: Boolean(
              bestContact.email && isUsableEmailStatus(bestContact.email_status)
            ),
          },
        });

        const refreshedCompany = await prisma.company.findUnique({
          where: { id: company.id },
        });
        if (refreshedCompany) company = refreshedCompany;
      }
    }

    if (!canSendOutreach(company)) {
      return NextResponse.json(
        {
          error:
            "Aucun contact actuel avec email vérifié/public n'a été trouvé. Lancez l'Enrichisseur ou ajoutez un email qualifié.",
        },
        { status: 409 }
      );
    }

    const generated = await runRedacteur(
      prospect.player,
      company,
      prospect,
      emailType as "first_contact" | "followup_1" | "followup_2"
    );

    // Save as draft email
    const email = await prisma.email.create({
      data: {
        prospectId: prospect.id,
        companyId: company.id,
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
        message: `Email ${emailType} généré pour ${company.name}`,
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
