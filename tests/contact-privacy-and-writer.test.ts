import test from "node:test";
import assert from "node:assert/strict";
import {
  redactContactIntelligence,
  redactRecipientIdentity,
} from "../src/lib/privacy/contact-redaction";
import { usesRepresentativeVoice } from "../src/lib/agents/redacteur";
import {
  COMPANY_MAILBOX_PROMPT,
  REDACTEUR_PROMPT,
} from "../src/lib/agents/prompts";

test("redacts a recipient identity from copy shown to client users", () => {
  const redacted = redactRecipientIdentity(
    "Bonjour Mohammed,\n\nMohammed El Idrissi peut transmettre ce dossier.",
    "Mohammed El Idrissi",
  );

  assert.doesNotMatch(redacted, /Mohammed|El Idrissi/i);
  assert.match(redacted, /^Bonjour,/);
});

test("accepts representative voice and rejects athlete impersonation", () => {
  const compliant =
    "Bonjour,\nJe suis Hakim Ouahabi, représentant de Souheil Kaouchen.\n\nBien cordialement,\nHakim Ouahabi";
  const impersonation =
    "Bonjour,\nJe suis Souheil Kaouchen, combattant professionnel.\n\nSouheil";

  assert.equal(
    usesRepresentativeVoice(compliant, "Hakim Ouahabi", "Souheil Kaouchen"),
    true,
  );
  assert.equal(
    usesRepresentativeVoice(
      impersonation,
      "Hakim Ouahabi",
      "Souheil Kaouchen",
    ),
    false,
  );
});

test("redacts addresses and decision-maker names from client-facing insights", () => {
  const redacted = redactContactIntelligence(
    "Mohammed El Idrissi est joignable via sponsoring@orange.ma.",
    ["Mohammed El Idrissi"],
  );

  assert.doesNotMatch(redacted, /Mohammed|El Idrissi|sponsoring@orange\.ma/i);
  assert.match(redacted, /coordonnée protégée/);
});

test("writer and mailbox prompts encode the non-bypass safeguards", () => {
  assert.match(REDACTEUR_PROMPT, /TOUJOURS écrit et signé/);
  assert.match(REDACTEUR_PROMPT, /deal réaliste/);
  assert.match(REDACTEUR_PROMPT, /L'objet ne doit pas contenir le nom/);
  assert.match(COMPANY_MAILBOX_PROMPT, /page officielle/);
  assert.match(COMPANY_MAILBOX_PROMPT, /Ne construis jamais une adresse/);
});
