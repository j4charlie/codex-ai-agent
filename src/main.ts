import {
  Editor,
  ItemView,
  MarkdownView,
  Menu,
  Notice,
  Plugin,
  TAbstractFile,
  TFile,
  TFolder,
  WorkspaceLeaf
} from "obsidian";

const VIEW_TYPE_CODEX_AGENT = "codex-agent-view";

type AgentMode = "ask" | "agent";

interface ContextChip {
  id: string;
  label: string;
  detail: string;
  kind: "selection" | "file" | "folder";
  path?: string;
  text?: string;
}

interface TimelineItem {
  title: string;
  body: string;
  tone: "thinking" | "tool" | "diff" | "command" | "done";
}

export default class CodexForObsidianPlugin extends Plugin {
  private selectionButtonEl: HTMLElement | null = null;

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
      this.app.workspace.on("editor-menu", (menu: Menu, editor: Editor, view: MarkdownView) => {
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
      this.app.workspace.on("file-menu", (menu: Menu, file: TAbstractFile) => {
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

  private async activateView(): Promise<CodexAgentView | null> {
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

  private showSelectionAddButton() {
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

  private hideSelectionAddButton() {
    this.selectionButtonEl?.remove();
    this.selectionButtonEl = null;
  }
}

class CodexAgentView extends ItemView {
  private mode: AgentMode = "agent";
  private contextChips: ContextChip[] = [];
  private timeline: TimelineItem[] = [
    {
      title: "Ready",
      body: "Attach note context, describe the task, then run a local foreground agent session.",
      tone: "done"
    }
  ];
  private promptInput: HTMLElement | null = null;
  private timelineContainer: HTMLElement | null = null;
  private modeButtons: Partial<Record<AgentMode, HTMLButtonElement>> = {};

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return VIEW_TYPE_CODEX_AGENT;
  }

  getDisplayText(): string {
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

  private renderHeader(container: Element) {
    const header = container.createDiv("codex-agent-header");
    const titleWrap = header.createDiv();
    titleWrap.createEl("p", { cls: "codex-agent-kicker", text: "LOCAL FOREGROUND AGENT" });
    titleWrap.createEl("h2", { text: "Codex Agent" });

    const status = header.createDiv("codex-agent-status");
    status.createSpan("codex-agent-status-dot");
    status.createSpan({ text: "CLI ready" });
  }

  private renderModeSwitch(container: Element) {
    const section = container.createDiv("codex-agent-section codex-agent-mode-row");
    this.modeButtons.ask = this.createModeButton(section, "ask", "Ask", "Read-only planning and research");
    this.modeButtons.agent = this.createModeButton(section, "agent", "Agent", "Reviewable vault edits and commands");
    this.updateModeButtons();
  }

  private createModeButton(parent: HTMLElement, mode: AgentMode, label: string, caption: string) {
    const button = parent.createEl("button", { cls: "codex-agent-mode" });
    button.createSpan({ cls: "codex-agent-mode-label", text: label });
    button.createSpan({ cls: "codex-agent-mode-caption", text: caption });
    button.addEventListener("click", () => {
      this.mode = mode;
      this.updateModeButtons();
    });
    return button;
  }

  private updateModeButtons() {
    Object.entries(this.modeButtons).forEach(([mode, button]) => {
      button?.toggleClass("is-active", mode === this.mode);
    });
  }

  private renderTimeline(container: Element) {
    const section = container.createDiv("codex-agent-section codex-agent-workbench");
    const head = section.createDiv("codex-agent-section-head");
    head.createEl("h3", { text: "Run" });
    head.createSpan({ cls: "codex-agent-muted", text: "Demo transcript" });
    this.timelineContainer = section.createDiv("codex-agent-timeline");
    this.renderTimelineItems();
  }

  private renderTimelineItems() {
    if (!this.timelineContainer) {
      return;
    }

    this.timelineContainer.empty();
    this.timeline.forEach((item) => {
      const row = this.timelineContainer!.createDiv(`codex-agent-event is-${item.tone}`);
      row.createDiv("codex-agent-event-marker");
      const content = row.createDiv("codex-agent-event-content");
      content.createEl("h4", { text: item.title });
      content.createEl("p", { text: item.body });
    });
  }

  private renderComposer(container: Element) {
    const composer = container.createDiv("codex-agent-composer");
    const inputBox = composer.createDiv("codex-agent-input-box");
    this.promptInput = inputBox.createDiv({
      cls: "codex-agent-prompt-editor is-empty",
      attr: {
        contenteditable: "true",
        "data-placeholder": "Ask Codex to analyze, rewrite, organize, or prepare safe vault edits..."
      }
    });
    this.promptInput.addEventListener("input", () => this.updatePromptEmptyState());
    this.promptInput.addEventListener("focus", () => this.updatePromptEmptyState());

    const footer = inputBox.createDiv("codex-agent-composer-footer");
    const controls = footer.createDiv("codex-agent-composer-controls");
    const modeButton = controls.createEl("button", { cls: "codex-agent-pill-button", text: this.mode === "agent" ? "Agent" : "Ask" });
    modeButton.addEventListener("click", () => {
      this.mode = this.mode === "agent" ? "ask" : "agent";
      modeButton.setText(this.mode === "agent" ? "Agent" : "Ask");
      this.updateModeButtons();
    });
    controls.createSpan({ text: "Auto" });

    const runButton = footer.createEl("button", { cls: "mod-cta", text: "Run demo" });
    runButton.addEventListener("click", () => this.runDemo());
  }

  addFileContext(file: TFile) {
    this.upsertContext({
      id: `file:${file.path}`,
      label: file.name,
      detail: file.path,
      kind: "file",
      path: file.path
    });
    new Notice(`已添加文件到对话：${file.name}`);
  }

  addFolderContext(folder: TFolder) {
    this.upsertContext({
      id: `folder:${folder.path}`,
      label: folder.name || folder.path,
      detail: folder.path,
      kind: "folder",
      path: folder.path
    });
    new Notice(`已添加路径到对话：${folder.path}`);
  }

  addSelectionContext(selection: string, file: TFile | null) {
    if (!selection) {
      return;
    }

    this.upsertContext({
      id: `selection:${file?.path ?? "untitled"}:${Date.now()}`,
      label: "Selected text",
      detail: `${selection.length} characters from ${file?.basename ?? "active editor"}`,
      kind: "selection",
      path: file?.path,
      text: selection
    });
    new Notice("已添加选中文本到对话");
  }

  private upsertContext(chip: ContextChip) {
    this.contextChips = [
      chip,
      ...this.contextChips.filter((item) => item.id !== chip.id)
    ];
    this.insertOrUpdateChip(chip);
  }

  private insertOrUpdateChip(chip: ContextChip) {
    if (!this.promptInput) {
      return;
    }

    if (chip.kind === "selection") {
      const count = this.contextChips.filter((item) => item.kind === "selection").length;
      const existing = this.promptInput.querySelector<HTMLElement>("[data-context-kind='selection']");
      if (existing) {
        existing.querySelector(".codex-agent-chip-label")?.setText(`${count}个已选文本片段`);
        return;
      }
      this.insertChipElement({
        id: "selection-summary",
        kind: "selection",
        label: `${count}个已选文本片段`
      });
      return;
    }

    const existing = this.promptInput.querySelector(`[data-context-id='${CSS.escape(chip.id)}']`);
    if (existing) {
      return;
    }

    this.insertChipElement(chip);
  }

  private insertChipElement(chip: Pick<ContextChip, "id" | "kind" | "label" | "path">) {
    if (!this.promptInput) {
      return;
    }

    const chipEl = document.createElement("span");
    chipEl.addClass("codex-agent-chip", `is-${chip.kind}`);
    chipEl.setAttr("contenteditable", "false");
    chipEl.setAttr("data-context-id", chip.id);
    chipEl.setAttr("data-context-kind", chip.kind);
    if (chip.path) {
      chipEl.setAttr("data-context-path", chip.path);
    }
    chipEl.createSpan({
      cls: `codex-agent-chip-icon is-${chip.kind}`,
      text: chip.kind === "folder" ? "▣" : chip.kind === "file" ? "◉" : "∞"
    });
    chipEl.createSpan({ cls: "codex-agent-chip-label", text: chip.label });
    const remove = chipEl.createEl("button", {
      text: "×",
      attr: {
        type: "button",
        "aria-label": `Remove ${chip.label}`
      }
    });
    remove.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (chip.kind === "selection") {
        this.contextChips = this.contextChips.filter((item) => item.kind !== "selection");
      } else {
        this.contextChips = this.contextChips.filter((item) => item.id !== chip.id);
      }
      chipEl.remove();
      this.updatePromptEmptyState();
    });

    this.insertNodeAtPromptCaret(chipEl);
    this.updatePromptEmptyState();
  }

  private insertNodeAtPromptCaret(node: HTMLElement) {
    if (!this.promptInput) {
      return;
    }

    const selection = window.getSelection();
    const hasPromptSelection = selection
      && selection.rangeCount > 0
      && this.promptInput.contains(selection.getRangeAt(0).commonAncestorContainer);

    const range = hasPromptSelection
      ? selection!.getRangeAt(0)
      : document.createRange();

    if (!hasPromptSelection) {
      range.selectNodeContents(this.promptInput);
      range.collapse(false);
    }

    const fragment = document.createDocumentFragment();
    const before = document.createTextNode(" ");
    const after = document.createTextNode(" ");
    fragment.append(before, node, after);

    range.deleteContents();
    range.insertNode(fragment);
    range.setStartAfter(after);
    range.collapse(true);

    selection?.removeAllRanges();
    selection?.addRange(range);
    this.promptInput.focus();
  }

  private updatePromptEmptyState() {
    if (!this.promptInput) {
      return;
    }

    const hasText = this.promptInput.innerText.trim().length > 0;
    const hasChip = Boolean(this.promptInput.querySelector(".codex-agent-chip"));
    this.promptInput.toggleClass("is-empty", !hasText && !hasChip);
  }

  private runDemo() {
    const prompt = this.promptInput?.innerText.trim();
    const target = prompt || "整理当前笔记，并给出可审查的修改建议";
    const payload = this.buildDemoPayload(target);
    const attached = payload.context.length;
    const summary = payload.context.length > 0
      ? payload.context.map((item) => {
        if (item.kind === "selection") {
          return `selection from ${item.path ?? "active editor"} (${item.text?.length ?? 0} chars)`;
        }
        return `${item.kind}: ${item.path}`;
      }).join("; ")
      : "no attached context";

    this.timeline = [
      {
        title: "Plan",
        body: `${this.mode === "ask" ? "Ask mode will stay read-only" : "Agent mode will prepare reviewable changes"} for: ${target}`,
        tone: "thinking"
      },
      {
        title: "Read context",
        body: `Prepared ${attached} structured context item${attached === 1 ? "" : "s"}: ${summary}.`,
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

  private buildDemoPayload(prompt: string) {
    return {
      prompt,
      context: this.contextChips.map((chip) => ({
        id: chip.id,
        kind: chip.kind,
        label: chip.label,
        path: chip.path,
        text: chip.kind === "selection" ? chip.text : undefined
      }))
    };
  }
}
