import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeRefresh } from "../src/lib/players/refresh";

test("refresh preserves unknown values instead of clearing existing fields", () => {
  assert.deepEqual(
    sanitizeRefresh({ followersIG: null, club: "", positioning: undefined }),
    {},
  );
  for (const input of [null, undefined, [], "bad"])
    assert.deepEqual(sanitizeRefresh(input), {});
});
test("refresh only permits public mutable profile fields", () => {
  assert.deepEqual(
    sanitizeRefresh({
      firstName: "Someone else",
      notes: "overwrite",
      targetPartnerships: "overwrite",
      active: false,
      positioning: " Nouvelle communication ",
    }),
    { positioning: "Nouvelle communication" },
  );
});
test("refresh accepts measured counts including zero, not invented numeric strings", () => {
  assert.deepEqual(
    sanitizeRefresh({
      followersIG: 12345,
      followersTK: 0,
      followersX: "15k",
      engagementRate: 2.5,
    }),
    { followersIG: 12345, followersTK: 0, engagementRate: 2.5 },
  );
});
test("refresh rejects negative, fractional, overflowing and nonfinite counts", () => {
  for (const value of [-1, 1.5, Infinity, NaN, 2147483648])
    assert.deepEqual(sanitizeRefresh({ followersIG: value }), {});
  assert.deepEqual(
    sanitizeRefresh({ engagementRate: 101, positioning: "a".repeat(4001) }),
    {},
  );
});
