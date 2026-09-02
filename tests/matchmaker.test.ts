import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import type { Player } from "@prisma/client";
import type { ScoutBrand } from "../src/types";
import { generateClaudeText, CLAUDE_SCOUT_MODEL } from "../src/lib/ai";
import {
  parseMatchmakerBatch,
  runMatchmaker,
  SCORE_AXES,
} from "../src/lib/agents/matchmaker";

const player = {
  firstName: "Dayot",
  lastName: "Test",
  club: "Club",
  league: "Ligue",
} as Player;
const brands = Array.from(
  { length: 15 },
  (_, index): ScoutBrand => ({
    name: `Marque ${index}`,
    sector: "Sport",
    country: "France",
    website: `https://brand${index}.example`,
    rationale: "Preuve Scout",
    partnership_type: "ambassadeur",
    commercial_angle: "Sport",
    opportunity_signal: "Nouvelle gamme annoncée",
  }),
);
function row(note = 8) {
  return {
    rationale: "Compatibilité documentée.",
    recommended_approach: "Proposer une présentation.",
    score_details: Object.fromEntries(SCORE_AXES.map((axis) => [axis, note])),
  };
}
function rows(count: number) {
  return Object.fromEntries(
    Array.from({ length: count }, (_, index) => [`brand_${index}`, row()]),
  );
}
function claudeResponse(
  scores: Record<string, unknown>,
  stop_reason = "end_turn",
) {
  return Response.json({
    stop_reason,
    content: [{ type: "text", text: JSON.stringify({ scores }) }],
  });
}
function withTestKey(t: TestContext) {
  const previous = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = "unit-test-only";
  t.after(() => {
    if (previous === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = previous;
  });
}

test("Matchmaker scores fifteen brands in three concurrent Claude calls without web search", async (t) => {
  withTestKey(t);
  const calls: Array<Record<string, unknown>> = [];
  const releases: Array<() => void> = [];
  t.mock.method(globalThis, "fetch", async (url: string, init: RequestInit) => {
    assert.equal(url, "https://api.anthropic.com/v1/messages");
    const body = JSON.parse(String(init.body));
    calls.push(body);
    await new Promise<void>((resolve) => releases.push(resolve));
    return claudeResponse(rows(5));
  });
  const logs: string[] = [];
  const resultPromise = runMatchmaker(player, brands, (message) =>
    logs.push(message),
  );
  assert.equal(
    calls.length,
    3,
    "small batches must actually execute concurrently",
  );
  for (const release of releases) release();
  const result = await resultPromise;
  assert.equal(result.length, 15);
  assert.equal(new Set(result.map((brand) => brand.name)).size, 15);
  assert.deepEqual(
    result.map((brand) => brand.website),
    brands.map((brand) => brand.website),
  );
  for (const call of calls) {
    assert.equal(call.model, CLAUDE_SCOUT_MODEL);
    assert.equal(call.max_tokens, 4096);
    assert.equal(call.tools, undefined);
    assert.deepEqual(call.thinking, { type: "disabled" });
    assert.equal(
      (call.output_config as { format: { type: string } }).format.type,
      "json_schema",
    );
    const format = (
      call.output_config as {
        format: {
          schema: {
            properties: {
              scores: {
                type: string;
                required: string[];
                additionalProperties: boolean;
              };
            };
          };
        };
      }
    ).format;
    assert.equal(format.schema.properties.scores.type, "object");
    assert.equal(format.schema.properties.scores.additionalProperties, false);
    assert.deepEqual(
      format.schema.properties.scores.required,
      Object.keys(rows(5)),
    );
  }
  assert.ok(logs.some((message) => message.includes("15/15")));
});

test("Matchmaker rejects missing or foreign brands, array responses and invalid scores", () => {
  const input = brands.slice(0, 2);
  for (const scores of [
    { brand_0: row() },
    { brand_0: row(), brand_5: row() },
    { brand_0: row(), brand_1: row(99) },
    { brand_0: row(), brand_1: { ...row(), score_details: {} } },
    { brand_0: row(), brand_1: { ...row(), rationale: "" } },
    [row(), row()],
  ])
    assert.throws(() =>
      parseMatchmakerBatch(JSON.stringify({ scores }), input),
    );
  assert.throws(() => parseMatchmakerBatch('{"scores":[', input));
});

test("Matchmaker preserves Scout facts and caps scores without strong evidence", () => {
  const input = [{ ...brands[0], opportunity_signal: "Signal faible" }];
  const [scored] = parseMatchmakerBatch(
    JSON.stringify({
      scores: { brand_0: { ...row(10), website: "https://invented.example" } },
    }),
    input,
  );
  assert.equal(scored.website, input[0].website);
  assert.equal(scored.score, 6);
  assert.equal(scored.priority, "B");
  const exclusive = row(10);
  exclusive.score_details.exclusivity_risk = 2;
  assert.equal(
    parseMatchmakerBatch(JSON.stringify({ scores: { brand_0: exclusive } }), [
      brands[0],
    ])[0].score,
    6,
  );
});

test("Claude structured scoring rejects truncated or refused output", async (t) => {
  withTestKey(t);
  t.mock.method(globalThis, "fetch", async () =>
    claudeResponse(rows(1), "max_tokens"),
  );
  await assert.rejects(
    generateClaudeText({
      prompt: "test",
      maxWebSearchUses: 0,
      outputSchema: { type: "object" },
    }),
    /structuré complet/,
  );
});

test("Matchmaker aborts sibling calls and does not retry a failed paid request", async (t) => {
  withTestKey(t);
  let calls = 0;
  let aborted = 0;
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: string, init: RequestInit) => {
      calls += 1;
      if (calls === 1) return new Response("Unavailable", { status: 503 });
      return new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener(
          "abort",
          () => {
            aborted += 1;
            reject(init.signal?.reason);
          },
          { once: true },
        );
      });
    },
  );
  await assert.rejects(
    runMatchmaker(player, [...brands, ...brands], () => {}),
    /Claude API failed/,
  );
  assert.equal(calls, 3);
  assert.equal(aborted, 2);
});

test("Claude accepts cancellation before making a request", async (t) => {
  withTestKey(t);
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    claudeResponse({}),
  );
  await assert.rejects(
    generateClaudeText({ prompt: "test", signal: AbortSignal.abort() }),
    { name: "AbortError" },
  );
  assert.equal(fetchMock.mock.callCount(), 0);
});

test("Matchmaker handles empty input without charging", async () => {
  assert.deepEqual(await runMatchmaker(player, [], () => {}), []);
});

test("Matchmaker makes every brand mandatory for full batches and the final partial batch", async (t) => {
  withTestKey(t);
  const sizes: number[] = [];
  t.mock.method(
    globalThis,
    "fetch",
    async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      const required = body.output_config.format.schema.properties.scores
        .required as string[];
      const prompt = body.messages[0].content as string;
      const input = JSON.parse(
        prompt
          .split("LISTE DES MARQUES :\n")[1]
          .split("\n\nPour chaque marque,")[0],
      ) as Array<{ brand_key: string }>;
      assert.deepEqual(
        required,
        input.map((brand) => brand.brand_key),
      );
      assert.ok(
        prompt.includes(
          `Les clés exactes à inclure sont : ${required.join(", ")}`,
        ),
      );
      sizes.push(required.length);
      return claudeResponse(
        Object.fromEntries(required.map((key) => [key, row()])),
      );
    },
  );
  const result = await runMatchmaker(player, brands.slice(0, 13), () => {});
  assert.deepEqual(sizes, [5, 5, 3]);
  assert.equal(result.length, 13);
});

test("Matchmaker maps unordered result keys back to the correct Scout brands", () => {
  const result = parseMatchmakerBatch(
    JSON.stringify({ scores: { brand_1: row(5), brand_0: row(9) } }),
    brands.slice(0, 2),
  );
  assert.deepEqual(
    result.map((brand) => [brand.name, brand.score]),
    [
      ["Marque 0", 9],
      ["Marque 1", 5],
    ],
  );
});
