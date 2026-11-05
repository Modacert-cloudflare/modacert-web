import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import axios from "axios";
import ts from "typescript";

function load(file, env, imports = {}) {
  const source = readFileSync(new URL(`../app/_lib/${file}.ts`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
  });
  const exports = {};
  runInNewContext(outputText, { exports, process: { env }, require: (name) => imports[name], URL });
  return exports;
}

test("Google sign-in exchanges the credential for a ModaCert session", async () => {
  const originalAdapter = axios.defaults.adapter;
  let request;
  axios.defaults.adapter = async (config) => {
    request = { url: config.url, body: JSON.parse(config.data) };
    return {
      data: {
        data: {
          tokens: { accessToken: "modacert-token" },
          user: { id: "user-id", email: "customer@example.com" },
        },
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
  try {
    const config = load("config", { NEXT_PUBLIC_API_RETRY_ATTEMPTS: "1" });
    const api = load("api", {}, { axios, "./config": config, "./auth": {} });
    const response = await api.loginWithGoogle("google-id-token");
    assert.equal(response.accessToken, "modacert-token");
    assert.deepEqual(request, {
      url: "/auth/google/login",
      body: { idToken: "google-id-token" },
    });
  } finally {
    axios.defaults.adapter = originalAdapter;
  }
});

test("public brand lookup does not redirect visitors to sign-in on stale auth", async () => {
  const originalAdapter = axios.defaults.adapter;
  let cleared = 0;
  axios.defaults.adapter = async (config) => {
    const error = new Error("Unauthorized");
    error.isAxiosError = true;
    error.config = config;
    error.response = { status: 401, data: { error: { code: "UNAUTHORIZED" } } };
    throw error;
  };
  try {
    const config = load("config", { NEXT_PUBLIC_API_RETRY_ATTEMPTS: "1" });
    const api = load("api", {}, {
      axios,
      "./config": config,
      "./auth": {
        clearAuth: () => { cleared += 1; },
        getStoredToken: () => "stale-token",
        rememberAuthReturnPath: () => { throw new Error("public lookup redirected"); },
      },
    });
    await assert.rejects(api.fetchBrands(), /Unauthorized/);
    assert.equal(cleared, 1);
  } finally {
    axios.defaults.adapter = originalAdapter;
  }
});

test("public brand lookup does not send a stored bearer token", async () => {
  const originalAdapter = axios.defaults.adapter;
  let authorization;
  axios.defaults.adapter = async (request) => {
    authorization = request.headers.get("Authorization");
    return { data: { data: [] }, status: 200, statusText: "OK", headers: {}, config: request };
  };
  try {
    const config = load("config", { NEXT_PUBLIC_API_RETRY_ATTEMPTS: "1" });
    const api = load("api", {}, { axios, "./config": config, "./auth": {} });
    api.setAuthToken("expired-token");
    assert.deepEqual(await api.fetchBrands(), []);
    assert.equal(authorization, undefined);
  } finally {
    axios.defaults.adapter = originalAdapter;
  }
});

test("Stripe checkout uses only Stripe endpoints", async () => {
  const originalAdapter = axios.defaults.adapter;
  let response;
  const requests = [];
  axios.defaults.adapter = async (request) => {
    requests.push({ url: request.url, body: request.data ? JSON.parse(request.data) : undefined });
    if (response instanceof Error) throw response;
    return { data: response, status: 200, statusText: "OK", headers: {}, config: request };
  };
  try {
    const config = load("config", { NEXT_PUBLIC_API_RETRY_ATTEMPTS: "1" });
    const api = load("api", {}, { axios, "./config": config, "./auth": {} });
    response = { success: true, data: { sessionId: "cs_test_123", status: "unpaid", url: "https://checkout.stripe.com/test" } };
    assert.equal((await api.createStripeCheckoutSession({ referenceId: "test-request" })).sessionId, "cs_test_123");
    assert.deepEqual(requests.at(-1), { url: "/payments/stripe/create-session", body: { referenceId: "test-request" } });
    response = { success: true, data: { sessionId: "cs_test_123", referenceId: "test-request", status: "COMPLETED", queued: true, amount: "19.90", currency: "USD" } };
    assert.equal((await api.fetchStripeCheckoutStatus("cs_test_123")).queued, true);
    assert.deepEqual(requests.at(-1), { url: "/payments/stripe/session/cs_test_123", body: undefined });
    response = { success: true, data: { sessionId: "cs_test_123", referenceId: "test-request", status: "COMPLETED" } };
    await assert.rejects(api.fetchStripeCheckoutStatus("cs_test_123"), /Invalid Stripe payment status response/);
  } finally {
    axios.defaults.adapter = originalAdapter;
  }
});
