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

declare const require: any;
declare const process: any;
const { spawn } = require("child_process");

const VIEW_TYPE_CODEX_AGENT = "codex-agent-view";
const DEFAULT_CODEX_BIN = "/Users/charlieli/.local/bin/codex";

type AgentMode = "ask" | "agent";
type ReasoningLevel = "智能" | "低" | "中" | "高" | "超高";
type ModelChoice = "GPT-5.5" | "GPT-5.4" | "GPT-5.4 Mini" | "GPT-5.3 Codex";
type SpeedChoice = "标准" | "快速";

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
  private reasoningLevel: ReasoningLevel = "中";
  private modelChoice: ModelChoice = "GPT-5.5";
  private speedChoice: SpeedChoice = "标准";
  private timeline: TimelineItem[] = [
    {
      title: "Ready",
      body: "Attach note context, describe the task, then run a local foreground agent session.",
      tone: "done"
    }
  ];
  private promptInput: HTMLElement | null = null;
  private timelineContainer: HTMLElement | null = null;
  private modeButton: HTMLButtonElement | null = null;
  private modelButton: HTMLButtonElement | null = null;
  private speedButton: HTMLButtonElement | null = null;
  private runButton: HTMLButtonElement | null = null;
  private runningProcess: any = null;

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
    this.modeButton = controls.createEl("button", { cls: "codex-agent-pill-button", text: this.mode === "agent" ? "Agent" : "Ask" });
    this.modeButton.addEventListener("click", (event) => this.openModeMenu(event));

    this.modelButton = controls.createEl("button", { cls: "codex-agent-select-button", text: this.modelChoice });
    this.modelButton.addEventListener("click", (event) => this.openModelMenu(event));

    this.speedButton = controls.createEl("button", { cls: "codex-agent-select-button", text: `${this.reasoningLevel} · ${this.speedChoice}` });
    this.speedButton.addEventListener("click", (event) => this.openReasoningMenu(event));

    this.runButton = footer.createEl("button", { cls: "mod-cta", text: "Run Codex" });
    this.runButton.addEventListener("click", () => this.runCodex());
  }

  private openModeMenu(event: MouseEvent) {
    const menu = new Menu();
    (["ask", "agent"] as AgentMode[]).forEach((mode) => {
      menu.addItem((item) => {
        item
          .setTitle(mode === "agent" ? "Agent" : "Ask")
          .setChecked(this.mode === mode)
          .onClick(() => {
            this.mode = mode;
            this.updateComposerControls();
          });
      });
    });
    menu.showAtMouseEvent(event);
  }

  private openModelMenu(event: MouseEvent) {
    const menu = new Menu();
    (["GPT-5.5", "GPT-5.4", "GPT-5.4 Mini", "GPT-5.3 Codex"] as ModelChoice[]).forEach((model) => {
      menu.addItem((item) => {
        item
          .setTitle(model)
          .setChecked(this.modelChoice === model)
          .onClick(() => {
            this.modelChoice = model;
            this.updateComposerControls();
          });
      });
    });
    menu.showAtMouseEvent(event);
  }

  private openReasoningMenu(event: MouseEvent) {
    const menu = new Menu();
    (["智能", "低", "中", "高", "超高"] as ReasoningLevel[]).forEach((level) => {
      menu.addItem((item) => {
        item
          .setTitle(level)
          .setChecked(this.reasoningLevel === level)
          .onClick(() => {
            this.reasoningLevel = level;
            this.updateComposerControls();
          });
      });
    });

    menu.addSeparator();
    (["标准", "快速"] as SpeedChoice[]).forEach((speed) => {
      menu.addItem((item) => {
        item
          .setTitle(speed)
          .setChecked(this.speedChoice === speed)
          .onClick(() => {
            this.speedChoice = speed;
            this.updateComposerControls();
          });
      });
    });

    menu.showAtMouseEvent(event);
  }

  private updateComposerControls() {
    this.modeButton?.setText(this.mode === "agent" ? "Agent" : "Ask");
    this.modelButton?.setText(this.modelChoice);
    this.speedButton?.setText(`${this.reasoningLevel} · ${this.speedChoice}`);
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

  private async runCodex() {
    if (this.runningProcess) {
      this.runningProcess.kill();
      this.runningProcess = null;
      this.runButton?.setText("Run Codex");
      this.appendTimelineItem({
        title: "Stopped",
        body: "Codex process was stopped by the user.",
        tone: "command"
      });
      return;
    }

    const prompt = this.getPromptText();
    const target = prompt || "整理当前笔记，并给出可审查的修改建议";
    const payload = await this.buildCodexPayload(target);
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
        title: "Starting Codex",
        body: `${this.mode === "ask" ? "Ask mode is read-only" : "Agent mode is running in read-only sandbox for this compatibility test"} with ${this.modelChoice}, ${this.reasoningLevel} reasoning, ${this.speedChoice} speed.`,
        tone: "thinking"
      },
      {
        title: "Read context",
        body: `Prepared ${attached} structured context item${attached === 1 ? "" : "s"}: ${summary}.`,
        tone: "tool"
      },
    ];

    this.renderTimelineItems();

    const vaultPath = (this.app.vault.adapter as any).getBasePath();
    const args = [
      "exec",
      "--json",
      "--color",
      "never",
      "--sandbox",
      "read-only",
      "--ephemeral",
      "--skip-git-repo-check",
      "-C",
      vaultPath,
      "-m",
      this.toCodexModel(this.modelChoice),
      "-"
    ];

    const codexBin = process.env.CODEX_BIN || DEFAULT_CODEX_BIN;
    const child = spawn(codexBin, args, {
      cwd: vaultPath,
      stdio: ["pipe", "pipe", "pipe"]
    });

    this.runningProcess = child;
    this.runButton?.setText("Stop");

    child.stdin.write(this.composeCodexPrompt(payload));
    child.stdin.end();

    let stdoutBuffer = "";
    let stderrBuffer = "";

    child.stdout.on("data", (chunk: any) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() ?? "";
      lines.forEach((line) => this.handleCodexLine(line, "stdout"));
    });

    child.stderr.on("data", (chunk: any) => {
      stderrBuffer += chunk.toString();
      const lines = stderrBuffer.split(/\r?\n/);
      stderrBuffer = lines.pop() ?? "";
      lines.forEach((line) => this.handleCodexLine(line, "stderr"));
    });

    child.on("error", (error: Error) => {
      this.appendTimelineItem({
        title: "Codex failed to start",
        body: `${error.message}. Tried: ${codexBin}`,
        tone: "command"
      });
    });

    child.on("close", (code: number | null) => {
      if (stdoutBuffer.trim()) {
        this.handleCodexLine(stdoutBuffer, "stdout");
      }
      if (stderrBuffer.trim()) {
        this.handleCodexLine(stderrBuffer, "stderr");
      }

      this.runningProcess = null;
      this.runButton?.setText("Run Codex");
      this.appendTimelineItem({
        title: "Codex exited",
        body: `Process exited with code ${code ?? "unknown"}.`,
        tone: code === 0 ? "done" : "command"
      });
    });
  }

  private getPromptText() {
    if (!this.promptInput) {
      return "";
    }

    const clone = this.promptInput.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".codex-agent-chip").forEach((node) => node.remove());
    return clone.innerText.trim();
  }

  private async buildCodexPayload(prompt: string) {
    return {
      prompt,
      context: await Promise.all(this.contextChips.map(async (chip) => {
        if (chip.kind === "file" && chip.path) {
          const file = this.app.vault.getAbstractFileByPath(chip.path);
          return {
            id: chip.id,
            kind: chip.kind,
            label: chip.label,
            path: chip.path,
            text: file instanceof TFile ? await this.app.vault.cachedRead(file) : undefined
          };
        }

        if (chip.kind === "folder" && chip.path) {
          const folder = this.app.vault.getAbstractFileByPath(chip.path);
          return {
            id: chip.id,
            kind: chip.kind,
            label: chip.label,
            path: chip.path,
            tree: folder instanceof TFolder ? this.buildFolderTree(folder) : ""
          };
        }

        return {
          id: chip.id,
          kind: chip.kind,
          label: chip.label,
          path: chip.path,
          text: chip.text
        };
      }))
    };
  }

  private buildFolderTree(folder: TFolder, depth = 0): string {
    if (depth > 3) {
      return "";
    }

    return folder.children
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((child) => {
        const prefix = "  ".repeat(depth);
        if (child instanceof TFolder) {
          const nested = this.buildFolderTree(child, depth + 1);
          return `${prefix}${child.path}/\n${nested}`;
        }
        return `${prefix}${child.path}`;
      })
      .filter(Boolean)
      .join("\n");
  }

  private composeCodexPrompt(payload: any) {
    const contextBlocks = payload.context.map((item: any) => {
      if (item.kind === "selection") {
        return `[Selection from ${item.path ?? "active editor"}]\n${item.text ?? ""}`;
      }
      if (item.kind === "file") {
        return `[File: ${item.path}]\n${item.text ?? ""}`;
      }
      return `[Folder tree: ${item.path}]\n${item.tree ?? ""}`;
    }).join("\n\n");

    return [
      "You are running inside an Obsidian plugin compatibility test.",
      "Do not modify files. Do not run shell commands unless explicitly necessary.",
      `Mode: ${this.mode}`,
      `Reasoning: ${this.reasoningLevel}`,
      `Speed: ${this.speedChoice}`,
      "",
      "User request:",
      payload.prompt,
      "",
      "Attached context:",
      contextBlocks || "(none)"
    ].join("\n");
  }

  private handleCodexLine(line: string, stream: "stdout" | "stderr") {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    if (!trimmed.startsWith("{")) {
      this.appendTimelineItem({
        title: stream === "stderr" ? "Codex stderr" : "Codex log",
        body: trimmed.length > 500 ? `${trimmed.slice(0, 500)}...` : trimmed,
        tone: "command"
      });
      return;
    }

    try {
      const event = JSON.parse(trimmed);
      this.appendTimelineItem(this.mapCodexEvent(event));
    } catch {
      this.appendTimelineItem({
        title: "Unparsed Codex output",
        body: trimmed,
        tone: "command"
      });
    }
  }

  private mapCodexEvent(event: any): TimelineItem {
    if (event.type === "thread.started") {
      return {
        title: "Thread started",
        body: event.thread_id ?? "New Codex thread started.",
        tone: "thinking"
      };
    }

    if (event.type === "turn.started") {
      return {
        title: "Turn started",
        body: "Codex started processing the request.",
        tone: "thinking"
      };
    }

    if (event.type === "item.completed") {
      const item = event.item ?? {};
      if (item.type === "agent_message") {
        return {
          title: "Codex response",
          body: item.text ?? "",
          tone: "done"
        };
      }
      return {
        title: `Codex item: ${item.type ?? "unknown"}`,
        body: JSON.stringify(item).slice(0, 700),
        tone: item.type?.includes("command") ? "command" : "tool"
      };
    }

    if (event.type === "turn.completed") {
      const usage = event.usage;
      return {
        title: "Turn completed",
        body: usage ? `input ${usage.input_tokens}, cached ${usage.cached_input_tokens}, output ${usage.output_tokens}, reasoning ${usage.reasoning_output_tokens}` : "Codex turn completed.",
        tone: "done"
      };
    }

    return {
      title: `Codex event: ${event.type ?? "unknown"}`,
      body: JSON.stringify(event).slice(0, 700),
      tone: "tool"
    };
  }

  private appendTimelineItem(item: TimelineItem) {
    this.timeline = [...this.timeline, item];
    this.renderTimelineItems();
  }

  private toCodexModel(model: ModelChoice) {
    const mapping: Record<ModelChoice, string> = {
      "GPT-5.5": "gpt-5.5",
      "GPT-5.4": "gpt-5.4",
      "GPT-5.4 Mini": "gpt-5.4-mini",
      "GPT-5.3 Codex": "gpt-5.3-codex"
    };
    return mapping[model];
  }
}
