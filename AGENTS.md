# Agent Instructions

This repository contains an Obsidian plugin that wraps Codex CLI as a local foreground agent.

## Product Direction

Build a local-first Obsidian Agent experience inspired by Cursor Agent, but scoped to Obsidian workflows:

- Knowledge work inside Markdown vaults.
- Explicit context attachment.
- Safe vault writes through diff review.
- Safe terminal execution through user confirmation.
- Clear separation between read-only Ask mode and write-capable Agent mode.

Do not design the first phase as a full IDE replacement, remote background agent platform, or generic chatbot.

## Engineering Principles

- Prefer small, explicit modules over large controller files.
- Treat the Obsidian vault as user data. Never write without an approval path.
- Keep Codex CLI integration behind a narrow adapter interface.
- Keep UI state separate from filesystem and process execution.
- Favor deterministic parsing and structured event contracts where available.
- Preserve user edits and avoid destructive file operations.
- Do not modify Obsidian itself. All behavior must be added through documented plugin APIs and removed automatically when the plugin is disabled or deleted.
- Add editor and file-tree actions through runtime menu events only. Do not persist custom buttons into Obsidian core configuration or patch native DOM components.

## Suggested Architecture

```text
Obsidian Plugin View
  -> Agent Session Manager
  -> Context Builder
  -> Codex CLI Adapter
  -> Tool Event Parser
  -> Diff Review / Command Approval
  -> Vault Writer / Terminal Runner
```

## First-Phase Boundaries

Implement:

- Sidebar Agent view.
- Ask and Agent modes.
- Active note, selected text, and manually attached file context.
- Codex CLI availability check.
- Streaming CLI output.
- Proposed file changes as reviewable diffs.
- Command approval before execution.
- Task cancellation.
- Local session history.

Do not implement yet:

- Background remote workers.
- Auto-run terminal commands by default.
- Silent multi-file writes.
- Full semantic indexing.
- Cloud sync.
- Marketplace packaging automation.

## Git Workflow

- Keep changes focused and reviewable.
- Use conventional commits where practical, for example `feat: add agent panel scaffold`.
- Do not commit generated dependency folders such as `node_modules` or build output.
- Keep documentation in sync with product decisions.
