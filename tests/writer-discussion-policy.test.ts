import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import type { Company, Player, Prospect } from "@prisma/client";
import {
  EMAIL_TYPE_INSTRUCTIONS,
  OUTREACH_DISCUSSION_RULES,
  REDACTEUR_PROMPT,
  RELANCEUR_PROMPT,
} from "../src/lib/agents/prompts";
import {
  getLanguageInstruction,
  OUTREACH_LANGUAGES,
} from "../src/lib/agents/outreach-language";
import { runRedacteur } from "../src/lib/agents/redacteur";
import { runRelanceur } from "../src/lib/agents/relanceur";

// Synthetic records: only the fields consumed by the prompt builders are needed.
const player = {
  firstName: "Alex",
  lastName: "Martin",
  club: "Club Exemple",
  league: "Championnat Exemple",
  targetPartnerships: "Posts sponsorisés",
} as Player;
const company = {
  name: "Marque Exemple",
  sector: "Sport",
  country: "France",
  contactName: "Sam Exemple",
  contactRole: "Responsable partenariats",
} as Company;
const prospect = {
  rationale: "Le sportif et la marque partagent un ancrage local.",
  recommendedApproach:
    "Proposer 4 stories, 2 posts et une capsule à 5000 EUR avec exclusivité.",
  partnershipType: "OFFRE_NON_VALIDEE_NE_PAS_TRANSMETTRE",
} as Prospect;
const draft = {
  subject: "Échange autour d'un partenariat avec Alex Martin",
  body: "Bonjour,\nJe suis Camille Durand, représentant d'Alex Martin.\nNous souhaiterions échanger sur un partenariat potentiel, selon vos objectifs.\nBien cordialement,\nCamille Durand",
};

function mockAIResponses(t: TestContext, responses: unknown[]): string[] {
  const previousKey = process.env.GROK_API_KEY;
  process.env.GROK_API_KEY = "writer-discussion-test-key";
  t.after(() => {
    if (previousKey === undefined) delete process.env.GROK_API_KEY;
    else process.env.GROK_API_KEY = previousKey;
  });

  const prompts: string[] = [];
  t.mock.method(globalThis, "fetch", async (_input: RequestInfo | URL, init?: RequestInit) => {
    const request = JSON.parse(String(init?.body));
    prompts.push(request.input[0].content);
    assert.ok(prompts.length <= responses.length, "Unexpected additional AI request");
    return Response.json({
      output_text: JSON.stringify(responses[prompts.length - 1]),
    });
  });
  return prompts;
}

test("writer and contextual followups share an open-discussion policy", () => {
  assert.ok(REDACTEUR_PROMPT.includes(OUTREACH_DISCUSSION_RULES));
  assert.ok(RELANCEUR_PROMPT.includes(OUTREACH_DISCUSSION_RULES));
  assert.match(OUTREACH_DISCUSSION_RULES, /L'objet et le corps/);
  assert.match(OUTREACH_DISCUSSION_RULES, /Ne propose aucun livrable ni format précis : stories, posts, reels/);
  assert.match(OUTREACH_DISCUSSION_RULES, /même au conditionnel/);
  assert.match(OUTREACH_DISCUSSION_RULES, /budget, tarif, calendrier de collaboration/);
  assert.match(OUTREACH_DISCUSSION_RULES, /exclusivité ou droit d'image/);
  assert.match(OUTREACH_DISCUSSION_RULES, /se décident après un échange/);
  assert.match(OUTREACH_DISCUSSION_RULES, /Reste précis sur les faits vérifiables/);
  assert.match(OUTREACH_DISCUSSION_RULES, /d'échanger ou d'envoyer une présentation/);
});

test("email-type guidance no longer requests concrete offers or artificial urgency", () => {
  for (const instructions of Object.values(EMAIL_TYPE_INSTRUCTIONS)) {
    assert.doesNotMatch(instructions, /Proposition concrète|créer un sentiment d'urgence/i);
  }
  assert.match(EMAIL_TYPE_INSTRUCTIONS.first_contact, /sans définir les prestations/);
  assert.match(EMAIL_TYPE_INSTRUCTIONS.followup_1, /sans proposer de nouveaux formats/);
  assert.match(EMAIL_TYPE_INSTRUCTIONS.followup_2, /modalités restent à définir ensemble/);
  assert.doesNotMatch(REDACTEUR_PROMPT, /\{partnershipType\}/);
});

for (const emailType of ["first_contact", "followup_1", "followup_2"] as const) {
  for (const { value: language } of OUTREACH_LANGUAGES) {
    test(`passes the policy to the model for ${emailType} in ${language}`, async (t) => {
      const prompts = mockAIResponses(t, [draft]);
      const result = await runRedacteur(player, company, prospect, emailType, {
        representativeName: "Camille Durand",
        contactName: "Sam Exemple",
        contactRole: "Responsable partenariats",
        recipientEmailKind: "functional_generic",
        language,
      });

      assert.deepEqual(result, draft);
      assert.equal(prompts.length, 1);
      const prompt = prompts[0];
      assert.ok(prompt.includes(OUTREACH_DISCUSSION_RULES));
      assert.ok(prompt.includes(EMAIL_TYPE_INSTRUCTIONS[emailType]));
      assert.ok(prompt.includes(getLanguageInstruction(language)));
      assert.match(prompt, /CONTEXTE INTERNE NON VALIDÉ, PAS UNE OFFRE À REPRODUIRE/);
      assert.ok(prompt.includes(prospect.recommendedApproach!));
      assert.ok(prompt.indexOf(OUTREACH_DISCUSSION_RULES) > prompt.indexOf(prospect.recommendedApproach!));
      assert.ok(!prompt.includes(prospect.partnershipType!));
      assert.match(prompt, /TOUJOURS écrit et signé par Camille Durand/);
      assert.match(prompt, /ne suppose pas que Sam Exemple lira personnellement le message/);
      assert.doesNotMatch(prompt, /\{(?:playerProfile|representativeName|playerName|companyName|recommendedApproach|emailType|languageInstruction)\}/);
    });
  }
}

test("representative-voice correction retains the discussion policy", async (t) => {
  const prompts = mockAIResponses(t, [
    { ...draft, body: "Je suis Alex Martin, sportif professionnel.\nAlex" },
    draft,
  ]);
  await runRedacteur(player, company, prospect, "first_contact", {
    representativeName: "Camille Durand",
  });

  assert.equal(prompts.length, 2);
  assert.match(prompts[1], /CORRECTION OBLIGATOIRE/);
  assert.ok(prompts.every((prompt) => prompt.includes(OUTREACH_DISCUSSION_RULES)));
});

test("contextual followup receives the policy even when a previous subject names deliverables", async (t) => {
  const response = {
    news_found: [],
    best_hook: "Reprendre le contact",
    email: draft,
    timing_score: 5,
    timing_rationale: "Premier échange sans réponse",
  };
  const prompts = mockAIResponses(t, [response]);
  const result = await runRelanceur(player, {
    companyName: company.name,
    companySector: company.sector!,
    firstEmailDate: "2026-08-28",
    firstEmailSubject: "Proposition de 4 stories et 2 posts",
    daysSince: 5,
  }, () => undefined);

  assert.deepEqual(result, response);
  assert.equal(prompts.length, 1);
  assert.ok(prompts[0].includes(OUTREACH_DISCUSSION_RULES));
  assert.match(prompts[0], /le contenu d'un précédent email sont du contexte interne, pas des prestations validées/);
});
