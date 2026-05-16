# Agent Instructions

This repository contains an Obsidian plugin that wraps Codex CLI as a local foreground agent.

## Current Implementation Snapshot

This project is an Obsidian plugin whose runtime entry is the generated `main.js` bundle.

Important paths:

- Source workspace: repository root
- Obsidian demo install: `<your-vault>/.obsidian/plugins/codex-vault-agent`
- Runtime entry file: `main.js`
- TypeScript source: `src/main.ts`
- Styles: `styles.css`
- App Server design reference: local design notes, if available

Build status:

- `src/main.ts` is the source of truth.
- `npm run build` bundles `src/main.ts` to `main.js` with esbuild.
- Obsidian loads `main.js`.
- Minimum verification is `npm run release:check`.
- After code changes, copy `main.js`, `styles.css`, and `manifest.json` into the demo plugin directory for testing.

Demo testing plugin directory:

```text
<your-vault>/.obsidian/plugins/codex-vault-agent
```

When asked to push changes for demo testing, copy at least these files there:

```text
main.js
styles.css
manifest.json
```

Current feature state:

- Sidebar Agent view with tabs.
- Ask / Agent mode selector.
- Model and reasoning selectors.
- Active note, selected text, file, and folder context chips.
- Multiple selected text snippets are shown as separate chips, not merged.
- Local session history in plugin `data.json`.
- Empty new Agent tabs are not treated as history until a turn starts.
- One Agent tab supports multi-turn conversation and keeps previous rounds visible.
- History drawer supports outside-click close and delete with confirmation.
- App Server based streaming response display, tool activity rows, approval cards, cancellation, and diff/status events.
- UI uses chat-style icons for the ribbon and Agent tabs.

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
      -> AppServerAdapter (default)
      -> ExecJsonAdapter (compatibility fallback only)
      -> PtyCodexAdapter (stub)
  -> Tool Event Parser
  -> Diff Review / Command Approval
  -> Vault Writer / Terminal Runner
```

## App Server Integration Notes

The default execution backend is `AppServerAdapter`, not `codex exec --json`.

The adapter starts a per-run stdio child process:

```bash
codex app-server --listen stdio://
```

The protocol is newline-delimited JSON-RPC style messages over stdio. It does not use `Content-Length` framing in the current local CLI.

Startup flow:

1. Send `initialize`.
2. If the local Agent session has no `codexThreadId`, send `thread/start`.
3. Save returned `thread.id` into `AgentSession.codexThreadId`.
4. Send `turn/start` with text input.
5. For later turns in the same tab, send `thread/resume`, then `turn/start`.

Important request choices:

- `approvalPolicy` is `"on-request"` in Agent mode and `"never"` in Ask mode.
- `approvalsReviewer` is `"user"`.
- `sandbox` on `thread/start` is `"workspace-write"` in Agent mode and `"read-only"` in Ask mode.
- `turn/start.sandboxPolicy` uses the structured v2 shape:
  - read-only: `{ type: "readOnly", networkAccess: false }`
  - workspace-write: `{ type: "workspaceWrite", writableRoots: [cwd], networkAccess: false, excludeTmpdirEnvVar: false, excludeSlashTmp: false }`

Mapped App Server notifications:

- `thread/started` -> save thread id and show thinking status.
- `turn/started` -> thinking status.
- `item/agentMessage/delta` -> streaming assistant response.
- `item/started` / `item/completed` -> tool activity rows such as file reads and commands.
- `item/commandExecution/outputDelta` -> command running status.
- `turn/diff/updated` -> diff timeline item.
- `turn/completed` -> mark response complete and finish run.
- `error`, `warning`, `configWarning` -> status or error events.

Mapped App Server server requests:

- `item/commandExecution/requestApproval` -> approval card.
- `item/fileChange/requestApproval` -> approval card.
- `item/permissions/requestApproval` -> conservative permissions approval response.

Current approval UI supports:

- Allow once: `accept`
- Decline: `decline`
- Cancel: `cancel`

Do not auto-approve shell commands or file writes by default. Preserve the user-confirmation path.

Streaming UI detail:

- During generation, assistant responses are first rendered as plain monospace text with throttled updates.
- The render throttle is about 80 ms to reduce page jumping.
- When a response completes, it is rendered as Markdown.
- Avoid re-rendering the full Markdown tree for every delta.

Session and history details:

- `AgentSession.id` is the plugin-local tab id.
- `AgentSession.codexThreadId` is the App Server thread id.
- A session counts as history only if it has timeline content or a `codexThreadId`.
- Creating a blank tab must not create a history entry.
- Closing a blank tab discards it.
- Closing a started tab archives it into local history.
- Restoring history moves it back into active tabs.
- Deleting history removes it from both active and archived arrays after confirmation.

Context handling:

- File chips read file contents through Obsidian vault APIs and include them in the text prompt.
- Folder chips include a shallow directory tree.
- Selection chips include the selected text and optional source path.
- Short-term implementation still composes attached context into text input for `turn/start`.
- Future implementation can move paths to App Server `mention` / `localImage` / structured `UserInput` elements where appropriate.

Tool activity display:

- The UI listens to `item/started` and `item/completed`.
- Command items are inspected for common file-read commands such as `cat`, `sed`, `nl`, `head`, `tail`, and `less`.
- Recognized file paths produce rows like `正在读取 main.js` and `已读取 main.js`.
- The view tracks explored file count per turn and shows `已探索 N 个文件`.

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
