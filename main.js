const {
  ItemView,
  MarkdownView,
  Notice,
  Plugin,
  TFile,
  TFolder
} = require("obsidian");

const VIEW_TYPE_CODEX_AGENT = "codex-agent-view";

module.exports = class CodexForObsidianPlugin extends Plugin {
  constructor(app, manifest) {
    super(app, manifest);
    this.selectionButtonEl = null;
  }

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

    this.addCommand({
      id: "attach-active-note-to-codex-agent",
      name: "Attach active note to Codex Agent",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        if (!file) {
          new Notice("No active note to add.");
          return;
        }
        const view = await this.activateView();
        view?.addFileContext(file);
      }
    });

    this.registerEvent(
      this.app.workspace.on("editor-menu", (menu, editor, view) => {
        const selection = editor.getSelection().trim();
        if (!selection) {
          return;
        }

        menu.addItem((item) => {
          item
            .setTitle("添加到对话")
            .setIcon("message-square-plus")
            .onClick(async () => {
              const agentView = await this.activateView();
              agentView?.addSelectionContext(selection, view.file);
            });
        });
      })
    );

    this.registerEvent(
      this.app.workspace.on("file-menu", (menu, file) => {
        if (file instanceof TFile) {
          menu.addItem((item) => {
            item
              .setTitle("添加文件到对话")
              .setIcon("file-plus")
              .onClick(async () => {
                const view = await this.activateView();
                view?.addFileContext(file);
              });
          });
          return;
        }

        if (file instanceof TFolder) {
          menu.addItem((item) => {
            item
              .setTitle("添加路径到对话")
              .setIcon("folder-plus")
              .onClick(async () => {
                const view = await this.activateView();
                view?.addFolderContext(file);
              });
          });
        }
      })
    );

    this.registerDomEvent(document, "mouseup", () => {
      window.setTimeout(() => this.showSelectionAddButton(), 0);
    });

    this.registerDomEvent(document, "keydown", () => {
      this.hideSelectionAddButton();
    });
  }

  async onunload() {
    this.hideSelectionAddButton();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CODEX_AGENT);
  }

  async activateView() {
    const existing = this.app.workspace.getLeavesOfType(VIEW_TYPE_CODEX_AGENT)[0];

    if (existing) {
      this.app.workspace.revealLeaf(existing);
      return existing.view instanceof CodexAgentView ? existing.view : null;
    }

    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) {
      return null;
    }

    await leaf.setViewState({
      type: VIEW_TYPE_CODEX_AGENT,
      active: true
    });

    this.app.workspace.revealLeaf(leaf);
    return leaf.view instanceof CodexAgentView ? leaf.view : null;
  }

  showSelectionAddButton() {
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const selection = markdownView?.editor.getSelection().trim();

    if (!selection) {
      this.hideSelectionAddButton();
      return;
    }

    const domSelection = document.getSelection();
    if (!domSelection || domSelection.rangeCount === 0) {
      return;
    }

    const rect = domSelection.getRangeAt(0).getBoundingClientRect();
    if (!rect || rect.width === 0 && rect.height === 0) {
      return;
    }

    this.hideSelectionAddButton();
    const button = document.body.createEl("button", {
      cls: "codex-agent-selection-popover",
      text: "添加到对话"
    });
    button.style.left = `${Math.max(8, rect.left + rect.width / 2 - 44)}px`;
    button.style.top = `${Math.max(8, rect.top - 34)}px`;
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    button.addEventListener("click", async () => {
      const view = await this.activateView();
      view?.addSelectionContext(selection, markdownView.file);
      this.hideSelectionAddButton();
    });
    this.selectionButtonEl = button;
  }

  hideSelectionAddButton() {
    this.selectionButtonEl?.remove();
    this.selectionButtonEl = null;
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

  renderContextChips() {
    if (!this.contextContainer) {
      return;
    }

    this.contextContainer.empty();

    const groupedSelectionCount = this.contextChips.filter((chip) => chip.kind === "selection").length;
    const nonSelectionChips = this.contextChips.filter((chip) => chip.kind !== "selection");

    if (groupedSelectionCount > 0) {
      const chipEl = this.contextContainer.createDiv("codex-agent-chip is-selection-summary");
      chipEl.createSpan({ cls: "codex-agent-chip-icon", text: "∞" });
      chipEl.createSpan({ cls: "codex-agent-chip-label", text: `${groupedSelectionCount}个已选文本片段` });
      const remove = chipEl.createEl("button", { text: "×", attr: { "aria-label": "Remove selected text context" } });
      remove.addEventListener("click", () => {
        this.contextChips = this.contextChips.filter((item) => item.kind !== "selection");
        this.renderContextChips();
      });
    }

    nonSelectionChips.forEach((chip) => {
      const chipEl = this.contextContainer.createDiv("codex-agent-chip");
      chipEl.createSpan({
        cls: `codex-agent-chip-icon is-${chip.kind}`,
        text: chip.kind === "folder" ? "▣" : "◉"
      });
      chipEl.createSpan({ cls: "codex-agent-chip-label", text: chip.label });
      const remove = chipEl.createEl("button", { text: "×", attr: { "aria-label": `Remove ${chip.label}` } });
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
    const inputBox = composer.createDiv("codex-agent-input-box");
    const promptLine = inputBox.createDiv("codex-agent-prompt-line");
    this.contextContainer = promptLine.createDiv("codex-agent-context-inline");
    this.renderContextChips();

    this.promptInput = promptLine.createEl("textarea", {
      attr: {
        placeholder: "Ask Codex to analyze, rewrite, organize, or prepare safe vault edits..."
      }
    });

    const footer = inputBox.createDiv("codex-agent-composer-footer");
    const controls = footer.createDiv("codex-agent-composer-controls");
    const modeButton = controls.createEl("button", {
      cls: "codex-agent-pill-button",
      text: this.mode === "agent" ? "Agent" : "Ask"
    });
    modeButton.addEventListener("click", () => {
      this.mode = this.mode === "agent" ? "ask" : "agent";
      modeButton.setText(this.mode === "agent" ? "Agent" : "Ask");
      this.updateModeButtons();
    });
    controls.createSpan({ text: "Auto" });

    const runButton = footer.createEl("button", { cls: "mod-cta", text: "Run demo" });
    runButton.addEventListener("click", () => this.runDemo());
  }

  addFileContext(file) {
    this.upsertContext({
      id: `file:${file.path}`,
      label: file.name,
      detail: file.path,
      kind: "file"
    });
    new Notice(`已添加文件到对话：${file.name}`);
  }

  addFolderContext(folder) {
    this.upsertContext({
      id: `folder:${folder.path}`,
      label: folder.name || folder.path,
      detail: folder.path,
      kind: "folder"
    });
    new Notice(`已添加路径到对话：${folder.path}`);
  }

  addSelectionContext(selection, file) {
    if (!selection) {
      return;
    }

    this.upsertContext({
      id: `selection:${file?.path ?? "untitled"}:${Date.now()}`,
      label: "Selected text",
      detail: `${selection.length} characters from ${file?.basename ?? "active editor"}`,
      kind: "selection"
    });
    new Notice("已添加选中文本到对话");
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
        body: `Loaded ${attached} context item${attached > 1 ? "s" : ""}: selected text, files, or folders added through runtime plugin menus.`,
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
