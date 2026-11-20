# Obsidian Plugin Compatibility Matrix

Validate an Obsidian plugin's `manifest.json` and `versions.json`, then generate a deterministic app-version test matrix for CI. Catch mismatches between the current plugin's `minAppVersion` and its published compatibility map before releasing.

## Install

```sh
npm install --save-dev obsidian-compat-matrix
```

## Validate and plan app-version tests

```sh
npx obsidian-compat-matrix \
  --manifest manifest.json \
  --versions versions.json \
  --app-versions 1.5.12,1.6.7,1.7.7 \
  --workflow \
  --output build/obsidian-compatibility.json
```

The JSON report lists each target Obsidian app version and whether the current plugin manifest declares it supported. Add the emitted `githubActionsMatrix` to a workflow that installs the plugin into the corresponding Obsidian test environment.

## What it validates

- Required plugin identity fields and semantic-version syntax.
- That `versions.json` maps the current plugin version to the same minimum app version in `manifest.json`.
- Which selected Obsidian app versions are inside or below the declared support range.
- Deterministic GitHub Actions matrix data for a release workflow.

The tool plans compatibility runs; it does not launch Obsidian or prove runtime compatibility. Pair the matrix with actual desktop/mobile smoke tests for the app versions you claim to support.

## Development

```sh
npm test
```

Keywords: Obsidian plugin compatibility, `manifest.json` validator, `versions.json` check, Obsidian plugin CI matrix, test multiple Obsidian versions.

## License

MIT
