# Codex for Obsidian

Codex for Obsidian is an Obsidian plugin concept for a local foreground agent powered by Codex CLI.

The first milestone focuses on a Cursor Agent-like workflow inside Obsidian:

- Chat with a local agent from an Obsidian sidebar.
- Attach the active note, selected text, and explicit vault files as context.
- Run in read-only Ask mode or write-capable Agent mode.
- Review file changes before applying them to the vault.
- Confirm terminal commands before execution.
- Keep lightweight local session history.

## Status

This repository is in product and technical discovery. The initial implementation target is a local-only MVP that uses an installed `codex` CLI binary.

## Repository Layout

```text
.
├── AGENTS.md
├── README.md
├── docs/
│   └── research/
│       └── cursor-agent-first-phase.md
├── manifest.json
├── package.json
├── src/
│   └── main.ts
├── styles.css
└── tsconfig.json
```

## MVP Scope

Included:

- Obsidian sidebar Agent view.
- Ask and Agent modes.
- Current note and selected text context.
- Manual file context.
- Codex CLI adapter.
- Streaming output display.
- Diff review before vault writes.
- Command confirmation before terminal execution.
- Basic session history.

Deferred:

- Remote background agents.
- GitHub branch and PR automation.
- Full semantic vault indexing.
- MCP server management.
- Multi-user collaboration.

## Development

Install dependencies after the implementation scaffold is completed:

```bash
npm install
npm run build
```

For local plugin testing, copy or symlink the built plugin files into an Obsidian vault under:

```text
.obsidian/plugins/codex-for-obsidian/
```

