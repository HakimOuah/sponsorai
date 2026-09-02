import { setTimeout as delay } from "node:timers/promises";
import type { ContactSearchOptions } from "./types";

const API_URL = "https://api.monid.ai";
const ENDPOINTS = {
  employees: { provider: "apify", endpoint: "/harvestapi/linkedin-company-employees" },
  findEmail: { provider: "hunterio", endpoint: "/email-finder" },
  verifyEmail: { provider: "hunterio", endpoint: "/email-verifier" },
  apolloSearch: { provider: "apollo", endpoint: "/mixed_people/api_search" },
  apolloMatch: { provider: "apollo", endpoint: "/people/match" },
} as const;

type Operation = keyof typeof ENDPOINTS;
type JsonObject = Record<string, unknown>;
type Price = { type?: string; amount?: unknown; flatFee?: unknown; default?: unknown; tiers?: unknown };
const APOLLO_EMAIL_ONLY = { reveal_personal_emails: false, reveal_phone_number: false } as const;

export class MonidError extends Error {
  constructor(readonly code: "configuration" | "budget" | "timeout" | "provider" | "response") {
    const messages = {
      configuration: "Monid n’est pas configuré ou sa clé n’est pas autorisée.",
      budget: "La limite de coût Monid a été atteinte ; les résultats déjà obtenus sont conservés.",
      timeout: "Le délai de recherche Monid est écoulé ; les résultats déjà obtenus sont conservés.",
      provider: "Une source Monid est indisponible. Aucun nouvel appel payant n’a été relancé automatiquement.",
      response: "La réponse Monid n’a pas pu être validée.",
    };
    super(messages[code]);
    this.name = "MonidError";
  }
}

export interface MonidRunResult {
  output: unknown;
  runId: string;
  costUsd: number | null;
  notFound: boolean;
}

export interface MonidReceipt {
  operation: Operation;
  runId?: string;
  reservedUsd: number;
  costUsd: number | null;
}

/** Server-only, narrowly scoped adapter: it cannot execute arbitrary paid endpoints. */
export class MonidClient {
  private readonly key: string;
  private readonly deadline: number;
  private readonly signal?: AbortSignal;
  private readonly maxCostUsd: number;
  private readonly prices = new Map<Operation, Promise<Price>>();
  private reservedUsd = 0;
  private unavailable = false;
  private readonly failedOperations = new Set<Operation>();
  readonly receipts: MonidReceipt[] = [];

  constructor(options: ContactSearchOptions & { apiKey?: string; maxCostUsd?: number } = {}) {
    if (typeof window !== "undefined") throw new MonidError("configuration");
    this.key = options.apiKey ?? process.env.MONID_API_KEY?.trim() ?? "";
    if (!this.key) throw new MonidError("configuration");
    this.signal = options.signal;
    this.deadline = Math.min(options.deadline ?? Infinity, Date.now() + 150_000);
    const configured = options.maxCostUsd ?? Number(process.env.MONID_ENRICHMENT_MAX_USD || "0.50");
    this.maxCostUsd = Number.isFinite(configured) && configured > 0
      ? Math.min(2, configured)
      : 0.50;
  }

  get usage() {
    return {
      reservedUsd: Math.round(this.reservedUsd * 1_000_000) / 1_000_000,
      costUsd: this.receipts.every((receipt) => receipt.costUsd !== null)
        ? Math.round(this.receipts.reduce((sum, receipt) => sum + (receipt.costUsd ?? 0), 0) * 1_000_000) / 1_000_000
        : null,
    };
  }

  async employees(companyLinkedinUrl: string): Promise<MonidRunResult> {
    return this.execute("employees", {
      body: {
        companies: [companyLinkedinUrl],
        profileScraperMode: "Full ($8 per 1k)",
        maxItems: 5,
        takePages: 1,
        companyBatchMode: "all_at_once",
        jobTitles: ["Sponsoring", "Sponsorship", "Partnerships", "Partenariats", "Brand", "Marketing", "Communication"],
      },
    }, 5);
  }

  async findEmail(name: string, domain: string): Promise<MonidRunResult> {
    return this.execute("findEmail", {
      queryParams: { domain, full_name: name, max_duration: 10 },
    }, 1);
  }

  async verifyEmail(email: string): Promise<MonidRunResult> {
    return this.execute("verifyEmail", { queryParams: { email } }, 1);
  }

  async searchApolloPeople(domain: string, titles: readonly string[]): Promise<MonidRunResult> {
    return this.execute("apolloSearch", {
      queryParams: {
        "person_titles[]": titles,
        "person_seniorities[]": ["head", "director", "manager", "vp", "c_suite"],
        "q_organization_domains_list[]": [domain],
        "contact_email_status[]": ["verified"],
        include_similar_titles: false,
        page: 1,
        per_page: 10,
      },
    }, 10);
  }

  async matchApolloPerson(id: string): Promise<MonidRunResult> {
    return this.execute("apolloMatch", { queryParams: { id, ...APOLLO_EMAIL_ONLY } }, 1);
  }

  /** Free catalog/auth check. Does not execute a search or reveal a contact. */
  async checkApolloAccess(): Promise<void> {
    const [search, match] = await Promise.all([this.inspectPrice("apolloSearch"), this.inspectPrice("apolloMatch")]);
    estimateMonidCost(search, 10);
    estimateMonidCost(match, 1, { queryParams: APOLLO_EMAIL_ONLY });
  }

  private assertAvailable(operation?: Operation) {
    if (this.signal?.aborted || Date.now() >= this.deadline) throw new MonidError("timeout");
    if (this.unavailable || (operation && this.failedOperations.has(operation))) throw new MonidError("provider");
  }

  private inspectPrice(operation: Operation): Promise<Price> {
    this.assertAvailable(operation);
    let price = this.prices.get(operation);
    if (!price) {
      price = this.request("POST", "/v1/inspect", ENDPOINTS[operation])
        .then((response) => response.price as Price);
      this.prices.set(operation, price);
    }
    return price;
  }

  private async execute(operation: Operation, input: JsonObject, limit: number): Promise<MonidRunResult> {
    this.assertAvailable(operation);
    // Inspect is free. Fail closed if the price model changes or cannot be bounded.
    const reservation = estimateMonidCost(await this.inspectPrice(operation), limit, operation === "apolloMatch" ? input : undefined);
    this.assertAvailable(operation);
    if (this.reservedUsd + reservation > this.maxCostUsd + 0.000001) throw new MonidError("budget");
    // No await between checking and reserving: parallel contact lookups share one cap.
    this.reservedUsd += reservation;
    const receipt: MonidReceipt = { operation, reservedUsd: reservation, costUsd: null };
    this.receipts.push(receipt);
    let runId: string | undefined;
    let terminal = false;
    try {
      // Never retry a paid POST: an ambiguous network error may already be billed.
      let run = await this.request("POST", "/v1/run", { ...ENDPOINTS[operation], input });
      if (typeof run.runId !== "string" || !/^[A-Za-z0-9_-]{1,100}$/.test(run.runId)) {
        throw new MonidError("response");
      }
      runId = run.runId;
      receipt.runId = runId;
      while (run.status === "RUNNING" || run.status === "READY") {
        this.assertAvailable();
        await delay(Math.min(1500, Math.max(1, this.deadline - Date.now())), undefined, { signal: this.signal });
        run = await this.request("GET", `/v1/runs/${encodeURIComponent(runId)}`);
      }
      terminal = true;
      receipt.costUsd = readMonidCost(run);
      // Preserve this result, but do not start another call if its charge is unknown.
      if (receipt.costUsd === null) this.unavailable = true;
      if (run.status !== "COMPLETED") throw new MonidError("provider");
      const providerStatus = asObject(run.providerResponse).httpStatus;
      if (providerStatus === 404) return { output: null, runId, costUsd: receipt.costUsd, notFound: true };
      if (typeof providerStatus !== "number" || providerStatus < 200 || providerStatus >= 300) {
        throw new MonidError("provider");
      }
      return { output: run.output, runId, costUsd: receipt.costUsd, notFound: false };
    } catch (error) {
      // A definitive provider failure may fall back to another operation. An
      // ambiguous charge must stop the entire shared client, including Apollo.
      this.failedOperations.add(operation);
      if (!terminal || receipt.costUsd === null) this.unavailable = true;
      if (runId && !terminal) await this.stop(runId);
      if (error instanceof MonidError) throw error;
      throw new MonidError(this.signal?.aborted || Date.now() >= this.deadline ? "timeout" : "provider");
    }
  }

  private async request(method: "GET" | "POST", path: string, body?: JsonObject): Promise<JsonObject> {
    this.assertAvailable();
    try {
      const response = await fetch(`${API_URL}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json", "X-Monid-Client": "sponsorai" },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.any([
          AbortSignal.timeout(Math.max(1, Math.min(35_000, this.deadline - Date.now()))),
          ...(this.signal ? [this.signal] : []),
        ]),
      });
      if (!response.ok) {
        // Provider errors can contain the request (including private coordinates).
        await response.body?.cancel();
        if ([401, 403].includes(response.status)) throw new MonidError("configuration");
        throw new MonidError("provider");
      }
      return asObject(await response.json());
    } catch (error) {
      if (error instanceof MonidError) throw error;
      throw new MonidError(this.signal?.aborted || Date.now() >= this.deadline ? "timeout" : "provider");
    }
  }

  private async stop(runId: string) {
    try {
      const response = await fetch(`${API_URL}/v1/runs/${encodeURIComponent(runId)}/stop`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}` },
        signal: AbortSignal.timeout(3000),
        cache: "no-store",
        redirect: "error",
      });
      await response.body?.cancel();
    } catch { /* Best effort only; an upstream call may already have completed. */ }
  }
}

export function asObject(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function dollars(value: unknown): number | null {
  const money = asObject(value);
  if (money.currency !== "USD" || typeof money.value !== "number" || !Number.isFinite(money.value) || money.value < 0) return null;
  if (money.unit === "MICRO_DOLLAR") return money.value / 1_000_000;
  if (money.unit && money.unit !== "DOLLAR") return null;
  return money.value;
}

export function estimateMonidCost(price: Price | undefined, limit: number, apolloInput?: JsonObject): number {
  if (price?.type === "TIERED") {
    const flags = asObject(apolloInput?.queryParams);
    // Only Apollo's inspected, explicitly disabled add-ons are supported. Never
    // assume a new tier, output-dependent fee or unspecified flag is free.
    if (flags.reveal_personal_emails !== false || flags.reveal_phone_number !== false ||
        !Array.isArray(price.tiers) || price.tiers.length === 0 || price.flatFee !== undefined) throw new MonidError("budget");
    for (const raw of price.tiers) {
      const conditions = Object.entries(asObject(asObject(raw).when));
      if (conditions.length !== 1 || !Object.hasOwn(APOLLO_EMAIL_ONLY, conditions[0][0]) ||
          ![true, "true"].includes(conditions[0][1] as boolean | string)) throw new MonidError("budget");
    }
    const base = asObject(price.default);
    if (base.type !== "PER_CALL") throw new MonidError("budget");
    return estimateMonidCost(base as Price, 1);
  }
  if (!price || !["PER_RESULT", "PER_CALL"].includes(price.type || "")) throw new MonidError("budget");
  const amount = dollars(price.amount);
  const flatFee = price.flatFee === undefined ? 0 : dollars(price.flatFee);
  if (amount === null || flatFee === null) throw new MonidError("budget");
  return Math.ceil((amount * (price.type === "PER_RESULT" ? limit : 1) + flatFee) * 1_000_000) / 1_000_000;
}

export function readMonidCost(run: JsonObject): number | null {
  return dollars(run.cost) ?? dollars(asObject(run.billing).reportedCost);
}
