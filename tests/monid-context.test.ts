import assert from "node:assert/strict";
import test from "node:test";
import type { Company } from "@prisma/client";
import { canonicalLinkedinUrl, mailboxPriority, resolveCompanyContactContext } from "../src/lib/contacts/company-context";
import { isOfficialUrl, isPublicAddress, parseOfficialHtml } from "../src/lib/contacts/official-sources";

const company = { id: "acme", name: "Acme France", website: "https://acme.fr", country: "France" } as Company;

test("company resolution uses an observed group email domain rather than assuming the website domain", async () => {
  const visited: string[] = [];
  const context = await resolveCompanyContactContext(company, {}, {
    research: async () => ({
      linkedin_company_url: "https://fr.linkedin.com/company/acme-france",
      source_urls: ["https://acme.fr/presse"],
      email_domain_evidence: [{ example_email: "presse@acme-group.com", source_url: "https://acme.fr/presse", excerpt: "Contacts presse Acme : presse@acme-group.com" }],
    }),
    readDocument: async (url) => {
      visited.push(url);
      return parseOfficialHtml(url.endsWith("/presse")
        ? "<p>Contacts presse Acme : presse@acme-group.com</p>"
        : '<a href="https://www.linkedin.com/company/acme-france">LinkedIn</a><a href="mailto:contact@acme.fr">Contact</a>', url);
    },
  });
  assert.equal(context.companyLinkedinUrl, "https://www.linkedin.com/company/acme-france");
  assert.deepEqual(context.emailDomains.map((item) => item.domain), ["acme-group.com", "acme.fr"]);
  assert.deepEqual(context.mailboxes.map((item) => item.email), ["presse@acme-group.com", "contact@acme.fr"]);
  assert.ok(visited.length <= 6);
});

test("AI suggestions are not evidence: reject unobserved aliases, fabricated mailboxes and ambiguous LinkedIn pages", async () => {
  const context = await resolveCompanyContactContext(company, {}, {
    research: async () => ({
      linkedin_company_url: "https://www.linkedin.com/company/unrelated-acme",
      source_urls: ["https://evil.example/contacts", "http://169.254.169.254/latest/meta-data"],
      email_domain_evidence: [{ example_email: "fake@unrelated.com", source_url: "https://acme.fr", excerpt: "Fake Acme contact fake@unrelated.com" }],
    }),
    readDocument: async (url) => {
      assert.equal(url, "https://acme.fr");
      return parseOfficialHtml('<a href="https://linkedin.com/company/acme-parent">Parent</a><a href="https://linkedin.com/company/acme-services">Services</a>', url);
    },
  });
  assert.equal(context.companyLinkedinUrl, null);
  assert.deepEqual(context.mailboxes, []);
  assert.deepEqual(context.emailDomains.map((item) => item.domain), ["acme.fr"]);
});

test("an inaccessible page remains missing rather than an invented contact address", async () => {
  const context = await resolveCompanyContactContext(company, {}, { research: async () => ({}), readDocument: async () => null });
  assert.equal(context.companyLinkedinUrl, null);
  assert.equal(context.mailboxes.length, 0);
});

test("an official redirect preserves evidence under the final source URL", async () => {
  const context = await resolveCompanyContactContext(company, {}, {
    research: async () => ({ email_domain_evidence: [{ example_email: "presse@acme-group.com", source_url: "https://acme.fr/press", excerpt: "Contacts presse Acme : presse@acme-group.com" }] }),
    readDocument: async (url) => url.endsWith("/press")
      ? parseOfficialHtml("Contacts presse Acme : presse@acme-group.com", "https://www.acme.fr/actualites/presse")
      : parseOfficialHtml("Acme France", url),
  });
  assert.equal(context.emailDomains[0].domain, "acme-group.com");
  assert.equal(context.emailDomains[0].source, "https://www.acme.fr/actualites/presse");
});

test("official-source URL and DNS checks block SSRF and spoofed domains", () => {
  for (const url of ["http://acme.fr", "https://acme.fr.evil.example", "https://acme.fr@evil.example", "file:///etc/passwd", "https://acme.fr:8443", "https://127.0.0.1", "https://localhost"]) {
    assert.equal(isOfficialUrl(url, "acme.fr"), false, url);
  }
  assert.equal(isOfficialUrl("https://corporate.acme.fr/contact", "acme.fr"), true);
  for (const ip of ["127.0.0.1", "10.0.0.2", "169.254.169.254", "100.64.0.1", "172.16.1.1", "192.168.1.1", "::1", "::ffff:127.0.0.1", "fe80::1", "fd00::1", "2002:7f00:1::", "2001:db8::1"]) {
    assert.equal(isPublicAddress(ip), false, ip);
  }
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
  assert.equal(canonicalLinkedinUrl("https://linkedin.com.evil.example/company/acme", "company"), null);
  assert.equal(canonicalLinkedinUrl("https://linkedin.com/in/acme", "company"), null);
});

test("mailbox discovery extracts published addresses, not guessed aliases or support inboxes", () => {
  const doc = parseOfficialHtml('<script>const email="fake@acme.fr"</script><a href="mailto:contact&#64;acme.fr">Contact</a><p>partenariats@acme.fr</p>', "https://acme.fr/contact");
  assert.deepEqual(doc.emails, ["partenariats@acme.fr", "contact@acme.fr"]);
  assert.equal(mailboxPriority("partenariats@acme.fr"), 4);
  assert.equal(mailboxPriority("contact@acme.fr"), 1);
  for (const email of ["support@acme.fr", "sav@acme.fr", "abuse@acme.fr", "mode.paiement@acme.fr", "network@acme.fr", "jobs@acme.fr"]) assert.equal(mailboxPriority(email), 0);
});
