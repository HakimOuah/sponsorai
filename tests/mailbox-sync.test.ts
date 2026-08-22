import assert from "node:assert/strict";
import test from "node:test";
import {
  collectThreadMessageIds,
  extractReplyText,
  messageIdVariants,
  normalizeReplyBody,
  normalizeMessageId,
} from "../src/lib/email/mailbox-sync";

test("normalizes SMTP message identifiers without duplicating brackets", () => {
  assert.equal(normalizeMessageId("abc@example.com"), "<abc@example.com>");
  assert.equal(normalizeMessageId(" <abc@example.com> "), "<abc@example.com>");
  assert.equal(normalizeMessageId(""), null);
  assert.deepEqual(messageIdVariants("<abc@example.com>"), [
    "<abc@example.com>",
    "abc@example.com",
  ]);
});

test("collects In-Reply-To and References identifiers for strict thread matching", () => {
  assert.deepEqual(
    collectThreadMessageIds({
      inReplyTo: "<latest@vectis.agency>",
      references: "<first@vectis.agency> <latest@vectis.agency>",
    }),
    ["<latest@vectis.agency>", "<first@vectis.agency>"],
  );
});

test("extracts the new French reply and removes quoted Gmail history", () => {
  const reply = extractReplyText(`Bonjour,

Oui, cette proposition nous intéresse. Pouvez-vous me rappeler demain ?

Le ven. 22 août 2026 à 09:12, Vectis Agency a
écrit :
> Bonjour,
> Voici notre proposition.
`);

  assert.equal(
    reply,
    "Bonjour,\n\nOui, cette proposition nous intéresse. Pouvez-vous me rappeler demain ?",
  );
});

test("extracts the new English reply before the quoted message", () => {
  const reply = extractReplyText(`Thanks, let's schedule a call.

On Fri, Aug 22, 2026 at 9:12 AM Vectis Agency wrote:
> Initial message
`);

  assert.equal(reply, "Thanks, let's schedule a call.");
});

test("normalizes equivalent historical reply bodies for migration deduplication", () => {
  assert.equal(
    normalizeReplyBody("Bonjour,  \r\n\r\nOui, intéressé.\r\n"),
    normalizeReplyBody("Bonjour,\n\nOui, intéressé."),
  );
});
