import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function storage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function loadAuth(localStorage = storage()) {
  const source = readFileSync(new URL("../app/_lib/auth.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
  const exports = {};
  const sessionStorage = storage();
  runInNewContext(outputText, { exports, window: {}, localStorage, sessionStorage });
  return exports;
}

test("authentication returns to the saved same-origin path once", () => {
  const auth = loadAuth();
  const path = "/certificate?uuid=123e4567-e89b-42d3-a456-426614174000";
  auth.rememberAuthReturnPath(path);
  assert.equal(auth.consumeAuthReturnPath(), path);
  assert.equal(auth.consumeAuthReturnPath(), "/checkout");
});

test("authentication return paths cannot leave the site or loop through sign in", () => {
  const auth = loadAuth();
  for (const path of ["https://example.com", "//example.com", "/\\example.com", "/signin?next=/certificate"]) {
    auth.rememberAuthReturnPath(path);
    assert.equal(auth.consumeAuthReturnPath(), "/checkout");
  }
});

test("a Google session keeps the account available for checkout", () => {
  const auth = loadAuth();
  const user = { id: "user-1", fullName: "Alex Chen", email: "alex@example.com", role: "customer" };
  auth.saveAuth("google-access-token", user, false);
  assert.equal(auth.getStoredToken(), "google-access-token");
  assert.deepEqual(JSON.parse(JSON.stringify(auth.getStoredUser())), user);
});

test("remembered Google sign-in is shared across tabs and cleared on sign out", () => {
  const sharedStorage = storage();
  const user = { id: "user-1", fullName: "Alex Chen", email: "alex@example.com", role: "customer" };
  loadAuth(sharedStorage).saveAuth("google-access-token", user, true);
  const otherTab = loadAuth(sharedStorage);
  assert.equal(otherTab.getStoredToken(), "google-access-token");
  assert.deepEqual(JSON.parse(JSON.stringify(otherTab.getStoredUser())), user);
  otherTab.clearAuth();
  assert.equal(loadAuth(sharedStorage).getStoredToken(), null);
});
