import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runEnrichisseur } from "@/lib/agents/enrichisseur";

export async function POST(request: NextRequest) {
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

        // Update company only with a contact verified as currently working there.
        const bestContact = result.contacts[0];
        if (bestContact) {
          const updateData: Record<string, string | null> = {};

          if (bestContact.name && !company.contactName) {
            updateData.contactName = bestContact.name;
          }
          if (bestContact.role && !company.contactRole) {
            updateData.contactRole = bestContact.role;
          }
          if (bestContact.email && !company.contactEmail) {
            updateData.contactEmail = bestContact.email;
          }
          if (bestContact.linkedin && !company.contactLinkedin) {
            updateData.contactLinkedin = bestContact.linkedin;
          }

          if (Object.keys(updateData).length > 0) {
            await prisma.company.update({
              where: { id: companyId },
              data: updateData,
            });
            log("Contact vérifié mis à jour dans la fiche entreprise", "success");
          }
        } else {
          log(
            "Aucun contact actuel suffisamment vérifié : la fiche entreprise n'a pas été modifiée",
            "info"
          );
        }

        // Store additional verified contacts as notes if multiple found.
        if (result.contacts.length > 1) {
          const contactsText = result.contacts
            .map(
              (c, i) =>
                `${i + 1}. ${c.name} — ${c.role}${c.email ? ` (${c.email})` : ""}${c.linkedin ? ` [LinkedIn: ${c.linkedin}]` : ""} [${c.confidence}] — preuve: ${c.evidence}`
            )
            .join("\n");

          const existingNotes = company.notes || "";
          const newNotes = existingNotes
            ? `${existingNotes}\n\n--- Contacts enrichis ---\n${contactsText}`
            : `--- Contacts enrichis ---\n${contactsText}`;

          await prisma.company.update({
            where: { id: companyId },
            data: { notes: newNotes },
          });
        }

        // Log activity
        await prisma.activityLog.create({
          data: {
            type: "scan_completed",
            message: `Enrichissement terminé pour ${company.name} — ${result.contacts.length} contact(s) vérifié(s)`,
            metadata: { companyId, contacts: result.contacts.length },
          },
        });

        send({
          type: "done",
          result: {
            contacts: result.contacts,
            insights: result.company_insights,
          },
        });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
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
