import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runEnrichisseur } from "@/lib/agents/enrichisseur";
import { isUsableEmailStatus } from "@/lib/agents/contact-quality";
import { persistContactCandidates } from "@/lib/contacts/persistence";
import { getCurrentUserAccess } from "@/lib/auth/access";
import { redactContactIntelligence } from "@/lib/privacy/contact-redaction";

export async function POST(request: NextRequest) {
  const access = await getCurrentUserAccess();
  if (!access.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { companyId } = await request.json();

  if (!companyId) {
    return NextResponse.json(
      { error: "companyId required" },
      { status: 400 }
    );
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    return NextResponse.json(
      { error: "Company not found" },
      { status: 404 }
    );
  }

  // SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      };

      const log = (message: string, type: string = "info") => {
        send({ type: "log", message, logType: type });
      };

      try {
        const result = await runEnrichisseur(company, log);
        const publicContacts = await persistContactCandidates(
          companyId,
          result.contacts,
          { includePrivate: access.isAdmin },
        );
        const usableEmails = result.contacts.filter(
          (contact) =>
            contact.email && isUsableEmailStatus(contact.email_status),
        ).length;

        // Update company only with a contact verified as currently working there.
        const bestContact =
          result.contacts.find(
            (contact) =>
              contact.email && isUsableEmailStatus(contact.email_status),
          ) || result.contacts[0];
        if (bestContact) {
          const updateData: Record<string, string | boolean | null> = {};

          if (bestContact.name && !company.contactName) {
            updateData.contactName = bestContact.name;
          }
          if (bestContact.role && !company.contactRole) {
            updateData.contactRole = bestContact.role;
          }
          if (
            bestContact.email &&
            isUsableEmailStatus(bestContact.email_status) &&
            !company.contactEmail
          ) {
            updateData.contactEmail = bestContact.email;
          }
          if (bestContact.linkedin && !company.contactLinkedin) {
            updateData.contactLinkedin = bestContact.linkedin;
          }
          updateData.contactVerificationStatus = bestContact.verification_status;
          updateData.contactEmailStatus = bestContact.email
            ? bestContact.email_status
            : "missing";
          updateData.contactRoleRelevance = bestContact.role_relevance || "medium";
          updateData.contactEvidence = [
            bestContact.evidence,
            bestContact.email_evidence ? `Email: ${bestContact.email_evidence}` : null,
            bestContact.email_candidates?.length
              ? `Candidats email non vérifiés: ${bestContact.email_candidates.join(", ")}`
              : null,
          ]
            .filter(Boolean)
            .join(" — ");
          updateData.contactSource = bestContact.source;
          updateData.outreachReady = Boolean(
            bestContact.email && isUsableEmailStatus(bestContact.email_status)
          );

          if (Object.keys(updateData).length > 0) {
            await prisma.company.update({
              where: { id: companyId },
              data: updateData,
            });
            log(
              bestContact.email && isUsableEmailStatus(bestContact.email_status)
                ? "Décideur et email exploitable mis à jour dans la fiche entreprise"
                : "Décideur identifié sans email exploitable : l’envoi reste bloqué",
              bestContact.email && isUsableEmailStatus(bestContact.email_status)
                ? "success"
                : "info",
            );
          }
        } else {
          log(
            "Aucun contact actuel suffisamment vérifié : la fiche entreprise n'a pas été modifiée",
            "info"
          );
        }

        // Log activity
        await prisma.activityLog.create({
          data: {
            type: "scan_completed",
            message: `Enrichissement terminé pour ${company.name} — ${result.contacts.length} décideur(s), ${usableEmails} email(s) exploitable(s)`,
            metadata: {
              companyId,
              decisionMakers: result.contacts.length,
              usableEmails,
              diagnostics: result.diagnostics.map((diagnostic) => ({
                ...diagnostic,
              })),
            },
          },
        });

        send({
          type: "done",
          result: {
            contacts: publicContacts,
            insights: access.isAdmin
              ? result.company_insights
              : redactContactIntelligence(
                  result.company_insights,
                  result.contacts.map((contact) => contact.name),
                ),
            diagnostics: result.diagnostics,
            canViewContactDetails: access.isAdmin,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error("[enrichisseur] failed", { companyId, message });
        send({ type: "error", message });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
