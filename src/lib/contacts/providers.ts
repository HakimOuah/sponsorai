import type { Company } from "@prisma/client";
import { searchMonidContacts } from "./monid";
import type {
  ContactDiscoveryDiagnostic,
  ContactProviderSearchResult,
  ContactSearchOptions,
} from "./types";

export interface ContactProvider {
  readonly id: "monid" | "apollo";
  isConfigured(): boolean;
  search(
    company: Company,
    log?: (message: string) => void,
    options?: ContactSearchOptions,
  ): Promise<ContactProviderSearchResult>;
}

class MonidContactProvider implements ContactProvider {
  readonly id = "monid";

  isConfigured(): boolean { return Boolean(process.env.MONID_API_KEY?.trim()); }

  search(company: Company, log?: (message: string) => void, options?: ContactSearchOptions) {
    return searchMonidContacts(company, log, options);
  }
}

export function getContactProviders(): ContactProvider[] {
  // Apollo is executed inside Monid so all paid operations share one budget.
  // An old APOLLO_API_KEY must never silently reactivate the direct subscription.
  return [new MonidContactProvider()];
}

export async function searchStructuredContactProviders(
  company: Company,
  log?: (message: string) => void,
  options: ContactSearchOptions = {},
  providers: ContactProvider[] = getContactProviders(),
): Promise<ContactProviderSearchResult> {
  const diagnostics: ContactDiscoveryDiagnostic[] = [];
  let partial: ContactProviderSearchResult | null = null;
  const rejectedEmails = new Set<string>();

  for (const provider of providers) {
    if (!provider.isConfigured()) {
      diagnostics.push({
        provider: provider.id,
        stage: "people_search",
        status: "failed",
        message: `${provider.id === "monid" ? "Monid" : "Apollo"} n’est pas configuré ; la source suivante est utilisée.`,
      });
      continue;
    }

    try {
      if (options.signal?.aborted || Date.now() >= (options.deadline ?? Infinity)) break;
      log?.(`Recherche ${provider.id} sur les rôles partenariats/marketing...`);
      const result = await provider.search(company, log, options);
      result.rejectedEmails?.forEach((email) => rejectedEmails.add(email));
      result.contacts = result.contacts.map((contact) => contact.email && rejectedEmails.has(contact.email.toLowerCase())
        ? { ...contact, email: null, email_status: "missing" }
        : contact);
      diagnostics.push(...result.diagnostics);
      if (result.contacts.length > 0) {
        if (result.contacts.some((contact) => contact.email && ["verified", "public_source"].includes(contact.email_status))) {
          return { ...result, diagnostics, rejectedEmails: Array.from(rejectedEmails) };
        }
        partial ??= result;
      }
    } catch {
      const message = `${provider.id === "monid" ? "Monid" : "Apollo"} est indisponible ; recherche de secours utilisée.`;
      log?.(`${provider.id}: ${message} — provider suivant`);
      diagnostics.push({
        provider: provider.id,
        stage: "people_search",
        status: "failed",
        message,
      });
    }
  }

  return { ...(partial || { contacts: [] }), diagnostics, rejectedEmails: Array.from(rejectedEmails) };
}
