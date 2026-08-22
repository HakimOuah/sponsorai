export function redactRecipientIdentity(
  value: string,
  recipientName?: string | null,
): string {
  const normalizedName = recipientName?.trim();
  if (!normalizedName) return value;

  const parts = normalizedName.split(/\s+/).filter(Boolean);
  const firstName = parts[0];
  const variants = Array.from(
    new Set(
      [normalizedName, firstName, parts.at(-1)]
        .filter((part): part is string => Boolean(part && part.length >= 3))
        .sort((a, b) => b.length - a.length),
    ),
  );

  let redacted = value;
  for (const variant of variants) {
    const escaped = escapeRegExp(variant);
    redacted = redacted.replace(
      new RegExp(
        `(Bonjour|Bonsoir|Hello|Dear)\\s+${escaped}(?=\\s*[,!])`,
        "giu",
      ),
      "$1",
    );
    redacted = redacted.replace(
      new RegExp(
        `(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`,
        "giu",
      ),
      "le contact concerné",
    );
  }

  return redacted;
}

export function redactContactIntelligence(
  value: string,
  contactNames: Array<string | null | undefined> = [],
): string {
  let redacted = value.replace(
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
    "coordonnée protégée",
  );

  for (const contactName of contactNames) {
    redacted = redactRecipientIdentity(redacted, contactName);
  }

  return redacted;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
