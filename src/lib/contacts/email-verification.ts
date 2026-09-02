import { asObject } from "./monid-client";

/** Provider labels alone never override a negative or inconclusive SMTP check. */
export function isDeliverableHunterEmail(output: unknown, expectedEmail: string): boolean {
  const data = asObject(asObject(output).data);
  return typeof data.email === "string" && data.email.trim().toLowerCase() === expectedEmail.toLowerCase() &&
    data.status === "valid" && data.result === "deliverable" &&
    data.accept_all === false && data.smtp_check === true &&
    data.mx_records === true && data.smtp_server === true && data.block !== true &&
    typeof data.score === "number" && data.score >= 80;
}
