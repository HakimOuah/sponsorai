import type { Company } from "@prisma/client";
import { searchApolloContacts } from "@/lib/agents/apollo";
import type {
  ContactDiscoveryDiagnostic,
  ContactProviderSearchResult,
} from "./types";

export interface ContactProvider {
  readonly id: string;
  isConfigured(): boolean;
  search(
    company: Company,
    log?: (message: string) => void,
  ): Promise<ContactProviderSearchResult>;
}

class ApolloContactProvider implements ContactProvider {
  readonly id = "apollo";

  isConfigured(): boolean {
    return Boolean(process.env.APOLLO_API_KEY);
  }

  async search(
    company: Company,
    log?: (message: string) => void,
  ): Promise<ContactProviderSearchResult> {
    return searchApolloContacts(company, log);
  }
}

export function getContactProviders(): ContactProvider[] {
  return [new ApolloContactProvider()];
}

export async function searchStructuredContactProviders(
  company: Company,
  log?: (message: string) => void
): Promise<ContactProviderSearchResult> {
  const diagnostics: ContactDiscoveryDiagnostic[] = [];

  for (const provider of getContactProviders()) {
    if (!provider.isConfigured()) {
      diagnostics.push({
        provider: "apollo",
        stage: "people_search",
        status: "failed",
        message: "Apollo n’est pas configuré ; recherche publique utilisée.",
      });
      continue;
    }

    try {
      log?.(`Recherche ${provider.id} sur les rôles partenariats/marketing...`);
      const result = await provider.search(company, log);
      diagnostics.push(...result.diagnostics);
      if (result.contacts.length > 0) {
        return { contacts: result.contacts, diagnostics };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "erreur inconnue";
      log?.(`${provider.id}: ${message} — provider suivant`);
      diagnostics.push({
        provider: "apollo",
        stage: "people_search",
        status: "failed",
        message,
      });
    }
  }

  return { contacts: [], diagnostics };
}
