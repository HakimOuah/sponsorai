import type { Company, Deal, Email, LearningEvent, Prisma, PrismaClient, Prospect } from "@prisma/client";
import type { SendOutreachDependencies } from "../../src/lib/email/send-outreach";

const timestamp = new Date("2026-09-01T10:00:00Z");

export function createOutreachDb() {
  let state = {
    emails: {
      "email-1": {
        id: "email-1", companyId: "company-1", prospectId: "prospect-1",
        status: "sent", direction: "outbound", type: "first_contact", sentAt: timestamp,
        subject: "Partnership proposal", body: "I represent Test Athlete.",
        messageId: "<original@example.test>", provider: "smtp", sendingIdentityId: null,
        mailThreadId: null, contactId: null,
      } as Email,
    } as Record<string, Email>,
    company: {
      id: "company-1", name: "Test Brand", contactEmail: "partnerships@example.test",
      contactEmailStatus: "verified", contactVerificationStatus: "verified_current", outreachReady: true,
    } as Company,
    prospect: {
      id: "prospect-1", playerId: "player-1", companyId: "company-1", status: "new",
      partnershipType: "ambassador", outreachApprovedAt: timestamp, selectedContactId: null,
      createdAt: timestamp,
    } as Prospect,
    deal: null as Deal | null,
    attribution: null as Record<string, unknown> | null,
    dealEvents: [] as Array<Record<string, unknown>>,
    outreachEvents: [] as Array<Record<string, unknown>>,
    activities: [] as Array<Record<string, unknown>>,
    threads: [] as Array<Record<string, unknown>>,
    learning: [] as unknown[],
  };
  const failures: Error[] = [];
  let transactions = 0;
  const client = {
    email: {
      findUnique: async ({ where }: { where: { id: string } }) => {
        const email = state.emails[where.id];
        return email ? structuredClone({
          ...email, company: state.company,
          prospect: email.prospectId ? { ...state.prospect, selectedContact: null, player: {} } : null,
        }) : null;
      },
      update: async ({ where, data }: { where: { id: string }; data: Partial<Email> }) => {
        Object.assign(state.emails[where.id], data);
        return structuredClone(state.emails[where.id]);
      },
      updateMany: async ({ where, data }: {
        where: { id: string; status: string; direction?: string; sentAt: null };
        data: Partial<Email>;
      }) => {
        const email = state.emails[where.id];
        if (!email || email.status !== where.status || email.sentAt !== null ||
          (where.direction && email.direction !== where.direction)) return { count: 0 };
        Object.assign(email, data);
        return { count: 1 };
      },
    },
    prospect: {
      updateMany: async ({ where, data }: { where: { id: string; status: string }; data: Partial<Prospect> }) => {
        if (state.prospect.id !== where.id || state.prospect.status !== where.status) return { count: 0 };
        Object.assign(state.prospect, data);
        return { count: 1 };
      },
    },
    deal: {
      findUnique: async () => state.deal ? structuredClone({ ...state.deal, prospect: state.prospect }) : null,
      upsert: async ({ create }: { create: Partial<Deal> }) => {
        if (!state.deal) state.deal = {
          id: "deal-1", origin: "sponsorai", closedAt: null, value: null, currency: "EUR",
          notes: null, nextAction: null, nextActionDate: null, ...create,
        } as Deal;
        return structuredClone(state.deal);
      },
      updateMany: async ({ where, data }: { where: { id: string; stage: string; closedAt: null }; data: Partial<Deal> }) => {
        if (!state.deal || state.deal.id !== where.id || state.deal.stage !== where.stage || state.deal.closedAt !== null) return { count: 0 };
        Object.assign(state.deal, data);
        return { count: 1 };
      },
    },
    attributionRecord: {
      findUnique: async () => structuredClone(state.attribution),
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (state.attribution) throw new Error("Duplicate attribution");
        state.attribution = structuredClone(data);
        return structuredClone(data);
      },
    },
    dealEvent: {
      upsert: async ({ where, create }: { where: { immutableKey: string }; create: Record<string, unknown> }) => {
        const existing = state.dealEvents.find((event) => event.immutableKey === where.immutableKey);
        if (existing) return existing;
        state.dealEvents.push(structuredClone(create));
        return create;
      },
    },
    outreachEvent: { create: async ({ data }: { data: Record<string, unknown> }) => { state.outreachEvents.push(data); return data; } },
    activityLog: { create: async ({ data }: { data: Record<string, unknown> }) => { state.activities.push(data); return data; } },
    mailThread: {
      findUnique: async () => state.threads[0] ?? null,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const thread = { id: "thread-1", ...data };
        state.threads.push(thread);
        return thread;
      },
    },
  };
  let queue: Promise<unknown> = Promise.resolve();
  const db = {
    ...client,
    $transaction: <T>(callback: (tx: typeof client) => Promise<T>, options: { isolationLevel?: Prisma.TransactionIsolationLevel }) => {
      const run = queue.then(async () => {
        transactions++;
        if (options.isolationLevel !== "Serializable") throw new Error("Expected serializable transaction");
        const failure = failures.shift();
        if (failure) throw failure;
        const before = structuredClone(state);
        try { return await callback(client); }
        catch (error) { state = before; throw error; }
      });
      queue = run.catch(() => undefined);
      return run;
    },
  } as unknown as PrismaClient;
  const deps: SendOutreachDependencies = {
    db,
    resolveIdentity: async () => ({ id: null, provider: "smtp", email: "agent@example.test", displayName: "Test Representative" }),
    getProvider: () => ({ id: "smtp", send: async () => ({ provider: "smtp", accepted: true, messageId: "<sent@example.test>" }) }),
    recordLearning: async (input) => { state.learning.push(input); return {} as LearningEvent; },
  };
  return {
    db, deps, failures,
    get state() { return state; },
    get transactions() { return transactions; },
    draft() { Object.assign(state.emails["email-1"], { status: "draft", sentAt: null, messageId: null }); },
    existingDeal(stage: string) {
      state.deal = {
        id: "deal-1", playerId: "player-1", companyId: "company-1", prospectId: "prospect-1",
        stage, origin: "sponsorai", notes: "Keep these notes", nextAction: "Call the partner",
        value: 12000, currency: "EUR", dealType: "ambassador",
        closedAt: ["signed", "lost"].includes(stage) ? timestamp : null,
      } as Deal;
    },
  };
}
