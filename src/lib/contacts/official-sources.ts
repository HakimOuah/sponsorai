import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import type { ContactSearchOptions } from "./types";

export interface OfficialDocument {
  url: string;
  text: string;
  links: string[];
  emails: string[];
}

export function isOfficialUrl(value: string, domain: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && !url.username && !url.password &&
      (!url.port || url.port === "443") && !isIP(host) &&
      (host === domain || host.endsWith(`.${domain}`)) &&
      !/(^|\.)(localhost|local|internal|test|invalid)$/.test(host);
  } catch { return false; }
}

export function isPublicAddress(address: string): boolean {
  if (isIP(address) === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && (b === 168 || b === 0 || (b === 88 && c === 99))) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 198 && [18, 19, 51].includes(b)) || (a === 203 && b === 0));
  }
  if (isIP(address) === 6) {
    // Only global unicast; reject mapped IPv4, loopback, ULA, multicast and link-local.
    return /^2[0-9a-f]{3}:/i.test(address) &&
      !/^2001:(?:0:|db8:|10:|20:)/i.test(address) && !/^2002:/i.test(address);
  }
  return false;
}

/** Fetch only the company domain, pin DNS and revalidate every redirect (SSRF boundary). */
export async function readOfficialDocument(
  value: string,
  domain: string,
  options: ContactSearchOptions = {},
): Promise<OfficialDocument | null> {
  if (!isOfficialUrl(value, domain)) return null;
  const timeout = Math.max(1, Math.min(10_000, (options.deadline ?? Infinity) - Date.now()));
  const signal = AbortSignal.any([AbortSignal.timeout(timeout), ...(options.signal ? [options.signal] : [])]);
  try {
    const result = await download(value, domain, signal, 0);
    if (!result) return null;
    if (result.type.includes("pdf") || result.body.subarray(0, 5).toString() === "%PDF-") {
      const { getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(result.body), { isEvalSupported: false, useSystemFonts: false, verbosity: 0 });
      try {
        if (pdf.numPages > 20) return null;
        const pages: string[] = [];
        for (let i = 1; i <= pdf.numPages; i += 1) {
          signal.throwIfAborted();
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          pages.push(content.items.map((item) => "str" in item ? item.str : "").join(" "));
        }
        const text = pages.join("\n").slice(0, 120_000);
        return { url: result.url, text, links: [], emails: extractEmails(text) };
      } finally { await pdf.destroy(); }
    }
    if (!/text\/html|text\/plain|application\/xhtml/.test(result.type)) return null;
    return parseOfficialHtml(result.body.toString("utf8"), result.url);
  } catch { return null; }
}

async function download(url: string, domain: string, signal: AbortSignal, redirects: number): Promise<{
  body: Buffer; type: string; url: string;
} | null> {
  if (redirects > 3 || !isOfficialUrl(url, domain)) return null;
  signal.throwIfAborted();
  const addresses = await lookup(new URL(url).hostname, { all: true, verbatim: true });
  signal.throwIfAborted();
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) return null;
  const address = addresses.find((item) => item.family === 4) || addresses[0];
  const result = await new Promise<{ body: Buffer; type: string; redirect?: string }>((resolve, reject) => {
    const req = httpsRequest(url, {
      signal,
      headers: { "User-Agent": "SponsorAI/1.0 (public business contact verification)", "Accept-Encoding": "identity" },
      // Node 20+ can request all addresses; both signatures use only the pinned public address.
      lookup: (_hostname, opts, callback) => {
        if (opts.all) callback(null, [address]);
        else callback(null, address.address, address.family);
      },
    }, (response) => {
      if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400) {
        response.resume();
        resolve({ body: Buffer.alloc(0), type: "", redirect: response.headers.location });
        return;
      }
      if (response.statusCode !== 200 || Number(response.headers["content-length"] || 0) > 2_000_000) {
        response.resume();
        reject(new Error("Source unavailable"));
        return;
      }
      const chunks: Buffer[] = [];
      let length = 0;
      response.on("data", (chunk: Buffer) => {
        length += chunk.length;
        if (length > 2_000_000) {
          req.destroy(new Error("Source too large"));
          return;
        }
        chunks.push(chunk);
      });
      response.on("error", reject);
      response.on("end", () => resolve({ body: Buffer.concat(chunks), type: response.headers["content-type"] || "" }));
    });
    req.on("error", reject);
    req.end();
  });
  if (result.redirect) return download(new URL(result.redirect, url).toString(), domain, signal, redirects + 1);
  return { ...result, url };
}

function decodeEntities(value: string): string {
  return value.replace(/&#(x[0-9a-f]+|\d+);?/gi, (_, code: string) => {
    const number = code[0].toLowerCase() === "x" ? parseInt(code.slice(1), 16) : parseInt(code, 10);
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : "";
  }).replace(/&(?:amp|quot|apos|lt|gt|nbsp|commat);/g, (entity) => ({
    "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">", "&nbsp;": " ", "&commat;": "@",
  })[entity] || entity);
}

export function extractEmails(text: string): string[] {
  return Array.from(new Set((text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []).map((email) => email.toLowerCase()))).slice(0, 40);
}

export function parseOfficialHtml(html: string, url: string): OfficialDocument {
  const decoded = decodeEntities(html);
  const links = Array.from(decoded.matchAll(/href\s*=\s*["']([^"']+)["']/gi)).flatMap((match) => {
    try { return [new URL(match[1], url).toString()]; } catch { return []; }
  });
  // Also support official structured-data sameAs links, but never execute scripts.
  links.push(...(decoded.match(/https:\/\/(?:[a-z]+\.)?linkedin\.com\/company\/[\w%-]+/gi) || []));
  const text = decoded.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").slice(0, 120_000);
  const mailto = links.filter((link) => link.startsWith("mailto:")).join(" ");
  return { url, text, links: Array.from(new Set(links)).slice(0, 300), emails: extractEmails(`${text} ${mailto}`) };
}
