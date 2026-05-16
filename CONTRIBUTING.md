# Contributing

Thanks for helping improve Codex AI Agent.

## Development

Install dependencies and run the release check before opening a pull request:

```bash
npm install
npm run release:check
```

The TypeScript source lives in `src/main.ts`. Obsidian loads the generated `main.js` bundle.

## Pull Requests

- Keep changes focused and reviewable.
- Preserve the user approval path for shell commands and file changes.
- Do not add telemetry, background network calls, or silent vault writes.
- Update `README.md` when behavior, requirements, or security posture changes.

## Releases

Releases must include:

```text
main.js
manifest.json
styles.css
```

The release tag must match the version in `manifest.json`.
