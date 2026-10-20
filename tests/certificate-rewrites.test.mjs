import assert from "node:assert/strict";
import test from "node:test";
import { certificateRewrites } from "../lib/certificate-rewrites.ts";

test("certificate host opens retrieval page and pre-fills valid request UUIDs", () => {
  const { beforeFiles } = certificateRewrites();
  assert.deepEqual(beforeFiles[0], {
    source: "/",
    destination: "/certificate",
    has: [{ type: "host", value: "certificate.modacert.com" }],
  });
  assert.equal(beforeFiles[1].destination, "/certificate?uuid=:uuid");
  assert.match(beforeFiles[1].source, /uuid/);
});
