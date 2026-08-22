import test from "node:test";
import assert from "node:assert/strict";
import { canChangeUserRole, isAppRole } from "../src/lib/auth/roles";

test("only known application roles are accepted", () => {
  assert.equal(isAppRole("admin"), true);
  assert.equal(isAppRole("client"), true);
  assert.equal(isAppRole("owner"), false);
});

test("an administrator cannot change their own role", () => {
  const result = canChangeUserRole({
    actorUserId: "user-1",
    targetUserId: "user-1",
    targetRole: "admin",
    nextRole: "client",
    adminCount: 2,
  });

  assert.equal(result.allowed, false);
});

test("the last administrator cannot be demoted", () => {
  const result = canChangeUserRole({
    actorUserId: "user-1",
    targetUserId: "user-2",
    targetRole: "admin",
    nextRole: "client",
    adminCount: 1,
  });

  assert.equal(result.allowed, false);
});

test("an administrator can promote a client", () => {
  const result = canChangeUserRole({
    actorUserId: "user-1",
    targetUserId: "user-2",
    targetRole: "client",
    nextRole: "admin",
    adminCount: 1,
  });

  assert.deepEqual(result, { allowed: true });
});
