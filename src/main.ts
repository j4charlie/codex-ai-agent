import {
  Editor,
  ItemView,
  MarkdownView,
  MarkdownRenderer,
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
  tone: "status" | "command" | "response";
}

interface AgentSession {
  id: string;
  title: string;
  timeline: TimelineItem[];
  statusItemIndex: number | null;
  runStartedAt: number;
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
}

interface AgentPluginData {
  sessions: AgentSession[];
  archivedSessions: AgentSession[];
  activeSessionId: string;
}

type AgentRuntimeState = "idle" | "thinking" | "running" | "done" | "error";

type AgentEvent =
  | { type: "status"; state: AgentRuntimeState; title: string; detail?: string }
  | { type: "message"; markdown: string }
  | { type: "command"; command: string; cwd?: string; status: "running" | "done" | "failed" }
  | { type: "approval"; id: string; command: string; cwd?: string; reason?: string }
  | { type: "error"; title: string; message: string };

interface CodexRunRequest {
  codexBin: string;
  args: string[];
  cwd: string;
  prompt: string;
}

interface AgentRunHandle {
  cancel(): void;
}

interface CodexAdapter {
  start(
    request: CodexRunRequest,
    onEvent: (event: AgentEvent) => void,
    onClose: (code: number | null) => void
  ): AgentRunHandle;
}

class ExecJsonAdapter implements CodexAdapter {
  start(
    request: CodexRunRequest,
    onEvent: (event: AgentEvent) => void,
    onClose: (code: number | null) => void
  ): AgentRunHandle {
    const child = spawn(request.codexBin, request.args, {
      cwd: request.cwd,
      stdio: ["pipe", "pipe", "pipe"]
    });
    let stdoutBuffer = "";
    let stderrBuffer = "";

    child.stdin.write(request.prompt);
    child.stdin.end();

    child.stdout.on("data", (chunk: any) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = lines.pop() ?? "";
      lines.forEach((line) => this.handleLine(line, onEvent));
    });

    child.stderr.on("data", (chunk: any) => {
      onEvent({ type: "status", state: "running", title: "正在运行" });
      stderrBuffer += chunk.toString();
      const lines = stderrBuffer.split(/\r?\n/);
      stderrBuffer = lines.pop() ?? "";
      lines.forEach((line) => this.handleLine(line, onEvent));
    });

    child.on("error", (error: Error) => {
      onEvent({
        type: "error",
        title: "Codex failed to start",
        message: `${error.message}. Tried: ${request.codexBin}`
      });
    });

    child.on("close", (code: number | null) => {
      if (stdoutBuffer.trim()) {
        this.handleLine(stdoutBuffer, onEvent);
      }
      if (stderrBuffer.trim()) {
        this.handleLine(stderrBuffer, onEvent);
      }
      onClose(code);
    });

    return {
      cancel: () => child.kill()
    };
  }

  private handleLine(line: string, onEvent: (event: AgentEvent) => void) {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    if (!trimmed.startsWith("{")) {
      if (this.shouldIgnoreCodexLog(trimmed)) {
        return;
      }

      onEvent({
        type: "status",
        state: "running",
        title: "正在运行",
        detail: trimmed.length > 160 ? `${trimmed.slice(0, 160)}...` : trimmed
      });
      return;
    }

    try {
      const event = JSON.parse(trimmed);
      this.mapCodexEvent(event, onEvent);
    } catch {
      onEvent({
        type: "error",
        title: "Unparsed Codex output",
        message: trimmed
      });
    }
  }

  private mapCodexEvent(event: any, onEvent: (event: AgentEvent) => void) {
    if (event.type === "thread.started" || event.type === "turn.started") {
      onEvent({ type: "status", state: "thinking", title: "正在思考" });
      return;
    }

    if (event.type === "item.completed") {
      const item = event.item ?? {};
      if (item.type === "agent_message") {
        onEvent({ type: "status", state: "thinking", title: "正在整理回复" });
        onEvent({ type: "message", markdown: item.text ?? "" });
        return;
      }

      if (item.type?.includes("command")) {
        onEvent({
          type: "command",
          command: this.describeCodexItem(item),
          status: "running"
        });
        return;
      }

      onEvent({
        type: "status",
        state: "thinking",
        title: "正在处理",
        detail: this.describeCodexItem(item)
      });
      return;
    }

    if (event.type === "turn.completed") {
      const usage = event.usage;
      onEvent({
        type: "status",
        state: "done",
        title: "已完成",
        detail: usage ? `input ${usage.input_tokens} · cached ${usage.cached_input_tokens} · output ${usage.output_tokens} · reasoning ${usage.reasoning_output_tokens}` : ""
      });
      return;
    }

    onEvent({
      type: "status",
      state: "thinking",
      title: "正在处理",
      detail: JSON.stringify(event).slice(0, 160)
    });
  }

  private shouldIgnoreCodexLog(line: string) {
    return line.includes("WARN codex_core_plugins")
      || line.includes("WARN codex_core_skills")
      || line.includes("WARN codex_rollout::list")
      || line.includes("Cloudflare")
      || line.includes("<html>")
      || line.includes("Enable JavaScript and cookies");
  }

  private describeCodexItem(item: any) {
    if (item.command) {
      return Array.isArray(item.command) ? item.command.join(" ") : String(item.command);
    }
    if (item.text) {
      return item.text;
    }
    return JSON.stringify(item).slice(0, 700);
  }
}

class PtyCodexAdapter implements CodexAdapter {
  start(
    _request: CodexRunRequest,
    _onEvent: (event: AgentEvent) => void,
    _onClose: (code: number | null) => void
  ): AgentRunHandle {
    throw new Error("PTY adapter is not implemented yet.");
  }
}

export default class CodexForObsidianPlugin extends Plugin {
  private selectionButtonEl: HTMLElement | null = null;
  private agentData: AgentPluginData = {
    sessions: [],
    archivedSessions: [],
    activeSessionId: ""
  };

  async onload() {
    this.agentData = this.normalizeAgentData(await this.loadData());

    this.registerView(
      VIEW_TYPE_CODEX_AGENT,
      (leaf) => new CodexAgentView(leaf, this)
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

  getAgentData(): AgentPluginData {
    return {
      sessions: this.agentData.sessions.map((session) => ({ ...session, timeline: [...session.timeline] })),
      archivedSessions: this.agentData.archivedSessions.map((session) => ({ ...session, timeline: [...session.timeline] })),
      activeSessionId: this.agentData.activeSessionId
    };
  }

  saveAgentData(sessions: AgentSession[], archivedSessions: AgentSession[], activeSessionId: string) {
    this.agentData = {
      sessions: sessions.map((session) => ({ ...session, timeline: [...session.timeline] })),
      archivedSessions: archivedSessions.map((session) => ({ ...session, timeline: [...session.timeline] })),
      activeSessionId
    };
    void this.saveData(this.agentData);
  }

  private normalizeAgentData(data: any): AgentPluginData {
    const sessions = Array.isArray(data?.sessions)
      ? data.sessions.map((session: any) => this.normalizeSession(session)).filter(Boolean) as AgentSession[]
      : [];
    const archivedSessions = Array.isArray(data?.archivedSessions)
      ? data.archivedSessions.map((session: any) => this.normalizeSession(session)).filter(Boolean) as AgentSession[]
      : [];
    const activeSessionId = typeof data?.activeSessionId === "string" ? data.activeSessionId : "";
    return { sessions, archivedSessions, activeSessionId };
  }

  private normalizeSession(session: any): AgentSession | null {
    if (!session || typeof session.id !== "string") {
      return null;
    }
    const now = Date.now();
    return {
      id: session.id,
      title: typeof session.title === "string" ? session.title : "New Agent",
      timeline: Array.isArray(session.timeline)
        ? session.timeline
          .filter((item: any) => typeof item?.title === "string" && typeof item?.body === "string")
          .map((item: any) => ({
            title: item.title,
            body: item.body,
            tone: ["status", "command", "response"].includes(item.tone) ? item.tone : "status"
          }))
        : [],
      statusItemIndex: typeof session.statusItemIndex === "number" ? session.statusItemIndex : null,
      runStartedAt: typeof session.runStartedAt === "number" ? session.runStartedAt : 0,
      createdAt: typeof session.createdAt === "number" ? session.createdAt : now,
      updatedAt: typeof session.updatedAt === "number" ? session.updatedAt : now,
      closedAt: typeof session.closedAt === "number" ? session.closedAt : undefined
    };
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
  private adapterMode: "exec-json" | "pty" = "exec-json";
  private contextChips: ContextChip[] = [];
  private reasoningLevel: ReasoningLevel = "中";
  private modelChoice: ModelChoice = "GPT-5.5";
  private speedChoice: SpeedChoice = "标准";
  private sessions: AgentSession[] = [];
  private archivedSessions: AgentSession[] = [];
  private activeSessionId = "";
  private runningSessionId: string | null = null;
  private promptInput: HTMLElement | null = null;
  private tabContainer: HTMLElement | null = null;
  private historyPanel: HTMLElement | null = null;
  private timelineContainer: HTMLElement | null = null;
  private workbenchContainer: HTMLElement | null = null;
  private modeButton: HTMLButtonElement | null = null;
  private modelButton: HTMLButtonElement | null = null;
  private speedButton: HTMLButtonElement | null = null;
  private runButton: HTMLButtonElement | null = null;
  private runningProcess: AgentRunHandle | null = null;
  private isCancellingRun = false;
  private liveStatusEl: HTMLElement | null = null;
  private liveStatusTextEl: HTMLElement | null = null;
  private elapsedTimer: number | null = null;

  constructor(leaf: WorkspaceLeaf, private owner: CodexForObsidianPlugin) {
    super(leaf);
    const saved = this.owner.getAgentData();
    this.sessions = saved.sessions.length > 0 ? saved.sessions : [this.createSession()];
    this.archivedSessions = saved.archivedSessions;
    this.activeSessionId = this.sessions.some((session) => session.id === saved.activeSessionId)
      ? saved.activeSessionId
      : this.sessions[0].id;
  }

  getViewType(): string {
    return VIEW_TYPE_CODEX_AGENT;
  }

  getDisplayText(): string {
    return "Codex Agent";
  }

  async onClose() {
    this.stopElapsedTimer();
    if (this.runningProcess) {
      this.isCancellingRun = true;
      this.runningProcess.cancel();
      this.runningProcess = null;
    }
    this.runningSessionId = null;
    this.persistSessions();
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("codex-agent-panel");

    this.renderTabs(container);
    this.renderTimeline(container);
    this.renderComposer(container);
  }

  private renderTabs(container: Element) {
    this.tabContainer = container.createDiv("codex-agent-tabbar");
    this.renderSessionTabs();
  }

  private renderSessionTabs() {
    if (!this.tabContainer) {
      return;
    }

    this.tabContainer.empty();
    this.sessions.forEach((session) => {
      const tab = this.tabContainer!.createEl("button", {
        cls: `codex-agent-tab ${session.id === this.activeSessionId ? "is-active" : ""}`
      });
      tab.createSpan({ cls: "codex-agent-tab-icon", text: "▱" });
      tab.createSpan({ cls: "codex-agent-tab-title", text: session.title });
      const close = tab.createSpan({ cls: "codex-agent-tab-close", text: "×" });

      tab.addEventListener("click", () => {
        this.activeSessionId = session.id;
        this.persistSessions();
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

    const history = this.tabContainer.createEl("button", {
      cls: "codex-agent-history-button",
      attr: { "aria-label": "History" }
    });
    history.createSpan({ text: "◷" });
    history.addEventListener("click", () => this.toggleHistoryPanel());
  }

  private toggleHistoryPanel() {
    if (this.historyPanel) {
      this.historyPanel.remove();
      this.historyPanel = null;
      return;
    }

    this.historyPanel = this.containerEl.createDiv("codex-agent-history-panel");
    const search = this.historyPanel.createEl("input", {
      cls: "codex-agent-history-search",
      attr: {
        placeholder: "Search Agents..."
      }
    });

    const newButton = this.historyPanel.createEl("button", {
      cls: "codex-agent-history-new",
      text: "New Agent"
    });
    newButton.addEventListener("click", () => {
      this.addSession();
      this.toggleHistoryPanel();
    });

    const list = this.historyPanel.createDiv("codex-agent-history-list");
    const renderList = () => {
      const query = search.value.trim().toLowerCase();
      list.empty();
      const sessions = this.getHistorySessions()
        .filter((session) => session.title.toLowerCase().includes(query));
      this.renderHistoryGroup(list, "Today", this.filterHistoryByAge(sessions, 0, 1));
      this.renderHistoryGroup(list, "Yesterday", this.filterHistoryByAge(sessions, 1, 2));
      this.renderHistoryGroup(list, "Last 7 Days", this.filterHistoryByAge(sessions, 2, 7));
      this.renderHistoryGroup(list, "Last 30 Days", this.filterHistoryByAge(sessions, 7, 30));
    };
    search.addEventListener("input", renderList);
    renderList();
    search.focus();
  }

  private renderHistoryGroup(parent: HTMLElement, label: string, sessions: AgentSession[]) {
    parent.createDiv({ cls: "codex-agent-history-group", text: label });
    if (sessions.length === 0) {
      parent.createDiv({ cls: "codex-agent-history-empty", text: "No agents" });
      return;
    }

    sessions.forEach((session) => {
      const item = parent.createEl("button", { cls: "codex-agent-history-item" });
      item.createSpan({ cls: "codex-agent-history-icon", text: session.timeline.length > 0 ? "✓" : "✎" });
      item.createSpan({ cls: "codex-agent-history-title", text: session.title });
      item.addEventListener("click", () => {
        this.restoreSession(session.id);
        this.renderSessionTabs();
        this.renderTimelineItems();
        this.toggleHistoryPanel();
      });
    });
  }

  private getHistorySessions() {
    const byId = new Map<string, AgentSession>();
    [...this.sessions, ...this.archivedSessions].forEach((session) => byId.set(session.id, session));
    return [...byId.values()]
      .sort((a, b) => this.getSessionHistoryTime(b) - this.getSessionHistoryTime(a));
  }

  private filterHistoryByAge(sessions: AgentSession[], minDays: number, maxDays: number) {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    return sessions.filter((session) => {
      const ageDays = Math.floor((now - this.getSessionHistoryTime(session)) / day);
      return ageDays >= minDays && ageDays < maxDays;
    });
  }

  private getSessionHistoryTime(session: AgentSession) {
    return session.closedAt ?? session.updatedAt ?? session.createdAt;
  }

  private restoreSession(sessionId: string) {
    const archived = this.archivedSessions.find((session) => session.id === sessionId);
    if (archived) {
      archived.closedAt = undefined;
      archived.updatedAt = Date.now();
      this.archivedSessions = this.archivedSessions.filter((session) => session.id !== sessionId);
      this.sessions = [...this.sessions, archived];
    }
    this.activeSessionId = sessionId;
    this.persistSessions();
  }

  private renderTimeline(container: Element) {
    const section = container.createDiv("codex-agent-workbench");
    this.workbenchContainer = section;
    this.timelineContainer = section.createDiv("codex-agent-timeline");
    this.renderTimelineItems();
  }

  private renderTimelineItems() {
    if (!this.timelineContainer) {
      return;
    }

    const session = this.getActiveSession();
    this.timelineContainer.empty();
    session.timeline.forEach((item) => {
      const row = this.timelineContainer!.createDiv(`codex-agent-event is-${item.tone}`);
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
    this.promptInput.addEventListener("keydown", (event) => this.handlePromptKeydown(event));

    const footer = inputBox.createDiv("codex-agent-composer-footer");
    const controls = footer.createDiv("codex-agent-composer-controls");
    this.modeButton = controls.createEl("button", { cls: "codex-agent-pill-button", text: this.mode === "agent" ? "Agent" : "Ask" });
    this.modeButton.addEventListener("click", (event) => this.openModeMenu(event));

    this.modelButton = controls.createEl("button", { cls: "codex-agent-select-button", text: this.modelChoice });
    this.modelButton.addEventListener("click", (event) => this.openModelMenu(event));

    this.speedButton = controls.createEl("button", { cls: "codex-agent-select-button", text: `${this.reasoningLevel} · ${this.speedChoice}` });
    this.speedButton.addEventListener("click", (event) => this.openReasoningMenu(event));

    this.runButton = footer.createEl("button", { cls: "mod-cta codex-agent-submit-button", attr: { "aria-label": "Submit" } });
    this.runButton.setText("↑");
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

  private handlePromptKeydown(event: KeyboardEvent) {
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();
    if (!this.runningProcess) {
      this.runCodex();
    }
  }

  private async runCodex() {
    if (this.runningProcess) {
      this.isCancellingRun = true;
      this.runningProcess.cancel();
      this.runningProcess = null;
      this.runButton?.setText("↑");
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
    session.updatedAt = Date.now();
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
    this.isCancellingRun = false;
    this.persistSessions();
    this.renderSessionTabs();
    this.startElapsedTimer();

    this.renderTimelineItems();

    const vaultPath = (this.app.vault.adapter as any).getBasePath();
    const sandboxMode = this.getCodexSandboxMode();
    const args = [
      "exec",
      "--json",
      "--color",
      "never",
      "--sandbox",
      sandboxMode,
      "--ephemeral",
      "--skip-git-repo-check",
      "-C",
      vaultPath,
      "-m",
      this.toCodexModel(this.modelChoice),
      "-"
    ];

    const codexBin = process.env.CODEX_BIN || DEFAULT_CODEX_BIN;
    const adapter = this.getCodexAdapter();
    this.runningProcess = adapter.start(
      {
        codexBin,
        args,
        cwd: vaultPath,
        prompt: this.composeCodexPrompt(payload)
      },
      (event) => this.handleAgentEvent(event),
      (code) => this.handleAgentClose(code)
    );
    this.runButton?.setText("■");
    this.setLiveStatus("thinking", "正在思考");
    this.clearComposer();
  }

  private getPromptText() {
    if (!this.promptInput) {
      return "";
    }

    const clone = this.promptInput.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".codex-agent-chip").forEach((node) => node.remove());
    return clone.innerText.trim();
  }

  private clearComposer() {
    this.contextChips = [];
    if (this.promptInput) {
      this.promptInput.empty();
      this.updatePromptEmptyState();
    }
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
    const modeInstruction = this.mode === "agent"
      ? "Agent mode: you may run necessary shell commands and edit files inside the current Obsidian vault workspace. Keep changes focused and reviewable."
      : "Ask mode: do not modify files and do not run shell commands; analyze only and explain proposed changes.";

    return [
      "You are running inside an Obsidian plugin compatibility test.",
      modeInstruction,
      `Mode: ${this.mode}`,
      `Sandbox: ${this.getCodexSandboxMode()}`,
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

  private getCodexSandboxMode() {
    return this.mode === "agent" ? "workspace-write" : "read-only";
  }

  private getCodexAdapter(): CodexAdapter {
    if (this.adapterMode === "pty") {
      return new PtyCodexAdapter();
    }
    return new ExecJsonAdapter();
  }

  private handleAgentEvent(event: AgentEvent) {
    if (event.type === "message") {
      this.updateTranscriptStatus(`已处理 ${this.getElapsedLabel()}`, "");
      this.appendTimelineItem({
        title: "",
        body: event.markdown,
        tone: "response"
      });
      return;
    }

    if (event.type === "command") {
      this.setLiveStatus("running", "正在运行");
      this.updateTranscriptStatus(`正在运行 ${this.getElapsedLabel()}`, event.command);
      return;
    }

    if (event.type === "approval") {
      this.setLiveStatus("running", "等待审批");
      this.updateTranscriptStatus("等待审批", event.reason ?? event.command);
      return;
    }

    if (event.type === "error") {
      this.setLiveStatus("error", event.title);
      this.appendTimelineItem({
        title: event.title,
        body: event.message,
        tone: "command"
      });
      return;
    }

    this.setLiveStatus(event.state, event.title);
    this.updateTranscriptStatus(this.formatStatusTitle(event), event.detail ?? "");
  }

  private handleAgentClose(code: number | null) {
    if (this.isCancellingRun) {
      this.isCancellingRun = false;
      this.runningProcess = null;
      this.runningSessionId = null;
      this.runButton?.setText("↑");
      this.stopElapsedTimer();
      this.persistSessions();
      return;
    }

    this.runningProcess = null;
    this.runningSessionId = null;
    this.runButton?.setText("↑");
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
    this.persistSessions();
  }

  private formatStatusTitle(event: Extract<AgentEvent, { type: "status" }>) {
    if (event.state === "done") {
      return `已处理 ${this.getElapsedLabel()}`;
    }
    if (event.state === "running") {
      return `${event.title} ${this.getElapsedLabel()}`;
    }
    if (event.state === "thinking") {
      return `${event.title} ${this.getElapsedLabel()}`;
    }
    return event.title;
  }

  private setLiveStatus(status: "idle" | "thinking" | "running" | "done" | "error", text: string) {
    if (!this.liveStatusEl || !this.liveStatusTextEl) {
      return;
    }

    this.liveStatusEl.removeClasses(["is-idle", "is-thinking", "is-running", "is-done", "is-error"]);
    this.liveStatusEl.addClass(`is-${status}`);
    this.liveStatusTextEl.setText(text);
  }

  private appendTimelineItem(item: TimelineItem) {
    const session = this.getTargetSession();
    session.timeline = [...session.timeline, item];
    session.updatedAt = Date.now();
    this.persistSessions();
    if (session.id === this.activeSessionId) {
      this.renderTimelineItems();
    }
  }

  private updateTranscriptStatus(title: string, body = "") {
    const item: TimelineItem = { title, body, tone: "status" };
    const session = this.getTargetSession();
    if (session.statusItemIndex === null || !session.timeline[session.statusItemIndex]) {
      session.timeline = [...session.timeline, item];
      session.statusItemIndex = session.timeline.length - 1;
    } else {
      session.timeline[session.statusItemIndex] = item;
    }
    session.updatedAt = Date.now();
    if (session.id === this.activeSessionId) {
      this.renderTimelineItems();
    }
  }

  private getElapsedLabel() {
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

  private startElapsedTimer() {
    this.stopElapsedTimer();
    this.elapsedTimer = window.setInterval(() => {
      if (this.runningProcess) {
        this.updateTranscriptStatus(`正在思考 ${this.getElapsedLabel()}`);
      }
    }, 1000);
  }

  private stopElapsedTimer() {
    if (this.elapsedTimer !== null) {
      window.clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }
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

  private createSession(title = "New Agent"): AgentSession {
    const now = Date.now();
    return {
      id: `session-${now}-${Math.random().toString(16).slice(2)}`,
      title,
      timeline: [],
      statusItemIndex: null,
      runStartedAt: 0,
      createdAt: now,
      updatedAt: now
    };
  }

  private addSession() {
    const session = this.createSession();
    this.sessions = [...this.sessions, session];
    this.activeSessionId = session.id;
    this.persistSessions();
    this.renderSessionTabs();
    this.renderTimelineItems();
  }

  private closeSession(sessionId: string) {
    const closingSession = this.sessions.find((session) => session.id === sessionId);
    if (this.runningSessionId === sessionId && this.runningProcess) {
      this.isCancellingRun = true;
      this.runningProcess.cancel();
      this.runningProcess = null;
      this.runningSessionId = null;
      this.stopElapsedTimer();
      this.runButton?.setText("↑");
    }

    if (closingSession) {
      const now = Date.now();
      closingSession.closedAt = now;
      closingSession.updatedAt = now;
      this.archivedSessions = [
        closingSession,
        ...this.archivedSessions.filter((session) => session.id !== sessionId)
      ];
    }

    this.sessions = this.sessions.filter((session) => session.id !== sessionId);
    if (this.sessions.length === 0) {
      this.sessions = [this.createSession()];
    }
    if (!this.sessions.some((session) => session.id === this.activeSessionId)) {
      this.activeSessionId = this.sessions[0].id;
    }
    this.persistSessions();
    this.renderSessionTabs();
    this.renderTimelineItems();
  }

  private persistSessions() {
    this.owner.saveAgentData(this.sessions, this.archivedSessions, this.activeSessionId);
  }

  private getActiveSession() {
    return this.sessions.find((session) => session.id === this.activeSessionId) ?? this.sessions[0];
  }

  private getTargetSession() {
    return this.sessions.find((session) => session.id === this.runningSessionId)
      ?? this.getActiveSession();
  }

  private makeSessionTitle(prompt: string) {
    const compact = prompt.replace(/\s+/g, " ").trim();
    if (!compact) {
      return "New Agent";
    }
    return compact.length > 22 ? `${compact.slice(0, 22)}...` : compact;
  }
}
