import assert from "node:assert/strict";
import test from "node:test";
import {
  createIntentPrefetcher,
  getNavigationPresentation,
  getNavigationTarget,
  isPlainNavigationClick,
  isWorkspacePath,
} from "../src/lib/navigation";

const current = "https://vectis.agency/companies?country=France";
const plainClick = {
  defaultPrevented: false,
  button: 0,
  metaKey: false,
  ctrlKey: false,
  shiftKey: false,
  altKey: false,
};

test("navigation preserves details, query filters and cross-page anchors", () => {
  assert.equal(
    getNavigationTarget("/players/athlete-id", current),
    "/players/athlete-id",
  );
  assert.equal(
    getNavigationTarget("?country=Maroc", current),
    "/companies?country=Maroc",
  );
  assert.equal(
    getNavigationTarget("/agents?prospect=one#relanceur", current),
    "/agents?prospect=one#relanceur",
  );
  assert.equal(
    getNavigationTarget("https://vectis.agency/emails/one", current),
    "/emails/one",
  );
  assert.equal(getNavigationTarget("/companies", current), "/companies");
});

test("same-page and hash-only links do not start a stuck progress indicator", () => {
  assert.equal(getNavigationTarget(current, current), null);
  assert.equal(getNavigationTarget("#contacts", current), null);
  assert.equal(
    getNavigationTarget("/companies?country=France#contacts", current),
    null,
  );
});

test("external, authentication, API, export and unsafe links keep native behaviour", () => {
  for (const href of [
    "https://other.example/players",
    "//other.example/emails",
    "mailto:hello@example.com",
    "tel:0123456789",
    "javascript:alert(1)",
    "/api/export?type=players",
    "/login",
    "/",
    "/players-impersonation",
    "https://[invalid",
  ])
    assert.equal(getNavigationTarget(href, current), null, href);
  assert.equal(isWorkspacePath("/admin/users"), true);
  assert.equal(isWorkspacePath("/administrator"), false);
});

test("modified clicks, new tabs, downloads and cancelled handlers are not intercepted", () => {
  assert.equal(isPlainNavigationClick(plainClick), true);
  assert.equal(isPlainNavigationClick(plainClick, "_self"), true);
  assert.equal(isPlainNavigationClick(plainClick, "_blank"), false);
  assert.equal(isPlainNavigationClick(plainClick, "", true), false);
  assert.equal(
    isPlainNavigationClick({ ...plainClick, defaultPrevented: true }),
    false,
  );
  for (const key of ["metaKey", "ctrlKey", "shiftKey", "altKey"] as const) {
    assert.equal(isPlainNavigationClick({ ...plainClick, [key]: true }), false);
  }
  for (const button of [1, 2])
    assert.equal(isPlainNavigationClick({ ...plainClick, button }), false);
});

test("intent prefetch deduplicates URLs and does not flood the server on a fast pointer pass", () => {
  let now = 0;
  const calls: string[] = [];
  const prefetch = createIntentPrefetcher(
    (href) => calls.push(href),
    () => now,
  );
  assert.equal(prefetch("/players", current), true);
  assert.equal(prefetch("/emails", current), false);
  now = 300;
  assert.equal(prefetch("/players#profile", current), false);
  assert.equal(prefetch("/emails", current), true);
  now = 30_001;
  assert.equal(prefetch("/players", current), true);
  assert.deepEqual(calls, ["/players", "/emails", "/players"]);
});

test("intent prefetch respects constrained connections and excludes API actions", () => {
  const calls: string[] = [];
  const prefetch = createIntentPrefetcher((href) => calls.push(href));
  for (const connection of [
    { saveData: true },
    { effectiveType: "2g" },
    { effectiveType: "slow-2g" },
  ]) {
    assert.equal(prefetch("/players", current, connection), false);
  }
  assert.equal(prefetch("/api/agents/scan", current), false);
  assert.equal(prefetch("https://other.example/players", current), false);
  assert.deepEqual(calls, []);
});

test("prefetch bookkeeping is bounded and belongs to one mounted workspace", () => {
  let now = 0;
  const one = createIntentPrefetcher(
    () => {},
    () => now,
  );
  for (let i = 0; i < 41; i++) {
    assert.equal(one(`/players/${i}`, current), true);
    now += 300;
  }
  assert.equal(one("/players/0", current), true);
  const anotherUserSession = createIntentPrefetcher(
    () => {},
    () => now,
  );
  assert.equal(anotherUserSession("/players/0", current), true);
});

test("loading layouts cover the workspace without showing opaque IDs or contact data", () => {
  assert.deepEqual(getNavigationPresentation("/players"), {
    title: "Talents",
    layout: "cards",
  });
  assert.deepEqual(
    getNavigationPresentation("/emails/private-id?contact=private"),
    { title: "Emails", layout: "detail" },
  );
  assert.deepEqual(getNavigationPresentation("/pipeline"), {
    title: "Pipeline",
    layout: "board",
  });
  assert.deepEqual(getNavigationPresentation("/admin/users"), {
    title: "Utilisateurs",
    layout: "table",
  });
  assert.deepEqual(getNavigationPresentation("/dashboard"), {
    title: "Dashboard",
    layout: "dashboard",
  });
  assert.deepEqual(getNavigationPresentation("/unknown"), {
    title: "Votre espace",
    layout: "table",
  });
});
