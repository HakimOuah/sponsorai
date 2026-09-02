import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runRedacteur } from "@/lib/agents/redacteur";
import { runEnrichisseur } from "@/lib/agents/enrichisseur";
import { companyContactUpdate } from "@/lib/contacts/company-primary";
import {
  canDraftForContact,
  canSendOutreach,
  isUsableEmailStatus,
} from "@/lib/agents/contact-quality";
import { persistContactCandidates } from "@/lib/contacts/persistence";
import {
  isOutreachLanguage,
  suggestOutreachLanguage,
} from "@/lib/agents/outreach-language";
import { getCurrentUserAccess } from "@/lib/auth/access";

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

  const { prospectId, emailType, contactId, language } = await request.json();

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
    const requestedContactId = contactId || prospect.selectedContactId;
    const selectedContact = requestedContactId
      ? await prisma.contact.findFirst({
          where: {
            id: requestedContactId,
            companyId: company.id,
          },
          include: {
            contactEmails: {
              where: { status: { in: ["verified", "public_source"] } },
              orderBy: [{ isPrimary: "desc" }, { verifiedAt: "desc" }],
              take: 1,
            },
          },
        })
      : null;

    if (
      requestedContactId &&
      (!selectedContact || !canDraftForContact(selectedContact))
    ) {
      return NextResponse.json(
        {
          error:
            "Ce décideur n’est pas vérifié comme étant actuellement en poste.",
        },
        { status: 409 },
      );
    }

    if (!selectedContact && !canSendOutreach(company)) {
      const enrichment = await runEnrichisseur(company, () => undefined, {
        signal: request.signal,
        deadline: Date.now() + 120_000,
      });
      const bestContact =
        enrichment.contacts.find(
          (contact) =>
            contact.email && isUsableEmailStatus(contact.email_status),
        ) || enrichment.contacts[0];
      await persistContactCandidates(company.id, enrichment.contacts, { rejectedEmails: enrichment.rejectedEmails });

      const contactUpdate = companyContactUpdate(company, bestContact, enrichment.rejectedEmails);
      if (contactUpdate) {
        await prisma.company.update({
          where: { id: company.id },
          data: contactUpdate,
        });

        const refreshedCompany = await prisma.company.findUnique({
          where: { id: company.id },
        });
        if (refreshedCompany) company = refreshedCompany;
      }
    }

    if (!selectedContact && !canSendOutreach(company)) {
      return NextResponse.json(
        {
          error:
            "Aucun contact actuel avec email vérifié/public n'a été trouvé. Lancez l'Enrichisseur ou ajoutez un email qualifié.",
        },
        { status: 409 }
      );
    }

    if (selectedContact) {
      await prisma.prospect.update({
        where: { id: prospect.id },
        data: { selectedContactId: selectedContact.id },
      });
    }

    const selectedLanguage = isOutreachLanguage(language)
      ? language
      : suggestOutreachLanguage(company.country).language;

    const generated = await runRedacteur(
      prospect.player,
      company,
      prospect,
      emailType as "first_contact" | "followup_1" | "followup_2",
      {
        contactName: access.isAdmin
          ? selectedContact?.fullName
          : "Responsable partenariats",
        contactRole: selectedContact?.roleRaw,
        language: selectedLanguage,
        representativeName: access.userName,
        recipientEmailKind: classifyRecipientEmail(
          selectedContact ? selectedContact.contactEmails[0]?.email : company.contactEmail,
          selectedContact ? selectedContact.contactEmails[0]?.evidence : company.contactEvidence,
        ),
      },
    );

    // Save as draft email
    const email = await prisma.email.create({
      data: {
        prospectId: prospect.id,
        companyId: company.id,
        contactId: selectedContact?.id || null,
        type: emailType,
        subject: generated.subject,
        body: generated.body,
        status: "draft",
        templateVersion: `redacteur-v2:${emailType}:${selectedLanguage}`,
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
        language: selectedLanguage,
        contact: selectedContact
          ? {
              id: selectedContact.id,
              role: selectedContact.roleRaw,
              score: selectedContact.contactScore,
              outreachReady: selectedContact.contactEmails.length > 0,
            }
          : null,
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

function classifyRecipientEmail(
  email?: string | null,
  evidence?: string | null,
): "personal_professional" | "functional_generic" | "unknown" {
  if (!email) return "unknown";
  if (evidence?.toLowerCase().includes("boîte fonctionnelle")) {
    return "functional_generic";
  }

  const localPart = email.split("@")[0]?.toLowerCase() || "";
  return /^(contact|info|hello|marketing|communication|communications|partnerships|partenariats|sponsoring|sponsorship|press|presse|media)([._-]|$)/.test(
    localPart,
  )
    ? "functional_generic"
    : "personal_professional";
}
