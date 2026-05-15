const { ItemView, MarkdownView, Notice, Plugin } = require("obsidian");

const VIEW_TYPE_CODEX_AGENT = "codex-agent-view";

module.exports = class CodexForObsidianPlugin extends Plugin {
  async onload() {
    this.registerView(
      VIEW_TYPE_CODEX_AGENT,
      (leaf) => new CodexAgentView(leaf)
    );

    this.addRibbonIcon("bot", "Open Codex Agent", () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-codex-agent",
      name: "Open Codex Agent",
      callback: () => this.activateView()
    });
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CODEX_AGENT);
  }

  async activateView() {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_CODEX_AGENT)[0];

    if (existing) {
      this.app.workspace.revealLeaf(existing);
      return;
    }

    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      return;
    }

    await leaf.setViewState({
      type: VIEW_TYPE_CODEX_AGENT,
      active: true
    });

    this.app.workspace.revealLeaf(leaf);
  }
};

class CodexAgentView extends ItemView {
  constructor(leaf) {
    super(leaf);
    this.mode = "agent";
    this.contextChips = [];
    this.timeline = [
      {
        title: "Ready",
        body: "Attach note context, describe the task, then run a local foreground agent session.",
        tone: "done"
      }
    ];
    this.promptInput = null;
    this.contextContainer = null;
    this.timelineContainer = null;
    this.modeButtons = {};
  }

  getViewType() {
    return VIEW_TYPE_CODEX_AGENT;
  }

  getDisplayText() {
    return "Codex Agent";
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("codex-agent-panel");

    this.renderHeader(container);
    this.renderModeSwitch(container);
    this.renderContextBar(container);
    this.renderTimeline(container);
    this.renderComposer(container);
  }

  renderHeader(container) {
    const header = container.createDiv("codex-agent-header");
    const titleWrap = header.createDiv();
    titleWrap.createEl("p", { cls: "codex-agent-kicker", text: "LOCAL FOREGROUND AGENT" });
    titleWrap.createEl("h2", { text: "Codex Agent" });

    const status = header.createDiv("codex-agent-status");
    status.createSpan("codex-agent-status-dot");
    status.createSpan({ text: "CLI ready" });
  }

  renderModeSwitch(container) {
    const section = container.createDiv("codex-agent-section codex-agent-mode-row");
    this.modeButtons.ask = this.createModeButton(section, "ask", "Ask", "Read-only planning and research");
    this.modeButtons.agent = this.createModeButton(section, "agent", "Agent", "Reviewable vault edits and commands");
    this.updateModeButtons();
  }

  createModeButton(parent, mode, label, caption) {
    const button = parent.createEl("button", { cls: "codex-agent-mode" });
    button.createSpan({ cls: "codex-agent-mode-label", text: label });
    button.createSpan({ cls: "codex-agent-mode-caption", text: caption });
    button.addEventListener("click", () => {
      this.mode = mode;
      this.updateModeButtons();
    });
    return button;
  }

  updateModeButtons() {
    Object.entries(this.modeButtons).forEach(([mode, button]) => {
      if (button) {
        button.toggleClass("is-active", mode === this.mode);
      }
    });
  }

  renderContextBar(container) {
    const section = container.createDiv("codex-agent-section");
    const head = section.createDiv("codex-agent-section-head");
    head.createEl("h3", { text: "Context" });
    const actions = head.createDiv("codex-agent-actions");

    const noteButton = actions.createEl("button", { text: "Active note" });
    noteButton.addEventListener("click", () => this.attachActiveNote());

    const selectionButton = actions.createEl("button", { text: "Selection" });
    selectionButton.addEventListener("click", () => this.attachSelection());

    const sampleButton = actions.createEl("button", { text: "Sample" });
    sampleButton.addEventListener("click", () => this.attachSample());

    const clearButton = actions.createEl("button", { text: "Clear" });
    clearButton.addEventListener("click", () => {
      this.contextChips = [];
      this.renderContextChips();
    });

    this.contextContainer = section.createDiv("codex-agent-context-list");
    this.renderContextChips();
  }

  renderContextChips() {
    if (!this.contextContainer) {
      return;
    }

    this.contextContainer.empty();

    if (this.contextChips.length === 0) {
      this.contextContainer.createDiv({
        cls: "codex-agent-empty",
        text: "No context attached. Start with the active note or selected text."
      });
      return;
    }

    this.contextChips.forEach((chip) => {
      const chipEl = this.contextContainer.createDiv("codex-agent-chip");
      chipEl.createSpan({ cls: `codex-agent-chip-kind is-${chip.kind}`, text: chip.kind });
      const text = chipEl.createDiv();
      text.createSpan({ cls: "codex-agent-chip-label", text: chip.label });
      text.createSpan({ cls: "codex-agent-chip-detail", text: chip.detail });
      const remove = chipEl.createEl("button", { text: "Remove" });
      remove.addEventListener("click", () => {
        this.contextChips = this.contextChips.filter((item) => item.id !== chip.id);
        this.renderContextChips();
      });
    });
  }

  renderTimeline(container) {
    const section = container.createDiv("codex-agent-section codex-agent-workbench");
    const head = section.createDiv("codex-agent-section-head");
    head.createEl("h3", { text: "Run" });
    head.createSpan({ cls: "codex-agent-muted", text: "Demo transcript" });
    this.timelineContainer = section.createDiv("codex-agent-timeline");
    this.renderTimelineItems();
  }

  renderTimelineItems() {
    if (!this.timelineContainer) {
      return;
    }

    this.timelineContainer.empty();
    this.timeline.forEach((item) => {
      const row = this.timelineContainer.createDiv(`codex-agent-event is-${item.tone}`);
      row.createDiv("codex-agent-event-marker");
      const content = row.createDiv("codex-agent-event-content");
      content.createEl("h4", { text: item.title });
      content.createEl("p", { text: item.body });
    });
  }

  renderComposer(container) {
    const composer = container.createDiv("codex-agent-composer");
    this.promptInput = composer.createEl("textarea", {
      attr: {
        placeholder: "Ask Codex to analyze, rewrite, organize, or prepare safe vault edits..."
      }
    });

    const footer = composer.createDiv("codex-agent-composer-footer");
    footer.createSpan({ text: "Writes and commands stay pending until reviewed." });

    const runButton = footer.createEl("button", { cls: "mod-cta", text: "Run demo" });
    runButton.addEventListener("click", () => this.runDemo());
  }

  attachActiveNote() {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new Notice("No active note to attach.");
      return;
    }

    this.upsertContext({
      id: `note:${file.path}`,
      label: file.basename,
      detail: file.path,
      kind: "note"
    });
  }

  attachSelection() {
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const selection = markdownView?.editor.getSelection().trim();

    if (!selection) {
      new Notice("No selected text to attach.");
      return;
    }

    const file = this.app.workspace.getActiveFile();
    this.upsertContext({
      id: `selection:${file?.path ?? "untitled"}:${selection.slice(0, 24)}`,
      label: "Selected text",
      detail: `${selection.length} characters from ${file?.basename ?? "active editor"}`,
      kind: "selection"
    });
  }

  attachSample() {
    this.upsertContext({
      id: "sample:first-phase-plan",
      label: "First phase plan",
      detail: "Demo context for Cursor-like Obsidian Agent",
      kind: "file"
    });
  }

  upsertContext(chip) {
    this.contextChips = [
      chip,
      ...this.contextChips.filter((item) => item.id !== chip.id)
    ];
    this.renderContextChips();
  }

  runDemo() {
    const prompt = this.promptInput?.value.trim();
    const target = prompt || "整理当前笔记，并给出可审查的修改建议";
    const attached = this.contextChips.length || 1;

    this.timeline = [
      {
        title: "Plan",
        body: `${this.mode === "ask" ? "Ask mode will stay read-only" : "Agent mode will prepare reviewable changes"} for: ${target}`,
        tone: "thinking"
      },
      {
        title: "Read context",
        body: `Loaded ${attached} context item${attached > 1 ? "s" : ""}: active note, selection, or explicit vault files.`,
        tone: "tool"
      },
      {
        title: "Proposed diff",
        body: "Prepared a Markdown structure pass: tighten headings, extract action items, and preserve original wording where meaning is unclear.",
        tone: "diff"
      },
      {
        title: "Command approval",
        body: "Would run: codex --ask-for-approval on-request. Waiting for user confirmation before any terminal action.",
        tone: "command"
      },
      {
        title: "Ready for review",
        body: "Demo complete. Next implementation step is wiring this transcript to real Codex CLI events.",
        tone: "done"
      }
    ];

    this.renderTimelineItems();
  }
}
