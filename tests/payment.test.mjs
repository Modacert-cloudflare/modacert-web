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
  runInNewContext(outputText, { exports, process: { env }, require: (name) => imports[name] });
  return exports;
}

test("payment modes accept only configured modes and the legacy PayPal alias", () => {
  for (const [value, expected] of [
    [undefined, "production"],
    ["production", "production"],
    ["sandbox", "sandbox"],
    ["fake", "fake"],
    ["paypal", "production"],
  ]) {
    assert.equal(load("config", { NEXT_PUBLIC_PAYMENT_MODE: value }).config.paymentMode, expected);
  }
  for (const value of ["", "test", "FAKE"]) {
    assert.throws(() => load("config", { NEXT_PUBLIC_PAYMENT_MODE: value }), /must be production, sandbox, or fake/);
  }
});

test("payment APIs require completed capture and queued expert processing in every mode", async () => {
  const originalAdapter = axios.defaults.adapter;
  let response;
  const requests = [];
  axios.defaults.adapter = async (request) => {
    requests.push({ url: request.url, body: JSON.parse(request.data) });
    if (response instanceof Error) throw response;
    return { data: response, status: 200, statusText: "OK", headers: {}, config: request };
  };
  try {
    for (const mode of ["production", "sandbox", "fake"]) {
      const config = load("config", { NEXT_PUBLIC_PAYMENT_MODE: mode, NEXT_PUBLIC_API_RETRY_ATTEMPTS: "1" });
      const api = load("api", {}, { axios, "./config": config, "./auth": {} });
      assert.equal(api.PAYMENT_MODE, mode);
      response = { success: true, data: { orderId: "test-order", status: "APPROVED" } };
      const order = await api.createPayPalOrder({ referenceId: "test-request" });
      assert.equal(order.orderId, "test-order");
      assert.deepEqual(requests.at(-1), {
        url: "/payments/paypal/create-order", body: { referenceId: "test-request" },
      });
      const payload = { orderId: order.orderId, referenceId: "test-request" };
      response = { success: true, data: { status: "COMPLETED", paypalStatus: "COMPLETED", queued: true } };
      assert.equal((await api.capturePayPalOrder(payload)).queued, true);
      assert.deepEqual(requests.at(-1), { url: "/payments/paypal/capture", body: payload });
      for (const data of [undefined, { status: "PENDING", queued: true }, { status: "APPROVED", queued: true }]) {
        response = { success: true, data };
        await assert.rejects(api.capturePayPalOrder(payload), /Payment is not completed/);
      }
      for (const queued of [undefined, false]) {
        response = { success: true, data: { status: "COMPLETED", queued } };
        await assert.rejects(api.capturePayPalOrder(payload), /could not be queued/);
      }
      response = { success: false, error: { message: "Capture rejected" } };
      await assert.rejects(api.capturePayPalOrder(payload), /Capture rejected/);
      response = new Error("Backend unavailable");
      await assert.rejects(api.capturePayPalOrder(payload), /Backend unavailable/);
      await assert.rejects(api.createPayPalOrder({ referenceId: "test-request" }), /Backend unavailable/);
    }
  } finally {
    axios.defaults.adapter = originalAdapter;
  }
});
