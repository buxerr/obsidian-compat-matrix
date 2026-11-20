import assert from "node:assert/strict";
import test from "node:test";
import { compareVersions, validateCompatibility, workflowMatrix } from "../src/matrix.js";

const manifest = { id: "sample-plugin", name: "Sample Plugin", version: "1.2.0", minAppVersion: "1.5.0" };
const versions = { "1.2.0": "1.5.0", "1.1.0": "1.4.0" };

test("validates current manifest against versions.json and sorts tested app versions", () => {
  const result = validateCompatibility(manifest, versions, ["1.6.0", "1.4.0", "1.5.0"]);
  assert.equal(result.valid, true);
  assert.deepEqual(result.matrix.map((row) => row.appVersion), ["1.4.0", "1.5.0", "1.6.0"]);
  assert.deepEqual(result.matrix.map((row) => row.supportedByManifest), [false, true, true]);
});

test("rejects mismatch between current minimum app version and versions.json", () => {
  const result = validateCompatibility({ ...manifest, minAppVersion: "1.6.0" }, versions);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /must map current plugin version/);
});

test("rejects invalid semantic versions and emits an Actions matrix", () => {
  assert.throws(() => compareVersions("latest", "1.0.0"), /Invalid semantic version/);
  assert.equal(compareVersions("1.5.0-beta.2", "1.5.0-beta.11") < 0, true);
  assert.equal(compareVersions("1.5.0-beta.11", "1.5.0") < 0, true);
  const result = validateCompatibility(manifest, versions, ["1.4.0", "1.5.0"]);
  assert.deepEqual(workflowMatrix(result).include.map((row) => row.supported), [false, true]);
});

test("reports malformed version mappings", () => {
  const result = validateCompatibility(manifest, { broken: "next" });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((message) => message.includes("plugin version")));
  assert.ok(result.errors.some((message) => message.includes("app version")));
});

test("reports invalid target versions without crashing matrix generation", () => {
  const result = validateCompatibility(manifest, versions, ["stable"]);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(" "), /target app version stable/);
  assert.deepEqual(result.matrix, []);
});
