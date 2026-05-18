import {
  Editor,
  ItemView,
  MarkdownView,
  MarkdownRenderer,
  Menu,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  setIcon,
  TAbstractFile,
  TFile,
  TFolder,
  WorkspaceLeaf
} from "obsidian";

declare const require: any;
declare const process: any;
const { spawn } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const VIEW_TYPE_CODEX_AGENT = "codex-agent-view";
const DEFAULT_CODEX_BIN = "codex";
const PLUGIN_ID = "codex-ai-agent";
const PLUGIN_NAME = "Codex AI Agent";
const PLUGIN_VERSION = "0.1.6";
const GITHUB_URL = "https://github.com/j4charlie/codex-ai-agent";
const GITHUB_ISSUES_URL = `${GITHUB_URL}/issues`;
const CODEX_MESSAGE_PARTS_MIME = "application/x-codex-agent-message-parts";
const CODEX_MESSAGE_PARTS_ATTR = "data-codex-agent-message-parts";
const COMMON_CODEX_BINS = [
  "codex",
  "/opt/homebrew/bin/codex",
  "/usr/local/bin/codex",
  "~/.local/bin/codex"
];
const AGENT_ICON_ID = "message-square";
const OPENAI_SVG_PATH = "M904.533333 435.285333c-2.730667-3.328-3.456-5.973333-2.218666-9.898666 10.197333-32.426667 13.013333-65.365333 7.466666-99.029334a220.501333 220.501333 0 0 0-83.413333-142.293333c-53.632-42.197333-115.029333-57.258667-182.741333-46.122667-6.4 1.024-10.24-0.725333-14.72-5.12-57.685333-57.301333-127.872-79.402667-207.573334-64.085333-84.522667 16.085333-142.506667 66.304-173.056 146.304-1.450667 3.669333-3.029333 5.674667-7.552 6.741333-52.309333 12.373333-95.701333 38.912-128.341333 81.194667-41.557333 54.058667-56.746667 114.773333-44.032 181.845333a216.618667 216.618667 0 0 0 50.346667 102.912c3.541333 4.096 4.138667 7.594667 2.56 12.501334-6.997333 20.565333-9.216 41.941333-9.770667 63.872 0.64 15.957333 1.706667 32.298667 5.546667 48.213333 27.178667 119.04 144.768 195.584 266.282666 173.269333 4.864-0.768 7.168 0.256 10.197334 3.413334 57.941333 58.837333 128.768 81.834667 209.706666 66.261333 84.608-16.213333 142.08-67.029333 172.885334-146.773333 1.408-3.584 2.986667-5.248 6.997333-6.186667 96.426667-21.973333 167.509333-102.826667 175.829333-200.106667 5.845333-62.592-12.757333-118.698667-54.4-166.912z m-55.210666-110.421333c3.882667 18.901333 5.12 37.802667 2.730666 56.96-0.256 2.176-0.981333 4.266667-1.578666 7.253333l-49.621334-28.245333c-43.52-24.874667-87.210667-49.493333-130.56-74.752a37.461333 37.461333 0 0 0-41.386666 0.085333c-66.304 38.357333-132.949333 75.946667-199.424 113.877334-2.133333 1.109333-3.882667 3.029333-7.253334 2.773333V318.037333c0-3.157333 2.048-4.138667 4.181334-5.418666 59.178667-33.706667 117.845333-68.437333 177.664-100.821334 97.493333-52.693333 222.976 5.76 245.248 113.066667z m-247.808 186.368c0 15.488-0.085333 30.890667 0.085333 46.293333 0 3.584-0.981333 5.717333-4.352 7.552-27.178667 15.317333-54.186667 30.805333-81.152 46.464-2.986667 1.664-5.12 1.834667-8.277333 0.085334-26.88-15.573333-54.016-31.061333-81.152-46.378667-3.541333-2.005333-4.608-4.266667-4.608-8.234667 0.170667-30.122667 0.170667-60.16 0-90.24 0-4.181333 1.237333-6.528 5.034666-8.746666 26.496-14.933333 52.906667-29.994667 79.232-45.226667 3.925333-2.176 6.741333-2.56 10.922667-0.170667 26.325333 15.317333 52.650667 30.378667 79.146667 45.312 3.712 2.133333 5.205333 4.394667 5.205333 8.661334-0.256 14.805333-0.085333 29.781333-0.085333 44.629333zM293.802667 294.4c0.085333-84.608 54.784-152.618667 138.709333-169.258667 51.584-10.026667 98.730667 2.986667 141.354667 36.053334l-69.12 39.253333c-38.314667 21.76-76.586667 43.733333-115.029334 65.322667a32 32 0 0 0-17.578666 30.464v236.970666c-2.645333 0.725333-4.138667-1.237333-5.930667-2.176-22.186667-12.501333-44.202667-25.386667-66.474667-37.632-4.608-2.56-5.930667-5.546667-5.930666-10.496 0.085333-62.848 0-125.653333 0-188.501333z m-169.514667 163.882667c-8.362667-72.96 37.290667-147.2 106.666667-172.8 1.152-0.341333 2.304-0.64 3.925333-0.981334V336.213333c0 51.626667 0.170667 103.253333 0 154.88-0.170667 15.146667 5.930667 25.6 19.413333 33.194667 67.072 37.717333 133.973333 76.032 200.832 114.090667l6.442667 3.84-74.24 42.453333c-2.56 1.493333-4.522667 2.133333-7.466667 0.341333-59.989333-34.389333-120.789333-67.2-179.626666-103.168-45.653333-27.818667-70.016-70.613333-75.946667-123.562666z m74.965333 297.898666a166.229333 166.229333 0 0 1-25.344-121.130666l11.776 6.4c56.917333 32.469333 113.92 64.938667 170.794667 97.578666a33.962667 33.962667 0 0 0 36.693333 0c67.797333-38.784 135.68-77.44 203.477334-116.053333l5.034666-2.773333c0 29.141333 0 57.130667 0.170667 85.12 0 3.413333-1.664 4.821333-4.138667 6.229333-58.581333 33.152-116.565333 67.413333-175.829333 99.413333-77.397333 41.472-173.994667 17.664-222.634667-54.784z m530.346667-12.074666c-1.706667 60.458667-41.045333 120.149333-107.776 146.346666a172.373333 172.373333 0 0 1-170.666667-28.032l80.426667-45.781333c34.218667-19.498667 68.352-39.210667 102.741333-58.368a31.274667 31.274667 0 0 0 17.536-30.165333c-0.256-76.672-0.085333-153.344-0.085333-230.144 0-8.405333 0-8.405333 7.168-4.48 22.058667 12.586667 44.16 25.301333 66.304 37.717333 3.541333 2.005333 4.949333 4.010667 4.864 8.106667-0.085333 68.181333 1.322667 136.533333-0.512 204.8z m68.266667-7.68c-8.832 3.754667-8.832 3.754667-8.832-5.632 0-66.56-0.256-133.162667 0.213333-199.68a32.426667 32.426667 0 0 0-18.261333-31.317334c-66.218667-37.461333-132.266667-75.264-198.357334-112.896l-10.112-5.888 75.178667-42.752c2.645333-1.578667 4.522667-0.725333 6.826667 0.512 59.349333 33.962667 119.381333 66.688 177.834666 101.76 44.672 26.965333 69.973333 67.84 76.928 119.168A167.125333 167.125333 0 0 1 797.866667 736.426667z";
const DEFAULT_SETTINGS: AgentPluginSettings = {
  codexBin: DEFAULT_CODEX_BIN,
  nodeBin: "",
  adapterMode: "app-server",
  defaultMode: "agent",
  defaultModel: "GPT-5.5",
  defaultReasoningLevel: "Medium",
  autoAttachActiveNote: false,
  enableRightClickAddToAgent: true,
  maxNoteLength: 10000,
  maxSelectionLength: 10000,
  folderTreeDepth: 3,
  externalPathAccess: "ask-each-time",
  showDetailedApprovals: true,
  stickyUserPrompts: true,
  compactCommandGroups: true,
  diffLineNumbers: true,
  pastedImageBehavior: "chip",
  chatViewLocation: "right-pane",
  chatFontSize: 15
};
const BUILTIN_CODEX_SKILLS: SkillDefinition[] = [
  { name: "frontend-design", description: "Design and implement high-quality frontend interfaces, components, and interactions." },
  { name: "web-design-guidelines", description: "Review UI, accessibility, layout, and visual consistency." },
  { name: "brainstorming", description: "Clarify requirements, options, and product interaction boundaries before implementation." },
  { name: "prototype-to-prd", description: "Turn prototypes, screenshots, or page structures into product requirements." },
  { name: "form-prototype-to-prd", description: "Analyze form pages and produce structured PRDs." },
  { name: "list-prototype-to-prd", description: "Analyze list pages and produce structured PRDs." },
  { name: "ruoyi-list-page-builder", description: "Build admin list pages following RuoYi-Vue conventions." },
  { name: "ruoyi-menu-navigation", description: "Add, adjust, and verify RuoYi menu navigation." },
  { name: "dalian-khd-tms-design-assistant", description: "Design product flows using the Dalian KHD TMS business design system." },
  { name: "openai-docs", description: "Look up official OpenAI API and product documentation." }
];
function appendOpenAIIcon(parent: HTMLElement, className: string) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", className);
  svg.setAttribute("viewBox", "0 0 1024 1024");
  svg.setAttribute("fill", "currentColor");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", OPENAI_SVG_PATH);
  svg.appendChild(path);
  parent.appendChild(svg);
  return svg;
}


type AgentMode = "ask" | "agent";
type ReasoningLevel = "Auto" | "Low" | "Medium" | "High" | "Extra High";
type ModelChoice = "GPT-5.5" | "GPT-5.4" | "GPT-5.4 Mini" | "GPT-5.3 Codex";
type AdapterMode = "app-server" | "exec-json" | "pty";
type ExternalPathAccess = "ask-each-time" | "allow-session" | "deny";
type ChatViewLocation = "right-pane" | "left-pane" | "new-leaf";
type TurnAuxMode = "auto" | "plan" | "confirm-first" | "deep-questions";

interface AgentPluginSettings {
  codexBin: string;
  nodeBin: string;
  adapterMode: AdapterMode;
  defaultMode: AgentMode;
  defaultModel: ModelChoice;
  defaultReasoningLevel: ReasoningLevel;
  autoAttachActiveNote: boolean;
  enableRightClickAddToAgent: boolean;
  maxNoteLength: number;
  maxSelectionLength: number;
  folderTreeDepth: number;
  externalPathAccess: ExternalPathAccess;
  showDetailedApprovals: boolean;
  stickyUserPrompts: boolean;
  compactCommandGroups: boolean;
  diffLineNumbers: boolean;
  pastedImageBehavior: "chip";
  chatViewLocation: ChatViewLocation;
  chatFontSize: number;
}

interface ContextChip {
  id: string;
  label: string;
  detail: string;
  kind: "selection" | "file" | "folder" | "image" | "skill";
  path?: string;
  text?: string;
}

interface SkillDefinition {
  name: string;
  description: string;
  sourcePath?: string;
}

interface PickerItem {
  id: string;
  label: string;
  detail: string;
  kind: "file" | "folder" | "skill";
  path?: string;
  skill?: SkillDefinition;
}

interface PromptTriggerState {
  kind: "mention" | "skill";
  query: string;
  markerLength: number;
}

interface DiffLineView {
  type: "context" | "add" | "remove" | "hunk";
  oldLine?: number;
  newLine?: number;
  text: string;
}

interface DiffFileView {
  path: string;
  added: number;
  removed: number;
  lines: DiffLineView[];
}

interface PlanChecklistItem {
  text: string;
  status: "pending" | "in_progress" | "completed";
}

type TimelineMessagePart =
  | { type: "text"; text: string }
  | { type: "chip"; chip: Pick<ContextChip, "id" | "kind" | "label" | "detail" | "path" | "text"> };

interface TimelineItem {
  title: string;
  body: string;
  tone: "status" | "command" | "response" | "user" | "tool";
  contextChips?: Pick<ContextChip, "id" | "kind" | "label" | "detail" | "path" | "text">[];
  messageParts?: TimelineMessagePart[];
  approvalId?: string;
  toolItemId?: string;
  commandGroupId?: string;
  commands?: string[];
  expanded?: boolean;
  readSummary?: boolean;
  readFiles?: string[];
  diffSummary?: boolean;
  diffId?: string;
  diffText?: string;
  diffAdded?: number;
  diffRemoved?: number;
  diffFiles?: string[];
  diffExpandedFiles?: string[];
  diffAnimatedAt?: number;
  planId?: string;
  planItems?: PlanChecklistItem[];
  planSummary?: boolean;
  streaming?: boolean;
}

interface ApprovalRequestState {
  id: string;
  sessionId: string;
  approvalKind: "command" | "file" | "permissions";
  title: string;
  detail: string;
  command?: string;
  cwd?: string;
  reason?: string;
  commandActions?: any[];
  proposedExecpolicyAmendment?: any;
  proposedNetworkPolicyAmendments?: any[];
  permissions?: any;
  respond: (response: any) => void;
}

interface AgentSession {
  id: string;
  codexThreadId?: string;
  title: string;
  timeline: TimelineItem[];
  tokenUsageTotal?: number;
  tokenUsageInput?: number;
  tokenUsageLimit?: number | null;
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
  settings: AgentPluginSettings;
}

type AgentRuntimeState = "idle" | "thinking" | "running" | "done" | "error";

type AgentEvent =
  | { type: "status"; state: AgentRuntimeState; title: string; detail?: string }
  | { type: "thread"; threadId: string }
  | { type: "message_delta"; itemId: string; delta: string }
  | { type: "message"; markdown: string }
  | { type: "command"; itemId?: string; command: string; cwd?: string; status: "running" | "done" | "failed" }
  | { type: "tool"; itemId: string; title: string; detail?: string; status: "running" | "done" | "failed"; filePath?: string }
  | { type: "plan"; itemId: string; title: string; items: PlanChecklistItem[] }
  | { type: "approval"; id: string; approvalKind: "command" | "file" | "permissions"; title: string; detail: string; command?: string; cwd?: string; reason?: string; commandActions?: any[]; proposedExecpolicyAmendment?: any; proposedNetworkPolicyAmendments?: any[]; permissions?: any; respond: (response: any) => void }
  | { type: "token_usage"; totalTokens: number; inputTokens?: number; modelContextWindow?: number | null }
  | { type: "diff"; diff: string }
  | { type: "error"; title: string; message: string };

interface CodexRunRequest {
  codexBin: string;
  extraPath?: string;
  args: string[];
  cwd: string;
  prompt: string;
  threadId?: string;
  model?: string;
  sandboxMode?: "read-only" | "workspace-write" | "danger-full-access";
  approvalPolicy?: "never" | "on-request";
  reasoningEffort?: string | null;
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

function normalizePlanStatus(value: any): PlanChecklistItem["status"] {
  const normalized = String(value ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  if (["completed", "complete", "done"].includes(normalized)) {
    return "completed";
  }
  if (["in_progress", "inprogress", "active", "running", "current"].includes(normalized)) {
    return "in_progress";
  }
  return "pending";
}

function normalizePlanItems(candidate: any): PlanChecklistItem[] {
  if (!Array.isArray(candidate)) {
    return [];
  }
  return candidate
    .map((item) => {
      if (typeof item === "string") {
        return { text: item.trim(), status: "pending" as const };
      }
      const text = item?.step ?? item?.text ?? item?.title ?? item?.content ?? item?.description;
      if (typeof text !== "string" || !text.trim()) {
        return null;
      }
      return {
        text: text.trim(),
        status: normalizePlanStatus(item?.status ?? item?.state)
      };
    })
    .filter((item): item is PlanChecklistItem => Boolean(item));
}

function extractPlanItemsFromItem(item: any): PlanChecklistItem[] {
  const candidates = [
    item?.plan,
    item?.items,
    item?.steps,
    item?.todos,
    item?.arguments?.plan,
    item?.arguments?.items,
    item?.arguments?.todos,
    item?.data?.plan,
    item?.data?.items
  ];
  for (const candidate of candidates) {
    const items = normalizePlanItems(candidate);
    if (items.length > 0) {
      return items;
    }
  }
  return [];
}

class ExecJsonAdapter implements CodexAdapter {
  start(
    request: CodexRunRequest,
    onEvent: (event: AgentEvent) => void,
    onClose: (code: number | null) => void
  ): AgentRunHandle {
    const child = spawn(request.codexBin, request.args, {
      cwd: request.cwd,
      stdio: ["pipe", "pipe", "pipe"],
      env: this.buildChildEnv(request.extraPath)
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
      onEvent({ type: "status", state: "running", title: "Running" });
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
        title: "Running",
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
      onEvent({ type: "status", state: "thinking", title: "Thinking" });
      return;
    }

    if (event.type === "item.completed") {
      const item = event.item ?? {};
      if (item.type === "agent_message") {
        onEvent({ type: "status", state: "thinking", title: "Composing response" });
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

      const planItems = extractPlanItemsFromItem(item);
      if (planItems.length > 0) {
        onEvent({
          type: "plan",
          itemId: item.id ?? `plan:${Date.now()}`,
          title: item.title ?? "Plan",
          items: planItems
        });
        return;
      }

      onEvent({
        type: "status",
        state: "thinking",
        title: "Processing",
        detail: this.describeCodexItem(item)
      });
      return;
    }

    if (event.type === "turn.completed") {
      const usage = event.usage;
      onEvent({
        type: "status",
        state: "done",
        title: "Completed",
        detail: usage ? `input ${usage.input_tokens} · cached ${usage.cached_input_tokens} · output ${usage.output_tokens} · reasoning ${usage.reasoning_output_tokens}` : ""
      });
      return;
    }

    onEvent({
      type: "status",
      state: "thinking",
      title: "Processing",
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

  private buildChildEnv(extraPath?: string) {
    if (!extraPath?.trim()) {
      return process.env;
    }
    return {
      ...process.env,
      PATH: `${extraPath.trim()}:${process.env.PATH ?? ""}`
    };
  }

}

class AppServerAdapter implements CodexAdapter {
  private nextId = 1;
  private pending = new Map<string | number, (message: any) => void>();
  private child: any = null;
  private stdoutBuffer = "";
  private stderrBuffer = "";
  private currentThreadId: string | undefined;
  private completed = false;
  private agentBuffers = new Map<string, string>();
  private commandBuffers = new Map<string, { command: string; cwd?: string; output: string }>();

  start(
    request: CodexRunRequest,
    onEvent: (event: AgentEvent) => void,
    onClose: (code: number | null) => void
  ): AgentRunHandle {
    this.currentThreadId = request.threadId;
    this.child = spawn(request.codexBin, ["app-server", "--listen", "stdio://"], {
      cwd: request.cwd,
      stdio: ["pipe", "pipe", "pipe"],
      env: this.buildChildEnv(request.extraPath)
    });

    this.child.stdout.on("data", (chunk: any) => {
      this.stdoutBuffer += chunk.toString();
      const lines = this.stdoutBuffer.split(/\r?\n/);
      this.stdoutBuffer = lines.pop() ?? "";
      lines.forEach((line) => this.handleLine(line, request, onEvent, onClose));
    });

    this.child.stderr.on("data", (chunk: any) => {
      this.stderrBuffer += chunk.toString();
      const lines = this.stderrBuffer.split(/\r?\n/);
      this.stderrBuffer = lines.pop() ?? "";
      lines.forEach((line) => this.handleStderr(line, onEvent));
    });

    this.child.on("error", (error: Error) => {
      this.completed = true;
      onEvent({
        type: "error",
        title: "Codex app-server failed to start",
        message: `${error.message}. Tried: ${request.codexBin}`
      });
      onClose(1);
    });

    this.child.on("close", (code: number | null) => {
      if (!this.completed) {
        this.completed = true;
        onClose(code);
      }
    });

    this.sendRequest("initialize", {
      clientInfo: {
        name: PLUGIN_ID,
        title: PLUGIN_NAME,
        version: PLUGIN_VERSION
      },
      capabilities: {
        experimentalApi: true,
        requestAttestation: false
      }
    }, (message) => {
      if (message.error) {
        onEvent({
          type: "error",
          title: "Codex app-server initialize failed",
          message: this.describeError(message.error)
        });
        this.finish(onClose, 1);
        return;
      }
      this.startThreadOrTurn(request, onEvent, onClose);
    });

    return {
      cancel: () => {
        if (this.currentThreadId) {
          this.sendRequest("turn/interrupt", { threadId: this.currentThreadId }, () => undefined);
        }
        this.child?.kill();
      }
    };
  }

  private buildChildEnv(extraPath?: string) {
    if (!extraPath?.trim()) {
      return process.env;
    }
    return {
      ...process.env,
      PATH: `${extraPath.trim()}:${process.env.PATH ?? ""}`
    };
  }

  private startThreadOrTurn(
    request: CodexRunRequest,
    onEvent: (event: AgentEvent) => void,
    onClose: (code: number | null) => void
  ) {
    if (request.threadId) {
      this.sendRequest("thread/resume", { threadId: request.threadId }, (message) => {
        if (message.error) {
          const errorMessage = this.describeError(message.error);
          if (this.isMissingRolloutError(errorMessage)) {
            onEvent({
              type: "status",
              state: "thinking",
              title: "Thinking",
              detail: "Previous Codex thread is no longer resumable. Starting a new thread."
            });
            this.currentThreadId = undefined;
            this.startThreadOrTurn({ ...request, threadId: undefined }, onEvent, onClose);
            return;
          }
          onEvent({
            type: "error",
            title: "Codex thread resume failed",
            message: errorMessage
          });
          this.finish(onClose, 1);
          return;
        }
        this.startTurn(request, onEvent, onClose);
      });
      return;
    }

    this.sendRequest("thread/start", {
      model: request.model ?? null,
      cwd: request.cwd,
      approvalPolicy: request.approvalPolicy ?? "on-request",
      approvalsReviewer: "user",
      sandbox: request.sandboxMode ?? "workspace-write",
      baseInstructions: null,
      developerInstructions: null,
      ephemeral: false
    }, (message) => {
      if (message.error) {
        onEvent({
          type: "error",
          title: "Codex thread start failed",
          message: this.describeError(message.error)
        });
        this.finish(onClose, 1);
        return;
      }

      const threadId = message.result?.thread?.id;
      if (!threadId) {
        onEvent({
          type: "error",
          title: "Codex thread start failed",
          message: "App server did not return a thread id."
        });
        this.finish(onClose, 1);
        return;
      }

      this.currentThreadId = threadId;
      onEvent({ type: "thread", threadId });
      this.startTurn({ ...request, threadId }, onEvent, onClose);
    });
  }

  private startTurn(
    request: CodexRunRequest,
    onEvent: (event: AgentEvent) => void,
    onClose: (code: number | null) => void
  ) {
    this.sendRequest("turn/start", {
      threadId: request.threadId,
      input: [
        {
          type: "text",
          text: request.prompt,
          text_elements: []
        }
      ],
      cwd: request.cwd,
      approvalPolicy: request.approvalPolicy ?? "on-request",
      approvalsReviewer: "user",
      sandboxPolicy: this.toSandboxPolicy(request.sandboxMode ?? "workspace-write", request.cwd),
      model: request.model ?? null,
      effort: request.reasoningEffort ?? null
    }, (message) => {
      if (message.error) {
        onEvent({
          type: "error",
          title: "Codex turn start failed",
          message: this.describeError(message.error)
        });
        this.finish(onClose, 1);
      }
    });
  }

  private handleLine(
    line: string,
    request: CodexRunRequest,
    onEvent: (event: AgentEvent) => void,
    onClose: (code: number | null) => void
  ) {
    const trimmed = line.trim();
    if (!trimmed) {
      return;
    }

    let message: any;
    try {
      message = JSON.parse(trimmed);
    } catch {
      onEvent({
        type: "status",
        state: "running",
        title: "App Server",
        detail: trimmed.slice(0, 160)
      });
      return;
    }

    if (Object.prototype.hasOwnProperty.call(message, "id")
      && (Object.prototype.hasOwnProperty.call(message, "result") || Object.prototype.hasOwnProperty.call(message, "error"))) {
      const handler = this.pending.get(message.id);
      if (handler) {
        this.pending.delete(message.id);
        handler(message);
      }
      return;
    }

    if (Object.prototype.hasOwnProperty.call(message, "id") && message.method) {
      this.handleServerRequest(message, request, onEvent);
      return;
    }

    this.handleNotification(message, onEvent, onClose);
  }

  private handleNotification(
    message: any,
    onEvent: (event: AgentEvent) => void,
    onClose: (code: number | null) => void
  ) {
    const method = message.method;
    const params = message.params ?? {};

    if (method === "thread/started") {
      const threadId = params.thread?.id ?? params.threadId;
      if (threadId) {
        this.currentThreadId = threadId;
        onEvent({ type: "thread", threadId });
      }
      onEvent({ type: "status", state: "thinking", title: "Thinking" });
      return;
    }

    if (method === "turn/started") {
      onEvent({ type: "status", state: "thinking", title: "Thinking" });
      return;
    }

    if (method === "item/agentMessage/delta") {
      const itemId = params.itemId ?? "agent-message";
      const delta = params.delta ?? "";
      this.agentBuffers.set(itemId, `${this.agentBuffers.get(itemId) ?? ""}${delta}`);
      onEvent({ type: "message_delta", itemId, delta });
      return;
    }

    if (this.isReasoningNotification(method)) {
      onEvent({ type: "status", state: "thinking", title: "Thinking" });
      return;
    }

    if (method === "item/started") {
      this.handleItemStarted(params.item, onEvent);
      return;
    }

    if (method === "item/completed") {
      this.handleItemCompleted(params.item, onEvent);
      return;
    }

    if (method === "item/commandExecution/outputDelta") {
      const itemId = params.itemId ?? "command";
      const delta = params.delta ?? "";
      const current = this.commandBuffers.get(itemId);
      if (!current) {
        return;
      }
      current.output += delta;
      this.commandBuffers.set(itemId, current);
      onEvent({
        type: "command",
        itemId,
        command: current.command,
        cwd: current.cwd,
        status: "running"
      });
      return;
    }

    if (method === "turn/diff/updated") {
      onEvent({ type: "diff", diff: params.diff ?? "" });
      return;
    }

    if (method === "turn/plan/updated") {
      const planItems = normalizePlanItems(params.plan);
      if (planItems.length > 0) {
        onEvent({
          type: "plan",
          itemId: `turn-plan:${params.turnId ?? params.threadId ?? "current"}`,
          title: params.explanation ?? "Plan",
          items: planItems
        });
      }
      return;
    }

    if (method === "thread/tokenUsage/updated") {
      const usage = params.tokenUsage ?? {};
      const totalTokens = usage.total?.totalTokens;
      if (typeof totalTokens === "number") {
        onEvent({
          type: "token_usage",
          totalTokens,
          inputTokens: typeof usage.last?.inputTokens === "number" ? usage.last.inputTokens : undefined,
          modelContextWindow: typeof usage.modelContextWindow === "number" ? usage.modelContextWindow : null
        });
      }
      return;
    }

    if (method === "turn/completed") {
      onEvent({ type: "status", state: "done", title: "Completed" });
      this.finish(onClose, 0);
      return;
    }

    if (method === "error") {
      onEvent({
        type: "error",
        title: "Codex app-server error",
        message: this.describeError(params)
      });
      return;
    }

    if (method === "warning" || method === "configWarning") {
      onEvent({
        type: "status",
        state: "running",
        title: "App Server",
        detail: this.describeError(params).slice(0, 160)
      });
    }
  }

  private handleItemCompleted(item: any, onEvent: (event: AgentEvent) => void) {
    if (!item) {
      return;
    }

    if (this.isReasoningItem(item)) {
      onEvent({ type: "status", state: "thinking", title: "Thinking" });
      return;
    }

    if (item.type === "agentMessage") {
      const buffered = this.agentBuffers.get(item.id);
      const markdown = item.text ?? buffered ?? "";
      if (markdown && !buffered) {
        onEvent({ type: "message", markdown });
      }
      this.agentBuffers.delete(item.id);
      return;
    }

    const planItems = extractPlanItemsFromItem(item);
    if (item.type === "plan" || planItems.length > 0) {
      if (planItems.length > 0) {
        onEvent({
          type: "plan",
          itemId: item.id ?? `plan:${Date.now()}`,
          title: item.title ?? "Plan",
          items: planItems
        });
      }
      return;
    }

    if (item.type === "commandExecution") {
      this.commandBuffers.set(item.id, {
        command: item.command ?? "Command",
        cwd: item.cwd,
        output: item.aggregatedOutput ?? ""
      });
      onEvent({
        type: "command",
        itemId: item.id,
        command: item.command ?? "Command",
        cwd: item.cwd,
        status: item.exitCode === 0 ? "done" : item.exitCode === null ? "running" : "failed"
      });
      return;
    }

    const toolEvent = this.describeToolEvent(item, item.success === false ? "failed" : "done");
    if (toolEvent) {
      onEvent(toolEvent);
    }
  }

  private handleItemStarted(item: any, onEvent: (event: AgentEvent) => void) {
    if (this.isReasoningItem(item)) {
      onEvent({ type: "status", state: "thinking", title: "Thinking" });
      return;
    }

    const planItems = extractPlanItemsFromItem(item);
    if (item?.type === "plan" && planItems.length > 0) {
      onEvent({
        type: "plan",
        itemId: item.id ?? `plan:${Date.now()}`,
        title: item.title ?? "Plan",
        items: planItems
      });
      return;
    }

    if (item?.type === "commandExecution") {
      this.commandBuffers.set(item.id, {
        command: item.command ?? "Command",
        cwd: item.cwd,
        output: ""
      });
      onEvent({
        type: "command",
        itemId: item.id,
        command: item.command ?? "Command",
        cwd: item.cwd,
        status: "running"
      });
      return;
    }

    const toolEvent = this.describeToolEvent(item, "running");
    if (toolEvent) {
      onEvent(toolEvent);
    }
  }

  private isReasoningItem(item: any) {
    const type = String(item?.type ?? "").toLowerCase();
    const title = String(item?.title ?? item?.name ?? "").toLowerCase();
    return type === "reasoning" || type === "thinking" || title.includes("thinking") || title.includes("reasoning");
  }

  private isReasoningNotification(method: any) {
    const normalized = String(method ?? "").toLowerCase();
    return normalized.includes("reasoning") || normalized.includes("thinking");
  }

  private describeToolEvent(item: any, status: "running" | "done" | "failed"): Extract<AgentEvent, { type: "tool" }> | null {
    if (!item?.id || item.type === "agentMessage" || item.type === "userMessage" || item.type === "reasoning" || item.type === "plan") {
      return null;
    }
    if (this.isNoisyToolEvent(item)) {
      return null;
    }

    if (item.type === "commandExecution") {
      const command = String(item.command ?? "");
      const filePath = this.extractFilePathFromCommand(command);
      const title = filePath
        ? `${status === "running" ? "Reading" : status === "failed" ? "Read failed" : "Read"} ${this.basename(filePath)}`
        : `${status === "running" ? "Running command" : status === "failed" ? "Command failed" : "Command completed"}`;
      return {
        type: "tool",
        itemId: item.id,
        title,
        detail: filePath ?? command,
        status,
        filePath
      };
    }

    const toolName = item.tool ?? item.name ?? item.type;
    const args = item.arguments ?? {};
    const filePath = this.extractFilePathFromArguments(args);
    const isRead = String(toolName).toLowerCase().includes("read") || Boolean(filePath);
    return {
      type: "tool",
      itemId: item.id,
      title: filePath
        ? `${status === "running" ? "Reading" : status === "failed" ? "Read failed" : "Read"} ${this.basename(filePath)}`
        : `${status === "running" ? "Using" : status === "failed" ? "Tool failed" : "Used"} ${toolName}`,
      detail: filePath ?? (isRead ? JSON.stringify(args).slice(0, 180) : undefined),
      status,
      filePath
    };
  }

  private isNoisyToolEvent(item: any) {
    const type = String(item?.type ?? "").toLowerCase();
    const toolName = String(item?.tool ?? item?.name ?? "").toLowerCase();
    return type === "filechange" || toolName === "filechange";
  }

  private extractFilePathFromArguments(args: any): string | undefined {
    if (!args || typeof args !== "object") {
      return undefined;
    }
    const candidate = args.path ?? args.filePath ?? args.file_path ?? args.absolutePath ?? args.absolute_path;
    return typeof candidate === "string" ? candidate : undefined;
  }

  private extractFilePathFromCommand(command: string): string | undefined {
    const tokens = this.tokenizeCommand(command);
    const readIndex = tokens.findIndex((token) => ["cat", "sed", "nl", "head", "tail", "less"].includes(token));
    if (readIndex >= 0) {
      const args = tokens.slice(readIndex + 1).filter((token) => !["|", ";", "&&", "||"].includes(token));
      if (tokens[readIndex] === "sed") {
        return args.filter((token) => !token.startsWith("-")).pop();
      }
      return args.find((token) => !token.startsWith("-"));
    }
    const rgCommand = command.match(/(?:^|\s)(?:rg|grep|ls|find)\s+.*?(?:"([^"]+\.[\w.-]+)"|'([^']+\.[\w.-]+)'|([^\s|;&]+\.[\w.-]+))/);
    return rgCommand ? rgCommand[1] ?? rgCommand[2] ?? rgCommand[3] : undefined;
  }

  private tokenizeCommand(command: string) {
    return [...command.matchAll(/"([^"]+)"|'([^']+)'|(\S+)/g)]
      .map((match) => match[1] ?? match[2] ?? match[3])
      .filter(Boolean);
  }

  private basename(path: string) {
    return path.split(/[\\/]/).filter(Boolean).pop() ?? path;
  }

  private handleServerRequest(
    message: any,
    request: CodexRunRequest,
    onEvent: (event: AgentEvent) => void
  ) {
    const params = message.params ?? {};
    const respond = (response: any) => {
      this.sendResponse(message.id, response);
    };

    if (request.approvalPolicy === "never" && String(message.method).includes("requestApproval")) {
      onEvent({
        type: "status",
        state: "running",
        title: "Ask mode denied the permission request",
        detail: "Ask mode only allows reading and analysis. It does not allow command execution, file writes, or permission expansion."
      });
      if (message.method === "item/permissions/requestApproval") {
        this.sendResponse(message.id, { permissions: {}, scope: "turn", strictAutoReview: true });
      } else {
        this.sendResponse(message.id, { decision: "decline" });
      }
      return;
    }

    if (message.method === "item/commandExecution/requestApproval") {
      const command = params.command ?? "Command";
      onEvent({
        type: "approval",
        id: String(message.id),
        approvalKind: "command",
        title: "Waiting for command approval",
        detail: command,
        command,
        cwd: params.cwd,
        reason: params.reason,
        commandActions: params.commandActions,
        proposedExecpolicyAmendment: params.proposedExecpolicyAmendment,
        proposedNetworkPolicyAmendments: params.proposedNetworkPolicyAmendments,
        respond
      });
      return;
    }

    if (message.method === "item/fileChange/requestApproval") {
      onEvent({
        type: "approval",
        id: String(message.id),
        approvalKind: "file",
        title: "Waiting for file change approval",
        detail: params.reason ?? params.grantRoot ?? "Codex requests file write permission.",
        reason: params.reason,
        cwd: params.grantRoot,
        respond
      });
      return;
    }

    if (message.method === "item/permissions/requestApproval") {
      onEvent({
        type: "approval",
        id: String(message.id),
        approvalKind: "permissions",
        title: "Waiting for permission approval",
        detail: this.describePermissionRequest(params),
        cwd: params.cwd,
        reason: params.reason,
        permissions: params.permissions,
        respond
      });
      return;
    }

    const fallbackDecision = request.approvalPolicy === "never" ? "decline" : "cancel";
    this.sendResponse(message.id, { decision: fallbackDecision });
  }

  private describePermissionRequest(params: any) {
    const permissions = params.permissions ?? {};
    const fileSystem = permissions.fileSystem ?? {};
    const network = permissions.network ?? {};
    const reads = Array.isArray(fileSystem.read) ? fileSystem.read : [];
    const writes = Array.isArray(fileSystem.write) ? fileSystem.write : [];
    const entries = Array.isArray(fileSystem.entries) ? fileSystem.entries : [];
    const entryLines = entries.map((entry: any) => {
      const path = typeof entry?.path === "string" ? entry.path : JSON.stringify(entry?.path ?? "");
      return `${entry?.access ?? "access"}: ${path}`;
    });
    const lines = [
      params.reason ?? "Codex requests additional permissions.",
      reads.length ? `read: ${reads.join(", ")}` : "",
      writes.length ? `write: ${writes.join(", ")}` : "",
      ...entryLines,
      network.enabled ? "network: enabled" : ""
    ].filter(Boolean);
    return lines.join("\n") || this.describeError(params);
  }

  private handleStderr(line: string, onEvent: (event: AgentEvent) => void) {
    const trimmed = line.trim();
    if (!trimmed || this.shouldIgnoreCodexLog(trimmed)) {
      return;
    }

    onEvent({
      type: "status",
      state: "running",
      title: "App Server",
      detail: trimmed.length > 160 ? `${trimmed.slice(0, 160)}...` : trimmed
    });
  }

  private sendRequest(method: string, params: any, handler: (message: any) => void) {
    const id = this.nextId++;
    this.pending.set(id, handler);
    this.write({ id, method, params });
  }

  private sendResponse(id: string | number, result: any) {
    this.write({ id, result });
  }

  private write(message: any) {
    if (!this.child || this.child.killed) {
      return;
    }
    this.child.stdin.write(`${JSON.stringify(message)}\n`);
  }

  private finish(onClose: (code: number | null) => void, code: number | null) {
    if (this.completed) {
      return;
    }
    this.completed = true;
    this.child?.kill();
    onClose(code);
  }

  private shouldIgnoreCodexLog(line: string) {
    return line.includes("WARN codex_core_plugins")
      || line.includes("WARN codex_core_skills")
      || line.includes("Cloudflare")
      || line.includes("<html>")
      || line.includes("Enable JavaScript and cookies");
  }

  private describeError(error: any) {
    if (!error) {
      return "Unknown error";
    }
    if (typeof error === "string") {
      return error;
    }
    if (typeof error.message === "string") {
      return error.message;
    }
    return JSON.stringify(error).slice(0, 1000);
  }

  private isMissingRolloutError(message: string) {
    const normalized = message.toLowerCase();
    return normalized.includes("no rollout found") || normalized.includes("rollout not found");
  }

  private toSandboxPolicy(mode: string, cwd: string) {
    if (mode === "danger-full-access") {
      return { type: "dangerFullAccess" };
    }
    if (mode === "read-only") {
      return { type: "readOnly", networkAccess: false };
    }
    return {
      type: "workspaceWrite",
      writableRoots: [cwd],
      networkAccess: false,
      excludeTmpdirEnvVar: false,
      excludeSlashTmp: false
    };
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
  private availableSkills: SkillDefinition[] = [...BUILTIN_CODEX_SKILLS];
  private agentData: AgentPluginData = {
    sessions: [],
    archivedSessions: [],
    activeSessionId: "",
    settings: { ...DEFAULT_SETTINGS }
  };

  async onload() {
    const rawData = await this.loadData();
    this.agentData = this.normalizeAgentData(rawData);
    if (rawData?.appServerDebugEvents) {
      void this.saveData(this.agentData);
    }
    this.availableSkills = this.loadAvailableSkills();
    this.addSettingTab(new CodexAgentSettingTab(this.app, this));

    this.registerView(
      VIEW_TYPE_CODEX_AGENT,
      (leaf) => new CodexAgentView(leaf, this)
    );

    this.addRibbonIcon(AGENT_ICON_ID, "Open Codex AI Agent", () => {
      this.activateView();
    });

    this.addCommand({
      id: "open-codex-agent",
      name: "Open agent",
      callback: () => this.activateView()
    });

    this.addCommand({
      id: "attach-active-note-to-codex-agent",
      name: "Attach active note",
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
        if (!this.agentData.settings.enableRightClickAddToAgent) {
          return;
        }
        const selection = editor.getSelection().trim();
        if (!selection) {
          return;
        }

        menu.addItem((item) => {
          item
            .setTitle("Add to Agent")
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
        if (!this.agentData.settings.enableRightClickAddToAgent) {
          return;
        }
        if (file instanceof TFile) {
          menu.addItem((item) => {
            item
              .setTitle("Add file to Agent")
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
              .setTitle("Add folder to Agent")
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
      activeSessionId: this.agentData.activeSessionId,
      settings: { ...this.agentData.settings }
    };
  }

  getSettings(): AgentPluginSettings {
    return { ...this.agentData.settings };
  }

  getSkills(): SkillDefinition[] {
    this.availableSkills = this.loadAvailableSkills();
    return this.availableSkills.map((skill) => ({ ...skill }));
  }

  async saveSettings(settings: AgentPluginSettings) {
    this.agentData = {
      ...this.agentData,
      settings: this.normalizeSettings(settings)
    };
    await this.saveData(this.agentData);
    this.refreshOpenAgentViews();
  }

  async openAgentView() {
    await this.activateView();
  }

  private refreshOpenAgentViews() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_CODEX_AGENT).forEach((leaf) => {
      if (leaf.view instanceof CodexAgentView) {
        leaf.view.applyDisplaySettings();
      }
    });
  }

  saveAgentData(sessions: AgentSession[], archivedSessions: AgentSession[], activeSessionId: string) {
    this.agentData = {
      sessions: sessions.map((session) => ({ ...session, timeline: [...session.timeline] })),
      archivedSessions: archivedSessions.map((session) => ({ ...session, timeline: [...session.timeline] })),
      activeSessionId,
      settings: this.agentData.settings
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
    return { sessions, archivedSessions, activeSessionId, settings: this.normalizeSettings(data?.settings) };
  }

  private loadAvailableSkills(): SkillDefinition[] {
    const skills = new Map<string, SkillDefinition>();
    const addSkill = (skill: SkillDefinition) => {
      if (!skill.name.trim()) {
        return;
      }
      const key = skill.name.trim().toLowerCase();
      const existing = skills.get(key);
      if (!existing || !existing.sourcePath && skill.sourcePath) {
        skills.set(key, {
          name: skill.name.trim(),
          description: skill.description.trim() || existing?.description || "",
          sourcePath: skill.sourcePath
        });
      }
    };

    BUILTIN_CODEX_SKILLS.forEach(addSkill);
    this.getSkillSearchRoots().forEach((root) => {
      this.findSkillFiles(root, 5).forEach((skillPath) => {
        const skill = this.readSkillDefinition(skillPath);
        if (skill) {
          addSkill(skill);
        }
      });
    });

    return [...skills.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  private getSkillSearchRoots(): string[] {
    const home = os.homedir?.() || process.env.HOME || "";
    const cwd = typeof process.cwd === "function" ? process.cwd() : "";
    const roots = [
      path.join(home, ".codex", "skills"),
      path.join(home, ".cc-switch", "skills"),
      path.join(home, ".agents", "skills"),
      cwd ? path.join(cwd, "skills") : "",
      cwd ? path.join(cwd, ".codex", "skills") : "",
      cwd ? path.join(cwd, ".cc-switch", "skills") : "",
      cwd ? path.join(cwd, ".agents", "skills") : ""
    ];
    const pluginBasePath = this.getPluginBasePath();
    if (pluginBasePath) {
      roots.push(
        path.join(pluginBasePath, "skills"),
        path.join(pluginBasePath, ".codex", "skills"),
        path.join(pluginBasePath, ".cc-switch", "skills"),
        path.join(pluginBasePath, ".agents", "skills")
      );
    }
    return [...new Set(roots.filter((root) => root && root.trim()))];
  }

  private getPluginBasePath(): string {
    const adapter = this.app.vault.adapter as any;
    let vaultBasePath = "";
    try {
      vaultBasePath = typeof adapter?.getBasePath === "function" ? adapter.getBasePath() : "";
    } catch {
      vaultBasePath = "";
    }
    const manifestDir = (this.manifest as any)?.dir;
    if (!vaultBasePath || !manifestDir) {
      return "";
    }
    return path.join(vaultBasePath, manifestDir);
  }

  private findSkillFiles(root: string, maxDepth: number): string[] {
    const results: string[] = [];
    const visit = (dir: string, depth: number) => {
      if (depth > maxDepth || !fs.existsSync(dir)) {
        return;
      }
      let entries: any[] = [];
      try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isFile?.() && entry.name === "SKILL.md") {
          results.push(entryPath);
        } else if (entry.isDirectory?.()) {
          visit(entryPath, depth + 1);
        }
      }
    };
    visit(root, 0);
    return results;
  }

  private readSkillDefinition(skillPath: string): SkillDefinition | null {
    let content = "";
    try {
      content = fs.readFileSync(skillPath, "utf8");
    } catch {
      return null;
    }
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatter) {
      return null;
    }
    const fields = this.parseSkillFrontmatter(frontmatter[1]);
    const fallbackName = path.basename(path.dirname(skillPath));
    const name = fields.name || fallbackName;
    if (!name) {
      return null;
    }
    return {
      name,
      description: fields.description || "",
      sourcePath: skillPath
    };
  }

  private parseSkillFrontmatter(frontmatter: string): Record<string, string> {
    const fields: Record<string, string> = {};
    const lines = frontmatter.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
      if (!match) {
        continue;
      }
      const key = match[1];
      let value = match[2].trim();
      if (value === ">-" || value === "|" || value === "|-") {
        const parts: string[] = [];
        while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
          index += 1;
          parts.push(lines[index].trim());
        }
        value = parts.join(" ");
      }
      fields[key] = this.unquoteYamlValue(value);
    }
    return fields;
  }

  private unquoteYamlValue(value: string) {
    const trimmed = value.trim();
    if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
      return trimmed.slice(1, -1);
    }
    return trimmed;
  }

  private normalizeSettings(settings: any): AgentPluginSettings {
    return {
      codexBin: typeof settings?.codexBin === "string" && settings.codexBin.trim() ? settings.codexBin : DEFAULT_SETTINGS.codexBin,
      nodeBin: typeof settings?.nodeBin === "string" ? settings.nodeBin : DEFAULT_SETTINGS.nodeBin,
      adapterMode: ["app-server", "exec-json"].includes(settings?.adapterMode) ? settings.adapterMode : DEFAULT_SETTINGS.adapterMode,
      defaultMode: ["ask", "agent"].includes(settings?.defaultMode) ? settings.defaultMode : DEFAULT_SETTINGS.defaultMode,
      defaultModel: ["GPT-5.5", "GPT-5.4", "GPT-5.4 Mini", "GPT-5.3 Codex"].includes(settings?.defaultModel) ? settings.defaultModel : DEFAULT_SETTINGS.defaultModel,
      defaultReasoningLevel: this.normalizeReasoningLevel(settings?.defaultReasoningLevel),
      autoAttachActiveNote: Boolean(settings?.autoAttachActiveNote),
      enableRightClickAddToAgent: typeof settings?.enableRightClickAddToAgent === "boolean" ? settings.enableRightClickAddToAgent : DEFAULT_SETTINGS.enableRightClickAddToAgent,
      maxNoteLength: this.normalizePositiveInteger(settings?.maxNoteLength, DEFAULT_SETTINGS.maxNoteLength),
      maxSelectionLength: this.normalizePositiveInteger(settings?.maxSelectionLength, DEFAULT_SETTINGS.maxSelectionLength),
      folderTreeDepth: this.normalizePositiveInteger(settings?.folderTreeDepth, DEFAULT_SETTINGS.folderTreeDepth),
      externalPathAccess: ["ask-each-time", "allow-session", "deny"].includes(settings?.externalPathAccess) ? settings.externalPathAccess : DEFAULT_SETTINGS.externalPathAccess,
      showDetailedApprovals: typeof settings?.showDetailedApprovals === "boolean" ? settings.showDetailedApprovals : DEFAULT_SETTINGS.showDetailedApprovals,
      stickyUserPrompts: typeof settings?.stickyUserPrompts === "boolean" ? settings.stickyUserPrompts : DEFAULT_SETTINGS.stickyUserPrompts,
      compactCommandGroups: typeof settings?.compactCommandGroups === "boolean" ? settings.compactCommandGroups : DEFAULT_SETTINGS.compactCommandGroups,
      diffLineNumbers: typeof settings?.diffLineNumbers === "boolean" ? settings.diffLineNumbers : DEFAULT_SETTINGS.diffLineNumbers,
      pastedImageBehavior: "chip",
      chatViewLocation: ["right-pane", "left-pane", "new-leaf"].includes(settings?.chatViewLocation) ? settings.chatViewLocation : DEFAULT_SETTINGS.chatViewLocation,
      chatFontSize: this.normalizeRangedInteger(settings?.chatFontSize, DEFAULT_SETTINGS.chatFontSize, 13, 20)
    };
  }

  private normalizePositiveInteger(value: any, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
  }

  private normalizeRangedInteger(value: any, fallback: number, min: number, max: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.min(max, Math.max(min, Math.floor(parsed)));
  }

  private normalizeReasoningLevel(value: any): ReasoningLevel {
    const legacy: Record<string, ReasoningLevel> = {
      "智能": "Auto",
      "低": "Low",
      "中": "Medium",
      "高": "High",
      "超高": "Extra High"
    };
    if (typeof value === "string" && legacy[value]) {
      return legacy[value];
    }
    return (["Auto", "Low", "Medium", "High", "Extra High"] as ReasoningLevel[]).includes(value)
      ? value
      : DEFAULT_SETTINGS.defaultReasoningLevel;
  }

  private normalizeSession(session: any): AgentSession | null {
    if (!session || typeof session.id !== "string") {
      return null;
    }
    const now = Date.now();
    return {
      id: session.id,
      codexThreadId: typeof session.codexThreadId === "string" ? session.codexThreadId : undefined,
      title: typeof session.title === "string" ? session.title : "New Agent",
      tokenUsageTotal: typeof session.tokenUsageTotal === "number" ? session.tokenUsageTotal : undefined,
      tokenUsageInput: typeof session.tokenUsageInput === "number" ? session.tokenUsageInput : undefined,
      tokenUsageLimit: typeof session.tokenUsageLimit === "number" ? session.tokenUsageLimit : null,
      timeline: Array.isArray(session.timeline)
        ? session.timeline
          .filter((item: any) => typeof item?.title === "string" && typeof item?.body === "string")
          .map((item: any) => ({
            title: item.title,
            body: item.body,
            tone: ["status", "command", "response", "user", "tool"].includes(item.tone) ? item.tone : "status",
            contextChips: Array.isArray(item.contextChips)
              ? item.contextChips
                .filter((chip: any) => typeof chip?.id === "string" && typeof chip?.label === "string" && typeof chip?.kind === "string")
                .map((chip: any) => ({
                  id: chip.id,
                  kind: ["selection", "file", "folder", "image", "skill"].includes(chip.kind) ? chip.kind : "file",
                  label: chip.label,
                  detail: typeof chip.detail === "string" ? chip.detail : chip.path ?? chip.label,
                  path: typeof chip.path === "string" ? chip.path : undefined,
                  text: typeof chip.text === "string" ? chip.text : undefined
                }))
              : undefined,
            messageParts: Array.isArray(item.messageParts)
              ? item.messageParts
                .map((part: any) => {
                  if (part?.type === "text" && typeof part.text === "string") {
                    return { type: "text" as const, text: part.text };
                  }
                  if (part?.type === "chip" && typeof part.chip?.id === "string" && typeof part.chip?.label === "string") {
                    return {
                      type: "chip" as const,
                      chip: {
                        id: part.chip.id,
                        kind: ["selection", "file", "folder", "image", "skill"].includes(part.chip.kind) ? part.chip.kind : "file",
                        label: part.chip.label,
                        detail: typeof part.chip.detail === "string" ? part.chip.detail : part.chip.path ?? part.chip.label,
                        path: typeof part.chip.path === "string" ? part.chip.path : undefined,
                        text: typeof part.chip.text === "string" ? part.chip.text : undefined
                      }
                    };
                  }
                  return null;
                })
                .filter((part: TimelineMessagePart | null): part is TimelineMessagePart => part !== null)
              : undefined,
            approvalId: typeof item.approvalId === "string" ? item.approvalId : undefined,
            toolItemId: typeof item.toolItemId === "string" ? item.toolItemId : undefined,
            commandGroupId: typeof item.commandGroupId === "string" ? item.commandGroupId : undefined,
            commands: Array.isArray(item.commands) ? item.commands.filter((command: any) => typeof command === "string") : undefined,
            expanded: Boolean(item.expanded),
            readSummary: Boolean(item.readSummary),
            readFiles: Array.isArray(item.readFiles) ? item.readFiles.filter((file: any) => typeof file === "string") : undefined,
            diffSummary: Boolean(item.diffSummary),
            diffId: typeof item.diffId === "string" ? item.diffId : undefined,
            diffText: typeof item.diffText === "string" ? item.diffText : undefined,
            diffAdded: typeof item.diffAdded === "number" ? item.diffAdded : undefined,
            diffRemoved: typeof item.diffRemoved === "number" ? item.diffRemoved : undefined,
            diffFiles: Array.isArray(item.diffFiles) ? item.diffFiles.filter((file: any) => typeof file === "string") : undefined,
            diffExpandedFiles: Array.isArray(item.diffExpandedFiles) ? item.diffExpandedFiles.filter((file: any) => typeof file === "string") : undefined,
            diffAnimatedAt: typeof item.diffAnimatedAt === "number" ? item.diffAnimatedAt : undefined,
            planId: typeof item.planId === "string" ? item.planId : undefined,
            planItems: Array.isArray(item.planItems)
              ? item.planItems
                .filter((planItem: any) => typeof planItem?.text === "string")
                .map((planItem: any) => ({
                  text: planItem.text,
                  status: ["pending", "in_progress", "completed"].includes(planItem.status) ? planItem.status : "pending"
                }))
              : undefined,
            planSummary: Boolean(item.planSummary),
            streaming: Boolean(item.streaming)
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

    const settings = this.agentData.settings;
    const leaf = settings.chatViewLocation === "left-pane"
      ? this.app.workspace.getLeftLeaf(false)
      : settings.chatViewLocation === "new-leaf"
        ? this.app.workspace.getLeaf("tab")
        : this.app.workspace.getRightLeaf(false);
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
    if (!this.agentData.settings.enableRightClickAddToAgent) {
      this.hideSelectionAddButton();
      return;
    }
    const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    const selection = markdownView?.editor.getSelection().trim();

    if (!markdownView || !selection) {
      this.hideSelectionAddButton();
      return;
    }
    const sourceFile = markdownView.file;

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
      text: "Add to Agent"
    });
    button.style.left = `${Math.max(8, rect.left + rect.width / 2 - 44)}px`;
    button.style.top = `${Math.max(8, rect.top - 34)}px`;
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    button.addEventListener("click", async () => {
      const view = await this.activateView();
      view?.addSelectionContext(selection, sourceFile);
      this.hideSelectionAddButton();
    });
    this.selectionButtonEl = button;
  }

  private hideSelectionAddButton() {
    this.selectionButtonEl?.remove();
    this.selectionButtonEl = null;
  }
}

class CodexAgentSettingTab extends PluginSettingTab {
  private setupStatusEl: HTMLElement | null = null;

  constructor(app: any, private owner: CodexForObsidianPlugin) {
    super(app, owner);
  }

  display() {
    const { containerEl } = this;
    const settings = this.owner.getSettings();
    containerEl.empty();
    containerEl.createEl("h2", { text: PLUGIN_NAME });
    this.renderProjectLinks(containerEl);
    this.renderSetup(containerEl, settings);
    this.renderDefaults(containerEl, settings);
    this.renderContext(containerEl, settings);
    this.renderAdvanced(containerEl, settings);
  }

  private renderProjectLinks(containerEl: HTMLElement) {
    const links = containerEl.createDiv("codex-agent-settings-links");
    links.createEl("p", {
      text: "Project GitHub: "
    }).createEl("a", {
      text: GITHUB_URL,
      href: GITHUB_URL
    });
    links.createEl("p", {
      text: "If you have any problems or suggestions, please open an issue. If you like this plugin, please consider giving it a star."
    });
    const actions = links.createDiv("codex-agent-settings-links-actions");
    actions.createEl("a", {
      text: "Open issues",
      href: GITHUB_ISSUES_URL,
      cls: "codex-agent-settings-link-button"
    });
    actions.createEl("a", {
      text: "Star on GitHub",
      href: GITHUB_URL,
      cls: "codex-agent-settings-link-button"
    });
  }

  private renderSetup(containerEl: HTMLElement, settings: AgentPluginSettings) {
    containerEl.createEl("h3", { text: "Setup" });
    const status = containerEl.createDiv("codex-agent-settings-status");
    this.setupStatusEl = status;
    this.renderSetupStatus("idle", "Codex status has not been checked yet.", "Click Check Codex to verify your local Codex CLI.");

    new Setting(containerEl)
      .setName("Codex")
      .setDesc("Check whether Obsidian can find and run the local Codex CLI.")
      .addButton((button) => button
        .setButtonText("Check Codex")
        .setCta()
        .onClick(() => this.checkCodex(this.owner.getSettings().codexBin || DEFAULT_CODEX_BIN)))
      .addButton((button) => button
        .setButtonText("Try common locations")
        .onClick(() => this.tryCommonCodexLocations()))
      .addButton((button) => button
        .setButtonText("Open Agent")
        .onClick(() => this.owner.openAgentView()));
  }

  private renderRuntime(containerEl: HTMLElement, settings: AgentPluginSettings) {
    containerEl.createEl("h3", { text: "Runtime" });
    new Setting(containerEl)
      .setName("Codex CLI path")
      .setDesc("Path to the Codex executable. Usually auto-detected. If Obsidian cannot find Codex, enter an absolute path.")
      .addText((text) => text
        .setPlaceholder(DEFAULT_CODEX_BIN)
        .setValue(settings.codexBin)
        .onChange(async (value) => this.update({ codexBin: value.trim() || DEFAULT_CODEX_BIN })))
      .addButton((button) => button
        .setButtonText("Reset to default")
        .onClick(async () => {
          await this.update({ codexBin: DEFAULT_CODEX_BIN });
          this.display();
        }))
      .addButton((button) => button
        .setButtonText("Test")
        .onClick(() => this.testCommand(this.owner.getSettings().codexBin || DEFAULT_CODEX_BIN, ["--version"], "Codex CLI")));

    new Setting(containerEl)
      .setName("Node.js path")
      .setDesc("Usually leave blank. Only set this if an npm-installed Codex depends on a specific Node binary, or Obsidian cannot find node in the GUI environment.")
      .addText((text) => text
        .setPlaceholder("/usr/local/bin/node")
        .setValue(settings.nodeBin)
        .onChange(async (value) => this.update({ nodeBin: value.trim() })))
      .addButton((button) => button
        .setButtonText("Test")
        .onClick(() => {
          const nodeBin = this.owner.getSettings().nodeBin;
          if (!nodeBin) {
            new Notice("Node.js path is empty.");
            return;
          }
          this.testCommand(nodeBin, ["--version"], "Node.js");
        }));

    new Setting(containerEl)
      .setName("Execution backend")
      .setDesc("Uses App Server by default. Exec JSON is only a compatibility fallback.")
      .addDropdown((dropdown) => dropdown
        .addOption("app-server", "App Server")
        .addOption("exec-json", "Exec JSON fallback")
        .setValue(settings.adapterMode)
        .onChange(async (value) => this.update({ adapterMode: value as AdapterMode })));
  }

  private renderDefaults(containerEl: HTMLElement, settings: AgentPluginSettings) {
    containerEl.createEl("h3", { text: "Defaults" });
    new Setting(containerEl)
      .setName("Default mode")
      .setDesc("Default mode for new Agent tabs.")
      .addDropdown((dropdown) => dropdown
        .addOption("agent", "Agent")
        .addOption("ask", "Ask")
        .setValue(settings.defaultMode)
        .onChange(async (value) => this.update({ defaultMode: value as AgentMode })));

    new Setting(containerEl)
      .setName("Default model")
      .setDesc("Default model for new Agent tabs.")
      .addDropdown((dropdown) => {
        (["GPT-5.5", "GPT-5.4", "GPT-5.4 Mini", "GPT-5.3 Codex"] as ModelChoice[]).forEach((model) => dropdown.addOption(model, model));
        dropdown.setValue(settings.defaultModel).onChange(async (value) => this.update({ defaultModel: value as ModelChoice }));
      });

    new Setting(containerEl)
      .setName("Default reasoning")
      .setDesc("Default reasoning level for new Agent tabs. It is passed to App Server as effort.")
      .addDropdown((dropdown) => {
        (["Auto", "Low", "Medium", "High", "Extra High"] as ReasoningLevel[]).forEach((level) => dropdown.addOption(level, level));
        dropdown.setValue(settings.defaultReasoningLevel).onChange(async (value) => this.update({ defaultReasoningLevel: value as ReasoningLevel }));
      });
  }

  private renderContext(containerEl: HTMLElement, settings: AgentPluginSettings) {
    containerEl.createEl("h3", { text: "Context" });
    new Setting(containerEl)
      .setName("Auto-attach active note")
      .setDesc("Automatically attach the active note as context. Off by default to avoid sending full notes unexpectedly.")
      .addToggle((toggle) => toggle.setValue(settings.autoAttachActiveNote).onChange(async (value) => this.update({ autoAttachActiveNote: value })));

    new Setting(containerEl)
      .setName('Enable right-click "Add to Agent"')
      .setDesc("Show Add to Agent in editor selection, file, and folder context menus.")
      .addToggle((toggle) => toggle.setValue(settings.enableRightClickAddToAgent).onChange(async (value) => this.update({ enableRightClickAddToAgent: value })));

    new Setting(containerEl)
      .setName("Pasted image behavior")
      .setDesc("Convert pasted images into image chips. This can later expand to direct image context.")
      .addDropdown((dropdown) => dropdown.addOption("chip", "Convert to image chip").setValue(settings.pastedImageBehavior));
  }

  private renderSafety(containerEl: HTMLElement, settings: AgentPluginSettings) {
    containerEl.createEl("h3", { text: "Safety" });
    new Setting(containerEl)
      .setName("External path access")
      .setDesc("Policy for accessing paths outside the current vault.")
      .addDropdown((dropdown) => dropdown
        .addOption("ask-each-time", "Ask every time")
        .addOption("allow-session", "Allow for current session")
        .addOption("deny", "Deny")
        .setValue(settings.externalPathAccess)
        .onChange(async (value) => this.update({ externalPathAccess: value as ExternalPathAccess })));

    new Setting(containerEl)
      .setName("Show detailed approval explanation")
      .setDesc("Show operation, target, purpose, command, and raw reason in approval cards.")
      .addToggle((toggle) => toggle.setValue(settings.showDetailedApprovals).onChange(async (value) => this.update({ showDetailedApprovals: value })));
  }

  private renderDisplay(containerEl: HTMLElement, settings: AgentPluginSettings) {
    containerEl.createEl("h3", { text: "Display" });
    new Setting(containerEl)
      .setName("Chat view location")
      .setDesc("Where to open the Agent view.")
      .addDropdown((dropdown) => dropdown
        .addOption("right-pane", "Right pane tabs")
        .addOption("left-pane", "Left pane tabs")
        .addOption("new-leaf", "New leaf")
        .setValue(settings.chatViewLocation)
        .onChange(async (value) => this.update({ chatViewLocation: value as ChatViewLocation })));

    new Setting(containerEl)
      .setName("Chat font size")
      .setDesc("Message text size in pixels. Recommended range: 14-17. Allowed range: 13-20.")
      .addSlider((slider) => slider
        .setLimits(13, 20, 1)
        .setValue(settings.chatFontSize)
        .setDynamicTooltip()
        .onChange(async (value) => this.update({ chatFontSize: value })))
      .addButton((button) => button
        .setButtonText("Reset")
        .setTooltip("Reset chat font size")
        .onClick(async () => {
          await this.update({ chatFontSize: DEFAULT_SETTINGS.chatFontSize });
          this.display();
        }));

    new Setting(containerEl)
      .setName("Sticky user prompts")
      .setDesc("Show the current user prompt anchor while scrolling.")
      .addToggle((toggle) => toggle.setValue(settings.stickyUserPrompts).onChange(async (value) => this.update({ stickyUserPrompts: value })));

    new Setting(containerEl)
      .setName("Compact command groups")
      .setDesc("Collapse command logs into one line by default.")
      .addToggle((toggle) => toggle.setValue(settings.compactCommandGroups).onChange(async (value) => this.update({ compactCommandGroups: value })));

    new Setting(containerEl)
      .setName("Diff line numbers")
      .setDesc("Show old and new line numbers in diffs.")
      .addToggle((toggle) => toggle.setValue(settings.diffLineNumbers).onChange(async (value) => this.update({ diffLineNumbers: value })));
  }

  private renderAdvanced(containerEl: HTMLElement, settings: AgentPluginSettings) {
    const details = containerEl.createEl("details", { cls: "codex-agent-settings-advanced" });
    details.createEl("summary", { text: "Advanced settings" });
    const body = details.createDiv("codex-agent-settings-advanced-body");
    this.renderRuntime(body, settings);
    this.renderSafety(body, settings);
    this.renderDisplay(body, settings);
  }

  private addNumberSetting(containerEl: HTMLElement, name: string, desc: string, value: number, onChange: (value: number) => Promise<void>) {
    new Setting(containerEl)
      .setName(name)
      .setDesc(desc)
      .addText((text) => text
        .setValue(String(value))
        .onChange(async (raw) => {
          const parsed = Number(raw);
          if (Number.isFinite(parsed) && parsed >= 0) {
            await onChange(Math.floor(parsed));
          }
        }));
  }

  private async update(patch: Partial<AgentPluginSettings>) {
    await this.owner.saveSettings({
      ...this.owner.getSettings(),
      ...patch
    });
  }

  private renderSetupStatus(tone: "idle" | "checking" | "ready" | "error", title: string, detail: string) {
    if (!this.setupStatusEl) {
      return;
    }
    this.setupStatusEl.empty();
    this.setupStatusEl.removeClasses(["is-idle", "is-checking", "is-ready", "is-error"]);
    this.setupStatusEl.addClass(`is-${tone}`);
    this.setupStatusEl.createDiv({ cls: "codex-agent-settings-status-title", text: title });
    this.setupStatusEl.createDiv({ cls: "codex-agent-settings-status-detail", text: detail });
  }

  private async checkCodex(command: string) {
    this.renderSetupStatus("checking", "Checking Codex...", "Verifying that Obsidian can run the Codex CLI.");
    const result = await this.runCommand(command, ["--version"]);
    if (result.ok) {
      this.renderSetupStatus("ready", "Codex is ready.", result.detail || command);
      return true;
    }
    this.renderSetupStatus(
      "error",
      "Codex was not found.",
      "Obsidian could not run Codex. Try common locations, or paste the full Codex executable path in Advanced settings."
    );
    return false;
  }

  private async tryCommonCodexLocations() {
    this.renderSetupStatus("checking", "Looking for Codex...", "Trying common install locations.");
    for (const candidate of COMMON_CODEX_BINS) {
      const expanded = this.expandHomePath(candidate);
      const result = await this.runCommand(expanded, ["--version"]);
      if (result.ok) {
        await this.update({ codexBin: expanded });
        this.renderSetupStatus("ready", "Codex is ready.", `${result.detail || expanded} · Using ${expanded}`);
        return;
      }
    }
    this.renderSetupStatus(
      "error",
      "Codex was not found.",
      "Install Codex CLI, then click Check Codex again. If Codex works in Terminal but not in Obsidian, paste the full path in Advanced settings."
    );
  }

  private expandHomePath(filePath: string) {
    if (!filePath.startsWith("~/")) {
      return filePath;
    }
    const home = os.homedir?.() || process.env.HOME || "";
    return home ? path.join(home, filePath.slice(2)) : filePath;
  }

  private runCommand(command: string, args: string[]): Promise<{ ok: boolean; detail: string }> {
    return new Promise((resolve) => {
      if (!command.trim()) {
        resolve({ ok: false, detail: "Path is empty." });
        return;
      }
      const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
      let output = "";
      let settled = false;
      const finish = (ok: boolean, detail: string) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve({ ok, detail });
      };
      child.stdout.on("data", (chunk: any) => {
        output += chunk.toString();
      });
      child.stderr.on("data", (chunk: any) => {
        output += chunk.toString();
      });
      child.on("error", (error: Error) => {
        finish(false, error.message);
      });
      child.on("close", (code: number | null) => {
        const detail = output.trim().split(/\r?\n/)[0] ?? "";
        finish(code === 0, detail);
      });
    });
  }

  private testCommand(command: string, args: string[], label: string) {
    if (!command.trim()) {
      new Notice(`${label} path is empty.`);
      return;
    }
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (chunk: any) => {
      output += chunk.toString();
    });
    child.stderr.on("data", (chunk: any) => {
      output += chunk.toString();
    });
    child.on("error", (error: Error) => {
      new Notice(`${label} failed: ${error.message}`);
    });
    child.on("close", (code: number | null) => {
      const detail = output.trim().split(/\r?\n/)[0] ?? "";
      new Notice(code === 0 ? `${label} OK: ${detail}` : `${label} exited with ${code}: ${detail}`);
    });
  }
}

class CodexApprovalNoticeModal extends Modal {
  constructor(
    app: any,
    private sessionTitle: string,
    private approvalTitle: string,
    private openApproval: () => void
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("codex-agent-approval-modal");
    contentEl.createEl("h3", { text: "Codex needs approval" });
    contentEl.createEl("p", { text: `${this.sessionTitle}：${this.approvalTitle}` });
    const actions = contentEl.createDiv("codex-agent-approval-modal-actions");
    const open = actions.createEl("button", { cls: "mod-cta", text: "View approval" });
    const later = actions.createEl("button", { text: "Later" });
    open.addEventListener("click", () => {
      this.close();
      this.openApproval();
    });
    later.addEventListener("click", () => this.close());
  }

  onClose() {
    this.contentEl.empty();
  }
}

class CodexAgentView extends ItemView {
  private mode: AgentMode = "agent";
  private adapterMode: AdapterMode = "app-server";
  private contextChips: ContextChip[] = [];
  private reasoningLevel: ReasoningLevel = "Medium";
  private modelChoice: ModelChoice = "GPT-5.5";
  private sessions: AgentSession[] = [];
  private archivedSessions: AgentSession[] = [];
  private activeSessionId = "";
  private runningSessionId: string | null = null;
  private promptInput: HTMLElement | null = null;
  private promptPlaceholderEl: HTMLElement | null = null;
  private promptPickerEl: HTMLElement | null = null;
  private promptPickerItems: PickerItem[] = [];
  private promptPickerIndex = 0;
  private promptPickerTrigger: PromptTriggerState | null = null;
  private tabContainer: HTMLElement | null = null;
  private historyPanel: HTMLElement | null = null;
  private historyOutsideClickHandler: ((event: MouseEvent) => void) | null = null;
  private timelineContainer: HTMLElement | null = null;
  private stickyUserPromptEl: HTMLElement | null = null;
  private stickyUserPromptContentEl: HTMLElement | null = null;
  private stickyUserPromptIndex: number | null = null;
  private workbenchContainer: HTMLElement | null = null;
  private composerContainer: HTMLElement | null = null;
  private tokenUsageEl: HTMLElement | null = null;
  private liveDiffEl: HTMLElement | null = null;
  private scrollBottomButton: HTMLButtonElement | null = null;
  private modeButton: HTMLButtonElement | null = null;
  private modelButton: HTMLButtonElement | null = null;
  private speedButton: HTMLButtonElement | null = null;
  private auxModeButton: HTMLButtonElement | null = null;
  private auxModeMenuEl: HTMLElement | null = null;
  private auxModeOutsideClickHandler: ((event: MouseEvent) => void) | null = null;
  private turnAuxMode: TurnAuxMode = "auto";
  private runButton: HTMLButtonElement | null = null;
  private runningProcess: AgentRunHandle | null = null;
  private isCancellingRun = false;
  private pendingApprovals = new Map<string, ApprovalRequestState>();
  private activeApprovalModal: CodexApprovalNoticeModal | null = null;
  private activeResponseItemId: string | null = null;
  private activeResponseItemIndex: number | null = null;
  private exploredFiles = new Set<string>();
  private responseRenderTimer: number | null = null;
  private liveStatusEl: HTMLElement | null = null;
  private liveStatusTextEl: HTMLElement | null = null;
  private elapsedTimer: number | null = null;
  private currentRunStatusTitle = "Thinking";
  private currentRunStatusBody = "";
  private currentRunMetaDetail = "";
  private shouldShowScrollBottomButton = false;
  private currentDiffStats: any = null;

  constructor(leaf: WorkspaceLeaf, private owner: CodexForObsidianPlugin) {
    super(leaf);
    const settings = this.owner.getSettings();
    this.mode = settings.defaultMode;
    this.adapterMode = settings.adapterMode;
    this.reasoningLevel = settings.defaultReasoningLevel;
    this.modelChoice = settings.defaultModel;
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
    return PLUGIN_NAME;
  }

  getIcon(): string {
    return AGENT_ICON_ID;
  }

  applyDisplaySettings() {
    const container = this.containerEl.children[1] as HTMLElement | undefined;
    container?.style.setProperty("--codex-chat-font-size", `${this.owner.getSettings().chatFontSize}px`);
  }

  async onClose() {
    this.stopElapsedTimer();
    this.closeHistoryPanel();
    this.closePromptPicker();
    this.closeAuxModeMenu();
    this.activeApprovalModal?.close();
    this.activeApprovalModal = null;
    if (this.responseRenderTimer !== null) {
      window.clearTimeout(this.responseRenderTimer);
      this.responseRenderTimer = null;
    }
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
    (container as HTMLElement).style.setProperty("--codex-chat-font-size", `${this.owner.getSettings().chatFontSize}px`);

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
      const hasPendingApproval = this.hasPendingApproval(session.id);
      const tab = this.tabContainer!.createEl("button", {
        cls: `codex-agent-tab ${session.id === this.activeSessionId ? "is-active" : ""} ${hasPendingApproval ? "has-pending-approval" : ""}`
      });
      const tabIcon = tab.createSpan({ cls: "codex-agent-tab-icon" });
      setIcon(tabIcon, AGENT_ICON_ID);
      if (hasPendingApproval) {
        tabIcon.createSpan({ cls: "codex-agent-tab-alert-dot" });
      }
      tab.createSpan({ cls: "codex-agent-tab-title", text: session.title });
      const close = tab.createSpan({ cls: "codex-agent-tab-close", text: "×" });

      tab.addEventListener("click", () => {
      this.activeSessionId = session.id;
        this.persistSessions();
        this.renderSessionTabs();
        this.renderTimelineItems();
        this.renderTokenUsage();
        window.requestAnimationFrame(() => {
          this.shouldShowScrollBottomButton = false;
          this.scrollTimelineToBottom("auto");
          this.updateScrollBottomButton();
        });
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
    setIcon(history, "history");
    history.addEventListener("click", () => this.toggleHistoryPanel());
  }

  private toggleHistoryPanel() {
    if (this.historyPanel) {
      this.closeHistoryPanel();
      return;
    }

    this.historyPanel = this.containerEl.createDiv("codex-agent-history-panel");
    window.setTimeout(() => {
      this.historyOutsideClickHandler = (event: MouseEvent) => {
        if (!this.historyPanel) {
          return;
        }
        const target = event.target as Node | null;
        if (target && (this.historyPanel.contains(target) || this.tabContainer?.contains(target))) {
          return;
        }
        this.closeHistoryPanel();
      };
      document.addEventListener("mousedown", this.historyOutsideClickHandler);
    }, 0);
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
      this.closeHistoryPanel();
    });

    const list = this.historyPanel.createDiv("codex-agent-history-list");
    const renderList = () => {
      const query = search.value.trim().toLowerCase();
      list.empty();
      const sessions = this.getHistorySessions()
        .filter((session) => session.title.toLowerCase().includes(query));
      this.renderHistoryGroup(list, "Today", this.filterHistoryByAge(sessions, 0, 1), renderList);
      this.renderHistoryGroup(list, "Yesterday", this.filterHistoryByAge(sessions, 1, 2), renderList);
      this.renderHistoryGroup(list, "Last 7 Days", this.filterHistoryByAge(sessions, 2, 7), renderList);
      this.renderHistoryGroup(list, "Last 30 Days", this.filterHistoryByAge(sessions, 7, 30), renderList);
    };
    search.addEventListener("input", renderList);
    renderList();
    search.focus();
  }

  private renderHistoryGroup(parent: HTMLElement, label: string, sessions: AgentSession[], onDelete: () => void) {
    parent.createDiv({ cls: "codex-agent-history-group", text: label });
    if (sessions.length === 0) {
      parent.createDiv({ cls: "codex-agent-history-empty", text: "No agents" });
      return;
    }

    sessions.forEach((session) => {
      const item = parent.createEl("button", { cls: "codex-agent-history-item" });
      item.createSpan({ cls: "codex-agent-history-icon", text: session.timeline.length > 0 ? "✓" : "✎" });
      item.createSpan({ cls: "codex-agent-history-title", text: session.title });
      const deleteButton = item.createEl("span", {
        cls: "codex-agent-history-delete",
        text: "×",
        attr: { "aria-label": `Delete ${session.title}` }
      });
      item.addEventListener("click", () => {
        this.restoreSession(session.id);
        this.renderSessionTabs();
        this.renderTimelineItems();
        this.closeHistoryPanel();
      });
      deleteButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!window.confirm(`Delete history item “${session.title}”? This will not delete any note files.`)) {
          return;
        }
        this.deleteHistorySession(session.id);
        onDelete();
      });
    });
  }

  private closeHistoryPanel() {
    this.historyPanel?.remove();
    this.historyPanel = null;
    if (this.historyOutsideClickHandler) {
      document.removeEventListener("mousedown", this.historyOutsideClickHandler);
      this.historyOutsideClickHandler = null;
    }
  }

  private getHistorySessions() {
    const byId = new Map<string, AgentSession>();
    [...this.sessions, ...this.archivedSessions]
      .filter((session) => this.hasStartedConversation(session))
      .forEach((session) => byId.set(session.id, session));
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
    this.renderTokenUsage();
  }

  private renderTimeline(container: Element) {
    const section = container.createDiv("codex-agent-workbench");
    this.workbenchContainer = section;
    this.renderStickyUserPrompt(section);
    this.timelineContainer = section.createDiv("codex-agent-timeline");
    this.timelineContainer.addEventListener("scroll", () => {
      this.updateScrollBottomButton();
      this.updateStickyUserPrompt();
    });
    this.timelineContainer.addEventListener("copy", (event) => this.handleTimelineCopy(event));
    this.renderTimelineItems();
    window.requestAnimationFrame(() => {
      this.scrollTimelineToBottom("auto");
      this.updateStickyUserPrompt();
    });
  }

  private renderStickyUserPrompt(parent: HTMLElement) {
    if (!this.owner.getSettings().stickyUserPrompts) {
      this.stickyUserPromptEl = null;
      this.stickyUserPromptContentEl = null;
      return;
    }
    this.stickyUserPromptEl = parent.createDiv({
      cls: "codex-agent-sticky-user-prompt",
      attr: { role: "button", tabindex: "0", "aria-label": "Jump to current user prompt" }
    });
    const stickyRow = this.stickyUserPromptEl.createDiv("codex-agent-event is-user codex-agent-sticky-user-row");
    this.stickyUserPromptContentEl = stickyRow.createDiv("codex-agent-event-content codex-agent-sticky-user-content");
    this.stickyUserPromptEl.addEventListener("click", () => this.scrollToStickyUserPrompt());
    this.stickyUserPromptEl.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      this.scrollToStickyUserPrompt();
    });
  }

  private renderTimelineItems() {
    if (!this.timelineContainer) {
      return;
    }

    const session = this.getActiveSession();
    this.timelineContainer.empty();
    this.stickyUserPromptIndex = null;
    if (session.timeline.length === 0) {
      this.renderEmptyAgentPlaceholder(this.timelineContainer);
      this.updateScrollBottomButton();
      this.updateStickyUserPrompt();
      return;
    }
    session.timeline.forEach((item, index) => {
      const row = this.timelineContainer!.createDiv(`codex-agent-event is-${item.tone}`);
      if (item.tone === "status" && item.title.startsWith("Processed")) {
        row.addClass("is-processed");
      }
      if (item.tone === "user") {
        row.setAttr("data-user-message-index", String(index));
      }
      const content = row.createDiv("codex-agent-event-content");
      if (item.tone === "response") {
        this.renderMessageCopyButton(content, item.body, "Copy agent response");
        if (item.streaming) {
          content.createEl("p", { cls: "codex-agent-streaming-text", text: item.body });
        } else {
          const markdown = content.createDiv("codex-agent-markdown");
          void Promise.resolve(MarkdownRenderer.renderMarkdown(item.body, markdown, "", this))
            .then(() => this.bindObsidianFileLinks(markdown));
        }
      } else if (item.tone === "user") {
        const parts = this.getTimelineMessageParts(item);
        this.renderMessageCopyButton(content, item.body, "Copy user message", parts);
        this.renderUserMessageParts(content, parts);
      } else {
        const approval = item.approvalId ? this.pendingApprovals.get(item.approvalId) : undefined;
        if (item.commandGroupId) {
          const commandToggle = content.createEl("button", {
            cls: `codex-agent-tool-heading codex-agent-command-heading ${item.expanded ? "is-expanded" : ""}`,
            text: item.title
          });
          commandToggle.addEventListener("click", () => this.toggleTimelineItemExpanded(item.commandGroupId));
          this.renderCommandGroup(content, item);
        } else if (item.planSummary) {
          content.createEl("h4", { text: item.title });
          this.renderPlanSummary(content, item);
        } else if (item.readSummary) {
          content.createEl("h4", { text: item.title });
          this.renderReadSummary(content, item);
        } else if (item.diffSummary) {
          content.createEl("h4", { text: item.title });
          this.renderDiffSummary(content, item);
        } else if (approval) {
          content.createEl("h4", { text: item.title });
          const markdown = content.createDiv("codex-agent-approval-detail");
          void Promise.resolve(MarkdownRenderer.renderMarkdown(item.body, markdown, "", this))
            .then(() => this.bindObsidianFileLinks(markdown));
        } else {
          content.createEl("h4", { text: item.title });
          content.createEl("p", { text: item.body });
        }
        if (approval) {
          this.renderApprovalActions(content, approval);
        }
      }
    });
    if (!this.shouldShowScrollBottomButton) {
      this.scrollTimelineToBottom("auto");
    }
    this.updateScrollBottomButton();
    this.updateStickyUserPrompt();
  }

  private renderMessageCopyButton(content: HTMLElement, text: string, label: string, parts?: TimelineMessagePart[]) {
    if (!text.trim()) {
      return;
    }

    content.addClass("codex-agent-copyable-message");
    const button = content.createEl("button", {
      cls: "codex-agent-copy-message",
      attr: {
        type: "button",
        "aria-label": label,
        title: label
      }
    });
    setIcon(button, "copy");
    button.addEventListener("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (parts && parts.length > 0) {
        await this.copyMessagePartsToClipboard(parts, text);
      } else {
        await this.copyTextToClipboard(text);
      }
    });
  }

  private getTimelineMessageParts(item: TimelineItem) {
    return item.messageParts && item.messageParts.length > 0
      ? item.messageParts
      : this.buildFallbackMessageParts(item);
  }

  private renderUserMessageParts(content: HTMLElement, parts: TimelineMessagePart[]) {
    const paragraph = content.createEl("p", { cls: "codex-agent-user-message-inline" });
    parts.forEach((part) => {
      if (part.type === "text") {
        paragraph.appendChild(document.createTextNode(part.text));
        return;
      }
      this.renderInlineMessageChip(paragraph, part.chip);
    });
  }

  private buildFallbackMessageParts(item: TimelineItem): TimelineMessagePart[] {
    const parts: TimelineMessagePart[] = [];
    (item.contextChips ?? []).forEach((chip) => parts.push({ type: "chip", chip }));
    if (item.body) {
      if (parts.length > 0) {
        parts.push({ type: "text", text: " " });
      }
      parts.push({ type: "text", text: item.body });
    }
    return parts;
  }

  private renderInlineMessageChip(parent: HTMLElement, chip: Pick<ContextChip, "id" | "kind" | "label" | "detail" | "path" | "text">) {
    const chipEl = parent.createSpan(`codex-agent-chip codex-agent-message-chip is-${chip.kind}`);
    chipEl.setAttr("title", chip.path ?? chip.label);
    chipEl.setAttr("data-context-id", chip.id);
    chipEl.setAttr("data-context-kind", chip.kind);
    chipEl.setAttr("data-context-label", chip.label);
    if (chip.detail) {
      chipEl.setAttr("data-context-detail", chip.detail);
    }
    if (chip.path) {
      chipEl.setAttr("data-context-path", chip.path);
    }
    if (chip.text) {
      chipEl.setAttr("data-context-text", chip.text);
    }
    const icon = chipEl.createSpan({ cls: `codex-agent-chip-icon is-${chip.kind}` });
    setIcon(icon, this.getContextChipIcon(chip));
    chipEl.createSpan({ cls: "codex-agent-chip-label", text: chip.label });
  }

  private async copyTextToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      new Notice("Message copied.");
    } catch (error) {
      new Notice(`Copy failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async copyMessagePartsToClipboard(parts: TimelineMessagePart[], fallbackText: string) {
    const normalized = this.normalizeMessageParts(parts);
    const plainText = this.messagePartsToPlainText(normalized) || fallbackText;
    try {
      if (typeof ClipboardItem !== "undefined" && typeof navigator.clipboard.write === "function") {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": new Blob([plainText], { type: "text/plain" }),
            "text/html": new Blob([this.messagePartsToClipboardHtml(normalized)], { type: "text/html" })
          })
        ]);
      } else {
        await navigator.clipboard.writeText(plainText);
      }
      new Notice("Message copied.");
    } catch (error) {
      try {
        await navigator.clipboard.writeText(plainText);
        new Notice("Message copied.");
      } catch {
        new Notice(`Copy failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private handleTimelineCopy(event: ClipboardEvent) {
    if (!this.timelineContainer || !event.clipboardData) {
      return;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const parts: TimelineMessagePart[] = [];
    for (let index = 0; index < selection.rangeCount; index += 1) {
      const range = selection.getRangeAt(index);
      const container = range.commonAncestorContainer;
      if (!this.timelineContainer.contains(container)) {
        continue;
      }
      parts.push(...this.extractMessagePartsFromNode(range.cloneContents()));
    }
    const normalized = this.normalizeMessageParts(parts);
    if (!normalized.some((part) => part.type === "chip")) {
      return;
    }

    event.preventDefault();
    const json = JSON.stringify(normalized);
    event.clipboardData.setData("text/plain", this.messagePartsToPlainText(normalized));
    event.clipboardData.setData("text/html", this.messagePartsToClipboardHtml(normalized));
    event.clipboardData.setData(CODEX_MESSAGE_PARTS_MIME, json);
  }

  private extractMessagePartsFromNode(node: Node): TimelineMessagePart[] {
    const parts: TimelineMessagePart[] = [];
    const addText = (text: string) => {
      const clean = this.stripPromptControlText(text);
      if (!clean) {
        return;
      }
      const previous = parts[parts.length - 1];
      if (previous?.type === "text") {
        previous.text += clean;
      } else {
        parts.push({ type: "text", text: clean });
      }
    };
    const walk = (current: Node) => {
      if (current.nodeType === Node.TEXT_NODE) {
        addText(current.textContent ?? "");
        return;
      }
      if (current instanceof HTMLBRElement) {
        addText("\n");
        return;
      }
      if (!(current instanceof HTMLElement) && current.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
        return;
      }
      if (current instanceof HTMLElement && current.hasClass("codex-agent-chip")) {
        const chip = this.readContextChipFromElement(current);
        if (chip) {
          parts.push({ type: "chip", chip });
        }
        return;
      }
      current.childNodes.forEach(walk);
    };
    walk(node);
    return parts;
  }

  private readContextChipFromElement(element: HTMLElement): Pick<ContextChip, "id" | "kind" | "label" | "detail" | "path" | "text"> | null {
    const id = element.getAttribute("data-context-id");
    const rawKind = element.getAttribute("data-context-kind");
    const label = element.getAttribute("data-context-label")
      ?? element.querySelector<HTMLElement>(".codex-agent-chip-label")?.innerText.trim();
    if (!id || !rawKind || !label || !["selection", "file", "folder", "image", "skill"].includes(rawKind)) {
      return null;
    }
    return {
      id,
      kind: rawKind as ContextChip["kind"],
      label,
      detail: element.getAttribute("data-context-detail") ?? "",
      path: element.getAttribute("data-context-path") ?? undefined,
      text: element.getAttribute("data-context-text") ?? undefined
    };
  }

  private normalizeMessageParts(parts: TimelineMessagePart[]) {
    const normalized: TimelineMessagePart[] = [];
    parts.forEach((part) => {
      if (part.type === "text") {
        if (!part.text) {
          return;
        }
        const previous = normalized[normalized.length - 1];
        if (previous?.type === "text") {
          previous.text += part.text;
        } else {
          normalized.push({ type: "text", text: part.text });
        }
        return;
      }
      normalized.push(part);
    });
    return normalized;
  }

  private messagePartsToPlainText(parts: TimelineMessagePart[]) {
    return parts.map((part) => part.type === "text" ? part.text : part.chip.label).join("");
  }

  private messagePartsToClipboardHtml(parts: TimelineMessagePart[]) {
    const wrapper = document.createElement("span");
    const marker = document.createElement("span");
    marker.setAttribute(CODEX_MESSAGE_PARTS_ATTR, encodeURIComponent(JSON.stringify(parts)));
    marker.setAttribute("style", "display:none");
    wrapper.appendChild(marker);
    wrapper.appendChild(document.createTextNode(this.messagePartsToPlainText(parts)));
    return wrapper.innerHTML;
  }

  private bindObsidianFileLinks(container: HTMLElement) {
    const links = container.querySelectorAll<HTMLAnchorElement>("a.internal-link, a[href]");
    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        const target = this.getObsidianLinkTarget(link);
        if (!target) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        this.openObsidianFileLink(target);
      });
    });
  }

  private getObsidianLinkTarget(link: HTMLAnchorElement) {
    const raw = link.getAttribute("data-href") || link.getAttribute("href") || link.textContent || "";
    const target = decodeURIComponent(raw).trim();
    if (!target || /^(https?:|mailto:|obsidian:|#)/i.test(target)) {
      return "";
    }
    return target.replace(/^\.?\//, "");
  }

  private openObsidianFileLink(target: string) {
    const filePath = target.split("#")[0];
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (file instanceof TFile) {
      const markdownLeaf = this.app.workspace.getLeavesOfType("markdown")[0];
      const leaf = markdownLeaf ?? this.app.workspace.getLeaf("tab");
      void leaf.openFile(file).then(() => this.app.workspace.revealLeaf(leaf));
      return;
    }
    void (this.app.workspace as any).openLinkText?.(target, "", false);
  }

  private renderEmptyAgentPlaceholder(parent: HTMLElement) {
    const empty = parent.createDiv({
      cls: "codex-agent-empty-state",
      attr: { "aria-hidden": "true" }
    });
    appendOpenAIIcon(empty, "codex-agent-empty-codex-mark");
  }

  private renderCommandGroup(parent: HTMLElement, item: TimelineItem) {
    const commands = item.commands ?? [];
    if (!item.expanded) {
      return;
    }
    const list = parent.createEl("ol", { cls: "codex-agent-command-list" });
    commands.forEach((command) => {
      list.createEl("li", { text: command });
    });
  }

  private renderReadSummary(parent: HTMLElement, item: TimelineItem) {
    const files = item.readFiles ?? [];
    if (files.length === 0) {
      parent.createEl("p", { text: item.body });
      return;
    }
    const list = parent.createEl("ul", { cls: "codex-agent-read-list" });
    files.forEach((file) => {
      list.createEl("li", { text: file });
    });
  }

  private renderPlanSummary(parent: HTMLElement, item: TimelineItem) {
    const items = item.planItems ?? [];
    if (items.length === 0) {
      parent.createEl("p", { text: item.body });
      return;
    }
    const list = parent.createEl("ul", { cls: "codex-agent-plan-list" });
    items.forEach((planItem) => {
      const row = list.createEl("li", { cls: `codex-agent-plan-item is-${planItem.status}` });
      row.createSpan("codex-agent-plan-check");
      row.createSpan({ cls: "codex-agent-plan-text", text: planItem.text });
    });
  }

  private renderDiffSummary(parent: HTMLElement, item: TimelineItem) {
    const byFile = this.parseDiffStats(item.diffText ?? "").files;
    const files = byFile.length > 0 ? byFile : (item.diffFiles ?? []).map((path) => ({ path, added: 0, removed: 0, lines: [] }));
    const expandedFiles = new Set(item.diffExpandedFiles ?? (item.expanded ? files.map((file) => file.path) : []));
    const shouldAnimateCounts = this.shouldAnimateDiffCounts(item);
    const header = parent.createDiv("codex-agent-diff-card-head");
    const title = header.createDiv("codex-agent-diff-card-title");
    title.createSpan({ text: `Edited ${files.length} files` });
    this.renderDiffCounts(title, item.diffAdded ?? 0, item.diffRemoved ?? 0, shouldAnimateCounts);
    const toggle = header.createEl("button", {
      cls: "codex-agent-diff-toggle",
      text: expandedFiles.size > 0 ? "Collapse all" : "Expand all"
    });
    toggle.addEventListener("click", () => this.toggleDiffTimelineItem(item.diffId));

    const list = parent.createDiv("codex-agent-diff-file-list");
    files.forEach((file) => {
      const expanded = expandedFiles.has(file.path);
      const row = list.createEl("button", {
        cls: `codex-agent-diff-file-row ${expanded ? "is-expanded" : ""}`,
        attr: { type: "button" }
      });
      row.addEventListener("click", () => this.toggleDiffFileTimelineItem(item.diffId, file.path));
      row.createSpan({ cls: "codex-agent-diff-file-name", text: file.path });
      const meta = row.createSpan("codex-agent-diff-file-meta");
      const counts = meta.createSpan("codex-agent-diff-file-counts");
      this.renderDiffCounts(counts, file.added, file.removed, shouldAnimateCounts);
      meta.createSpan({ cls: "codex-agent-diff-caret", text: expanded ? "⌃" : "⌄" });
      if (expanded) {
        this.renderDiffFileLines(list, file);
      }
    });
  }

  private shouldAnimateDiffCounts(item: TimelineItem) {
    if (!item.diffAnimatedAt) {
      return false;
    }
    return Date.now() - item.diffAnimatedAt < 700;
  }

  private renderDiffCounts(parent: HTMLElement, added: number, removed: number, animated: boolean) {
    parent.createSpan({
      cls: `codex-agent-diff-added ${animated ? "is-bumping" : ""}`,
      text: `+${added}`
    });
    parent.createSpan({
      cls: `codex-agent-diff-removed ${animated ? "is-bumping" : ""}`,
      text: `-${removed}`
    });
  }

  private renderDiffFileLines(parent: HTMLElement, file: DiffFileView) {
    const table = parent.createDiv("codex-agent-diff-lines");
    table.toggleClass("has-line-numbers", this.owner.getSettings().diffLineNumbers);
    if (file.lines.length === 0) {
      table.createDiv({ cls: "codex-agent-diff-empty", text: "No line-level diff to show" });
      return;
    }
    file.lines.forEach((line) => {
      const row = table.createDiv(`codex-agent-diff-line is-${line.type}`);
      if (line.type === "hunk") {
        if (this.owner.getSettings().diffLineNumbers) {
          row.createSpan({ cls: "codex-agent-diff-line-number", text: "" });
          row.createSpan({ cls: "codex-agent-diff-line-number", text: "" });
        }
        row.createSpan({ cls: "codex-agent-diff-line-code", text: line.text });
        return;
      }
      if (this.owner.getSettings().diffLineNumbers) {
        row.createSpan({ cls: "codex-agent-diff-line-number", text: line.oldLine ? String(line.oldLine) : "" });
        row.createSpan({ cls: "codex-agent-diff-line-number", text: line.newLine ? String(line.newLine) : "" });
      }
      row.createSpan({ cls: "codex-agent-diff-line-code", text: line.text });
    });
  }

  private renderApprovalActions(parent: HTMLElement, approval: ApprovalRequestState) {
    if (approval.commandActions?.length) {
      const actionsSummary = parent.createDiv("codex-agent-approval-meta");
      actionsSummary.setText(this.describeCommandActions(approval.commandActions));
    }
    if (approval.proposedExecpolicyAmendment) {
      const rule = parent.createDiv("codex-agent-approval-meta");
      rule.setText(`Suggested rule: ${this.formatApprovalValue(approval.proposedExecpolicyAmendment)}`);
    }
    if (approval.proposedNetworkPolicyAmendments?.length) {
      const network = parent.createDiv("codex-agent-approval-meta");
      network.setText(`Network rule: ${this.formatApprovalValue(approval.proposedNetworkPolicyAmendments)}`);
    }
    const choices = [
      { key: "accept", label: "Yes", detail: "" },
      { key: "acceptForSession", label: this.getApprovalSessionLabel(approval), detail: this.getApprovalSessionDetail(approval) },
      { key: "decline", label: "No, tell Codex how to adjust", detail: "" }
    ].filter((choice) => choice.key !== "acceptForSession" || approval.approvalKind === "command" || approval.proposedExecpolicyAmendment || approval.proposedNetworkPolicyAmendments?.length);
    let selectedIndex = 0;
    const shell = parent.createDiv("codex-agent-approval-choice-shell");
    shell.setAttr("tabindex", "0");
    const list = shell.createDiv("codex-agent-approval-choice-list");
    const footer = shell.createDiv("codex-agent-approval-choice-footer");

    const renderChoices = () => {
      list.empty();
      choices.forEach((choice, index) => {
        const row = list.createEl("button", {
          cls: `codex-agent-approval-choice ${index === selectedIndex ? "is-selected" : ""}`,
          attr: { type: "button" }
        });
        row.createSpan({ cls: "codex-agent-approval-choice-number", text: `${index + 1}.` });
        const text = row.createSpan("codex-agent-approval-choice-text");
        text.createSpan({ cls: "codex-agent-approval-choice-label", text: choice.label });
        if (choice.detail) {
          text.createSpan({ cls: "codex-agent-approval-choice-detail", text: choice.detail });
        }
        const arrows = row.createSpan("codex-agent-approval-choice-arrows");
        if (index === selectedIndex) {
          arrows.setText("↑ ↓");
        }
        row.addEventListener("click", () => {
          selectedIndex = index;
          this.resolveApproval(approval.id, choice.key);
        });
      });
    };

    const submitSelected = () => this.resolveApproval(approval.id, choices[selectedIndex]?.key ?? "accept");
    renderChoices();
    footer.createEl("button", { cls: "codex-agent-approval-skip", text: "Skip", attr: { type: "button" } })
      .addEventListener("click", () => this.resolveApproval(approval.id, "cancel"));
    footer.createEl("button", { cls: "codex-agent-approval-submit", text: "Submit ↵", attr: { type: "button" } })
      .addEventListener("click", submitSelected);
    shell.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, choices.length - 1);
        renderChoices();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        renderChoices();
      } else if (event.key === "Enter") {
        event.preventDefault();
        submitSelected();
      } else if (event.key === "Escape") {
        event.preventDefault();
        this.resolveApproval(approval.id, "cancel");
      } else if (/^[1-9]$/.test(event.key)) {
        const index = Number(event.key) - 1;
        if (choices[index]) {
          event.preventDefault();
          selectedIndex = index;
          this.resolveApproval(approval.id, choices[index].key);
        }
      }
    });
    window.setTimeout(() => shell.focus(), 0);
  }

  private getApprovalSessionLabel(approval: ApprovalRequestState) {
    if (approval.approvalKind === "command") {
      return "Yes, and do not ask again for similar commands";
    }
    return "Yes, allow similar access for this session";
  }

  private getApprovalSessionDetail(approval: ApprovalRequestState) {
    if (approval.command) {
      return this.extractShellInnerCommand(approval.command).split(/\s+/).slice(0, 4).join(" ");
    }
    return "";
  }

  private renderComposer(container: Element) {
    const composer = container.createDiv("codex-agent-composer");
    this.composerContainer = composer;
    this.renderScrollBottomButton(composer);
    this.liveDiffEl = composer.createDiv("codex-agent-live-diff");
    this.renderLiveDiff();
    const inputBox = composer.createDiv("codex-agent-input-box");
    this.promptInput = inputBox.createDiv({
      cls: "codex-agent-prompt-editor is-empty",
      attr: {
        contenteditable: "true"
      }
    });
    this.promptPlaceholderEl = inputBox.createDiv({
      cls: "codex-agent-prompt-placeholder is-visible",
      text: "Ask Codex anything. Use @ to attach files or folders, / to choose a skill..."
    });
    this.promptInput.addEventListener("input", () => {
      this.normalizePromptLeadingChipLayout();
      this.updatePromptEmptyState();
      this.updatePromptPicker();
    });
    this.promptInput.addEventListener("focus", () => this.updatePromptEmptyState());
    this.promptInput.addEventListener("blur", () => {
      window.setTimeout(() => this.closePromptPicker(), 160);
    });
    this.promptInput.addEventListener("keydown", (event) => this.handlePromptKeydown(event));
    this.promptInput.addEventListener("paste", (event) => this.handlePromptPaste(event));

    const footer = inputBox.createDiv("codex-agent-composer-footer");
    const controls = footer.createDiv("codex-agent-composer-controls");
    this.modeButton = controls.createEl("button", { cls: "codex-agent-pill-button", text: this.mode === "agent" ? "Agent" : "Ask" });
    this.modeButton.addEventListener("click", (event) => this.openModeMenu(event));

    this.modelButton = controls.createEl("button", { cls: "codex-agent-select-button", text: this.modelChoice });
    this.modelButton.addEventListener("click", (event) => this.openModelMenu(event));

    this.speedButton = controls.createEl("button", { cls: "codex-agent-select-button", text: this.reasoningLevel });
    this.speedButton.addEventListener("click", (event) => this.openReasoningMenu(event));

    this.auxModeButton = controls.createEl("button", {
      cls: "codex-agent-turn-mode-button",
      attr: {
        type: "button",
        title: this.getAuxModeDescription(this.turnAuxMode)
      }
    });
    this.auxModeButton.addEventListener("click", (event) => this.openAuxModeMenu(event));
    this.updateTurnModeControls();

    this.runButton = footer.createEl("button", { cls: "mod-cta codex-agent-submit-button", attr: { "aria-label": "Submit" } });
    this.setRunButtonRunning(false);
    this.updateRunButtonDisabledState();
    this.runButton.addEventListener("click", () => this.runCodex());
    this.tokenUsageEl = composer.createDiv("codex-agent-token-usage");
    this.renderTokenUsage();
  }

  private setRunButtonRunning(isRunning: boolean) {
    if (!this.runButton) {
      return;
    }
    this.runButton.empty();
    this.runButton.toggleClass("is-running", isRunning);
    this.runButton.disabled = isRunning ? false : !this.hasPromptText();
    this.runButton.setAttr("aria-label", isRunning ? "Stop" : "Submit");
    this.runButton.setAttr("title", isRunning ? "Stop" : "Send");
    setIcon(this.runButton, isRunning ? "square" : "send-horizontal");
  }

  private renderScrollBottomButton(parent: HTMLElement) {
    this.scrollBottomButton = parent.createEl("button", {
      cls: "codex-agent-scroll-bottom",
      attr: {
        "aria-label": "Jump to latest message",
        title: "Jump to latest message"
      }
    });
    setIcon(this.scrollBottomButton, "arrow-down");
    this.scrollBottomButton.addEventListener("click", () => {
      this.shouldShowScrollBottomButton = false;
      this.scrollTimelineToBottom("smooth");
      this.updateScrollBottomButton();
    });
    this.updateScrollBottomButton();
  }

  private updateScrollBottomButton() {
    if (!this.timelineContainer || !this.scrollBottomButton) {
      return;
    }
    const distanceFromBottom = this.timelineContainer.scrollHeight
      - this.timelineContainer.scrollTop
      - this.timelineContainer.clientHeight;
    this.shouldShowScrollBottomButton = distanceFromBottom > 96;
    this.scrollBottomButton.toggleClass("is-visible", this.shouldShowScrollBottomButton);
  }

  private updateStickyUserPrompt() {
    if (!this.owner.getSettings().stickyUserPrompts || !this.timelineContainer || !this.stickyUserPromptEl || !this.stickyUserPromptContentEl) {
      return;
    }

    const session = this.getActiveSession();
    const containerRect = this.timelineContainer.getBoundingClientRect();
    const stickyThreshold = containerRect.top + 1;
    const userRows = Array.from(
      this.timelineContainer.querySelectorAll<HTMLElement>(".codex-agent-event.is-user[data-user-message-index]")
    );
    let activeIndex: number | null = null;
    let activeItem: TimelineItem | null = null;

    userRows.forEach((row) => {
      const rect = row.getBoundingClientRect();
      const rawIndex = row.getAttribute("data-user-message-index");
      const index = rawIndex ? Number(rawIndex) : NaN;
      if (Number.isNaN(index) || rect.bottom > stickyThreshold) {
        return;
      }
      const item = session.timeline[index];
      if (item?.tone !== "user" || !item.body.trim()) {
        return;
      }
      activeIndex = index;
      activeItem = item;
    });

    if (activeIndex === null || !activeItem) {
      this.stickyUserPromptIndex = null;
      this.stickyUserPromptEl.removeClass("is-visible");
      this.stickyUserPromptContentEl.empty();
      return;
    }

    const stickyHeight = Math.max(this.stickyUserPromptEl.offsetHeight, 74);
    const stickyBottom = containerRect.top + stickyHeight + 8;
    const overlapsVisibleUserMessage = userRows.some((row) => {
      const rect = row.getBoundingClientRect();
      return rect.top < stickyBottom && rect.bottom > containerRect.top;
    });
    if (overlapsVisibleUserMessage) {
      this.stickyUserPromptIndex = null;
      this.stickyUserPromptEl.removeClass("is-visible");
      this.stickyUserPromptContentEl.empty();
      return;
    }

    if (this.stickyUserPromptIndex === activeIndex && this.stickyUserPromptEl.hasClass("is-visible")) {
      return;
    }

    this.stickyUserPromptIndex = activeIndex;
    this.stickyUserPromptContentEl.empty();
    this.renderUserMessageParts(this.stickyUserPromptContentEl, this.getTimelineMessageParts(activeItem));
    this.stickyUserPromptEl.addClass("is-visible");
  }

  private scrollToStickyUserPrompt() {
    if (!this.timelineContainer || this.stickyUserPromptIndex === null) {
      return;
    }
    const row = this.timelineContainer.querySelector<HTMLElement>(
      `.codex-agent-event.is-user[data-user-message-index="${this.stickyUserPromptIndex}"]`
    );
    if (!row) {
      return;
    }
    const containerRect = this.timelineContainer.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const targetTop = this.timelineContainer.scrollTop + rowRect.top - containerRect.top - 8;
    this.timelineContainer.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth"
    });
  }

  private scrollTimelineToBottom(behavior: ScrollBehavior = "auto") {
    if (!this.timelineContainer) {
      return;
    }
    this.timelineContainer.scrollTo({
      top: this.timelineContainer.scrollHeight,
      behavior
    });
  }

  private renderTokenUsage() {
    if (!this.tokenUsageEl) {
      return;
    }
    const session = this.getActiveSession();
    const input = session.tokenUsageInput;
    const total = session.tokenUsageTotal;
    const limit = session.tokenUsageLimit;
    this.tokenUsageEl.empty();
    if (typeof input !== "number") {
      this.tokenUsageEl.createSpan({ cls: "codex-agent-token-label", text: "Context: waiting for Codex" });
      return;
    }
    if (typeof limit === "number" && limit > 0) {
      const percent = Math.min(100, Math.max(0, Math.round((input / limit) * 100)));
      const ring = this.tokenUsageEl.createSpan("codex-agent-token-ring");
      ring.style.setProperty("--codex-token-percent", `${percent}%`);
      ring.setAttr(
        "title",
        "Codex reported last turn input tokens. Includes conversation, instructions, attachments, and current prompt. Total token usage is cumulative and not used for this ratio."
      );
      this.tokenUsageEl.createSpan({
        cls: "codex-agent-token-label",
        text: `Context ${percent}% · ${this.formatTokenCount(input)} / ${this.formatTokenCount(limit)}`
      });
      return;
    }
    this.tokenUsageEl.createSpan({
      cls: "codex-agent-token-label",
      text: typeof total === "number"
        ? `Context input: ${this.formatTokenCount(input)} · total tokens ${this.formatTokenCount(total)}`
        : `Context input: ${this.formatTokenCount(input)}`
    });
  }

  private formatTokenCount(value: number) {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return String(value);
  }

  private renderLiveDiff() {
    if (!this.liveDiffEl) {
      return;
    }
    this.liveDiffEl.empty();
    const stats = this.currentDiffStats;
    if (!stats || stats.files.length === 0) {
      this.liveDiffEl.removeClass("is-visible");
      return;
    }
    this.liveDiffEl.addClass("is-visible");
    const label = stats.files.length === 1
      ? `Editing ${stats.files[0].path}`
      : `${stats.files.length} files changed`;
    setIcon(this.liveDiffEl.createSpan("codex-agent-live-diff-icon"), "pencil");
    this.liveDiffEl.createSpan({ cls: "codex-agent-live-diff-label", text: label });
    this.renderDiffCounts(this.liveDiffEl, stats.added, stats.removed, true);
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
    (["Auto", "Low", "Medium", "High", "Extra High"] as ReasoningLevel[]).forEach((level) => {
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

    menu.showAtMouseEvent(event);
  }

  private openAuxModeMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.auxModeMenuEl) {
      this.closeAuxModeMenu();
      return;
    }
    if (!this.composerContainer) {
      return;
    }

    const menu = this.composerContainer.createDiv("codex-agent-aux-mode-menu");
    this.auxModeMenuEl = menu;
    (["auto", "plan", "confirm-first", "deep-questions"] as TurnAuxMode[]).forEach((mode) => {
      const row = menu.createEl("button", {
        cls: `codex-agent-aux-mode-row ${this.turnAuxMode === mode ? "is-selected" : ""}`,
        attr: { type: "button" }
      });
      const marker = row.createSpan("codex-agent-aux-mode-marker");
      marker.setText(this.turnAuxMode === mode ? "✓" : "");
      const text = row.createSpan("codex-agent-aux-mode-text");
      text.createSpan({ cls: "codex-agent-aux-mode-label", text: this.getAuxModeLabel(mode) });
      text.createSpan({ cls: "codex-agent-aux-mode-detail", text: this.getAuxModeDescription(mode) });
      row.addEventListener("click", () => {
        this.turnAuxMode = mode;
        this.updateTurnModeControls();
        this.closeAuxModeMenu();
      });
    });

    window.setTimeout(() => {
      this.auxModeOutsideClickHandler = (clickEvent: MouseEvent) => {
        const target = clickEvent.target as Node | null;
        if (target && (this.auxModeMenuEl?.contains(target) || this.auxModeButton?.contains(target))) {
          return;
        }
        this.closeAuxModeMenu();
      };
      document.addEventListener("mousedown", this.auxModeOutsideClickHandler);
    }, 0);
  }

  private closeAuxModeMenu() {
    this.auxModeMenuEl?.remove();
    this.auxModeMenuEl = null;
    if (this.auxModeOutsideClickHandler) {
      document.removeEventListener("mousedown", this.auxModeOutsideClickHandler);
      this.auxModeOutsideClickHandler = null;
    }
  }

  private updateComposerControls() {
    this.modeButton?.setText(this.mode === "agent" ? "Agent" : "Ask");
    this.modelButton?.setText(this.modelChoice);
    this.speedButton?.setText(this.reasoningLevel);
    this.updateTurnModeControls();
  }

  private updateTurnModeControls() {
    if (!this.auxModeButton) {
      return;
    }
    this.auxModeButton.setText(`Assist: ${this.getAuxModeLabel(this.turnAuxMode)}`);
    this.auxModeButton.toggleClass("is-active", this.turnAuxMode !== "auto");
    this.auxModeButton.setAttr("aria-pressed", this.turnAuxMode !== "auto" ? "true" : "false");
    this.auxModeButton.setAttr("title", this.getAuxModeDescription(this.turnAuxMode));
  }

  private getAuxModeLabel(mode: TurnAuxMode) {
    if (mode === "plan") {
      return "Plan";
    }
    if (mode === "confirm-first") {
      return "Confirm First";
    }
    if (mode === "deep-questions") {
      return "Deep Questions";
    }
    return "Auto";
  }

  private getAuxModeDescription(mode: TurnAuxMode) {
    if (mode === "plan") {
      return "Use Codex's native planning. Recommended for complex tasks; slows down simple ones.";
    }
    if (mode === "confirm-first") {
      return "Restate the request and proposed approach, then wait for confirmation before working.";
    }
    if (mode === "deep-questions") {
      return "Ask deeper follow-up questions to clarify the request before proceeding.";
    }
    return "No extra auxiliary instruction is added.";
  }

  addFileContext(file: TFile) {
    this.addContextChip({
      id: this.makeContextChipId("file", file.path),
      label: file.name,
      detail: file.path,
      kind: "file",
      path: file.path
    });
    new Notice(`Added file to Agent: ${file.name}`);
  }

  addFolderContext(folder: TFolder) {
    this.addContextChip({
      id: this.makeContextChipId("folder", folder.path),
      label: folder.name || folder.path,
      detail: folder.path,
      kind: "folder",
      path: folder.path
    });
    new Notice(`Added folder to Agent: ${folder.path}`);
  }

  addSelectionContext(selection: string, file: TFile | null) {
    if (!selection) {
      return;
    }

    const compact = selection.replace(/\s+/g, " ").trim();
    this.addContextChip({
      id: this.makeContextChipId("selection", file?.path ?? "untitled"),
      label: compact.length > 18 ? `${compact.slice(0, 18)}...` : compact || "Selected text",
      detail: `${selection.length} characters from ${file?.basename ?? "active editor"}`,
      kind: "selection",
      path: file?.path,
      text: selection
    });
    new Notice("Added selected text to Agent");
  }

  private addImageContext(file: File) {
    const label = file.name || `Pasted image ${new Date().toLocaleTimeString()}`;
    this.addContextChip({
      id: this.makeContextChipId("image", label),
      label,
      detail: `${file.type || "image"} · ${this.formatFileSize(file.size)}`,
      kind: "image",
      text: label
    });
  }

  private addSkillContext(skill: SkillDefinition) {
    this.addContextChip({
      id: this.makeContextChipId("skill", skill.name),
      label: skill.name,
      detail: skill.description,
      kind: "skill",
      text: skill.description
    });
  }

  private addContextChip(chip: ContextChip) {
    this.contextChips = [chip, ...this.contextChips];
    this.insertChipElement(chip);
  }

  private makeContextChipId(kind: ContextChip["kind"], target: string) {
    return `${kind}:${target}:${Date.now()}:${Math.floor(Math.random() * 100000)}`;
  }

  private insertChipElement(chip: ContextChip) {
    if (!this.promptInput) {
      return;
    }

    this.insertNodeAtPromptCaret(this.createPromptChipElement(chip));
    this.updatePromptEmptyState();
  }

  private createPromptChipElement(chip: ContextChip) {
    const chipEl = document.createElement("span");
    chipEl.addClass("codex-agent-chip", `is-${chip.kind}`);
    chipEl.setAttr("contenteditable", "false");
    chipEl.setAttr("data-context-id", chip.id);
    chipEl.setAttr("data-context-kind", chip.kind);
    chipEl.setAttr("data-context-label", chip.label);
    if (chip.detail) {
      chipEl.setAttr("data-context-detail", chip.detail);
    }
    if (chip.path) {
      chipEl.setAttr("data-context-path", chip.path);
    }
    if (chip.text) {
      chipEl.setAttr("data-context-text", chip.text);
    }
    const icon = chipEl.createSpan({ cls: `codex-agent-chip-icon is-${chip.kind}` });
    setIcon(icon, this.getContextChipIcon(chip));
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
      this.contextChips = this.contextChips.filter((item) => item.id !== chip.id);
      chipEl.remove();
      this.updatePromptEmptyState();
    });
    return chipEl;
  }

  private getContextChipIcon(chip: Pick<ContextChip, "kind" | "path" | "label">) {
    if (chip.kind === "folder") {
      return "folder";
    }
    if (chip.kind === "selection") {
      return "text-select";
    }
    if (chip.kind === "image") {
      return "image";
    }
    if (chip.kind === "skill") {
      return "sparkles";
    }
    const name = (chip.path ?? chip.label).toLowerCase();
    if (name.endsWith(".md") || name.endsWith(".txt")) {
      return "file-text";
    }
    if (name.endsWith(".json") || name.endsWith(".js") || name.endsWith(".ts") || name.endsWith(".css") || name.endsWith(".html") || name.endsWith(".vue")) {
      return "file-code";
    }
    if (name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".gif") || name.endsWith(".webp") || name.endsWith(".svg")) {
      return "file-image";
    }
    return "file";
  }

  private insertNodeAtPromptCaret(node: HTMLElement) {
    if (!this.promptInput) {
      return;
    }

    const selection = window.getSelection();
    const hasPromptSelection = selection
      && selection.rangeCount > 0
      && this.promptInput.contains(selection.getRangeAt(0).commonAncestorContainer);
    const hasPromptContent = this.stripPromptControlText(this.promptInput.innerText).trim().length > 0
      || Boolean(this.promptInput.querySelector(".codex-agent-chip"));

    if (!hasPromptContent) {
      this.promptInput.empty();
    }

    const range = hasPromptSelection
      ? selection!.getRangeAt(0)
      : document.createRange();

    if (!hasPromptSelection || !hasPromptContent) {
      range.selectNodeContents(this.promptInput);
      range.collapse(false);
    }

    const fragment = document.createDocumentFragment();
    if (hasPromptContent) {
      fragment.append(document.createTextNode(" "));
    }
    const after = document.createTextNode("\u200B");
    fragment.append(node, after);

    range.deleteContents();
    range.insertNode(fragment);
    range.setStartAfter(after);
    range.collapse(true);

    selection?.removeAllRanges();
    selection?.addRange(range);
    this.promptInput.focus();
  }

  private normalizePromptLeadingChipLayout() {
    if (!this.promptInput || !this.promptInput.querySelector(".codex-agent-chip")) {
      return;
    }

    let firstChip: HTMLElement | null = null;
    const walker = document.createTreeWalker(this.promptInput, NodeFilter.SHOW_ELEMENT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node instanceof HTMLElement && node.hasClass("codex-agent-chip")) {
        firstChip = node;
        break;
      }
    }
    if (!firstChip) {
      return;
    }

    const removable: Node[] = [];
    for (const node of Array.from(this.promptInput.childNodes)) {
      if (node === firstChip || (node instanceof HTMLElement && node.contains(firstChip))) {
        break;
      }
      if (!this.isEmptyPromptLeadNode(node)) {
        return;
      }
      removable.push(node);
    }
    removable.forEach((node) => node.parentNode?.removeChild(node));
  }

  private isEmptyPromptLeadNode(node: Node): boolean {
    if (node.nodeType === Node.TEXT_NODE) {
      return this.stripPromptControlText(node.textContent ?? "").trim().length === 0;
    }
    if (node instanceof HTMLBRElement) {
      return true;
    }
    if (node instanceof HTMLElement) {
      const clone = node.cloneNode(true) as HTMLElement;
      clone.querySelectorAll(".codex-agent-chip").forEach((chip) => chip.remove());
      return this.stripPromptControlText(clone.innerText ?? clone.textContent ?? "").trim().length === 0;
    }
    return false;
  }

  private stripPromptControlText(text: string) {
    return text.replace(/\u200B/g, "");
  }

  private insertPlainTextAtPromptCaret(text: string) {
    if (!this.promptInput || !text) {
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

    const textNode = document.createTextNode(text);
    range.deleteContents();
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(true);

    selection?.removeAllRanges();
    selection?.addRange(range);
    this.promptInput.focus();
  }

  private insertMessagePartsAtPromptCaret(parts: TimelineMessagePart[]) {
    if (!this.promptInput || parts.length === 0) {
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
    const pastedChips: ContextChip[] = [];
    parts.forEach((part) => {
      if (part.type === "text") {
        fragment.appendChild(document.createTextNode(part.text));
        return;
      }
      const chip: ContextChip = {
        id: this.makeContextChipId(part.chip.kind, part.chip.path ?? part.chip.label),
        kind: part.chip.kind,
        label: part.chip.label,
        detail: part.chip.detail,
        path: part.chip.path,
        text: part.chip.text
      };
      pastedChips.push(chip);
      fragment.appendChild(this.createPromptChipElement(chip));
    });
    const after = document.createTextNode("\u200B");
    fragment.appendChild(after);

    range.deleteContents();
    range.insertNode(fragment);
    range.setStartAfter(after);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
    this.contextChips = [...pastedChips, ...this.contextChips];
    this.promptInput.focus();
  }

  private getClipboardText(clipboardData: DataTransfer | null) {
    if (!clipboardData) {
      return "";
    }

    const html = clipboardData.getData("text/html");
    const plainText = clipboardData.getData("text/plain");
    if (!html.trim()) {
      return plainText;
    }

    return this.convertClipboardHtmlToPlainText(html) || plainText;
  }

  private getClipboardMessageParts(clipboardData: DataTransfer | null): TimelineMessagePart[] {
    if (!clipboardData) {
      return [];
    }

    const custom = clipboardData.getData(CODEX_MESSAGE_PARTS_MIME);
    const fromCustom = this.parseClipboardMessageParts(custom);
    if (fromCustom.length > 0) {
      return fromCustom;
    }

    const html = clipboardData.getData("text/html");
    if (!html.trim()) {
      return [];
    }
    const template = document.createElement("template");
    template.innerHTML = html;
    const marker = template.content.querySelector<HTMLElement>(`[${CODEX_MESSAGE_PARTS_ATTR}]`);
    return this.parseClipboardMessageParts(marker?.getAttribute(CODEX_MESSAGE_PARTS_ATTR) ?? "", true);
  }

  private parseClipboardMessageParts(raw: string, encoded = false): TimelineMessagePart[] {
    if (!raw.trim()) {
      return [];
    }
    try {
      const value = encoded ? decodeURIComponent(raw) : raw;
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        return [];
      }
      const parts = parsed.map((part: any): TimelineMessagePart | null => {
        if (part?.type === "text" && typeof part.text === "string") {
          return { type: "text" as const, text: part.text };
        }
        if (part?.type === "chip" && typeof part.chip?.label === "string" && ["selection", "file", "folder", "image", "skill"].includes(part.chip.kind)) {
          return {
            type: "chip" as const,
            chip: {
              id: typeof part.chip.id === "string" ? part.chip.id : this.makeContextChipId(part.chip.kind, part.chip.path ?? part.chip.label),
              kind: part.chip.kind as ContextChip["kind"],
              label: part.chip.label,
              detail: typeof part.chip.detail === "string" ? part.chip.detail : "",
              path: typeof part.chip.path === "string" ? part.chip.path : undefined,
              text: typeof part.chip.text === "string" ? part.chip.text : undefined
            }
          };
        }
        return null;
      }).filter((part: TimelineMessagePart | null): part is TimelineMessagePart => part !== null);
      return this.normalizeMessageParts(parts);
    } catch {
      return [];
    }
  }

  private convertClipboardHtmlToPlainText(html: string) {
    const template = document.createElement("template");
    template.innerHTML = html;
    const rendered = this.renderClipboardNodeText(template.content, 0);
    return rendered
      .replace(/\u00a0/g, " ")
      .split(/\r?\n/)
      .map((line) => line.replace(/[ \t]+$/g, ""))
      .join("\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  private renderClipboardNodeText(node: Node, listDepth: number): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent ?? "").replace(/[ \t\r\n]+/g, " ");
    }
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) {
      return "";
    }

    const element = node instanceof HTMLElement ? node : null;
    const tag = element?.tagName.toLowerCase() ?? "";
    if (tag === "br") {
      return "\n";
    }
    if (tag === "pre") {
      return `${element?.textContent ?? ""}\n`;
    }
    if (tag === "ol" || tag === "ul") {
      return this.renderClipboardListText(element!, tag, listDepth);
    }

    const childrenText = Array.from(node.childNodes)
      .map((child) => this.renderClipboardNodeText(child, listDepth))
      .join("");

    if (["p", "div", "section", "article", "header", "footer", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6"].includes(tag)) {
      return `${childrenText.trim()}\n`;
    }
    if (tag === "tr") {
      return `${childrenText.trim()}\n`;
    }
    if (tag === "td" || tag === "th") {
      return `${childrenText.trim()}\t`;
    }
    return childrenText;
  }

  private renderClipboardListText(listEl: HTMLElement, tag: string, listDepth: number) {
    const lines: string[] = [];
    let index = Number(listEl.getAttr("start") ?? "1");
    if (!Number.isFinite(index) || index < 1) {
      index = 1;
    }

    Array.from(listEl.children).forEach((child) => {
      if (!(child instanceof HTMLElement) || child.tagName.toLowerCase() !== "li") {
        return;
      }

      const nestedLists = Array.from(child.children)
        .filter((item): item is HTMLElement => item instanceof HTMLElement && ["ol", "ul"].includes(item.tagName.toLowerCase()));
      const itemText = Array.from(child.childNodes)
        .filter((item) => !(item instanceof HTMLElement && ["ol", "ul"].includes(item.tagName.toLowerCase())))
        .map((item) => this.renderClipboardNodeText(item, listDepth))
        .join("")
        .trim();
      const marker = tag === "ol" ? `${index}. ` : "- ";
      const indent = "  ".repeat(listDepth);
      if (itemText) {
        lines.push(`${indent}${marker}${itemText}`);
      }
      nestedLists.forEach((nestedList) => {
        const nestedText = this.renderClipboardNodeText(nestedList, listDepth + 1).trimEnd();
        if (nestedText) {
          lines.push(nestedText);
        }
      });
      index += 1;
    });

    return `${lines.join("\n")}\n`;
  }

  private handlePromptPaste(event: ClipboardEvent) {
    const messageParts = this.getClipboardMessageParts(event.clipboardData);
    if (messageParts.length > 0) {
      event.preventDefault();
      this.insertMessagePartsAtPromptCaret(messageParts);
      this.normalizePromptLeadingChipLayout();
      this.updatePromptEmptyState();
      this.updatePromptPicker();
      return;
    }

    const fileMap = new Map<string, File>();
    Array.from(event.clipboardData?.files ?? [])
      .filter((file) => file.type.startsWith("image/"))
      .forEach((file) => fileMap.set(`${file.name}:${file.size}:${file.type}`, file));
    Array.from(event.clipboardData?.items ?? [])
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .forEach((item) => {
        const file = item.getAsFile();
        if (file) {
          fileMap.set(`${file.name}:${file.size}:${file.type}`, file);
        }
      });
    const files = [...fileMap.values()];
    const plainText = this.getClipboardText(event.clipboardData);
    if (files.length === 0 && !plainText) {
      return;
    }
    event.preventDefault();
    if (plainText) {
      this.insertPlainTextAtPromptCaret(plainText);
    }
    files.forEach((file) => this.addImageContext(file));
    this.updatePromptEmptyState();
    this.updatePromptPicker();
  }

  private updatePromptPicker() {
    const trigger = this.getPromptTrigger();
    if (!trigger) {
      this.closePromptPicker();
      return;
    }
    const items = trigger.kind === "mention"
      ? this.searchVaultItems(trigger.query)
      : this.searchSkillItems(trigger.query);
    if (items.length === 0) {
      this.closePromptPicker();
      return;
    }
    this.promptPickerTrigger = trigger;
    this.promptPickerItems = items;
    this.promptPickerIndex = Math.min(this.promptPickerIndex, items.length - 1);
    this.renderPromptPicker();
  }

  private getPromptTrigger(): PromptTriggerState | null {
    if (!this.promptInput) {
      return null;
    }
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !selection.isCollapsed) {
      return null;
    }
    const anchor = selection.anchorNode;
    if (!anchor || !this.promptInput.contains(anchor) || anchor.nodeType !== Node.TEXT_NODE) {
      return null;
    }
    const text = anchor.textContent ?? "";
    const beforeCaret = text.slice(0, selection.anchorOffset);
    const match = beforeCaret.match(/(^|\s)([@/])([^\s@/]*)$/);
    if (!match) {
      return null;
    }
    const marker = match[2];
    if (marker === "/" && match[1] !== "" && !/\s$/.test(match[1])) {
      return null;
    }
    return {
      kind: marker === "@" ? "mention" : "skill",
      query: match[3] ?? "",
      markerLength: marker.length + (match[3]?.length ?? 0)
    };
  }

  private searchVaultItems(query: string): PickerItem[] {
    const normalized = query.toLowerCase();
    const files = this.app.vault.getAllLoadedFiles() as TAbstractFile[];
    return files
      .filter((file) => file instanceof TFile || file instanceof TFolder)
      .map((file) => {
        const isFolder = file instanceof TFolder;
        const label = isFolder ? (file.name || file.path || "/") : file.name;
        const detail = isFolder ? `${file.path}/` : file.parent?.path ? file.parent.path : "/";
        const score = this.scorePickerMatch(normalized, label, file.path);
        return {
          id: `${isFolder ? "folder" : "file"}:${file.path}`,
          label,
          detail,
          kind: isFolder ? "folder" as const : "file" as const,
          path: file.path,
          score
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
      .slice(0, 80)
      .map(({ score, ...item }) => item);
  }

  private searchSkillItems(query: string): PickerItem[] {
    const normalized = query.toLowerCase();
    return this.owner.getSkills()
      .map((skill) => ({
        id: `skill:${skill.name}`,
        label: skill.name,
        detail: skill.description,
        kind: "skill" as const,
        skill,
        score: this.scorePickerMatch(normalized, skill.name, skill.description)
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
      .slice(0, 80)
      .map(({ score, ...item }) => item);
  }

  private scorePickerMatch(query: string, label: string, detail: string) {
    if (!query) {
      return 1;
    }
    const lowerLabel = label.toLowerCase();
    const lowerDetail = detail.toLowerCase();
    if (lowerLabel.startsWith(query)) {
      return 100 - lowerLabel.length / 100;
    }
    if (lowerLabel.includes(query)) {
      return 60 - lowerLabel.indexOf(query) / 100;
    }
    if (lowerDetail.includes(query)) {
      return 30 - lowerDetail.indexOf(query) / 100;
    }
    let cursor = 0;
    for (const char of query) {
      cursor = lowerLabel.indexOf(char, cursor);
      if (cursor === -1) {
        return 0;
      }
      cursor += 1;
    }
    return 10;
  }

  private renderPromptPicker() {
    if (!this.composerContainer) {
      return;
    }
    if (!this.promptPickerEl) {
      this.promptPickerEl = this.composerContainer.createDiv("codex-agent-prompt-picker");
      this.promptPickerEl.addEventListener("wheel", (event) => event.stopPropagation(), { passive: true });
      this.promptPickerEl.addEventListener("touchmove", (event) => event.stopPropagation(), { passive: true });
    }
    this.sizePromptPicker();
    this.promptPickerEl.empty();
    this.promptPickerEl.toggleClass("is-skill", this.promptPickerTrigger?.kind === "skill");
    this.promptPickerItems.forEach((item, index) => {
      const row = this.promptPickerEl!.createEl("button", {
        cls: `codex-agent-picker-row ${index === this.promptPickerIndex ? "is-selected" : ""}`,
        attr: { type: "button" }
      });
      const icon = row.createSpan({ cls: `codex-agent-picker-icon is-${item.kind}` });
      setIcon(icon, item.kind === "folder" ? "folder" : item.kind === "skill" ? "package" : this.getPickerFileIcon(item.path ?? item.label));
      const text = row.createSpan("codex-agent-picker-text");
      text.createSpan({ cls: "codex-agent-picker-label", text: item.label });
      text.createSpan({ cls: "codex-agent-picker-detail", text: item.detail });
      row.createSpan({ cls: "codex-agent-picker-source", text: this.getPickerSourceLabel(item) });
      row.addEventListener("mousedown", (event) => event.preventDefault());
      row.addEventListener("click", () => this.acceptPromptPickerItem(index));
    });
    this.scrollSelectedPromptPickerRowIntoView();
  }

  private getPickerSourceLabel(item: PickerItem) {
    if (item.kind === "folder") {
      return "文件夹";
    }
    if (item.kind === "file") {
      return "文件";
    }
    const sourcePath = item.skill?.sourcePath ?? "";
    return sourcePath.includes("/.system/") ? "系统" : "个人";
  }

  private sizePromptPicker() {
    if (!this.promptPickerEl || !this.composerContainer) {
      return;
    }
    const composerRect = this.composerContainer.getBoundingClientRect();
    const viewRect = this.containerEl.getBoundingClientRect();
    const availableAbove = composerRect.top - viewRect.top - 12;
    const maxHeight = Math.max(132, Math.min(420, availableAbove));
    this.promptPickerEl.style.maxHeight = `${maxHeight}px`;
  }

  private scrollSelectedPromptPickerRowIntoView() {
    if (!this.promptPickerEl) {
      return;
    }
    const selected = this.promptPickerEl.querySelector(".codex-agent-picker-row.is-selected");
    if (selected instanceof HTMLElement) {
      selected.scrollIntoView({ block: "nearest" });
    }
  }

  private getPickerFileIcon(path: string) {
    const lower = path.toLowerCase();
    if (lower.endsWith(".md") || lower.endsWith(".txt")) {
      return "file-text";
    }
    if (lower.endsWith(".json") || lower.endsWith(".js") || lower.endsWith(".ts") || lower.endsWith(".css") || lower.endsWith(".html") || lower.endsWith(".vue")) {
      return "file-code";
    }
    if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".gif") || lower.endsWith(".webp") || lower.endsWith(".svg")) {
      return "file-image";
    }
    return "file";
  }

  private handlePromptPickerKeydown(event: KeyboardEvent) {
    if (!this.promptPickerEl || this.promptPickerItems.length === 0) {
      return false;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      this.promptPickerIndex = Math.min(this.promptPickerIndex + 1, this.promptPickerItems.length - 1);
      this.renderPromptPicker();
      return true;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      this.promptPickerIndex = Math.max(this.promptPickerIndex - 1, 0);
      this.renderPromptPicker();
      return true;
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      this.acceptPromptPickerItem(this.promptPickerIndex);
      return true;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      this.closePromptPicker();
      return true;
    }
    return false;
  }

  private acceptPromptPickerItem(index: number) {
    const item = this.promptPickerItems[index];
    if (!item) {
      return;
    }
    this.removePromptTriggerText();
    if (item.kind === "skill" && item.skill) {
      this.addSkillContext(item.skill);
    } else if (item.kind === "folder" && item.path) {
      const folder = this.app.vault.getAbstractFileByPath(item.path);
      if (folder instanceof TFolder) {
        this.addFolderContext(folder);
      }
    } else if (item.kind === "file" && item.path) {
      const file = this.app.vault.getAbstractFileByPath(item.path);
      if (file instanceof TFile) {
        this.addFileContext(file);
      }
    }
    this.closePromptPicker();
  }

  private removePromptTriggerText() {
    if (!this.promptInput || !this.promptPickerTrigger) {
      return;
    }
    const selection = window.getSelection();
    const anchor = selection?.anchorNode;
    if (!selection || !anchor || anchor.nodeType !== Node.TEXT_NODE || !this.promptInput.contains(anchor)) {
      return;
    }
    const range = document.createRange();
    const end = selection.anchorOffset;
    range.setStart(anchor, Math.max(0, end - this.promptPickerTrigger.markerLength));
    range.setEnd(anchor, end);
    range.deleteContents();
    selection.removeAllRanges();
    selection.addRange(range);
  }

  private closePromptPicker() {
    this.promptPickerEl?.remove();
    this.promptPickerEl = null;
    this.promptPickerItems = [];
    this.promptPickerIndex = 0;
    this.promptPickerTrigger = null;
  }

  private formatFileSize(size: number) {
    if (!Number.isFinite(size) || size <= 0) {
      return "unknown size";
    }
    if (size >= 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(1)} MB`;
    }
    if (size >= 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }
    return `${size} B`;
  }

  private updatePromptEmptyState() {
    if (!this.promptInput) {
      return;
    }

    const hasText = this.stripPromptControlText(this.promptInput.innerText).trim().length > 0;
    const hasChip = Boolean(this.promptInput.querySelector(".codex-agent-chip"));
    const isEmpty = !hasText && !hasChip;
    this.promptInput.toggleClass("is-empty", isEmpty);
    this.promptPlaceholderEl?.toggleClass("is-visible", isEmpty);
    this.updateRunButtonDisabledState();
  }

  private hasPromptText() {
    return Boolean(this.promptInput && this.stripPromptControlText(this.promptInput.innerText).trim());
  }

  private updateRunButtonDisabledState() {
    if (!this.runButton || this.runningProcess) {
      return;
    }
    this.runButton.disabled = !this.hasPromptText();
  }

  private handlePromptKeydown(event: KeyboardEvent) {
    if (this.handlePromptPickerKeydown(event)) {
      return;
    }
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
      this.setRunButtonRunning(false);
      this.stopElapsedTimer();
      this.activeResponseItemId = null;
      this.activeResponseItemIndex = null;
      this.currentDiffStats = null;
      this.renderLiveDiff();
      this.finishRunStatus("Stopped", "Codex process was stopped by the user.");
      this.runningSessionId = null;
      return;
    }

    const prompt = this.getPromptText();
    if (!prompt) {
      this.updateRunButtonDisabledState();
      return;
    }
    const messageParts = this.getPromptMessageParts();
    const payload = await this.buildCodexPayload(prompt);
    const attached = payload.context.length;
    const summary = payload.context.length > 0
      ? payload.context.map((item) => {
        if (item.kind === "selection") {
          return `selection from ${item.path ?? "active editor"} (${item.text?.length ?? 0} chars)`;
        }
        if (item.kind === "skill") {
          return `skill: ${item.label}`;
        }
        return `${item.kind}: ${item.path}`;
      }).join("; ")
      : "no attached context";
    this.currentRunMetaDetail = this.formatRunMetaDetail();
    const contextStatusDetail = attached > 0 ? `Read ${attached} context items: ${summary}` : "No context attached";
    const initialStatusBody = this.formatRunStatusBody(contextStatusDetail);

    const session = this.getActiveSession();
    if (!this.hasStartedConversation(session)) {
      session.title = this.makeSessionTitle(prompt);
    }
    session.updatedAt = Date.now();
    session.timeline = [
      ...session.timeline,
      {
        title: "You",
        body: prompt,
        tone: "user",
        contextChips: payload.context.map((item) => ({
          id: item.id,
          kind: item.kind,
          label: item.label,
          detail: item.path ?? item.label,
          path: item.path,
          text: item.text
        })),
        messageParts
      },
      {
        title: "Thinking",
        body: initialStatusBody,
        tone: "status"
      }
    ];
    session.statusItemIndex = session.timeline.length - 1;
    session.runStartedAt = Date.now();
    this.currentRunStatusTitle = "Thinking";
    this.currentRunStatusBody = initialStatusBody;
    this.runningSessionId = session.id;
    this.isCancellingRun = false;
    this.activeResponseItemId = null;
    this.activeResponseItemIndex = null;
    this.exploredFiles = new Set<string>();
    this.currentDiffStats = null;
    this.renderLiveDiff();
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

    const settings = this.owner.getSettings();
    const codexBin = process.env.CODEX_BIN || settings.codexBin || DEFAULT_CODEX_BIN;
    const extraPath = this.buildRuntimeExtraPath(settings);
    const adapter = this.getCodexAdapter();
    const promptText = this.composeCodexPrompt(payload);
    this.runningProcess = adapter.start(
      {
        codexBin,
        extraPath,
        args,
        cwd: vaultPath,
        prompt: promptText,
        threadId: session.codexThreadId,
        model: this.toCodexModel(this.modelChoice),
        sandboxMode,
        approvalPolicy: this.mode === "agent" ? "on-request" : "never",
        reasoningEffort: this.toCodexReasoningEffort(this.reasoningLevel)
      },
      (event) => this.handleAgentEvent(event),
      (code) => this.handleAgentClose(code)
    );
    this.setRunButtonRunning(true);
    this.setLiveStatus("thinking", "Thinking");
    this.clearComposer();
  }

  private buildRuntimeExtraPath(settings: AgentPluginSettings) {
    return this.getParentPath(settings.nodeBin);
  }

  private getParentPath(filePath: string) {
    const trimmed = filePath.trim();
    const index = trimmed.lastIndexOf("/");
    if (index <= 0) {
      return "";
    }
    return trimmed.slice(0, index);
  }

  private getPromptText() {
    if (!this.promptInput) {
      return "";
    }

    const clone = this.promptInput.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".codex-agent-chip").forEach((node) => node.remove());
    return this.stripPromptControlText(clone.innerText).trim();
  }

  private getPromptMessageParts(): TimelineMessagePart[] {
    if (!this.promptInput) {
      return [];
    }

    const chipsById = new Map(this.contextChips.map((chip) => [chip.id, chip]));
    const parts: TimelineMessagePart[] = [];
    const addText = (text: string) => {
      const clean = this.stripPromptControlText(text);
      if (!clean) {
        return;
      }
      const previous = parts[parts.length - 1];
      if (previous?.type === "text") {
        previous.text += clean;
      } else {
        parts.push({ type: "text", text: clean });
      }
    };
    const addChip = (element: HTMLElement) => {
      const id = element.getAttribute("data-context-id");
      if (!id) {
        return;
      }
      const chip = chipsById.get(id);
      const label = element.querySelector<HTMLElement>(".codex-agent-chip-label")?.innerText.trim();
      const kind = element.getAttribute("data-context-kind");
      const normalizedKind = kind && ["selection", "file", "folder", "image", "skill"].includes(kind)
        ? kind as ContextChip["kind"]
        : chip?.kind;
      if (!chip && (!label || !normalizedKind)) {
        return;
      }
      parts.push({
        type: "chip",
        chip: {
          id,
          kind: normalizedKind ?? "file",
          label: chip?.label ?? label ?? "Context",
          detail: chip?.detail ?? element.getAttribute("data-context-detail") ?? "",
          path: chip?.path ?? element.getAttribute("data-context-path") ?? undefined,
          text: chip?.text ?? element.getAttribute("data-context-text") ?? undefined
        }
      });
    };
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        addText(node.textContent ?? "");
        return;
      }
      if (node instanceof HTMLBRElement) {
        addText("\n");
        return;
      }
      if (!(node instanceof HTMLElement)) {
        return;
      }
      if (node.hasClass("codex-agent-chip")) {
        addChip(node);
        return;
      }
      node.childNodes.forEach(walk);
    };

    this.promptInput.childNodes.forEach(walk);
    const first = parts[0];
    if (first?.type === "text") {
      first.text = first.text.trimStart();
      if (!first.text) {
        parts.shift();
      }
    }
    const last = parts[parts.length - 1];
    if (last?.type === "text") {
      last.text = last.text.trimEnd();
      if (!last.text) {
        parts.pop();
      }
    }
    return parts.length > 0 ? parts : [{ type: "text", text: this.getPromptText() }];
  }

  private clearComposer() {
    this.closePromptPicker();
    this.contextChips = [];
    if (this.promptInput) {
      this.promptInput.empty();
      this.updatePromptEmptyState();
    }
  }

  private async buildCodexPayload(prompt: string) {
    const settings = this.owner.getSettings();
    const activeFile = settings.autoAttachActiveNote ? this.app.workspace.getActiveFile() : null;
    const hasActiveFileChip = activeFile
      ? this.contextChips.some((chip) => chip.kind === "file" && chip.path === activeFile.path)
      : true;
    const chips = activeFile && !hasActiveFileChip
      ? [
        {
          id: this.makeContextChipId("file", activeFile.path),
          label: activeFile.name,
          detail: activeFile.path,
          kind: "file" as const,
          path: activeFile.path
        },
        ...this.contextChips
      ]
      : this.contextChips;
    return {
      prompt,
      context: await Promise.all(chips.map(async (chip) => {
        if (chip.kind === "file" && chip.path) {
          const file = this.app.vault.getAbstractFileByPath(chip.path);
          const text = file instanceof TFile ? await this.app.vault.cachedRead(file) : undefined;
          return {
            id: chip.id,
            kind: chip.kind,
            label: chip.label,
            path: chip.path,
            text: this.truncateText(text, settings.maxNoteLength)
          };
        }

        if (chip.kind === "folder" && chip.path) {
          const folder = this.app.vault.getAbstractFileByPath(chip.path);
          return {
            id: chip.id,
            kind: chip.kind,
            label: chip.label,
            path: chip.path,
            tree: folder instanceof TFolder ? this.buildFolderTree(folder, 0, settings.folderTreeDepth) : ""
          };
        }

        if (chip.kind === "image") {
          return {
            id: chip.id,
            kind: chip.kind,
            label: chip.label,
            text: chip.text
          };
        }

        if (chip.kind === "skill") {
          return {
            id: chip.id,
            kind: chip.kind,
            label: chip.label,
            text: chip.text
          };
        }

        return {
          id: chip.id,
          kind: chip.kind,
          label: chip.label,
          path: chip.path,
          text: chip.kind === "selection" ? this.truncateText(chip.text, settings.maxSelectionLength) : chip.text
        };
      }))
    };
  }

  private truncateText(text: string | undefined, maxLength: number) {
    if (!text || maxLength <= 0 || text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, maxLength)}\n\n[Truncated at ${maxLength} characters]`;
  }

  private buildFolderTree(folder: TFolder, depth = 0, maxDepth = 3): string {
    if (depth > maxDepth) {
      return "";
    }

    return folder.children
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((child) => {
        const prefix = "  ".repeat(depth);
        if (child instanceof TFolder) {
          const nested = this.buildFolderTree(child, depth + 1, maxDepth);
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
      if (item.kind === "image") {
        return `[Image placeholder: ${item.label}]\n${item.text ?? ""}`;
      }
      if (item.kind === "skill") {
        return `[Requested Codex skill: ${item.label}]\n${item.text ?? ""}\nThe user explicitly selected this skill. Follow it if available.`;
      }
      return `[Folder tree: ${item.path}]\n${item.tree ?? ""}`;
    }).join("\n\n");
    const modeInstruction = this.mode === "agent"
      ? "Agent mode: you may run necessary shell commands and edit files inside the current Obsidian vault workspace. Keep changes focused and reviewable. If you need access outside the vault, request explicit permission with a narrow reason and path instead of bypassing the sandbox."
      : "Ask mode: do not modify files and do not run shell commands; analyze only and explain proposed changes.";
    const turnModeInstructions = this.buildTurnModeInstructions();

    return [
      "You are running inside an Obsidian plugin compatibility test.",
      modeInstruction,
      `Mode: ${this.mode}`,
      `Sandbox: ${this.getCodexSandboxMode()}`,
      `Reasoning: ${this.reasoningLevel}`,
      ...(turnModeInstructions ? ["", `Turn mode instructions:\n${turnModeInstructions}`] : []),
      "",
      "User request:",
      payload.prompt,
      "",
      "Attached context:",
      contextBlocks || "(none)"
    ].join("\n");
  }

  private buildTurnModeInstructions() {
    if (this.turnAuxMode === "plan") {
      return "Plan mode: use Codex's native todo/plan capability for this turn when the task has multiple steps. Create or update the native plan as work progresses. For trivial tasks, keep the plan minimal or skip it if it would add overhead.";
    }
    if (this.turnAuxMode === "confirm-first") {
      return "This turn: restate your understanding of the user's request, then describe your proposed approach or implementation plan at a high level, and ask for confirmation before taking implementation actions. Do not execute the task yet. After the user confirms in the next turn, proceed normally and use todo/plan when appropriate.";
    }
    if (this.turnAuxMode === "deep-questions") {
      return "Deep Questions mode: interview the user deeply about the request or plan until there is shared understanding. Walk down the decision tree, resolve dependencies between decisions one by one, ask only one question at a time, and include your recommended answer with each question. If a question can be answered by inspecting the current codebase or attached context, inspect it yourself instead of asking the user. Do not rely on external or locally installed skills for this behavior.";
    }
    return "";
  }

  private getCodexSandboxMode() {
    return this.mode === "agent" ? "workspace-write" : "read-only";
  }

  private getCodexAdapter(): CodexAdapter {
    const adapterMode = this.owner.getSettings().adapterMode ?? this.adapterMode;
    if (adapterMode === "app-server") {
      return new AppServerAdapter();
    }
    if (adapterMode === "pty") {
      return new PtyCodexAdapter();
    }
    return new ExecJsonAdapter();
  }

  private handleAgentEvent(event: AgentEvent) {
    if (event.type === "thread") {
      const session = this.getTargetSession();
      session.codexThreadId = event.threadId;
      session.updatedAt = Date.now();
      this.persistSessions();
      return;
    }

    if (event.type === "message_delta") {
      this.appendOrUpdateResponseDelta(event.itemId, event.delta);
      return;
    }

    if (event.type === "message") {
      this.markActiveResponseComplete();
      this.appendTimelineItem({
        title: "",
        body: event.markdown,
        tone: "response"
      });
      this.updateTranscriptStatus(this.getProcessedStatusTitle(), "");
      return;
    }

    if (event.type === "token_usage") {
      const session = this.getTargetSession();
      session.tokenUsageTotal = event.totalTokens;
      session.tokenUsageInput = typeof event.inputTokens === "number" ? event.inputTokens : session.tokenUsageInput;
      session.tokenUsageLimit = typeof event.modelContextWindow === "number" ? event.modelContextWindow : null;
      session.updatedAt = Date.now();
      this.persistSessions();
      if (session.id === this.activeSessionId) {
        this.renderTokenUsage();
      }
      return;
    }

    if (event.type === "command") {
      const isComplete = event.status === "done";
      const isFailed = event.status === "failed";
      this.setLiveStatus(isComplete ? "running" : isFailed ? "error" : "running", isComplete ? "Command complete" : isFailed ? "Command failed" : "Running");
      this.upsertCommandTimelineItem(event);
      this.updateWorkingTranscriptStatus(isComplete ? "Command complete" : isFailed ? "Command failed" : "Running command", event.command);
      return;
    }

    if (event.type === "tool") {
      this.upsertToolTimelineItem(event);
      return;
    }

    if (event.type === "plan") {
      this.upsertPlanTimelineItem(event);
      return;
    }

    if (event.type === "approval") {
      const session = this.getTargetSession();
      const approval: ApprovalRequestState = {
        id: event.id,
        sessionId: session.id,
        approvalKind: event.approvalKind,
        title: event.title,
        detail: event.detail,
        command: event.command,
        cwd: event.cwd,
        reason: event.reason,
        commandActions: event.commandActions,
        proposedExecpolicyAmendment: event.proposedExecpolicyAmendment,
        proposedNetworkPolicyAmendments: event.proposedNetworkPolicyAmendments,
        permissions: event.permissions,
        respond: event.respond
      };
      this.pendingApprovals.set(event.id, approval);
      this.setLiveStatus("running", "Waiting for approval");
      this.appendTimelineItem({
        title: this.formatApprovalTitle(approval),
        body: this.formatApprovalBody(approval),
        tone: "command",
        approvalId: event.id
      });
      this.updateWorkingTranscriptStatus("Waiting for approval", event.detail);
      this.renderSessionTabs();
      this.notifyApprovalIfNeeded(approval);
      return;
    }

    if (event.type === "diff") {
      this.markActiveResponseComplete();
      this.updateCurrentDiffStats(event.diff);
      return;
    }

    if (event.type === "error") {
      this.markActiveResponseComplete();
      this.setLiveStatus("error", event.title);
      this.appendTimelineItem({
        title: event.title,
        body: event.message,
        tone: "command"
      });
      return;
    }

    if (event.state === "done") {
      this.markActiveResponseComplete();
      if (this.currentDiffStats) {
        this.upsertDiffTimelineItem(this.currentDiffStats.diffText, true);
        this.currentDiffStats = null;
        this.renderLiveDiff();
      }
    }
    this.setLiveStatus(event.state, event.title);
    if (event.state === "done") {
      this.updateTranscriptStatus(this.getProcessedStatusTitle(), event.detail ?? "");
    } else {
      this.updateWorkingTranscriptStatus(event.title, event.detail ?? "");
    }
  }

  private upsertPlanTimelineItem(event: Extract<AgentEvent, { type: "plan" }>) {
    const session = this.getTargetSession();
    const existingIndex = session.timeline.findIndex((item) => item.planId === event.itemId);
    const completed = event.items.filter((item) => item.status === "completed").length;
    const body = event.items.map((item) => `${item.status}:${item.text}`).join("\n");
    const item: TimelineItem = {
      title: event.title || "Plan",
      body: body || `${event.items.length} plan items`,
      tone: "tool",
      planId: event.itemId,
      planItems: event.items,
      planSummary: true
    };

    if (existingIndex >= 0) {
      session.timeline[existingIndex] = item;
    } else {
      session.timeline = [...session.timeline, item];
    }
    session.updatedAt = Date.now();
    this.persistSessions();
    this.updateTranscriptStatus(`${completed}/${event.items.length} plan items complete`, event.title);
    if (session.id === this.activeSessionId) {
      this.renderTimelineItems();
    }
  }

  private upsertToolTimelineItem(event: Extract<AgentEvent, { type: "tool" }>) {
    if (!event.filePath && event.title.toLowerCase().includes("command")) {
      return;
    }

    if (event.filePath) {
      this.exploredFiles.add(event.filePath);
      this.upsertReadSummaryTimelineItem();
    }

    const session = this.getTargetSession();
    const exploredSummary = this.exploredFiles.size > 0
      ? `Explored ${this.exploredFiles.size} files`
      : "";
    const detail = [event.detail, exploredSummary].filter(Boolean).join("\n");
    const existingIndex = session.timeline.findIndex((item) => item.toolItemId === event.itemId);
    const item: TimelineItem = {
      title: event.title,
      body: detail,
      tone: "tool",
      toolItemId: event.itemId
    };

    if (existingIndex >= 0) {
      session.timeline[existingIndex] = item;
    } else {
      session.timeline = [...session.timeline, item];
    }

    this.moveTranscriptStatusToEnd(session);
    session.updatedAt = Date.now();
    this.persistSessions();
    if (session.id === this.activeSessionId) {
      this.renderTimelineItems();
    }
  }

  private upsertCommandTimelineItem(event: Extract<AgentEvent, { type: "command" }>) {
    const session = this.getTargetSession();
    const groupId = `command-group:${session.id}:${session.runStartedAt}`;
    const existingIndex = session.timeline.findIndex((item) => item.commandGroupId === groupId);
    const existing = existingIndex >= 0 ? session.timeline[existingIndex] : undefined;
    const commands = existing?.commands ? [...existing.commands] : [];
    if (event.command && !commands.includes(event.command)) {
      commands.push(event.command);
    }
    const hasFailure = event.status === "failed" || existing?.title === "Command failed";
    const isRunning = event.status === "running";
    const item: TimelineItem = {
      title: hasFailure
        ? "Command failed"
        : isRunning
          ? "Running command"
          : `Command complete (${commands.length})`,
      body: commands.length > 0 ? `${commands.length} command${commands.length === 1 ? "" : "s"}` : "Running command",
      tone: "tool",
      commandGroupId: groupId,
      commands,
      expanded: existing?.expanded ?? !this.owner.getSettings().compactCommandGroups
    };

    if (existingIndex >= 0) {
      session.timeline[existingIndex] = item;
    } else {
      session.timeline = [...session.timeline, item];
    }
    session.updatedAt = Date.now();
    this.persistSessions();
    if (session.id === this.activeSessionId) {
      this.renderTimelineItems();
    }
  }

  private upsertReadSummaryTimelineItem() {
    const session = this.getTargetSession();
    const files = [...this.exploredFiles].sort();
    const itemId = `read-summary:${session.id}:${session.runStartedAt}`;
    const existingIndex = session.timeline.findIndex((item) => item.toolItemId === itemId);
    const item: TimelineItem = {
      title: `Read ${files.length} files`,
      body: files.join("\n"),
      tone: "tool",
      toolItemId: itemId,
      readSummary: true,
      readFiles: files
    };

    if (existingIndex >= 0) {
      session.timeline[existingIndex] = item;
    } else {
      session.timeline = [...session.timeline, item];
    }
    session.updatedAt = Date.now();
    this.persistSessions();
  }

  private updateCurrentDiffStats(diffText: string) {
    const stats = this.parseDiffStats(diffText);
    if (stats.files.length === 0) {
      return;
    }
    this.currentDiffStats = { ...stats, diffText };
    this.renderLiveDiff();
  }

  private upsertDiffTimelineItem(diffText: string, finalized: boolean) {
    const stats = this.parseDiffStats(diffText);
    if (stats.files.length === 0) {
      return;
    }

    const session = this.getTargetSession();
    const diffId = `diff-summary:${session.id}:${session.runStartedAt}`;
    const existingIndex = session.timeline.findIndex((item) => item.diffId === diffId);
    const existing = existingIndex >= 0 ? session.timeline[existingIndex] : undefined;
    const changed = !existing || existing.diffAdded !== stats.added || existing.diffRemoved !== stats.removed;
    const item: TimelineItem = {
      title: finalized ? `Edited ${stats.files.length} files` : "Editing files",
      body: `${stats.files.length} files changed +${stats.added} -${stats.removed}`,
      tone: "tool",
      diffSummary: true,
      diffId,
      diffText,
      diffAdded: stats.added,
      diffRemoved: stats.removed,
      diffFiles: stats.files.map((file: any) => file.path),
      diffExpandedFiles: existing?.diffExpandedFiles,
      diffAnimatedAt: changed ? Date.now() : existing?.diffAnimatedAt,
      expanded: existing?.expanded ?? false
    };

    if (existingIndex >= 0) {
      session.timeline[existingIndex] = item;
    } else {
      session.timeline = [...session.timeline, item];
    }

    this.currentDiffStats = { ...stats, diffText };
    session.updatedAt = Date.now();
    this.persistSessions();
    if (session.id === this.activeSessionId) {
      this.renderLiveDiff();
      this.renderTimelineItems();
    }
  }

  private parseDiffStats(diffText: string) {
    const files: DiffFileView[] = [];
    let current: DiffFileView | null = null;
    let oldLine: number | null = null;
    let newLine: number | null = null;

    const ensureFile = (path: string) => {
      let file = files.find((entry) => entry.path === path);
      if (!file) {
        file = { path, added: 0, removed: 0, lines: [] };
        files.push(file);
      }
      current = file;
      oldLine = null;
      newLine = null;
    };

    diffText.split(/\r?\n/).forEach((line) => {
      if (line.startsWith("diff --git ")) {
        const match = line.match(/^diff --git a\/(.+?) b\/(.+)$/);
        const path = match?.[2] ?? line.replace(/^diff --git\s+/, "");
        ensureFile(path);
        return;
      }
      if (line.startsWith("+++ b/")) {
        ensureFile(line.slice(6));
        return;
      }
      if (!current) {
        return;
      }
      if (line.startsWith("@@")) {
        const match = line.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
        oldLine = match ? Number(match[1]) : null;
        newLine = match ? Number(match[2]) : null;
        current.lines.push({ type: "hunk", text: line });
        return;
      }
      if (oldLine === null || newLine === null || line.startsWith("+++") || line.startsWith("---") || line.startsWith("index ")) {
        return;
      }
      if (line.startsWith("+")) {
        current.added += 1;
        current.lines.push({ type: "add", newLine, text: line.slice(1) });
        newLine += 1;
      } else if (line.startsWith("-")) {
        current.removed += 1;
        current.lines.push({ type: "remove", oldLine, text: line.slice(1) });
        oldLine += 1;
      } else if (line.startsWith(" ")) {
        current.lines.push({ type: "context", oldLine, newLine, text: line.slice(1) });
        oldLine += 1;
        newLine += 1;
      } else if (line === "\\ No newline at end of file") {
        current.lines.push({ type: "hunk", text: line });
      }
    });

    const changedFiles = files.filter((file) => file.added > 0 || file.removed > 0);
    return {
      files: changedFiles,
      added: changedFiles.reduce((total, file) => total + file.added, 0),
      removed: changedFiles.reduce((total, file) => total + file.removed, 0)
    };
  }

  private toggleDiffTimelineItem(diffId?: string) {
    if (!diffId) {
      return;
    }
    const session = this.getActiveSession();
    session.timeline = session.timeline.map((item) => {
      if (item.diffId !== diffId) {
        return item;
      }
      const files = this.parseDiffStats(item.diffText ?? "").files.map((file) => file.path);
      const expandedFiles = item.diffExpandedFiles ?? (item.expanded ? files : []);
      const shouldCollapse = expandedFiles.length > 0;
      return {
        ...item,
        expanded: !shouldCollapse,
        diffExpandedFiles: shouldCollapse ? [] : files
      };
    });
    session.updatedAt = Date.now();
    this.persistSessions();
    this.renderTimelineItems();
  }

  private toggleDiffFileTimelineItem(diffId: string | undefined, filePath: string) {
    if (!diffId) {
      return;
    }
    const session = this.getActiveSession();
    session.timeline = session.timeline.map((item) => {
      if (item.diffId !== diffId) {
        return item;
      }
      const allFiles = this.parseDiffStats(item.diffText ?? "").files.map((file) => file.path);
      const expanded = new Set(item.diffExpandedFiles ?? (item.expanded ? allFiles : []));
      if (expanded.has(filePath)) {
        expanded.delete(filePath);
      } else {
        expanded.add(filePath);
      }
      return {
        ...item,
        expanded: expanded.size > 0,
        diffExpandedFiles: [...expanded]
      };
    });
    session.updatedAt = Date.now();
    this.persistSessions();
    this.renderTimelineItems();
  }

  private toggleTimelineItemExpanded(commandGroupId?: string) {
    if (!commandGroupId) {
      return;
    }
    const session = this.getActiveSession();
    session.timeline = session.timeline.map((item) => item.commandGroupId === commandGroupId
      ? { ...item, expanded: !item.expanded }
      : item);
    session.updatedAt = Date.now();
    this.persistSessions();
    this.renderTimelineItems();
  }

  private appendOrUpdateResponseDelta(itemId: string, delta: string) {
    const session = this.getTargetSession();
    if (this.activeResponseItemId !== itemId || this.activeResponseItemIndex === null || !session.timeline[this.activeResponseItemIndex]) {
      this.activeResponseItemId = itemId;
      session.timeline = [
        ...session.timeline,
        {
          title: "",
          body: "",
          tone: "response",
          streaming: true
        }
      ];
      this.activeResponseItemIndex = session.timeline.length - 1;
    }

    const index = this.activeResponseItemIndex;
    if (index === null || !session.timeline[index]) {
      return;
    }

    session.timeline[index].body += delta;
    this.moveTranscriptStatusToEnd(session);
    session.updatedAt = Date.now();
    this.persistSessions();
    if (session.id === this.activeSessionId) {
      this.scheduleResponseRender();
    }
  }

  private scheduleResponseRender() {
    if (this.responseRenderTimer !== null) {
      return;
    }

    this.responseRenderTimer = window.setTimeout(() => {
      this.responseRenderTimer = null;
      this.renderTimelineItems();
    }, 80);
  }

  private markActiveResponseComplete() {
    if (this.responseRenderTimer !== null) {
      window.clearTimeout(this.responseRenderTimer);
      this.responseRenderTimer = null;
    }

    const session = this.getTargetSession();
    if (this.activeResponseItemIndex !== null && session.timeline[this.activeResponseItemIndex]?.tone === "response") {
      session.timeline[this.activeResponseItemIndex].streaming = false;
      session.updatedAt = Date.now();
      this.persistSessions();
      if (session.id === this.activeSessionId) {
        this.renderTimelineItems();
      }
    }
  }

  private formatApprovalTitle(approval: ApprovalRequestState) {
    if (approval.approvalKind === "command") {
      return "Allow Codex to run this command?";
    }
    if (approval.approvalKind === "file") {
      return "Allow Codex to edit files?";
    }
    return "Allow Codex to temporarily expand permissions?";
  }

  private formatApprovalBody(approval: ApprovalRequestState) {
    const showDetails = this.owner.getSettings().showDetailedApprovals;
    if (approval.approvalKind === "command") {
      const command = approval.command ?? approval.detail;
      const readableCommand = this.extractShellInnerCommand(command);
      const target = this.extractApprovalTarget(approval, readableCommand);
      const purpose = this.describeApprovalPurpose(approval, readableCommand);
      return [
        `**Operation**: ${this.describeCommandOperation(readableCommand)}`,
        target ? `**Target**: \`${target}\`` : "",
        approval.cwd ? `**Working directory**: \`${approval.cwd}\`` : "",
        purpose ? `**Purpose**: ${purpose}` : "",
        `**Will run**:\n\`\`\`text\n${command}\n\`\`\``,
        showDetails && approval.reason ? `**Raw Reason**: ${approval.reason}` : ""
      ].filter(Boolean).join("\n\n");
    }

    if (approval.approvalKind === "file") {
      return [
        "**Operation**: Allow Codex to edit files",
        approval.cwd ? `**Target scope**: \`${approval.cwd}\`` : "",
        approval.detail ? `**Purpose**: ${approval.detail}` : "",
        showDetails && approval.reason ? `**Raw Reason**: ${approval.reason}` : ""
      ].filter(Boolean).join("\n\n");
    }

    const target = this.describePermissionTargets(approval);
    return [
      "**Operation**: Temporarily expand permissions",
      target ? `**Target**: ${target}` : "",
      "**Purpose**: Allow Codex restricted access needed to complete the current task.",
      "This may include accessing paths outside the current vault, expanding file read/write scope, or network-related permissions.",
      showDetails && approval.reason ? `**Raw Reason**: ${approval.reason}` : ""
    ].filter(Boolean).join("\n\n");
  }

  private extractShellInnerCommand(command: string) {
    const match = command.match(/(?:^|\s)-lc\s+(['"])([\s\S]*)\1\s*$/);
    return match?.[2] ?? command;
  }

  private describeCommandOperation(command: string) {
    const name = this.getCommandName(command);
    if (["ls"].includes(name)) {
      return "List directory contents";
    }
    if (["find"].includes(name)) {
      return "Find files";
    }
    if (["cat", "sed", "nl", "head", "tail", "less"].includes(name)) {
      return "Read file contents";
    }
    if (["rg", "grep"].includes(name)) {
      return "Search text contents";
    }
    if (["cp", "mv"].includes(name)) {
      return "Copy or move files";
    }
    if (["mkdir"].includes(name)) {
      return "Create directories";
    }
    if (["rm", "rmdir"].includes(name)) {
      return "Delete files or directories";
    }
    if (["npm", "pnpm", "yarn", "bun"].includes(name)) {
      return "Run project scripts or dependency commands";
    }
    if (name === "git") {
      return "Run Git operations";
    }
    if (["curl", "wget"].includes(name)) {
      return "Access network resources";
    }
    return "Run command";
  }

  private describeApprovalPurpose(approval: ApprovalRequestState, command: string) {
    const name = this.getCommandName(command);
    if (name === "ls") {
      return "Check whether the directory exists and read its listing.";
    }
    if (["cat", "sed", "nl", "head", "tail", "less"].includes(name)) {
      return "Read target file contents to understand task context.";
    }
    if (["rg", "grep"].includes(name)) {
      return "Search files for relevant content.";
    }
    if (["find"].includes(name)) {
      return "Find matching files or directories.";
    }
    if (approval.reason) {
      return this.simplifyApprovalReason(approval.reason);
    }
    return "";
  }

  private getCommandName(command: string) {
    const token = this.tokenizeApprovalCommand(command)[0] ?? "";
    return token.split("/").pop() ?? token;
  }

  private tokenizeApprovalCommand(command: string) {
    return [...command.matchAll(/"([^"]+)"|'([^']+)'|(\S+)/g)]
      .map((match) => match[1] ?? match[2] ?? match[3])
      .filter(Boolean);
  }

  private extractApprovalTarget(approval: ApprovalRequestState, command: string) {
    const tokens = this.tokenizeApprovalCommand(command);
    const candidates = tokens.slice(1).filter((token) => !token.startsWith("-"));
    const commandTarget = candidates[candidates.length - 1];
    if (commandTarget?.startsWith("/") || commandTarget?.includes("/")) {
      return commandTarget;
    }
    const actionTarget = approval.commandActions
      ?.map((action) => action?.path ?? action?.name)
      .find((value) => typeof value === "string" && value.length > 0);
    if (actionTarget) {
      return actionTarget;
    }
    return commandTarget;
  }

  private describePermissionTargets(approval: ApprovalRequestState) {
    const permissions: any = approval.permissions ?? {};
    const fileSystem = permissions.fileSystem ?? {};
    const entries = Array.isArray(fileSystem.entries) ? fileSystem.entries : [];
    const paths = [
      ...(Array.isArray(fileSystem.read) ? fileSystem.read : []),
      ...(Array.isArray(fileSystem.write) ? fileSystem.write : []),
      ...entries.map((entry: any) => entry?.path)
    ].filter((path: any) => typeof path === "string" && path.length > 0);
    if (paths.length > 0) {
      return paths.map((path) => `\`${path}\``).join("、");
    }
    return approval.cwd ? `\`${approval.cwd}\`` : "";
  }

  private simplifyApprovalReason(reason: string) {
    return reason
      .replace(/^reason[:：]\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  private describeCommandActions(actions: any[]) {
    const labels = actions.map((action) => {
      if (action?.type === "read") {
        return `Read ${action.path ?? action.name ?? ""}`.trim();
      }
      if (action?.type === "listFiles") {
        return `List files ${action.path ?? ""}`.trim();
      }
      if (action?.type === "search") {
        return `Search ${action.query ?? ""} ${action.path ?? ""}`.trim();
      }
      return action?.command ?? action?.type ?? "Unknown operation";
    });
    return `Detected: ${labels.join("; ")}`;
  }

  private formatApprovalValue(value: any) {
    if (Array.isArray(value)) {
      return value.map((item) => typeof item === "string" ? item : JSON.stringify(item)).join(" ");
    }
    if (typeof value === "string") {
      return value;
    }
    return JSON.stringify(value);
  }

  private hasPendingApproval(sessionId: string) {
    return [...this.pendingApprovals.values()].some((approval) => approval.sessionId === sessionId);
  }

  private notifyApprovalIfNeeded(approval: ApprovalRequestState) {
    const session = this.getSessionById(approval.sessionId);
    const isActiveConversation = approval.sessionId === this.activeSessionId && this.app.workspace.activeLeaf === this.leaf;
    if (isActiveConversation || !session) {
      return;
    }

    new Notice(`Codex needs approval：${session.title}`);
    this.activeApprovalModal?.close();
    this.activeApprovalModal = new CodexApprovalNoticeModal(
      this.app,
      session.title,
      this.formatApprovalTitle(approval),
      () => {
        this.activeSessionId = approval.sessionId;
        this.persistSessions();
        this.app.workspace.revealLeaf(this.leaf);
        this.renderSessionTabs();
        this.renderTimelineItems();
      }
    );
    this.activeApprovalModal.open();
  }

  private resolveApproval(approvalId: string, decision: string) {
    const approval = this.pendingApprovals.get(approvalId);
    if (!approval) {
      return;
    }

    approval.respond(this.buildApprovalResponse(approval, decision));
    this.pendingApprovals.delete(approvalId);
    const session = this.getSessionById(approval.sessionId) ?? this.getTargetSession();
    session.timeline = session.timeline.map((item) => item.approvalId === approvalId
      ? {
        ...item,
        title: this.formatResolvedApprovalTitle(decision),
        approvalId: undefined
      }
      : item);
    session.updatedAt = Date.now();
    this.persistSessions();
    this.renderSessionTabs();
    this.renderTimelineItems();
  }

  private buildApprovalResponse(approval: ApprovalRequestState, decision: string) {
    if (approval.approvalKind === "permissions") {
      if (decision === "accept" || decision === "acceptForSession") {
        return {
          permissions: approval.permissions ?? {},
          scope: decision === "acceptForSession" ? "session" : "turn"
        };
      }
      return {
        permissions: {},
        scope: "turn",
        strictAutoReview: true
      };
    }

    return {
      decision: decision === "acceptForSession" ? "acceptForSession" : decision
    };
  }

  private formatResolvedApprovalTitle(decision: string) {
    if (decision === "accept") {
      return "Allowed";
    }
    if (decision === "acceptForSession") {
      return "Allowed for this session";
    }
    if (decision === "decline") {
      return "Denied";
    }
    return "Canceled";
  }

  private handleAgentClose(code: number | null) {
    if (this.isCancellingRun) {
      this.isCancellingRun = false;
      this.runningProcess = null;
      this.runningSessionId = null;
      this.activeResponseItemId = null;
      this.activeResponseItemIndex = null;
      this.setRunButtonRunning(false);
      this.stopElapsedTimer();
      this.currentDiffStats = null;
      this.renderLiveDiff();
      this.finishRunStatus("Stopped", "Codex process was stopped by the user.");
      this.persistSessions();
      return;
    }

    this.runningProcess = null;
    this.runningSessionId = null;
    this.activeResponseItemId = null;
    this.activeResponseItemIndex = null;
    this.setRunButtonRunning(false);
    this.stopElapsedTimer();
    this.markActiveResponseComplete();
    this.setLiveStatus(code === 0 ? "done" : "error", code === 0 ? "Completed" : "Run failed");
    if (code !== 0) {
      this.finishRunStatus("Run failed", `Codex exited with code ${code ?? "unknown"}.`);
    } else {
      this.updateTranscriptStatus(this.getProcessedStatusTitle(), "");
    }
    this.persistSessions();
  }

  private finishRunStatus(title: string, body = "") {
    this.currentRunStatusTitle = title;
    this.currentRunStatusBody = body;
    this.updateTranscriptStatus(title, body);
  }

  private updateWorkingTranscriptStatus(title: string, body = "") {
    this.currentRunStatusTitle = title;
    this.currentRunStatusBody = this.formatRunStatusBody(body);
    this.updateTranscriptStatus(title, this.currentRunStatusBody);
  }

  private formatRunMetaDetail() {
    return `${this.modelChoice} · ${this.reasoningLevel} reason`;
  }

  private formatRunStatusBody(detail = "") {
    return [this.currentRunMetaDetail, detail].filter(Boolean).join("\n");
  }

  private getProcessedStatusTitle() {
    return `Processed ${this.getElapsedLabel()}`;
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
      this.moveTranscriptStatusToEnd(session);
    }
    session.updatedAt = Date.now();
    if (session.id === this.activeSessionId) {
      this.renderTimelineItems();
    }
  }

  private moveTranscriptStatusToEnd(session: AgentSession) {
    const index = session.statusItemIndex;
    if (index === null || index < 0 || index >= session.timeline.length || index === session.timeline.length - 1) {
      return;
    }

    const [item] = session.timeline.splice(index, 1);
    session.timeline.push(item);
    session.statusItemIndex = session.timeline.length - 1;
    if (this.activeResponseItemIndex !== null && session.id === this.runningSessionId && index < this.activeResponseItemIndex) {
      this.activeResponseItemIndex -= 1;
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
        this.updateTranscriptStatus(this.currentRunStatusTitle, this.currentRunStatusBody);
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

  private toCodexReasoningEffort(level: ReasoningLevel) {
    const mapping: Record<ReasoningLevel, string | null> = {
      "Auto": null,
      "Low": "low",
      "Medium": "medium",
      "High": "high",
      "Extra High": "xhigh"
    };
    return mapping[level];
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
    this.renderTokenUsage();
  }

  private closeSession(sessionId: string) {
    const closingSession = this.sessions.find((session) => session.id === sessionId);
    if (this.runningSessionId === sessionId && this.runningProcess) {
      this.isCancellingRun = true;
      this.runningProcess.cancel();
      this.runningProcess = null;
      this.runningSessionId = null;
      this.activeResponseItemId = null;
      this.activeResponseItemIndex = null;
      this.stopElapsedTimer();
      this.setRunButtonRunning(false);
    }

    if (closingSession && this.hasStartedConversation(closingSession)) {
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
    this.renderTokenUsage();
  }

  private deleteHistorySession(sessionId: string) {
    if (this.runningSessionId === sessionId && this.runningProcess) {
      this.isCancellingRun = true;
      this.runningProcess.cancel();
      this.runningProcess = null;
      this.runningSessionId = null;
      this.activeResponseItemId = null;
      this.activeResponseItemIndex = null;
      this.stopElapsedTimer();
      this.setRunButtonRunning(false);
    }

    this.sessions = this.sessions.filter((session) => session.id !== sessionId);
    this.archivedSessions = this.archivedSessions.filter((session) => session.id !== sessionId);
    if (this.sessions.length === 0) {
      this.sessions = [this.createSession()];
    }
    if (!this.sessions.some((session) => session.id === this.activeSessionId)) {
      this.activeSessionId = this.sessions[0].id;
    }
    this.persistSessions();
    this.renderSessionTabs();
    this.renderTimelineItems();
    this.renderTokenUsage();
  }

  private persistSessions() {
    this.owner.saveAgentData(this.sessions, this.archivedSessions, this.activeSessionId);
  }

  private getActiveSession() {
    return this.sessions.find((session) => session.id === this.activeSessionId) ?? this.sessions[0];
  }

  private getSessionById(sessionId: string) {
    return this.sessions.find((session) => session.id === sessionId)
      ?? this.archivedSessions.find((session) => session.id === sessionId);
  }

  private getTargetSession() {
    return this.sessions.find((session) => session.id === this.runningSessionId)
      ?? this.getActiveSession();
  }

  private hasStartedConversation(session: AgentSession) {
    return session.timeline.length > 0 || Boolean(session.codexThreadId);
  }

  private makeSessionTitle(prompt: string) {
    const compact = prompt.replace(/\s+/g, " ").trim();
    if (!compact) {
      return "New Agent";
    }
    return compact.length > 22 ? `${compact.slice(0, 22)}...` : compact;
  }
}
