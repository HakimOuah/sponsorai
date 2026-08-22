import assert from "node:assert/strict";
import test from "node:test";
import type { Company } from "@prisma/client";
import { searchApolloContacts } from "../src/lib/agents/apollo";

const company = {
  name: "Acme France",
  website: "https://acme.fr",
} as Company;

test("Apollo contact discovery", async (t) => {
  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.APOLLO_API_KEY;
  process.env.APOLLO_API_KEY = "test-key";

  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.APOLLO_API_KEY;
    else process.env.APOLLO_API_KEY = originalApiKey;
  });

  await t.test(
    "reveals a verified work email and keeps the Apollo identifier",
    async () => {
      const urls: string[] = [];
      globalThis.fetch = async (input) => {
        const url = String(input);
        urls.push(url);

        if (url.includes("mixed_people/api_search")) {
          return Response.json({
            people: [
              {
                id: "apollo-person-1",
                first_name: "Jane",
                last_name_obfuscated: "D***",
                title: "Head of Partnerships",
                has_email: true,
                organization: { name: "Acme France" },
              },
            ],
          });
        }

        return Response.json({
          total_requested_enrichments: 1,
          unique_enriched_records: 1,
          missing_records: 0,
          credits_consumed: 1,
          matches: [
            {
              id: "apollo-person-1",
              first_name: "Jane",
              last_name: "Doe",
              name: "Jane Doe",
              title: "Head of Partnerships",
              email: "jane.doe@acme-group.com",
              email_status: "verified",
              linkedin_url: "https://www.linkedin.com/in/jane-doe",
              organization: {
                name: "Acme France",
                primary_domain: "acme-group.com",
              },
            },
          ],
        });
      };

      const result = await searchApolloContacts(company);

      assert.equal(result.contacts.length, 1);
      assert.equal(result.contacts[0].email, "jane.doe@acme-group.com");
      assert.equal(result.contacts[0].providerExternalId, "apollo-person-1");
      assert.equal(result.contacts[0].email_status, "verified");
      assert.equal(
        result.diagnostics.find(
          (diagnostic) => diagnostic.stage === "email_enrichment",
        )?.creditsConsumed,
        1,
      );
      assert.match(urls[0], /contact_email_status%5B%5D=verified/);
      assert.match(urls[1], /people\/bulk_match/);
    },
  );

  await t.test(
    "reports a bulk enrichment permission failure without inventing a contact",
    async () => {
      globalThis.fetch = async (input) => {
        const url = String(input);
        if (url.includes("mixed_people/api_search")) {
          return Response.json({
            people: [
              {
                id: "apollo-person-2",
                first_name: "Sam",
                last_name_obfuscated: "M***",
                title: "Marketing Director",
                has_email: true,
                organization: { name: "Acme France" },
              },
            ],
          });
        }

        return Response.json(
          {
            error_code: "INSUFFICIENT_API_SCOPE",
            error_message: "Missing people_bulk_match scope",
          },
          { status: 403 },
        );
      };

      const result = await searchApolloContacts(company);

      assert.equal(result.contacts.length, 0);
      const diagnostic = result.diagnostics.find(
        (item) => item.stage === "email_enrichment",
      );
      assert.equal(diagnostic?.status, "failed");
      assert.match(diagnostic?.message || "", /403/);
      assert.match(diagnostic?.message || "", /INSUFFICIENT_API_SCOPE/);
    },
  );

  await t.test("does not spend a bulk request when Apollo has no email", async () => {
    let requestCount = 0;
    globalThis.fetch = async () => {
      requestCount += 1;
      return Response.json({
        people: [
          {
            id: "apollo-person-3",
            first_name: "Alex",
            last_name_obfuscated: "R***",
            title: "Communications Director",
            has_email: false,
            organization: { name: "Acme France" },
          },
        ],
      });
    };

    const result = await searchApolloContacts(company);

    assert.equal(requestCount, 1);
    assert.equal(result.contacts.length, 0);
    assert.equal(
      result.diagnostics.find(
        (diagnostic) => diagnostic.stage === "email_enrichment",
      )?.creditsConsumed,
      0,
    );
  });
});
