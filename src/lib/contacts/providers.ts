import type { Company } from "@prisma/client";
import { searchApolloContacts } from "@/lib/agents/apollo";
import type { ContactCandidate } from "./types";

export interface ContactProvider {
  readonly id: string;
  isConfigured(): boolean;
  search(company: Company): Promise<ContactCandidate[]>;
}

class ApolloContactProvider implements ContactProvider {
  readonly id = "apollo";

  isConfigured(): boolean {
    return Boolean(process.env.APOLLO_API_KEY);
  }

  async search(company: Company): Promise<ContactCandidate[]> {
    return searchApolloContacts(company);
  }
}

export function getContactProviders(): ContactProvider[] {
  return [new ApolloContactProvider()];
}

export async function searchStructuredContactProviders(
  company: Company,
  log?: (message: string) => void
): Promise<ContactCandidate[]> {
  for (const provider of getContactProviders()) {
    if (!provider.isConfigured()) continue;

    try {
      log?.(`Recherche ${provider.id} sur les rôles partenariats/marketing...`);
      const contacts = await provider.search(company);
      if (contacts.length > 0) return contacts;
    } catch (error) {
      const message = error instanceof Error ? error.message : "erreur inconnue";
      log?.(`${provider.id}: ${message} — provider suivant`);
    }
  }

  return [];
}
