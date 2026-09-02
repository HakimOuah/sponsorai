import type { Company } from "@prisma/client";
import type { UserAccess } from "@/lib/auth/access";
import type { EnrichResult } from "@/lib/agents/enrichisseur";
import { isUsableEmailStatus } from "@/lib/agents/contact-quality";
import { companyContactUpdate } from "./company-primary";
import { enrichmentProgress } from "./progress";
import { visibleContact, visibleDiagnostics } from "./visibility";
import type { CompanyEnrichmentLease } from "./enrichment-lease";
import type { ContactCandidate, ContactDiscoveryDiagnostic, ContactSearchOptions, PublicContactSummary } from "./types";

export type EnrichmentDependencies = {
  getAccess: () => Promise<UserAccess>;
  findCompany: (id: string) => Promise<Company | null>;
  enrich: (company: Company, log: (message: string) => void, options: ContactSearchOptions) => Promise<EnrichResult>;
  persist: (companyId: string, contacts: ContactCandidate[], options: { includePrivate: boolean; rejectedEmails?: string[] }) => Promise<PublicContactSummary[]>;
  updateCompany: (companyId: string, data: NonNullable<ReturnType<typeof companyContactUpdate>>) => Promise<unknown>;
  recordActivity: (activity: { companyId: string; message: string; decisionMakers: number; usableEmails: number; diagnostics: ContactDiscoveryDiagnostic[] }) => Promise<unknown>;
  reportError: (context: { companyId: string; aborted: boolean }) => void;
  acquireLease?: (companyId: string) => Promise<CompanyEnrichmentLease | null>;
  releaseLease?: (lease: CompanyEnrichmentLease) => Promise<unknown>;
  isLeaseHeld?: (lease: CompanyEnrichmentLease) => Promise<boolean>;
};

/** The same HTTP/SSE flow is exercised with isolated providers in contract tests. */
export function createEnrichmentHandler(
  deps: EnrichmentDependencies,
  timing = { deadlineMs: 255_000, abortMs: 265_000, heartbeatMs: 15_000 },
) {
  return async function handleEnrichment(request: Request): Promise<Response> {
    const access = await deps.getAccess();
    if (!access.authenticated) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (!access.canOperate) return Response.json({ error: "Votre compte est en mode découverte." }, { status: 403 });
    const input = await request.json().catch(() => null);
    const companyId = input?.companyId;
    if (typeof companyId !== "string" || !companyId.trim() || companyId.length > 200) {
      return Response.json({ error: "companyId required" }, { status: 400 });
    }
    const company = await deps.findCompany(companyId);
    if (!company) return Response.json({ error: "Company not found" }, { status: 404 });

    let lease: CompanyEnrichmentLease | null = null;
    if (deps.acquireLease) {
      try {
        lease = await deps.acquireLease(companyId);
      } catch {
        return Response.json({ error: "La recherche ne peut pas être démarrée pour le moment. Aucun appel fournisseur n’a été lancé." }, { status: 503 });
      }
      if (!lease) return Response.json({ error: "Une recherche de contacts est déjà en cours pour cette entreprise. Les résultats seront disponibles dans sa fiche." }, { status: 409 });
    }

    const abort = new AbortController();
    const onDisconnect = () => abort.abort();
    if (request.signal.aborted) abort.abort();
    request.signal.addEventListener("abort", onDisconnect, { once: true });
    const encoder = new TextEncoder();
    let closed = false;
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: Record<string, unknown>) => {
          if (closed) return;
          try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)); }
          catch { closed = true; abort.abort(); }
        };
        let progress = 5;
        const log = (message: string) => {
          const stage = enrichmentProgress(message);
          progress = Math.max(progress, stage.progress);
          send({ type: "log", message: stage.detail, progress });
        };
        const heartbeat = setInterval(() => send({ type: "heartbeat" }), timing.heartbeatMs);
        const timer = setTimeout(() => abort.abort(), timing.abortMs);
        try {
          abort.signal.throwIfAborted();
          const result = await deps.enrich(company, log, { signal: abort.signal, deadline: Date.now() + timing.deadlineMs });
          abort.signal.throwIfAborted();
          if (lease && (lease.expiresAt <= Date.now() || (deps.isLeaseHeld && !await deps.isLeaseHeld(lease)))) {
            throw new Error("Enrichment lease expired");
          }
          const stored = await deps.persist(companyId, result.contacts, {
            includePrivate: access.isAdmin,
            rejectedEmails: result.rejectedEmails,
          });
          // Enforce privacy again at the HTTP boundary, even if a persistence adapter changes.
          const publicContacts = stored.map((contact) => visibleContact(contact, access.isAdmin));
          const usableEmails = publicContacts.filter((contact) => isUsableEmailStatus(contact.contactability)).length;
          const decisionMakers = publicContacts.filter((contact) => contact.kind !== "company_mailbox").length;
          const bestContact = result.contacts.find((contact) => contact.email && isUsableEmailStatus(contact.email_status)) || result.contacts[0];
          const update = companyContactUpdate(company, bestContact, result.rejectedEmails);
          if (update) await deps.updateCompany(companyId, update);
          log("Contacts consolidés dans la fiche entreprise");
          await deps.recordActivity({
            companyId,
            message: `Enrichissement terminé pour ${company.name} — ${decisionMakers} décideur(s), ${usableEmails} email(s) exploitable(s)`,
            decisionMakers,
            usableEmails,
            diagnostics: visibleDiagnostics(result.diagnostics, false),
          });
          send({
            type: "done",
            result: {
              contacts: publicContacts,
              insights: access.isAdmin ? result.company_insights : `${decisionMakers} décideur(s) identifié(s) · ${usableEmails} email(s) exploitable(s). Les coordonnées restent protégées ; l’envoi nécessite votre validation.`,
              diagnostics: visibleDiagnostics(result.diagnostics, access.isAdmin),
              canViewContactDetails: access.isAdmin,
            },
          });
        } catch {
          deps.reportError({ companyId, aborted: abort.signal.aborted });
          send({ type: "error", message: abort.signal.aborted
            ? "Le délai de recherche est écoulé. Consultez les contacts déjà enregistrés avant de relancer."
            : "L’enrichissement n’a pas pu être terminé. Consultez les contacts déjà enregistrés avant de relancer." });
        } finally {
          clearInterval(heartbeat);
          clearTimeout(timer);
          request.signal.removeEventListener("abort", onDisconnect);
          // A release failure leaves the bounded lease in place rather than
          // exposing provider errors or allowing duplicate concurrent billing.
          if (lease && deps.releaseLease) {
            try { await deps.releaseLease(lease); }
            catch { deps.reportError({ companyId, aborted: abort.signal.aborted }); }
          }
          if (!closed) { closed = true; controller.close(); }
        }
      },
      cancel() { closed = true; abort.abort(); },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "private, no-store, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  };
}
