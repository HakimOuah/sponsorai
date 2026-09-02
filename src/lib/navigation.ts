const WORKSPACE_SECTIONS = [
  "dashboard",
  "players",
  "companies",
  "pipeline",
  "prospection",
  "emails",
  "agents",
  "veille",
  "analytics",
  "settings",
  "admin",
] as const;

export function isWorkspacePath(pathname: string): boolean {
  return WORKSPACE_SECTIONS.some(
    (section) =>
      pathname === `/${section}` || pathname.startsWith(`/${section}/`),
  );
}

/** Only page navigation: leave external URLs, downloads, API calls and anchors alone. */
export function getNavigationTarget(
  href: string,
  currentHref: string,
): string | null {
  try {
    const current = new URL(currentHref);
    const target = new URL(href, current);
    if (
      !["http:", "https:"].includes(target.protocol) ||
      target.origin !== current.origin ||
      !isWorkspacePath(target.pathname) ||
      (target.pathname === current.pathname && target.search === current.search)
    )
      return null;
    return target.pathname + target.search + target.hash;
  } catch {
    return null;
  }
}

export function isPlainNavigationClick(
  event: {
    defaultPrevented: boolean;
    button: number;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
  },
  target?: string | null,
  download = false,
): boolean {
  return (
    !event.defaultPrevented &&
    event.button === 0 &&
    !event.metaKey &&
    !event.ctrlKey &&
    !event.shiftKey &&
    !event.altKey &&
    (!target || target === "_self") &&
    !download
  );
}

export type NavigationLayout =
  | "cards"
  | "table"
  | "detail"
  | "board"
  | "dashboard";

export function getNavigationPresentation(href: string): {
  title: string;
  layout: NavigationLayout;
} {
  const [section, detail] = href.split(/[?#]/)[0].split("/").filter(Boolean);
  const titles: Record<string, string> = {
    dashboard: "Dashboard",
    players: "Talents",
    companies: "Entreprises",
    pipeline: "Pipeline",
    prospection: "Prospection",
    emails: "Emails",
    agents: "Agents IA",
    veille: "Veille",
    analytics: "Analytics",
    settings: "Paramètres",
    admin: "Utilisateurs",
  };
  const title = titles[section] || "Votre espace";
  if (detail && section !== "admin") return { title, layout: "detail" };
  if (section === "pipeline") return { title, layout: "board" };
  if (section === "dashboard" || section === "analytics")
    return { title, layout: "dashboard" };
  if (["players", "companies", "agents"].includes(section))
    return { title, layout: "cards" };
  if (section === "settings") return { title, layout: "detail" };
  return { title, layout: "table" };
}

export type ConnectionPreference = {
  saveData?: boolean;
  effectiveType?: string;
};

/** This stores URL timestamps only, never page data or permissions. Scoped to one app mount. */
export function createIntentPrefetcher(
  prefetch: (href: string) => void,
  now = Date.now,
) {
  const seen = new Map<string, number>();
  let lastStarted = -Infinity;
  return (
    href: string,
    currentHref: string,
    connection?: ConnectionPreference,
  ) => {
    const target = getNavigationTarget(href, currentHref);
    if (
      !target ||
      connection?.saveData ||
      ["slow-2g", "2g"].includes(connection?.effectiveType || "")
    )
      return false;
    const key = target.split("#")[0];
    const time = now();
    if (
      time - (seen.get(key) ?? -Infinity) < 30_000 ||
      time - lastStarted < 250
    )
      return false;
    prefetch(key);
    seen.delete(key);
    seen.set(key, time);
    lastStarted = time;
    if (seen.size > 40) seen.delete(seen.keys().next().value!);
    return true;
  };
}
