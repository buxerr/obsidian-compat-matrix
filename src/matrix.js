import fs from "node:fs";

const VERSION_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;

export function parseVersion(version) {
  const match = VERSION_RE.exec(String(version));
  if (!match) throw new TypeError(`Invalid semantic version: ${version}`);
  return { core: match.slice(1, 4).map(Number), prerelease: match[4] ? match[4].split(".") : [] };
}

export function compareVersions(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let index = 0; index < 3; index += 1) {
    if (a.core[index] !== b.core[index]) return a.core[index] - b.core[index];
  }
  if (!a.prerelease.length && !b.prerelease.length) return 0;
  if (!a.prerelease.length) return 1;
  if (!b.prerelease.length) return -1;
  const length = Math.max(a.prerelease.length, b.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    if (a.prerelease[index] === undefined) return -1;
    if (b.prerelease[index] === undefined) return 1;
    const leftId = a.prerelease[index];
    const rightId = b.prerelease[index];
    if (leftId === rightId) continue;
    const leftNumeric = /^\d+$/.test(leftId);
    const rightNumeric = /^\d+$/.test(rightId);
    if (leftNumeric && rightNumeric) return Number(leftId) - Number(rightId);
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return leftId < rightId ? -1 : 1;
  }
  return 0;
}

export function validateCompatibility(manifest, versions, targetAppVersions = []) {
  const errors = [];
  if (!manifest || typeof manifest.id !== "string" || !/^[a-z0-9-]+$/.test(manifest.id)) errors.push("manifest.id must be lowercase letters, digits, or hyphens");
  if (!manifest || typeof manifest.name !== "string" || !manifest.name.trim()) errors.push("manifest.name is required");
  for (const key of ["version", "minAppVersion"]) {
    try { parseVersion(manifest?.[key]); } catch { errors.push(`manifest.${key} must be a valid semantic version`); }
  }
  if (!versions || typeof versions !== "object" || Array.isArray(versions)) errors.push("versions.json must be an object mapping plugin versions to minimum app versions");
  else {
    for (const [pluginVersion, minAppVersion] of Object.entries(versions)) {
      try { parseVersion(pluginVersion); } catch { errors.push(`versions.json key ${pluginVersion} must be a valid plugin version`); }
      try { parseVersion(minAppVersion); } catch { errors.push(`versions.json value for ${pluginVersion} must be a valid app version`); }
    }
    if (manifest?.version && versions[manifest.version] !== manifest.minAppVersion) {
      errors.push(`versions.json must map current plugin version ${manifest.version} to manifest.minAppVersion ${manifest.minAppVersion}`);
    }
  }
  const targets = [];
  for (const version of new Set(targetAppVersions)) {
    try { parseVersion(version); targets.push(version); }
    catch { errors.push(`target app version ${version} must be valid semantic version`); }
  }
  const matrix = targets.sort(compareVersions).map((appVersion) => ({
    appVersion,
    pluginVersion: manifest?.version ?? null,
    supportedByManifest: Boolean(manifest?.minAppVersion && compareVersions(appVersion, manifest.minAppVersion) >= 0),
  }));
  return { valid: errors.length === 0, errors, plugin: manifest?.id ?? null, matrix };
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function workflowMatrix(result) {
  return {
    include: result.matrix.map((row) => ({ appVersion: row.appVersion, pluginVersion: row.pluginVersion, supported: row.supportedByManifest })),
  };
}
