# Cursor Agent First-Phase Research

## Goal

Define the first-phase requirements for an Obsidian plugin that provides a Cursor Agent-like local agent experience using Codex CLI.

## Cursor Agent Reference Model

Cursor Agent is organized around a side-panel assistant that can:

- Operate in different modes such as Agent and Ask.
- Use tools to search, read, edit, and run terminal commands.
- Accept explicit context through file and folder references.
- Apply generated changes to files.
- Show diffs for review.
- Run terminal commands with configurable safety behavior.
- Maintain multiple conversations and history.
- Use project rules as persistent instructions.

Cursor also has Background Agents, but those are remote asynchronous agents with separate infrastructure. That model is outside the first phase.

## Obsidian First-Phase Interpretation

The Obsidian plugin should copy the workflow shape, not the full IDE feature set.

The first phase should be a local foreground agent:

- The user starts a task in an Obsidian sidebar.
- The user explicitly attaches note context.
- The plugin invokes Codex CLI locally.
- The plugin streams progress and results.
- The plugin previews proposed file changes.
- The user accepts or rejects changes before vault writes.
- Terminal commands require confirmation.

## MVP Feature Set

### Agent Panel

- Dockable Obsidian sidebar view.
- Mode selector: Ask and Agent.
- Codex CLI status indicator.
- Conversation area with streaming updates.
- Stop button for long-running tasks.

### Context Management

- Attach active note.
- Attach selected text.
- Attach specific vault files.
- Show attached context chips.
- Clear context.

### Agent Execution

- Spawn Codex CLI as a child process.
- Pass task prompt and selected context.
- Stream output into the panel.
- Detect completion, cancellation, and errors.

### File Change Safety

- Represent proposed writes as pending changes.
- Show Markdown-aware or text diff previews.
- Support accept all, accept one, and reject.
- Back up files before applying changes.

### Command Safety

- Show command, working directory, and risk hint.
- Require user confirmation.
- Support skip and stop.
- Keep command output attached to the session.

### Local History

- Store recent sessions locally.
- Preserve prompt, mode, attached context references, and final output.
- Avoid storing secrets or oversized file content by default.

## Deferred Features

- Remote background agents.
- Automatic GitHub branch and pull request creation.
- Full semantic indexing for the whole vault.
- MCP marketplace and server management.
- Agent auto-run for arbitrary terminal commands.
- Multi-user collaboration.

## Open Technical Questions

- Whether Codex CLI exposes a stable structured event stream suitable for direct UI rendering.
- Whether file changes should be produced by Codex CLI directly or mediated through plugin-managed patch application.
- How much command execution should be delegated to Codex CLI versus handled by the plugin approval layer.
- How Obsidian mobile should be treated, since local CLI execution is desktop-only.

## Recommended First Implementation Path

1. Scaffold the Obsidian plugin.
2. Build a static Agent panel UI.
3. Add Codex CLI detection and configuration.
4. Implement Ask mode with active-note context.
5. Add Agent mode with pending diff review.
6. Add command approval.
7. Add local session history.

