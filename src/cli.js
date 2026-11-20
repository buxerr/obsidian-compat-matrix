#!/usr/bin/env node
import fs from "node:fs";
import { readJson, validateCompatibility, workflowMatrix } from "./matrix.js";

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

try {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("Usage: obsidian-compat-matrix [--manifest manifest.json] [--versions versions.json] [--app-versions v1,v2] [--workflow] [--output report.json]");
    process.exit(0);
  }
  const manifest = readJson(arg("--manifest", "manifest.json"));
  const versions = readJson(arg("--versions", "versions.json"));
  const targets = String(arg("--app-versions", "")).split(",").map((item) => item.trim()).filter(Boolean);
  const result = validateCompatibility(manifest, versions, targets);
  if (process.argv.includes("--workflow")) result.githubActionsMatrix = workflowMatrix(result);
  const output = JSON.stringify(result, null, 2);
  const outputPath = arg("--output", null);
  if (outputPath) fs.writeFileSync(outputPath, `${output}\n`, "utf8");
  else console.log(output);
  if (!result.valid) process.exitCode = 1;
} catch (error) {
  console.error(`obsidian-compat-matrix: ${error.message}`);
  process.exitCode = 2;
}
