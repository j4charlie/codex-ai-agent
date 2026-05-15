const {
  ItemView,
  MarkdownView,
  MarkdownRenderer,
  Menu,
  Notice,
  Plugin,
  TFile,
  TFolder
} = require("obsidian");
const { spawn } = require("child_process");

const VIEW_TYPE_CODEX_AGENT = "codex-agent-view";
const DEFAULT_CODEX_BIN = "/Users/charlieli/.local/bin/codex";

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
    this.reasoningLevel = "中";
    this.modelChoice = "GPT-5.5";
    this.speedChoice = "标准";
    this.sessions = [];
    this.activeSessionId = "";
    this.runningSessionId = null;
    this.promptInput = null;
    this.tabContainer = null;
    this.timelineContainer = null;
    this.workbenchContainer = null;
    this.modeButton = null;
    this.modelButton = null;
    this.speedButton = null;
    this.runButton = null;
    this.runningProcess = null;
    this.liveStatusEl = null;
    this.liveStatusTextEl = null;
    this.elapsedTimer = null;
    const session = this.createSession();
    this.sessions = [session];
    this.activeSessionId = session.id;
  }

  getViewType() {
    return VIEW_TYPE_CODEX_AGENT;
  }

  getDisplayText() {
    return "Codex Agent";
  }

  async onClose() {
    this.stopElapsedTimer();
    if (this.runningProcess) {
      this.runningProcess.kill();
      this.runningProcess = null;
    }
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("codex-agent-panel");

    this.renderHeader(container);
    this.renderTabs(container);
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

  renderTabs(container) {
    this.tabContainer = container.createDiv("codex-agent-tabbar");
    this.renderSessionTabs();
  }

  renderSessionTabs() {
    if (!this.tabContainer) {
      return;
    }

    this.tabContainer.empty();
    this.sessions.forEach((session) => {
      const tab = this.tabContainer.createEl("button", {
        cls: `codex-agent-tab ${session.id === this.activeSessionId ? "is-active" : ""}`
      });
      tab.createSpan({ cls: "codex-agent-tab-icon", text: "▱" });
      tab.createSpan({ cls: "codex-agent-tab-title", text: session.title });
      const close = tab.createSpan({ cls: "codex-agent-tab-close", text: "×" });

      tab.addEventListener("click", () => {
        this.activeSessionId = session.id;
        this.renderSessionTabs();
        this.renderTimelineItems();
      });

      close.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.closeSession(session.id);
      });
    });

    const add = this.tabContainer.createEl("button", { cls: "codex-agent-tab-add", text: "+" });
    add.addEventListener("click", () => this.addSession());
  }

  renderTimeline(container) {
    const section = container.createDiv("codex-agent-workbench");
    this.workbenchContainer = section;
    this.timelineContainer = section.createDiv("codex-agent-timeline");
    this.renderTimelineItems();
  }

  renderTimelineItems() {
    if (!this.timelineContainer) {
      return;
    }

    const session = this.getActiveSession();
    this.timelineContainer.empty();
    session.timeline.forEach((item) => {
      const row = this.timelineContainer.createDiv(`codex-agent-event is-${item.tone}`);
      row.createDiv("codex-agent-event-marker");
      const content = row.createDiv("codex-agent-event-content");
      if (item.tone === "response") {
        const markdown = content.createDiv("codex-agent-markdown");
        MarkdownRenderer.renderMarkdown(item.body, markdown, "", this);
      } else {
        content.createEl("h4", { text: item.title });
        content.createEl("p", { text: item.body });
      }
    });
    this.timelineContainer.scrollTo({
      top: this.timelineContainer.scrollHeight,
      behavior: "smooth"
    });
  }

  renderComposer(container) {
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
    this.promptInput.addEventListener("keydown", (event) => this.handlePromptKeydown(event));

    const footer = inputBox.createDiv("codex-agent-composer-footer");
    const controls = footer.createDiv("codex-agent-composer-controls");
    this.modeButton = controls.createEl("button", {
      cls: "codex-agent-pill-button",
      text: this.mode === "agent" ? "Agent" : "Ask"
    });
    this.modeButton.addEventListener("click", (event) => this.openModeMenu(event));

    this.modelButton = controls.createEl("button", { cls: "codex-agent-select-button", text: this.modelChoice });
    this.modelButton.addEventListener("click", (event) => this.openModelMenu(event));

    this.speedButton = controls.createEl("button", { cls: "codex-agent-select-button", text: `${this.reasoningLevel} · ${this.speedChoice}` });
    this.speedButton.addEventListener("click", (event) => this.openReasoningMenu(event));

    this.runButton = footer.createEl("button", { cls: "mod-cta", text: "Run Codex" });
    this.runButton.addEventListener("click", () => this.runCodex());
  }

  openModeMenu(event) {
    const menu = new Menu();
    ["ask", "agent"].forEach((mode) => {
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

  openModelMenu(event) {
    const menu = new Menu();
    ["GPT-5.5", "GPT-5.4", "GPT-5.4 Mini", "GPT-5.3 Codex"].forEach((model) => {
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

  openReasoningMenu(event) {
    const menu = new Menu();
    ["智能", "低", "中", "高", "超高"].forEach((level) => {
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
    ["标准", "快速"].forEach((speed) => {
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

  updateComposerControls() {
    this.modeButton?.setText(this.mode === "agent" ? "Agent" : "Ask");
    this.modelButton?.setText(this.modelChoice);
    this.speedButton?.setText(`${this.reasoningLevel} · ${this.speedChoice}`);
  }

  addFileContext(file) {
    this.upsertContext({
      id: `file:${file.path}`,
      label: file.name,
      detail: file.path,
      kind: "file",
      path: file.path
    });
    new Notice(`已添加文件到对话：${file.name}`);
  }

  addFolderContext(folder) {
    this.upsertContext({
      id: `folder:${folder.path}`,
      label: folder.name || folder.path,
      detail: folder.path,
      kind: "folder",
      path: folder.path
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
      kind: "selection",
      path: file?.path,
      text: selection
    });
    new Notice("已添加选中文本到对话");
  }

  upsertContext(chip) {
    this.contextChips = [
      chip,
      ...this.contextChips.filter((item) => item.id !== chip.id)
    ];
    this.insertOrUpdateChip(chip);
  }

  insertOrUpdateChip(chip) {
    if (!this.promptInput) {
      return;
    }

    if (chip.kind === "selection") {
      const count = this.contextChips.filter((item) => item.kind === "selection").length;
      const existing = this.promptInput.querySelector("[data-context-kind='selection']");
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

  insertChipElement(chip) {
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

  insertNodeAtPromptCaret(node) {
    if (!this.promptInput) {
      return;
    }

    const selection = window.getSelection();
    const hasPromptSelection = selection
      && selection.rangeCount > 0
      && this.promptInput.contains(selection.getRangeAt(0).commonAncestorContainer);

    const range = hasPromptSelection
      ? selection.getRangeAt(0)
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

  updatePromptEmptyState() {
    if (!this.promptInput) {
      return;
    }

    const hasText = this.promptInput.innerText.trim().length > 0;
    const hasChip = Boolean(this.promptInput.querySelector(".codex-agent-chip"));
    this.promptInput.toggleClass("is-empty", !hasText && !hasChip);
  }

  handlePromptKeydown(event) {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();
    if (!this.runningProcess) {
      this.runCodex();
    }
  }

  async runCodex() {
    if (this.runningProcess) {
      this.runningProcess.kill();
      this.runningProcess = null;
      this.runButton?.setText("Run Codex");
      this.stopElapsedTimer();
      this.appendTimelineItem({
        title: "Stopped",
        body: "Codex process was stopped by the user.",
        tone: "command"
      });
      this.runningSessionId = null;
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

    const session = this.getActiveSession();
    session.title = this.makeSessionTitle(target);
    session.timeline = [
      {
        title: "正在思考",
        body: attached > 0 ? `已读取 ${attached} 个上下文：${summary}` : "未添加上下文",
        tone: "status"
      }
    ];
    session.statusItemIndex = 0;
    session.runStartedAt = Date.now();
    this.runningSessionId = session.id;
    this.renderSessionTabs();
    this.startElapsedTimer();

    this.renderTimelineItems();

    const vaultPath = this.app.vault.adapter.getBasePath();
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
    this.setLiveStatus("thinking", "正在思考");
    this.clearComposer();

    child.stdin.write(this.composeCodexPrompt(payload));
    child.stdin.end();

    let stdoutBuffer = "";
    let stderrBuffer = "";

    child.stdout.on("data", (chunk) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() ?? "";
      lines.forEach((line) => this.handleCodexLine(line, "stdout"));
    });

    child.stderr.on("data", (chunk) => {
      this.setLiveStatus("running", "正在运行");
      stderrBuffer += chunk.toString();
      const lines = stderrBuffer.split(/\r?\n/);
      stderrBuffer = lines.pop() ?? "";
      lines.forEach((line) => this.handleCodexLine(line, "stderr"));
    });

    child.on("error", (error) => {
      this.setLiveStatus("error", "启动失败");
      this.appendTimelineItem({
        title: "Codex failed to start",
        body: `${error.message}. Tried: ${codexBin}`,
        tone: "command"
      });
    });

    child.on("close", (code) => {
      if (stdoutBuffer.trim()) {
        this.handleCodexLine(stdoutBuffer, "stdout");
      }
      if (stderrBuffer.trim()) {
        this.handleCodexLine(stderrBuffer, "stderr");
      }

      this.runningProcess = null;
      this.runningSessionId = null;
      this.runButton?.setText("Run Codex");
      this.stopElapsedTimer();
      this.setLiveStatus(code === 0 ? "done" : "error", code === 0 ? "已完成" : "运行失败");
      if (code !== 0) {
        this.appendTimelineItem({
          title: "Run failed",
          body: `Codex exited with code ${code ?? "unknown"}.`,
          tone: "command"
        });
      } else {
        this.updateTranscriptStatus(`已处理 ${this.getElapsedLabel()}`, "");
      }
    });
  }

  getPromptText() {
    if (!this.promptInput) {
      return "";
    }

    const clone = this.promptInput.cloneNode(true);
    clone.querySelectorAll(".codex-agent-chip").forEach((node) => node.remove());
    return clone.innerText.trim();
  }

  clearComposer() {
    this.contextChips = [];
    if (this.promptInput) {
      this.promptInput.empty();
      this.updatePromptEmptyState();
    }
  }

  async buildCodexPayload(prompt) {
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

  buildFolderTree(folder, depth = 0) {
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

  composeCodexPrompt(payload) {
    const contextBlocks = payload.context.map((item) => {
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

  handleCodexLine(line, stream) {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    if (!trimmed.startsWith("{")) {
      if (this.shouldIgnoreCodexLog(trimmed)) {
        return;
      }

      this.updateTranscriptStatus(`正在运行 ${this.getElapsedLabel()}`, trimmed.length > 160 ? `${trimmed.slice(0, 160)}...` : trimmed);
      return;
    }

    try {
      const event = JSON.parse(trimmed);
      const mapped = this.mapCodexEvent(event);
      if (mapped) {
        this.appendTimelineItem(mapped);
      }
    } catch {
      this.appendTimelineItem({
        title: "Unparsed Codex output",
        body: trimmed,
        tone: "command"
      });
    }
  }

  mapCodexEvent(event) {
    if (event.type === "thread.started") {
      this.setLiveStatus("thinking", "正在思考");
      this.updateTranscriptStatus("正在思考");
      return null;
    }

    if (event.type === "turn.started") {
      this.setLiveStatus("thinking", "正在思考");
      this.updateTranscriptStatus("正在思考");
      return null;
    }

    if (event.type === "item.completed") {
      const item = event.item ?? {};
      if (item.type === "agent_message") {
        this.setLiveStatus("thinking", "正在整理回复");
        this.updateTranscriptStatus(`已处理 ${this.getElapsedLabel()}`, "");
        return {
          title: "",
          body: item.text ?? "",
          tone: "response"
        };
      }
      this.setLiveStatus(item.type?.includes("command") ? "running" : "thinking", item.type?.includes("command") ? "正在运行" : "正在处理");
      this.updateTranscriptStatus(item.type?.includes("command") ? `正在运行 ${this.getElapsedLabel()}` : `正在处理 ${this.getElapsedLabel()}`, this.describeCodexItem(item));
      return null;
    }

    if (event.type === "turn.completed") {
      this.setLiveStatus("done", "已完成");
      const usage = event.usage;
      this.updateTranscriptStatus(`已处理 ${this.getElapsedLabel()}`, usage ? `input ${usage.input_tokens} · cached ${usage.cached_input_tokens} · output ${usage.output_tokens} · reasoning ${usage.reasoning_output_tokens}` : "");
      return null;
    }

    this.updateTranscriptStatus("正在处理", JSON.stringify(event).slice(0, 160));
    return null;
  }

  shouldIgnoreCodexLog(line) {
    return line.includes("WARN codex_core_plugins")
      || line.includes("WARN codex_core_skills")
      || line.includes("WARN codex_rollout::list")
      || line.includes("Cloudflare")
      || line.includes("<html>")
      || line.includes("Enable JavaScript and cookies");
  }

  describeCodexItem(item) {
    if (item.command) {
      return Array.isArray(item.command) ? item.command.join(" ") : String(item.command);
    }
    if (item.text) {
      return item.text;
    }
    return JSON.stringify(item).slice(0, 700);
  }

  appendTimelineItem(item) {
    const session = this.getTargetSession();
    session.timeline = [...session.timeline, item];
    if (session.id === this.activeSessionId) {
      this.renderTimelineItems();
    }
  }

  updateTranscriptStatus(title, body = "") {
    const item = { title, body, tone: "status" };
    const session = this.getTargetSession();
    if (session.statusItemIndex === null || !session.timeline[session.statusItemIndex]) {
      session.timeline = [...session.timeline, item];
      session.statusItemIndex = session.timeline.length - 1;
    } else {
      session.timeline[session.statusItemIndex] = item;
    }
    if (session.id === this.activeSessionId) {
      this.renderTimelineItems();
    }
  }

  getElapsedLabel() {
    const session = this.getTargetSession();
    if (!session.runStartedAt) {
      return "0s";
    }

    const totalSeconds = Math.max(0, Math.round((Date.now() - session.runStartedAt) / 1000));
    if (totalSeconds < 60) {
      return `${totalSeconds}s`;
    }
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }

  startElapsedTimer() {
    this.stopElapsedTimer();
    this.elapsedTimer = window.setInterval(() => {
      if (this.runningProcess) {
        this.updateTranscriptStatus(`正在思考 ${this.getElapsedLabel()}`);
      }
    }, 1000);
  }

  stopElapsedTimer() {
    if (this.elapsedTimer !== null) {
      window.clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
  }

  setLiveStatus(status, text) {
    if (!this.liveStatusEl || !this.liveStatusTextEl) {
      return;
    }

    this.liveStatusEl.removeClasses(["is-idle", "is-thinking", "is-running", "is-done", "is-error"]);
    this.liveStatusEl.addClass(`is-${status}`);
    this.liveStatusTextEl.setText(text);
  }

  toCodexModel(model) {
    const mapping = {
      "GPT-5.5": "gpt-5.5",
      "GPT-5.4": "gpt-5.4",
      "GPT-5.4 Mini": "gpt-5.4-mini",
      "GPT-5.3 Codex": "gpt-5.3-codex"
    };
    return mapping[model];
  }

  createSession(title = "New Agent") {
    return {
      id: `session-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      timeline: [],
      statusItemIndex: null,
      runStartedAt: 0
    };
  }

  addSession() {
    const session = this.createSession();
    this.sessions = [...this.sessions, session];
    this.activeSessionId = session.id;
    this.renderSessionTabs();
    this.renderTimelineItems();
  }

  closeSession(sessionId) {
    if (this.runningSessionId === sessionId && this.runningProcess) {
      this.runningProcess.kill();
      this.runningProcess = null;
      this.runningSessionId = null;
      this.stopElapsedTimer();
      this.runButton?.setText("Run Codex");
    }

    this.sessions = this.sessions.filter((session) => session.id !== sessionId);
    if (this.sessions.length === 0) {
      this.sessions = [this.createSession()];
    }
    if (!this.sessions.some((session) => session.id === this.activeSessionId)) {
      this.activeSessionId = this.sessions[0].id;
    }
    this.renderSessionTabs();
    this.renderTimelineItems();
  }

  getActiveSession() {
    return this.sessions.find((session) => session.id === this.activeSessionId) ?? this.sessions[0];
  }

  getTargetSession() {
    return this.sessions.find((session) => session.id === this.runningSessionId)
      ?? this.getActiveSession();
  }

  makeSessionTitle(prompt) {
    const compact = prompt.replace(/\s+/g, " ").trim();
    if (!compact) {
      return "New Agent";
    }
    return compact.length > 22 ? `${compact.slice(0, 22)}...` : compact;
  }
}
