import {
  Editor,
  EditorPosition,
  editorInfoField,
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
import { StateEffect, StateField } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate, WidgetType } from "@codemirror/view";

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
const PLUGIN_VERSION = "0.1.8";
const AGENT_DATA_DIR_NAME = ".codexaiagent";
const LEGACY_AGENT_DATA_DIR_NAMES = [".codeaiagent"];
const AGENT_DATA_FILE_NAME = "data.json";
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
const INLINE_EDIT_DEFAULT_COMMANDS = {
  polish: {
    zhName: "润色",
    enName: "Polish",
    zhPrompt: "润色选中内容，使表达更清晰自然，保留原意和 Markdown 结构。",
    enPrompt: "Polish the selected content for clarity and natural flow while preserving the original meaning and Markdown structure."
  },
  summarize: {
    zhName: "总结",
    enName: "Summarize",
    zhPrompt: "总结选中内容，压缩为简洁要点，保留关键信息。",
    enPrompt: "Summarize the selected content into concise points while preserving the key information."
  }
};
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
  enableDiffReview: true,
  enableGitManagement: true,
  language: "en",
  pastedImageBehavior: "chip",
  chatViewLocation: "right-pane",
  chatFontSize: 15,
  inlineEditQuickCommands: [
    { id: "polish", name: INLINE_EDIT_DEFAULT_COMMANDS.polish.enName, prompt: INLINE_EDIT_DEFAULT_COMMANDS.polish.enPrompt },
    { id: "summarize", name: INLINE_EDIT_DEFAULT_COMMANDS.summarize.enName, prompt: INLINE_EDIT_DEFAULT_COMMANDS.summarize.enPrompt }
  ]
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
type AppLanguage = "zh" | "en";
type TurnAuxMode = "auto" | "plan" | "confirm-first" | "mirror-not-echo" | "deep-questions";
type GitReviewSection = "review" | "stage" | "commit" | "history";
type DiffReviewFilter = "active" | "accepted" | "rejected" | "all";
type InlineEditConversationMode = "current" | "new";

interface InlineEditQuickCommand {
  id: string;
  name: string;
  prompt: string;
}

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
  enableDiffReview: boolean;
  enableGitManagement: boolean;
  language: AppLanguage;
  pastedImageBehavior: "chip";
  chatViewLocation: ChatViewLocation;
  chatFontSize: number;
  inlineEditQuickCommands: InlineEditQuickCommand[];
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

interface DiffHunkView {
  id: string;
  header: string;
  added: number;
  removed: number;
  lines: DiffLineView[];
  rawLines: string[];
}

interface DiffFileView {
  path: string;
  oldPath: string;
  headerLines: string[];
  added: number;
  removed: number;
  lines: DiffLineView[];
  hunks: DiffHunkView[];
}

interface DiffReviewPersistedState {
  acceptedFiles: string[];
  acceptedHunks: string[];
  acceptedLines: string[];
  rejectedFiles: string[];
}

interface InlineDiffReviewSnapshot {
  file: DiffFileView;
  acceptedFiles: string[];
  acceptedHunks: string[];
  acceptedLines: string[];
  language: AppLanguage;
}

interface InlineDiffAction {
  action: "accept-hunk" | "reject-hunk" | "accept-line" | "reject-line";
  filePath: string;
  hunkId: string;
  lineKey?: string;
}

type InlineEditStatus = "idle" | "running" | "result" | "error";

interface InlineEditSnapshot {
  id: string;
  filePath: string;
  from: number;
  to: number;
  originalText: string;
  request: string;
  resultText: string;
  status: InlineEditStatus;
  statusTitle: string;
  isTableMode: boolean;
  tableEditRange?: TableEditRange;
  conversationMode: InlineEditConversationMode;
  quickCommands: InlineEditQuickCommand[];
  language: AppLanguage;
}

interface TableEditRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  totalRows: number;
  totalCols: number;
}

interface RenderedTableSelection {
  text: string;
  selectionText: string;
  sourceSelectionText: string;
  index: number;
  table?: HTMLTableElement;
  sourceStartLine?: number;
  sourceEndLine?: number;
  editorTableRange?: { from: EditorPosition; to: EditorPosition };
  sourceLine?: number;
  editRange?: TableEditRange;
  rect?: DOMRect;
  rows: string[][];
  selectedTexts: string[];
  selectedCellCoordinates?: Array<{ row: number; col: number }>;
}

interface RenderedTablePointerCell {
  filePath?: string;
  table: HTMLTableElement;
  row: number;
  col: number;
  time: number;
}

interface InlineEditSelectionState {
  id: string;
  editor: Editor;
  view: MarkdownView;
  file: TFile | null;
  from: EditorPosition;
  to: EditorPosition;
  originalText: string;
  beforeContext: string;
  afterContext: string;
  request: string;
  resultText: string;
  status: InlineEditStatus;
  statusTitle: string;
  isTableMode: boolean;
  tableEditRange?: TableEditRange;
  conversationMode: InlineEditConversationMode;
  quickCommands: InlineEditQuickCommand[];
  conversationRun?: InlineEditConversationRun;
  previousMode: "source" | "preview";
  previousSource: boolean;
  previousScrollTop: number;
}

interface InlineEditConversationRun {
  threadId?: string;
  onEvent(event: AgentEvent): void;
  onThread(threadId: string): void;
  onStatus(title: string): void;
  onDelta(delta: string): void;
  onMessage(markdown: string): void;
  onComplete(): void;
  onError(title: string, message: string): void;
}

let activeInlineDiffReviewController: { handleInlineDiffAction(action: InlineDiffAction): void } | null = null;
let activeInlineEditController: {
  handleInlineEditSubmit(id: string, request: string): void;
  handleInlineEditStop(id: string): void;
  handleInlineEditApply(id: string): void;
  handleInlineEditReject(id: string): void;
  handleInlineEditClose(id: string): void;
  handleInlineEditConversationMode(id: string, mode: InlineEditConversationMode): void;
  handleInlineEditQuickCommand(id: string, commandId: string, mode: InlineEditConversationMode): void;
} | null = null;

const setInlineDiffReviewEffect = StateEffect.define<InlineDiffReviewSnapshot | null>();
const inlineDiffReviewField = StateField.define<InlineDiffReviewSnapshot | null>({
  create: () => null,
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setInlineDiffReviewEffect)) {
        return effect.value;
      }
    }
    return value;
  }
});

const inlineDiffReviewDecorations = EditorView.decorations.compute([inlineDiffReviewField], (state) => {
  const snapshot = state.field(inlineDiffReviewField, false);
  if (!snapshot) {
    return Decoration.none;
  }
  return buildInlineDiffDecorations(state, snapshot);
});

const inlineDiffReviewExtension = [inlineDiffReviewField, inlineDiffReviewDecorations];

const setInlineEditEffect = StateEffect.define<InlineEditSnapshot | null>();
const inlineEditField = StateField.define<InlineEditSnapshot | null>({
  create: () => null,
  update(value, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(setInlineEditEffect)) {
        return effect.value;
      }
    }
    if (!value || !transaction.docChanged) {
      return value;
    }
    return {
      ...value,
      from: transaction.changes.mapPos(value.from, -1),
      to: transaction.changes.mapPos(value.to, 1)
    };
  }
});

const inlineEditDecorations = EditorView.decorations.compute([inlineEditField], (state) => {
  const snapshot = state.field(inlineEditField, false);
  if (!snapshot) {
    return Decoration.none;
  }
  const info = state.field(editorInfoField, false);
  if (info?.file?.path !== snapshot.filePath) {
    return Decoration.none;
  }
  const ranges: any[] = [];
  if (snapshot.status === "result" && !snapshot.isTableMode) {
    ranges.push(Decoration.mark({ class: "codex-agent-inline-edit-delete" }).range(snapshot.from, snapshot.to));
    ranges.push(Decoration.widget({
      widget: new InlineEditReplacementWidget(snapshot),
      block: false,
      side: 1
    }).range(snapshot.to));
    ranges.push(Decoration.widget({
      widget: new InlineEditActionsWidget(snapshot),
      block: false,
      side: 2
    }).range(snapshot.to));
  } else {
    ranges.push(Decoration.mark({ class: "codex-agent-inline-edit-selection" }).range(snapshot.from, snapshot.to));
    ranges.push(Decoration.widget({
      widget: new InlineEditWidget(snapshot),
      block: true,
      side: 1
    }).range(snapshot.to));
  }
  return Decoration.set(ranges, true);
});

const inlineEditExtension = [inlineEditField, inlineEditDecorations];

function inlineEditTr(language: AppLanguage, zh: string, en: string) {
  return language === "zh" ? zh : en;
}

class InlineEditReplacementWidget extends WidgetType {
  constructor(private snapshot: InlineEditSnapshot) {
    super();
  }

  eq(other: WidgetType) {
    return other instanceof InlineEditReplacementWidget
      && other.snapshot.id === this.snapshot.id
      && other.snapshot.resultText === this.snapshot.resultText;
  }

  toDOM() {
    const span = document.createElement("span");
    span.className = "codex-agent-inline-edit-inserted";
    span.textContent = this.snapshot.resultText || " ";
    return span;
  }
}

class InlineEditActionsWidget extends WidgetType {
  constructor(private snapshot: InlineEditSnapshot) {
    super();
  }

  eq(other: WidgetType) {
    return other instanceof InlineEditActionsWidget && other.snapshot.id === this.snapshot.id;
  }

  toDOM() {
    const actions = document.createElement("span");
    actions.className = "codex-agent-inline-edit-overlay-actions";
    actions.appendChild(this.createButton("×", "reject", false, inlineEditTr(this.snapshot.language, "拒绝修改", "Reject change")));
    actions.appendChild(this.createButton("✓", "apply", true, inlineEditTr(this.snapshot.language, "应用修改", "Apply change")));
    return actions;
  }

  private createButton(label: string, action: "apply" | "reject", primary = false, title = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `codex-agent-inline-edit-action ${primary ? "is-primary" : ""}`;
    button.textContent = label;
    if (title) {
      button.title = title;
      button.setAttr("aria-label", title);
    }
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (action === "apply") {
        activeInlineEditController?.handleInlineEditApply(this.snapshot.id);
      } else {
        activeInlineEditController?.handleInlineEditReject(this.snapshot.id);
      }
    });
    return button;
  }
}

class InlineEditWidget extends WidgetType {
  constructor(private snapshot: InlineEditSnapshot) {
    super();
  }

  eq(other: WidgetType) {
    return other instanceof InlineEditWidget
      && other.snapshot.id === this.snapshot.id
      && other.snapshot.status === this.snapshot.status
      && other.snapshot.statusTitle === this.snapshot.statusTitle
      && other.snapshot.request === this.snapshot.request
      && other.snapshot.resultText === this.snapshot.resultText
      && other.snapshot.conversationMode === this.snapshot.conversationMode
      && other.snapshot.quickCommands.length === this.snapshot.quickCommands.length
      && other.snapshot.language === this.snapshot.language;
  }

  toDOM() {
    const wrap = document.createElement("div");
    wrap.className = this.snapshot.status === "result"
      ? "codex-agent-inline-edit-result"
      : `codex-agent-inline-edit-widget is-${this.snapshot.status}`;
    if (this.snapshot.status === "result") {
      this.renderDiff(wrap);
      return wrap;
    }
    this.renderPrompt(wrap);
    return wrap;
  }

  private renderPrompt(parent: HTMLElement) {
    const t = (zh: string, en: string) => inlineEditTr(this.snapshot.language, zh, en);
    const header = parent.createDiv("codex-agent-inline-edit-header");
    const title = header.createDiv("codex-agent-inline-edit-title");
    setIcon(title.createSpan("codex-agent-inline-edit-title-icon"), "wand-sparkles");
    title.createSpan({ text: t("让 Codex 修改选中内容", "Edit selection with Codex") });
    title.createSpan({
      cls: "codex-agent-inline-edit-subtitle",
      text: this.snapshot.isTableMode ? t("Markdown 表格源码", "Markdown table source") : t("仅修改当前选区", "Current selection only")
    });
    if (this.snapshot.tableEditRange) {
      title.createSpan({ cls: "codex-agent-inline-edit-subtitle", text: formatTableEditRange(this.snapshot.tableEditRange, this.snapshot.language) });
    }
    const close = header.createEl("button", { cls: "codex-agent-inline-edit-ghost", text: t("关闭", "Close"), attr: { type: "button" } });
    close.addEventListener("mousedown", (event) => event.preventDefault());
    close.addEventListener("click", () => activeInlineEditController?.handleInlineEditClose(this.snapshot.id));

    const body = parent.createDiv("codex-agent-inline-edit-body");
    let input: HTMLTextAreaElement | null = null;
    if (this.snapshot.status === "running") {
      body.createDiv({
        cls: "codex-agent-inline-edit-request-text",
        text: this.snapshot.request || " "
      });
    } else {
      input = body.createEl("textarea", {
        cls: "codex-agent-inline-edit-input",
        attr: {
          rows: "2",
          placeholder: t("输入修改要求...", "Describe the edit...")
        }
      });
      input.value = this.snapshot.request;
      input.addEventListener("mousedown", (event) => event.stopPropagation());
      input.addEventListener("keydown", (event) => {
        event.stopPropagation();
        if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
          event.preventDefault();
          activeInlineEditController?.handleInlineEditSubmit(this.snapshot.id, input?.value ?? "");
        }
      });
      window.setTimeout(() => {
        if (this.snapshot.status === "idle") {
          input?.focus();
        }
      }, 0);
    }

    const footer = parent.createDiv("codex-agent-inline-edit-footer");
    const meta = footer.createEl("button", { cls: "codex-agent-inline-edit-meta", attr: { type: "button" } });
    meta.createSpan({ text: this.snapshot.conversationMode === "current" ? t("当前对话", "Current chat") : t("新对话", "New chat") });
    setIcon(meta.createSpan("codex-agent-inline-edit-caret"), "chevron-down");
    meta.disabled = this.snapshot.status === "running";
    meta.addEventListener("mousedown", (event) => event.preventDefault());
    meta.addEventListener("click", (event) => this.openConversationMenu(event));
    const shortcuts = footer.createEl("button", { cls: "codex-agent-inline-edit-meta", attr: { type: "button" } });
    shortcuts.createSpan({ text: this.snapshot.quickCommands.length > 0 ? t("快捷指令", "Quick commands") : t("快捷指令：无", "No quick commands") });
    setIcon(shortcuts.createSpan("codex-agent-inline-edit-caret"), "chevron-down");
    shortcuts.disabled = this.snapshot.quickCommands.length === 0 || this.snapshot.status === "running";
    shortcuts.addEventListener("mousedown", (event) => event.preventDefault());
    shortcuts.addEventListener("click", (event) => this.openQuickCommandMenu(event));
    const spacer = footer.createDiv("codex-agent-inline-edit-spacer");
    if (this.snapshot.status === "running") {
      footer.createSpan({ cls: "codex-agent-inline-edit-status", text: this.snapshot.statusTitle || t("思考中", "Thinking") });
      const stop = footer.createEl("button", { cls: "codex-agent-inline-edit-action", text: t("停止", "Stop"), attr: { type: "button" } });
      stop.addEventListener("mousedown", (event) => event.preventDefault());
      stop.addEventListener("click", () => activeInlineEditController?.handleInlineEditStop(this.snapshot.id));
      return;
    }
    if (this.snapshot.status === "error") {
      footer.createSpan({ cls: "codex-agent-inline-edit-status is-error", text: this.snapshot.statusTitle || t("失败", "Failed") });
    }
    const send = footer.createEl("button", { cls: "codex-agent-inline-edit-send", text: t("发送", "Send"), attr: { type: "button" } });
    send.addEventListener("mousedown", (event) => event.preventDefault());
    send.addEventListener("click", () => activeInlineEditController?.handleInlineEditSubmit(this.snapshot.id, input?.value ?? ""));
    spacer.empty();
  }

  private openConversationMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const menu = new Menu();
    menu.addItem((item) => item
      .setTitle(inlineEditTr(this.snapshot.language, "在当前对话中修改", "Edit in current chat"))
      .setIcon(this.snapshot.conversationMode === "current" ? "check" : "message-square")
      .onClick(() => activeInlineEditController?.handleInlineEditConversationMode(this.snapshot.id, "current")));
    menu.addItem((item) => item
      .setTitle(inlineEditTr(this.snapshot.language, "在新对话中修改", "Edit in new chat"))
      .setIcon(this.snapshot.conversationMode === "new" ? "check" : "message-square-plus")
      .onClick(() => activeInlineEditController?.handleInlineEditConversationMode(this.snapshot.id, "new")));
    menu.showAtMouseEvent(event);
  }

  private openQuickCommandMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const menu = new Menu();
    if (this.snapshot.quickCommands.length === 0) {
      menu.addItem((item) => item.setTitle(inlineEditTr(this.snapshot.language, "当前没有快捷指令，请在设置中创建", "No quick commands yet. Create one in settings.")).setDisabled(true));
    } else {
      this.snapshot.quickCommands.forEach((command) => {
        menu.addItem((item) => item
          .setTitle(command.name)
          .setIcon("sparkles")
          .onClick(() => activeInlineEditController?.handleInlineEditQuickCommand(this.snapshot.id, command.id, this.snapshot.conversationMode)));
      });
    }
    menu.showAtMouseEvent(event);
  }

  private renderDiff(parent: HTMLElement) {
    const lines = parent.createDiv("codex-agent-inline-edit-diff-lines");
    buildSimpleLineDiff(this.snapshot.originalText, this.snapshot.resultText).forEach((line) => {
      const row = lines.createDiv(`codex-agent-inline-edit-diff-line is-${line.type}`);
      row.createSpan({ cls: "codex-agent-inline-edit-diff-marker", text: line.type === "add" ? "+" : line.type === "remove" ? "-" : " " });
      row.createSpan({ cls: "codex-agent-inline-edit-diff-code", text: line.text || " " });
    });
    const actions = parent.createDiv("codex-agent-inline-edit-inline-actions");
    actions.appendChild(this.createDiffButton("×", "reject", false, inlineEditTr(this.snapshot.language, "拒绝修改", "Reject change")));
    actions.appendChild(this.createDiffButton("✓", "apply", true, inlineEditTr(this.snapshot.language, "应用修改", "Apply change")));
  }

  private createDiffButton(label: string, action: "apply" | "reject", primary = false, title = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `codex-agent-inline-edit-action ${primary ? "is-primary" : ""}`;
    button.textContent = label;
    if (title) {
      button.title = title;
      button.setAttr("aria-label", title);
    }
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", () => {
      if (action === "apply") {
        activeInlineEditController?.handleInlineEditApply(this.snapshot.id);
      } else {
        activeInlineEditController?.handleInlineEditReject(this.snapshot.id);
      }
    });
    return button;
  }
}

function buildSimpleLineDiff(original: string, replacement: string): Array<{ type: "context" | "add" | "remove"; text: string }> {
  const oldLines = original.split(/\r?\n/);
  const newLines = replacement.split(/\r?\n/);
  const prefix: Array<{ type: "context"; text: string }> = [];
  while (oldLines.length && newLines.length && oldLines[0] === newLines[0]) {
    prefix.push({ type: "context", text: oldLines.shift() ?? "" });
  }
  const suffix: Array<{ type: "context"; text: string }> = [];
  while (oldLines.length && newLines.length && oldLines[oldLines.length - 1] === newLines[newLines.length - 1]) {
    suffix.unshift({ type: "context", text: oldLines.pop() ?? "" });
    newLines.pop();
  }
  return [
    ...prefix,
    ...oldLines.map((text) => ({ type: "remove" as const, text })),
    ...newLines.map((text) => ({ type: "add" as const, text })),
    ...suffix
  ];
}

function formatTableEditRange(range: TableEditRange, language: AppLanguage = "zh") {
  return inlineEditTr(
    language,
    `修改范围：第 ${range.startRow + 1}-${range.endRow + 1} 行，第 ${range.startCol + 1}-${range.endCol + 1} 列`,
    `Edit scope: rows ${range.startRow + 1}-${range.endRow + 1}, columns ${range.startCol + 1}-${range.endCol + 1}`
  );
}

class InlineDiffHunkWidget extends WidgetType {
  constructor(
    private filePath: string,
    private hunk: DiffHunkView,
    private index: number,
    private accepted: boolean,
    private language: AppLanguage
  ) {
    super();
  }

  eq(other: WidgetType) {
    return other instanceof InlineDiffHunkWidget
      && other.filePath === this.filePath
      && other.hunk.id === this.hunk.id
      && other.accepted === this.accepted
      && other.language === this.language;
  }

  toDOM() {
    const row = document.createElement("div");
    row.className = `codex-agent-cm-diff-hunk ${this.accepted ? "is-accepted" : ""}`;
    const label = row.createSpan({ cls: "codex-agent-cm-diff-hunk-label", text: `Hunk ${this.index + 1}` });
    label.setAttr("title", this.hunk.header);
    row.createSpan({ cls: "codex-agent-cm-diff-count is-add", text: `+${this.hunk.added}` });
    row.createSpan({ cls: "codex-agent-cm-diff-count is-remove", text: `-${this.hunk.removed}` });
    row.appendChild(this.createAction("✓", inlineEditTr(this.language, "接受此 hunk", "Accept hunk"), "accept-hunk"));
    row.appendChild(this.createAction("×", inlineEditTr(this.language, "拒绝此 hunk", "Reject hunk"), "reject-hunk", true));
    return row;
  }

  private createAction(text: string, title: string, action: InlineDiffAction["action"], danger = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `codex-agent-cm-diff-action ${danger ? "is-danger" : ""}`;
    button.textContent = text;
    button.title = title;
    button.disabled = this.accepted && action === "accept-hunk";
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      activeInlineDiffReviewController?.handleInlineDiffAction({
        action,
        filePath: this.filePath,
        hunkId: this.hunk.id
      });
    });
    return button;
  }
}

class InlineDiffLineControlWidget extends WidgetType {
  constructor(
    private action: InlineDiffAction,
    private marker: string,
    private accepted: boolean,
    private language: AppLanguage
  ) {
    super();
  }

  eq(other: WidgetType) {
    return other instanceof InlineDiffLineControlWidget
      && other.action.action === this.action.action
      && other.action.filePath === this.action.filePath
      && other.action.hunkId === this.action.hunkId
      && other.action.lineKey === this.action.lineKey
      && other.accepted === this.accepted
      && other.language === this.language;
  }

  toDOM() {
    const wrap = document.createElement("span");
    wrap.className = `codex-agent-cm-diff-inline-controls ${this.accepted ? "is-accepted" : ""}`;
    wrap.createSpan({ cls: "codex-agent-cm-diff-marker", text: this.marker });
    wrap.appendChild(this.createButton("✓", inlineEditTr(this.language, "接受这一行", "Accept line"), "accept-line"));
    wrap.appendChild(this.createButton("×", inlineEditTr(this.language, "拒绝这一行", "Reject line"), "reject-line", true));
    return wrap;
  }

  private createButton(text: string, title: string, action: InlineDiffAction["action"], danger = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `codex-agent-cm-diff-action ${danger ? "is-danger" : ""}`;
    button.textContent = text;
    button.title = title;
    button.disabled = this.accepted && action === "accept-line";
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      activeInlineDiffReviewController?.handleInlineDiffAction({
        ...this.action,
        action
      });
    });
    return button;
  }
}

class InlineDiffRemovedLineWidget extends WidgetType {
  constructor(
    private action: InlineDiffAction,
    private text: string,
    private oldLine: number | undefined,
    private language: AppLanguage
  ) {
    super();
  }

  eq(other: WidgetType) {
    return other instanceof InlineDiffRemovedLineWidget
      && other.action.filePath === this.action.filePath
      && other.action.hunkId === this.action.hunkId
      && other.action.lineKey === this.action.lineKey
      && other.text === this.text
      && other.oldLine === this.oldLine
      && other.language === this.language;
  }

  toDOM() {
    const row = document.createElement("div");
    row.className = "codex-agent-cm-diff-removed-line";
    row.createSpan({ cls: "codex-agent-cm-diff-removed-marker", text: "-" });
    row.createSpan({ cls: "codex-agent-cm-diff-removed-number", text: this.oldLine ? String(this.oldLine) : "" });
    row.createSpan({ cls: "codex-agent-cm-diff-removed-code", text: this.text || " " });
    const actions = row.createSpan("codex-agent-cm-diff-removed-actions");
    actions.appendChild(this.createButton("✓", inlineEditTr(this.language, "接受这一行", "Accept line")));
    actions.appendChild(this.createButton("×", inlineEditTr(this.language, "拒绝这一行", "Reject line"), true));
    return row;
  }

  private createButton(text: string, title: string, danger = false) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `codex-agent-cm-diff-action ${danger ? "is-danger" : ""}`;
    button.textContent = text;
    button.title = title;
    button.addEventListener("mousedown", (event) => event.preventDefault());
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      activeInlineDiffReviewController?.handleInlineDiffAction({
        ...this.action,
        action: danger ? "reject-line" : "accept-line"
      });
    });
    return button;
  }
}

function buildInlineDiffDecorations(state: any, snapshot: InlineDiffReviewSnapshot): DecorationSet {
  const info = state.field(editorInfoField, false);
  if (info?.file?.path !== snapshot.file.path) {
    return Decoration.none;
  }
  const acceptedFiles = new Set(snapshot.acceptedFiles);
  const acceptedHunks = new Set(snapshot.acceptedHunks);
  const acceptedLines = new Set(snapshot.acceptedLines);
  if (acceptedFiles.has(snapshot.file.path)) {
    return Decoration.none;
  }
  const ranges: any[] = [];
  snapshot.file.hunks.forEach((hunk, index) => {
    const hunkAccepted = acceptedFiles.has(snapshot.file.path) || acceptedHunks.has(`${snapshot.file.path}::${hunk.id}`);
    if (hunkAccepted) {
      return;
    }
    const hunkPos = findInlineHunkPosition(state, hunk);
    ranges.push(Decoration.widget({
      widget: new InlineDiffHunkWidget(snapshot.file.path, hunk, index, hunkAccepted, snapshot.language),
      block: true,
      side: -1
    }).range(hunkPos));
    hunk.lines.forEach((line) => {
      const lineKey = getInlineDiffLineKey(snapshot.file.path, hunk.id, line);
      const lineAccepted = hunkAccepted || acceptedLines.has(lineKey);
      if (lineAccepted) {
        return;
      }
      if (line.type === "add" && typeof line.newLine === "number" && line.newLine <= state.doc.lines) {
        const docLine = state.doc.line(line.newLine);
        ranges.push(Decoration.line({
          attributes: { class: `codex-agent-cm-diff-line is-add ${lineAccepted ? "is-accepted" : ""}` }
        }).range(docLine.from));
        ranges.push(Decoration.widget({
          widget: new InlineDiffLineControlWidget({
            action: "accept-line",
            filePath: snapshot.file.path,
            hunkId: hunk.id,
            lineKey
          }, "+", lineAccepted, snapshot.language),
          side: -1
        }).range(docLine.from));
      } else if (line.type === "remove") {
        const pos = findInlineRemovedLinePosition(state, hunk, line);
        ranges.push(Decoration.widget({
          widget: new InlineDiffRemovedLineWidget({
            action: "accept-line",
            filePath: snapshot.file.path,
            hunkId: hunk.id,
            lineKey
          }, line.text, line.oldLine, snapshot.language),
          block: true,
          side: -1
        }).range(pos));
      }
    });
  });
  return Decoration.set(ranges, true);
}

function findInlineHunkPosition(state: any, hunk: DiffHunkView): number {
  const firstChange = hunk.lines.find((line) => line.type === "add" || line.type === "remove");
  if (firstChange) {
    if (firstChange.type === "add" && firstChange.newLine && firstChange.newLine <= state.doc.lines) {
      return state.doc.line(firstChange.newLine).from;
    }
    if (firstChange.type === "remove") {
      return findInlineRemovedLinePosition(state, hunk, firstChange);
    }
  }
  const firstContext = hunk.lines.find((line) => (line.type === "context" || line.type === "add") && typeof line.newLine === "number");
  if (firstContext?.newLine && firstContext.newLine <= state.doc.lines) {
    return state.doc.line(firstContext.newLine).from;
  }
  return Math.min(Math.max(getInlineHunkNewStartLine(hunk) - 1, 0), state.doc.lines) === 0
    ? 0
    : state.doc.line(Math.min(getInlineHunkNewStartLine(hunk), state.doc.lines)).from;
}

function findInlineRemovedLinePosition(state: any, hunk: DiffHunkView, line: DiffLineView): number {
  const index = hunk.lines.indexOf(line);
  for (let cursor = index + 1; cursor < hunk.lines.length; cursor += 1) {
    const next = hunk.lines[cursor];
    if ((next.type === "context" || next.type === "add") && typeof next.newLine === "number" && next.newLine <= state.doc.lines) {
      return state.doc.line(next.newLine).from;
    }
  }
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const previous = hunk.lines[cursor];
    if ((previous.type === "context" || previous.type === "add") && typeof previous.newLine === "number" && previous.newLine <= state.doc.lines) {
      return state.doc.line(previous.newLine).to;
    }
  }
  return findInlineHunkPosition(state, hunk);
}

function getInlineHunkNewStartLine(hunk: DiffHunkView) {
  const match = hunk.header.match(/\+(\d+)(?:,\d+)?/);
  return match ? Number(match[1]) : 1;
}

function getInlineDiffLineKey(filePath: string, hunkId: string, line: DiffLineView) {
  const lineNo = line.type === "remove" ? line.oldLine : line.newLine;
  return `${filePath}::${hunkId}::${line.type}:${lineNo ?? "?"}:${line.text}`;
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
  draftMessageParts?: TimelineMessagePart[];
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
  diffReviewState: DiffReviewPersistedState;
}

type AgentRuntimeState = "idle" | "thinking" | "running" | "done" | "error";

interface AgentRunState {
  runId: string;
  handle: AgentRunHandle;
  isCancelling: boolean;
  activeResponseItemId: string | null;
  activeResponseItemIndex: number | null;
  exploredFiles: Set<string>;
  currentDiffStats: any;
  statusTitle: string;
  statusBody: string;
  metaDetail: string;
}

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
      developerInstructions: this.buildPathSafetyInstructions(request.cwd),
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

  private dirname(filePath: string) {
    const normalized = filePath.replace(/\\/g, "/").replace(/\/+$/, "");
    const index = normalized.lastIndexOf("/");
    return index > 0 ? normalized.slice(0, index) : "";
  }

  private buildPathSafetyInstructions(cwd: string) {
    const normalizedCwd = cwd.replace(/\\/g, "/").replace(/\/+$/, "");
    const shadowRoot = normalizedCwd.replace(/^\/+/, "");
    return [
      "Path safety for this Obsidian vault:",
      `- The vault root and current working directory are ${normalizedCwd || cwd}.`,
      "- Treat vault files as cwd-relative paths unless a tool explicitly requires an absolute path.",
      `- Never create or edit paths under ${shadowRoot}/ inside the vault; that is a shadow copy of the vault path.`,
      "- If you see a path like Users/.../Documents/<vault>/note.md, convert it to the vault-relative suffix before reading or writing."
    ].join("\n");
  }

  private findShadowVaultPath(value: any, cwd: string): { path: string; relativePath: string } | null {
    const normalizedCwd = cwd.replace(/\\/g, "/").replace(/\/+$/, "");
    const shadowRoot = normalizedCwd.replace(/^\/+/, "");
    if (!shadowRoot) {
      return null;
    }

    const visit = (entry: any): { path: string; relativePath: string } | null => {
      if (typeof entry === "string") {
        return this.matchShadowVaultPath(entry, shadowRoot);
      }
      if (Array.isArray(entry)) {
        for (const item of entry) {
          const match = visit(item);
          if (match) {
            return match;
          }
        }
        return null;
      }
      if (entry && typeof entry === "object") {
        for (const item of Object.values(entry)) {
          const match = visit(item);
          if (match) {
            return match;
          }
        }
      }
      return null;
    };

    return visit(value);
  }

  private matchShadowVaultPath(value: string, shadowRoot: string): { path: string; relativePath: string } | null {
    const normalized = value.replace(/\\/g, "/");
    const escapedRoot = this.escapeRegExp(shadowRoot);
    const pattern = new RegExp(`(?:^|[\\s"'\\\`=:(<>|;&])(?:\\./)?(${escapedRoot}(?:/[^\\s"'\\\`;&|<>)]*)?)`);
    const match = normalized.match(pattern);
    if (!match?.[1]) {
      return null;
    }

    const shadowPath = match[1].replace(/\/+$/, "");
    return {
      path: shadowPath,
      relativePath: shadowPath.slice(shadowRoot.length).replace(/^\/+/, "") || "."
    };
  }

  private escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
    const shadowPath = this.findShadowVaultPath(params, request.cwd);
    if (shadowPath && String(message.method).includes("requestApproval")) {
      onEvent({
        type: "status",
        state: "error",
        title: "Blocked shadow vault path",
        detail: `Codex tried to use \`${shadowPath.path}\` inside the vault. Use vault-relative path \`${shadowPath.relativePath}\` instead.`
      });
      if (message.method === "item/permissions/requestApproval") {
        this.sendResponse(message.id, { permissions: {}, scope: "turn", strictAutoReview: true });
      } else {
        this.sendResponse(message.id, { decision: "decline" });
      }
      return;
    }

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
  private inlineEditState: InlineEditSelectionState | null = null;
  private inlineEditEditorView: EditorView | null = null;
  private inlineEditHandle: AgentRunHandle | null = null;
  private inlineEditRunId = 0;
  private renderedTableDragStart: RenderedTablePointerCell | null = null;
  private renderedTableDragEnd: RenderedTablePointerCell | null = null;
  private availableSkills: SkillDefinition[] = [...BUILTIN_CODEX_SKILLS];
  private agentData: AgentPluginData = {
    sessions: [],
    archivedSessions: [],
    activeSessionId: "",
    settings: { ...DEFAULT_SETTINGS },
    diffReviewState: {
      acceptedFiles: [],
      acceptedHunks: [],
      acceptedLines: [],
      rejectedFiles: []
    }
  };

  async onload() {
    const { data: rawData, migratedFromLegacy } = await this.loadAgentDataFile();
    this.agentData = this.normalizeAgentData(rawData);
    if (rawData?.appServerDebugEvents || migratedFromLegacy) {
      void this.saveAgentDataFile();
    }
    this.availableSkills = this.loadAvailableSkills();
    this.addSettingTab(new CodexAgentSettingTab(this.app, this));
    this.registerEditorExtension(inlineDiffReviewExtension);
    this.registerEditorExtension(inlineEditExtension);
    this.registerEditorExtension(this.createLivePreviewTableMarkerExtension());
    this.registerMarkdownPostProcessor((el, ctx) => {
      void this.markRenderedTables(el, ctx);
    });

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
            .setTitle(this.tr("加入 Codex 对话", "Add to Codex conversation"))
            .setIcon("message-square-plus")
            .onClick(async () => {
              const agentView = await this.activateView();
              agentView?.addSelectionContext(selection, view.file);
            });
        });
        menu.addItem((item) => {
          item
            .setTitle(this.tr("用 Codex 修改选中内容", "Edit selection with Codex"))
            .setIcon("wand-sparkles")
            .onClick(() => {
              void this.openInlineEditForEditorSelection(editor, view);
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
              .setTitle(this.tr("添加文件到Codex对话", "Add file to Codex conversation"))
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
              .setTitle(this.tr("添加文件夹到Codex对话", "Add folder to Codex conversation"))
              .setIcon("folder-plus")
              .onClick(async () => {
                const view = await this.activateView();
                view?.addFolderContext(file);
              });
          });
        }
      })
    );

    this.registerDomEvent(document, "mousedown", (event: MouseEvent) => {
      this.renderedTableDragStart = this.getRenderedTablePointerCell(event);
      this.renderedTableDragEnd = null;
    });

    this.registerDomEvent(document, "mouseup", (event: MouseEvent) => {
      this.renderedTableDragEnd = this.getRenderedTablePointerCell(event);
      window.setTimeout(() => this.showSelectionAddButton(), 0);
    });

    this.registerDomEvent(document, "keydown", (event: KeyboardEvent) => {
      if (event.key === "Escape" && this.inlineEditState) {
        this.closeInlineEdit();
        return;
      }
      this.hideSelectionAddButton();
    });
  }

  async onunload() {
    this.hideSelectionAddButton();
    this.closeInlineEdit();
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_CODEX_AGENT);
  }

  private createLivePreviewTableMarkerExtension() {
    const owner = this;
    return ViewPlugin.fromClass(class {
      constructor(private view: EditorView) {
        owner.markLivePreviewTablesInEditorView(this.view);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged || update.geometryChanged) {
          owner.markLivePreviewTablesInEditorView(update.view);
        }
      }
    }).extension;
  }

  getAgentData(): AgentPluginData {
    return {
      sessions: this.agentData.sessions.map((session) => ({ ...session, timeline: [...session.timeline] })),
      archivedSessions: this.agentData.archivedSessions.map((session) => ({ ...session, timeline: [...session.timeline] })),
      activeSessionId: this.agentData.activeSessionId,
      settings: { ...this.agentData.settings },
      diffReviewState: this.cloneDiffReviewState(this.agentData.diffReviewState)
    };
  }

  getSettings(): AgentPluginSettings {
    return { ...this.agentData.settings };
  }

  tr(zh: string, en: string) {
    return this.agentData.settings.language === "zh" ? zh : en;
  }

  localizeInlineEditQuickCommand(command: InlineEditQuickCommand, language = this.agentData.settings.language): InlineEditQuickCommand {
    const defaults = INLINE_EDIT_DEFAULT_COMMANDS[command.id as keyof typeof INLINE_EDIT_DEFAULT_COMMANDS];
    if (!defaults) {
      return command;
    }
    const knownNames = new Set([defaults.zhName, defaults.enName]);
    const knownPrompts = new Set([defaults.zhPrompt, defaults.enPrompt]);
    return {
      ...command,
      name: knownNames.has(command.name) ? inlineEditTr(language, defaults.zhName, defaults.enName) : command.name,
      prompt: knownPrompts.has(command.prompt) ? inlineEditTr(language, defaults.zhPrompt, defaults.enPrompt) : command.prompt
    };
  }

  localizeInlineEditQuickCommands(commands: InlineEditQuickCommand[], language = this.agentData.settings.language) {
    return commands.map((command) => this.localizeInlineEditQuickCommand(command, language));
  }

  getDiffReviewState(): DiffReviewPersistedState {
    return this.cloneDiffReviewState(this.agentData.diffReviewState);
  }

  saveDiffReviewState(diffReviewState: DiffReviewPersistedState) {
    this.agentData = {
      ...this.agentData,
      diffReviewState: this.normalizeDiffReviewState(diffReviewState)
    };
    void this.saveAgentDataFile();
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
    await this.saveAgentDataFile();
    this.refreshOpenAgentViews();
  }

  async openAgentView() {
    await this.activateView();
  }

  async clearUserData() {
    const dataDirPaths = [
      this.getAgentDataDirPath(),
      ...LEGACY_AGENT_DATA_DIR_NAMES.map((dirName) => this.getAgentDataDirPath(dirName))
    ].filter(Boolean);
    try {
      for (const dataDirPath of [...new Set(dataDirPaths)]) {
        await fs.promises.rm(dataDirPath, { recursive: true, force: true });
      }
      this.agentData = this.createDefaultAgentData();
      this.app.workspace.detachLeavesOfType(VIEW_TYPE_CODEX_AGENT);
      new Notice("Codex AI Agent user data cleared.");
    } catch (error) {
      console.error("Failed to clear Codex AI Agent user data", error);
      new Notice("Failed to clear Codex AI Agent user data.");
    }
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
      settings: this.agentData.settings,
      diffReviewState: this.agentData.diffReviewState
    };
    void this.saveAgentDataFile();
  }

  private createDefaultAgentData(): AgentPluginData {
    return {
      sessions: [],
      archivedSessions: [],
      activeSessionId: "",
      settings: { ...DEFAULT_SETTINGS },
      diffReviewState: {
        acceptedFiles: [],
        acceptedHunks: [],
        acceptedLines: [],
        rejectedFiles: []
      }
    };
  }

  private async loadAgentDataFile(): Promise<{ data: any; migratedFromLegacy: boolean }> {
    const agentDataPath = this.getAgentDataFilePath();
    if (agentDataPath) {
      const stored = await this.readJsonFile(agentDataPath);
      if (stored !== null) {
        return { data: stored, migratedFromLegacy: false };
      }
    }

    for (const legacyDirName of LEGACY_AGENT_DATA_DIR_NAMES) {
      const legacyRootPath = this.getAgentDataFilePath(legacyDirName);
      if (!legacyRootPath || legacyRootPath === agentDataPath) {
        continue;
      }
      const legacyRootData = await this.readJsonFile(legacyRootPath);
      if (legacyRootData !== null) {
        return { data: legacyRootData, migratedFromLegacy: true };
      }
    }

    const legacyData = await this.loadData();
    return { data: legacyData, migratedFromLegacy: Boolean(legacyData) };
  }

  private async saveAgentDataFile() {
    const agentDataPath = this.getAgentDataFilePath();
    if (!agentDataPath) {
      await this.saveData(this.agentData);
      return;
    }
    try {
      await fs.promises.mkdir(path.dirname(agentDataPath), { recursive: true });
      await fs.promises.writeFile(agentDataPath, JSON.stringify(this.agentData, null, 2), "utf8");
    } catch (error) {
      console.error("Failed to save Codex AI Agent data file", error);
      await this.saveData(this.agentData);
    }
  }

  private async readJsonFile(filePath: string): Promise<any | null> {
    try {
      if (!fs.existsSync(filePath)) {
        return null;
      }
      const content = await fs.promises.readFile(filePath, "utf8");
      return JSON.parse(content);
    } catch (error) {
      console.error("Failed to read Codex AI Agent data file", error);
      return null;
    }
  }

  private getAgentDataFilePath(dirName = AGENT_DATA_DIR_NAME) {
    const dataDirPath = this.getAgentDataDirPath(dirName);
    return dataDirPath ? path.join(dataDirPath, AGENT_DATA_FILE_NAME) : "";
  }

  private getAgentDataDirPath(dirName = AGENT_DATA_DIR_NAME) {
    const adapter = this.app.vault.adapter as any;
    let vaultBasePath = "";
    try {
      vaultBasePath = typeof adapter?.getBasePath === "function" ? adapter.getBasePath() : "";
    } catch {
      vaultBasePath = "";
    }
    if (!vaultBasePath) {
      return "";
    }
    return path.join(vaultBasePath, ".obsidian", dirName);
  }

  private normalizeAgentData(data: any): AgentPluginData {
    const sessions = Array.isArray(data?.sessions)
      ? data.sessions.map((session: any) => this.normalizeSession(session)).filter(Boolean) as AgentSession[]
      : [];
    const archivedSessions = Array.isArray(data?.archivedSessions)
      ? data.archivedSessions.map((session: any) => this.normalizeSession(session)).filter(Boolean) as AgentSession[]
      : [];
    const activeSessionId = typeof data?.activeSessionId === "string" ? data.activeSessionId : "";
    return {
      sessions,
      archivedSessions,
      activeSessionId,
      settings: this.normalizeSettings(data?.settings),
      diffReviewState: this.normalizeDiffReviewState(data?.diffReviewState)
    };
  }

  private cloneDiffReviewState(state: DiffReviewPersistedState): DiffReviewPersistedState {
    return {
      acceptedFiles: [...state.acceptedFiles],
      acceptedHunks: [...state.acceptedHunks],
      acceptedLines: [...state.acceptedLines],
      rejectedFiles: [...state.rejectedFiles]
    };
  }

  private normalizeDiffReviewState(state: any): DiffReviewPersistedState {
    return {
      acceptedFiles: this.normalizeStringList(state?.acceptedFiles),
      acceptedHunks: this.normalizeStringList(state?.acceptedHunks),
      acceptedLines: this.normalizeStringList(state?.acceptedLines),
      rejectedFiles: this.normalizeStringList(state?.rejectedFiles)
    };
  }

  private normalizeStringList(value: any): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return [...new Set(value.filter((entry) => typeof entry === "string" && entry.trim()))];
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
    const language: AppLanguage = ["zh", "en"].includes(settings?.language) ? settings.language : DEFAULT_SETTINGS.language;
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
      enableDiffReview: typeof settings?.enableDiffReview === "boolean" ? settings.enableDiffReview : DEFAULT_SETTINGS.enableDiffReview,
      enableGitManagement: typeof settings?.enableGitManagement === "boolean" ? settings.enableGitManagement : DEFAULT_SETTINGS.enableGitManagement,
      language,
      pastedImageBehavior: "chip",
      chatViewLocation: ["right-pane", "left-pane", "new-leaf"].includes(settings?.chatViewLocation) ? settings.chatViewLocation : DEFAULT_SETTINGS.chatViewLocation,
      chatFontSize: this.normalizeRangedInteger(settings?.chatFontSize, DEFAULT_SETTINGS.chatFontSize, 13, 20),
      inlineEditQuickCommands: this.localizeInlineEditQuickCommands(this.normalizeInlineEditQuickCommands(settings?.inlineEditQuickCommands), language)
    };
  }

  private normalizeInlineEditQuickCommands(value: any): InlineEditQuickCommand[] {
    const source = Array.isArray(value) ? value : DEFAULT_SETTINGS.inlineEditQuickCommands;
    return source
      .map((entry: any, index: number) => ({
        id: typeof entry?.id === "string" && entry.id.trim() ? entry.id.trim() : `quick-${index}-${Date.now()}`,
        name: typeof entry?.name === "string" ? entry.name : "",
        prompt: typeof entry?.prompt === "string" ? entry.prompt : ""
      }))
      .slice(0, 20);
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
      draftMessageParts: Array.isArray(session.draftMessageParts)
        ? this.normalizeMessageParts(session.draftMessageParts)
        : undefined,
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
              ? this.normalizeMessageParts(item.messageParts)
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

  private normalizeMessageParts(parts: any[]): TimelineMessagePart[] {
    const normalized: TimelineMessagePart[] = [];
    parts.forEach((part: any) => {
      if (part?.type === "text" && typeof part.text === "string") {
        normalized.push({ type: "text", text: part.text });
        return;
      }
      if (part?.type === "chip" && typeof part.chip?.id === "string" && typeof part.chip?.label === "string") {
        normalized.push({
          type: "chip",
          chip: {
            id: part.chip.id,
            kind: ["selection", "file", "folder", "image", "skill"].includes(part.chip.kind) ? part.chip.kind : "file",
            label: part.chip.label,
            detail: typeof part.chip.detail === "string" ? part.chip.detail : part.chip.path ?? part.chip.label,
            path: typeof part.chip.path === "string" ? part.chip.path : undefined,
            text: typeof part.chip.text === "string" ? part.chip.text : undefined
          }
        });
      }
    });
    return normalized;
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
    const editorSelection = markdownView?.editor.getSelection().trim() ?? "";
    const domSelection = document.getSelection();
    const domSelectionInView = this.isDomSelectionInsideView(domSelection, markdownView);
    const markdownEditorView = markdownView ? this.getCodeMirrorEditorView(markdownView.editor) : null;
    if (markdownEditorView) {
      this.markLivePreviewTablesInEditorView(markdownEditorView);
    }
    const domSelectionTable = this.getDomSelectionRenderedTable(domSelection, markdownView);
    const domSelectionInTable = Boolean(domSelectionTable);
    const domSelectionText = domSelectionInView ? domSelection?.toString().trim() ?? "" : "";
    const selection = editorSelection || domSelectionText || domSelectionTable?.text || "";

    if (!markdownView || (!selection && !domSelectionInTable)) {
      this.hideSelectionAddButton();
      return;
    }

    if (!domSelection || domSelection.rangeCount === 0) {
      return;
    }

    const selectionRect = domSelection.getRangeAt(0).getBoundingClientRect();
    const rect = this.isEmptyDomRect(selectionRect) && domSelectionTable?.rect
      ? domSelectionTable.rect
      : domSelectionInTable && domSelectionTable?.rect
        ? domSelectionTable.rect
        : selectionRect;
    if (!rect || rect.width === 0 && rect.height === 0) {
      return;
    }

    this.hideSelectionAddButton();
    const button = document.body.createEl("button", {
      cls: "codex-agent-selection-popover",
      attr: { type: "button", "aria-label": this.tr("用 Codex 修改选中内容", "Edit selection with Codex") }
    });
    const icon = button.createSpan("codex-agent-selection-popover-icon");
    setIcon(icon, "sparkles");
    button.createSpan({ cls: "codex-agent-selection-popover-label", text: this.tr("用 Codex 修改", "Edit with Codex") });
    button.style.left = `${Math.max(8, rect.left + rect.width / 2 - 70)}px`;
    button.style.top = `${Math.max(8, rect.top - 38)}px`;
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    button.addEventListener("click", () => {
      if (domSelectionInTable) {
        void this.openInlineEditForRenderedSelection(markdownView, domSelectionTable?.text || domSelectionText || selection, domSelectionTable ?? undefined);
      } else if (editorSelection) {
        void this.openInlineEditForEditorSelection(markdownView.editor, markdownView);
      } else {
        void this.openInlineEditForRenderedSelection(markdownView, selection);
      }
      this.hideSelectionAddButton();
    });
    this.selectionButtonEl = button;
  }

  private isDomSelectionInsideView(selection: Selection | null, view: MarkdownView | null): boolean {
    if (!selection || !view || selection.rangeCount === 0 || selection.isCollapsed) {
      return false;
    }
    const container = selection.getRangeAt(0).commonAncestorContainer;
    return view.contentEl.contains(container.nodeType === Node.ELEMENT_NODE ? container as HTMLElement : container.parentElement);
  }

  private getDomSelectionRenderedTable(selection: Selection | null, view: MarkdownView | null): RenderedTableSelection | null {
    if (!selection || !view || selection.rangeCount === 0) {
      return null;
    }
    const range = selection.getRangeAt(0);
    const nodes = [range.startContainer, range.endContainer, range.commonAncestorContainer];
    const table = nodes.map((node) => {
      const element = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement;
      return element?.closest("table");
    }).find((candidate): candidate is HTMLTableElement => Boolean(candidate && view.contentEl.contains(candidate)));
    if (!table) {
      return null;
    }
    const tables = Array.from(view.contentEl.querySelectorAll("table"));
    const tableIndex = Math.max(0, tables.indexOf(table));
    const editorView = this.getCodeMirrorEditorView(view.editor);
    if (editorView && (!table.hasAttribute("data-codex-source-start-line") || !table.hasAttribute("data-codex-source-end-line"))) {
      this.markLivePreviewTableElement(editorView, table, tableIndex);
    }
    const selectionText = selection.toString().trim();
    const sourceSelectionText = view.editor.getSelection().trim();
    const dragSelectedCells = this.getRenderedTableDragSelectedCells(table, view);
    const selectedCells = dragSelectedCells.length > 0
      ? dragSelectedCells
      : this.getRenderedTableSelectedCells(table, range);
    const rect = this.getRenderedTableSelectionRect(selectedCells) ?? table.getBoundingClientRect();
    const rows = this.getRenderedTableRows(table);
    const editorTableRange = this.getEditorSelectionTableRange(view, rows);
    const selectedCellCoordinates = this.getRenderedTableCellCoordinates(table, selectedCells);
    const editorEditRange = sourceSelectionText
      ? this.getEditorSelectionTableEditRange(view, rows)
      : undefined;
    const fallbackEditRange = this.getRenderedTableSelectionRange(table, selectedCells, selectionText, rows, sourceSelectionText);
    const editRange = dragSelectedCells.length > 1
      ? fallbackEditRange ?? editorEditRange
      : editorEditRange ?? fallbackEditRange;
    return {
      text: table.innerText.trim(),
      selectionText,
      sourceSelectionText,
      index: tableIndex,
      table,
      sourceStartLine: this.getRenderedTableSourceLineAttr(table, "data-codex-source-start-line"),
      sourceEndLine: this.getRenderedTableSourceLineAttr(table, "data-codex-source-end-line"),
      editorTableRange,
      sourceLine: this.getRenderedSourceLine(table, view),
      editRange,
      rect,
      rows,
      selectedTexts: selectedCells.map((cell) => this.normalizeTableCellText(cell.innerText)),
      selectedCellCoordinates
    };
  }

  private getRenderedTableSourceLineAttr(table: HTMLTableElement, attr: string): number | undefined {
    const raw = table.getAttribute(attr);
    return raw && /^\d+$/.test(raw) ? Number(raw) : undefined;
  }

  private getRenderedTableCellCoordinates(table: HTMLTableElement, cells: HTMLTableCellElement[]) {
    const selected = new Set(cells);
    const coordinates: Array<{ row: number; col: number }> = [];
    Array.from(table.rows).forEach((row, rowIndex) => {
      Array.from(row.cells).forEach((cell, colIndex) => {
        if (selected.has(cell as HTMLTableCellElement)) {
          coordinates.push({ row: rowIndex, col: colIndex });
        }
      });
    });
    return coordinates;
  }

  private getRenderedTablePointerCell(event: MouseEvent): RenderedTablePointerCell | null {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      return null;
    }
    const target = event.target instanceof HTMLElement
      ? event.target
      : document.elementFromPoint(event.clientX, event.clientY);
    const pointTarget = document.elementFromPoint(event.clientX, event.clientY);
    const cell = this.findClosestRenderedTableCell(pointTarget) ?? this.findClosestRenderedTableCell(target);
    if (!cell || !view.contentEl.contains(cell)) {
      return null;
    }
    const table = cell.closest("table");
    if (!(table instanceof HTMLTableElement) || !view.contentEl.contains(table)) {
      return null;
    }
    const row = Array.from(table.rows).findIndex((entry) => Array.from(entry.cells).includes(cell));
    const col = row >= 0 ? Array.from(table.rows[row].cells).indexOf(cell) : -1;
    if (row < 0 || col < 0) {
      return null;
    }
    return {
      filePath: view.file?.path,
      table,
      row,
      col,
      time: Date.now()
    };
  }

  private findClosestRenderedTableCell(target: Element | null): HTMLTableCellElement | null {
    const cell = target?.closest("td, th");
    return cell instanceof HTMLTableCellElement ? cell : null;
  }

  private getRenderedTableDragSelectedCells(table: HTMLTableElement, view: MarkdownView) {
    const start = this.renderedTableDragStart;
    const end = this.renderedTableDragEnd;
    if (!start || !end || start.table !== table || end.table !== table) {
      return [];
    }
    if (start.filePath !== view.file?.path || end.filePath !== view.file?.path || Date.now() - end.time > 5000) {
      return [];
    }
    const startRow = Math.min(start.row, end.row);
    const endRow = Math.max(start.row, end.row);
    const startCol = Math.min(start.col, end.col);
    const endCol = Math.max(start.col, end.col);
    const cells: HTMLTableCellElement[] = [];
    Array.from(table.rows).forEach((row, rowIndex) => {
      if (rowIndex < startRow || rowIndex > endRow) {
        return;
      }
      Array.from(row.cells).forEach((cell, colIndex) => {
        if (colIndex >= startCol && colIndex <= endCol) {
          cells.push(cell as HTMLTableCellElement);
        }
      });
    });
    return cells;
  }

  private getEditorSelectionTableRange(view: MarkdownView, renderedRows: string[][]): { from: EditorPosition; to: EditorPosition } | undefined {
    const from = this.normalizeEditorPosition(view.editor.getCursor("from"));
    const to = this.normalizeEditorPosition(view.editor.getCursor("to"));
    const range = this.getMarkdownTableRange(view.editor, from, to);
    if (!range) {
      return undefined;
    }
    const sourceRows = view.editor.getRange(range.from, range.to)
      .split(/\r?\n/)
      .filter((line) => this.isMarkdownTableLikeLine(line))
      .filter((line) => !this.isMarkdownTableSeparatorLine(line))
      .map((line) => this.splitMarkdownTableRow(line));
    return this.tableRowsMatchSourceRows(sourceRows, renderedRows) ? range : undefined;
  }

  private async markRenderedTables(el: HTMLElement, ctx: { sourcePath: string; getSectionInfo(el: HTMLElement): { text: string; lineStart: number; lineEnd: number } | null }) {
    const tables = Array.from(el.querySelectorAll<HTMLTableElement>("table"));
    if (tables.length === 0 || !ctx.sourcePath) {
      return;
    }
    const section = ctx.getSectionInfo(el);
    if (!section) {
      return;
    }
    const candidates = this.getMarkdownTableCandidates(section.text)
      .map((candidate) => ({
        ...candidate,
        start: candidate.start + section.lineStart,
        end: candidate.end + section.lineStart
      }))
      .filter((candidate) => candidate.start >= section.lineStart && candidate.end <= section.lineEnd);
    const used = new Set<number>();
    tables.forEach((table, tableIndex) => {
      const renderedRows = this.getRenderedTableRows(table);
      if (candidates[tableIndex] && !used.has(tableIndex) && this.tableRowsMatchSourceRows(candidates[tableIndex].rows, renderedRows)) {
        used.add(tableIndex);
        this.setRenderedTableMarkers(table, tableIndex, candidates[tableIndex].start, candidates[tableIndex].end);
        return;
      }
      const best = candidates
        .map((candidate, candidateIndex) => ({
          candidate,
          candidateIndex,
          score: used.has(candidateIndex)
            ? -Infinity
            : this.scoreMarkdownTableCandidate(candidate, candidateIndex, {
              text: table.innerText.trim(),
              selectionText: "",
              sourceSelectionText: "",
              index: tableIndex,
              table,
              rows: renderedRows,
              selectedTexts: [],
              editRange: undefined
            })
        }))
        .sort((a, b) => b.score - a.score)[0];
      if (!best || best.score < 70) {
        return;
      }
      used.add(best.candidateIndex);
      this.setRenderedTableMarkers(table, tableIndex, best.candidate.start, best.candidate.end);
    });
  }

  private markLivePreviewTablesInEditorView(editorView: EditorView) {
    const tables = Array.from(editorView.dom.querySelectorAll<HTMLTableElement>("table"));
    tables.forEach((table, tableIndex) => {
      if (table.hasAttribute("data-codex-source-start-line") && table.hasAttribute("data-codex-source-end-line")) {
        return;
      }
      this.markLivePreviewTableElement(editorView, table, tableIndex);
    });
  }

  private markLivePreviewTableElement(editorView: EditorView, table: HTMLTableElement, tableIndex: number) {
    const source = editorView.state.doc.toString();
    const lines = source.split(/\r?\n/);
    const range = this.getLivePreviewTableRange(editorView, table, lines);
    if (!range) {
      return false;
    }
    const sourceRows = lines
      .slice(range.from.line, range.to.line + 1)
      .filter((line) => this.isMarkdownTableLikeLine(line))
      .filter((line) => !this.isMarkdownTableSeparatorLine(line))
      .map((line) => this.splitMarkdownTableRow(line));
    if (!this.tableRowsMatchSourceRows(sourceRows, this.getRenderedTableRows(table))) {
      return false;
    }
    this.setRenderedTableMarkers(table, tableIndex, range.from.line, range.to.line);
    return true;
  }

  private getLivePreviewTableRange(editorView: EditorView, table: HTMLTableElement, lines: string[]): { from: EditorPosition; to: EditorPosition } | null {
    const cells = Array.from(table.querySelectorAll<HTMLTableCellElement>("th, td"));
    const domCandidates = [
      table,
      cells[0],
      cells[cells.length - 1],
      this.findFirstTextNode(cells[0] ?? table),
      this.findFirstTextNode(cells[cells.length - 1] ?? table)
    ].filter((node): node is Node => Boolean(node));
    for (const node of domCandidates) {
      try {
        const pos = editorView.posAtDOM(node, 0);
        const line = editorView.state.doc.lineAt(pos).number - 1;
        if (line < 0 || line >= lines.length || !this.isMarkdownTableLikeLine(lines[line])) {
          continue;
        }
        const range = this.getMarkdownTableRangeInLines(lines, line);
        if (range) {
          return range;
        }
      } catch {
        continue;
      }
    }
    return null;
  }

  private findFirstTextNode(root: Node | null | undefined): Node | null {
    if (!root) {
      return null;
    }
    if (root.nodeType === Node.TEXT_NODE && root.textContent?.trim()) {
      return root;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.textContent?.trim()) {
        return node;
      }
      node = walker.nextNode();
    }
    return null;
  }

  private setRenderedTableMarkers(table: HTMLTableElement, tableIndex: number, startLine: number, endLine: number) {
    table.setAttribute("data-codex-table-index", String(tableIndex));
    table.setAttribute("data-codex-source-start-line", String(startLine));
    table.setAttribute("data-codex-source-end-line", String(endLine));
    Array.from(table.rows).forEach((row, rowIndex) => {
      Array.from(row.cells).forEach((cell, colIndex) => {
        cell.setAttribute("data-codex-row", String(rowIndex));
        cell.setAttribute("data-codex-col", String(colIndex));
      });
    });
  }

  private getRenderedSourceLine(element: HTMLElement, view: MarkdownView): number | undefined {
    let cursor: HTMLElement | null = element;
    while (cursor && cursor !== view.contentEl) {
      const raw = cursor.getAttribute("data-line");
      if (raw && /^\d+$/.test(raw)) {
        return Number(raw);
      }
      cursor = cursor.parentElement;
    }
    const nearest = element.closest<HTMLElement>("[data-line]");
    const raw = nearest && view.contentEl.contains(nearest) ? nearest.getAttribute("data-line") : null;
    return raw && /^\d+$/.test(raw) ? Number(raw) : undefined;
  }

  private getRenderedTableSelectedCells(table: HTMLTableElement, range: Range): HTMLTableCellElement[] {
    const rows = Array.from(table.rows);
    if (range.collapsed) {
      const start = range.startContainer.nodeType === Node.ELEMENT_NODE
        ? range.startContainer as HTMLElement
        : range.startContainer.parentElement;
      const cell = start?.closest("td, th");
      return cell && table.contains(cell) ? [cell as HTMLTableCellElement] : [];
    }
    const selectionRects = Array.from(range.getClientRects()).filter((rect) => !this.isEmptyDomRect(rect));
    const selected: HTMLTableCellElement[] = [];
    rows.forEach((row, rowIndex) => {
      Array.from(row.cells).forEach((cell, colIndex) => {
        const selectedByRect = selectionRects.length > 0
          && selectionRects.some((rect) => this.rectsOverlap(rect, cell.getBoundingClientRect()));
        const selectedByRange = selectionRects.length === 0 && range.intersectsNode(cell);
        if (selectedByRect || selectedByRange) {
          selected.push(cell);
        }
      });
    });
    return selected;
  }

  private rectsOverlap(a: DOMRect | ClientRect, b: DOMRect | ClientRect) {
    const tolerance = 1;
    return a.left < b.right - tolerance
      && a.right > b.left + tolerance
      && a.top < b.bottom - tolerance
      && a.bottom > b.top + tolerance;
  }

  private getRenderedTableRows(table: HTMLTableElement): string[][] {
    return Array.from(table.rows).map((row) =>
      Array.from(row.cells).map((cell) => this.normalizeTableCellText(cell.innerText))
    );
  }

  private getRenderedTableSelectionRange(
    table: HTMLTableElement,
    cells: HTMLTableCellElement[],
    selectionText = "",
    renderedRows?: string[][],
    sourceSelectionText = ""
  ): TableEditRange | undefined {
    const rows = Array.from(table.rows);
    const sourceRange = renderedRows
      ? this.getRenderedTableSelectionRangeFromSourceText(renderedRows, sourceSelectionText)
      : undefined;
    if (sourceRange) {
      return sourceRange;
    }
    const textRange = renderedRows ? this.getRenderedTableSelectionRangeFromText(renderedRows, selectionText) : undefined;
    if (textRange) {
      return textRange;
    }
    const selected: Array<{ row: number; col: number }> = [];
    rows.forEach((row, rowIndex) => {
      Array.from(row.cells).forEach((cell, colIndex) => {
        if (cells.includes(cell)) {
          selected.push({ row: rowIndex, col: colIndex });
        }
      });
    });
    if (selected.length === 0) {
      return undefined;
    }
    return {
      startRow: Math.min(...selected.map((cell) => cell.row)),
      endRow: Math.max(...selected.map((cell) => cell.row)),
      startCol: Math.min(...selected.map((cell) => cell.col)),
      endCol: Math.max(...selected.map((cell) => cell.col)),
      totalRows: rows.length,
      totalCols: Math.max(...rows.map((row) => row.cells.length), 0)
    };
  }

  private getEditorSelectionTableEditRange(view: MarkdownView, renderedRows: string[][]): TableEditRange | undefined {
    const from = this.normalizeEditorPosition(view.editor.getCursor("from"));
    const to = this.normalizeEditorPosition(view.editor.getCursor("to"));
    if (from.line === to.line && from.ch === to.ch) {
      return undefined;
    }
    const tableRange = this.getEditorSelectionTableRange(view, renderedRows);
    if (!tableRange) {
      return undefined;
    }
    return this.getSourceTableSelectionRange(view.editor, from, to, tableRange);
  }

  private getSourceTableSelectionRange(
    editor: Editor,
    selectionFrom: EditorPosition,
    selectionTo: EditorPosition,
    tableRange: { from: EditorPosition; to: EditorPosition }
  ): TableEditRange | undefined {
    const from = this.compareEditorPositions(selectionFrom, selectionTo) <= 0 ? selectionFrom : selectionTo;
    const to = from === selectionFrom ? selectionTo : selectionFrom;
    const tableLines = editor.getRange(tableRange.from, tableRange.to).split(/\r?\n/);
    const rows = tableLines
      .map((line, index) => ({
        line,
        sourceLine: tableRange.from.line + index,
        cells: this.splitMarkdownTableRowWithSpans(line)
      }))
      .filter((entry) => this.isMarkdownTableLikeLine(entry.line))
      .filter((entry) => !this.isMarkdownTableSeparatorLine(entry.line));
    if (rows.length === 0) {
      return undefined;
    }

    const selected: Array<{ row: number; col: number }> = [];
    rows.forEach((row, rowIndex) => {
      const overlap = this.getSourceLineSelectionOverlap(row.sourceLine, row.line, from, to);
      if (!overlap) {
        return;
      }
      const cols = this.getSelectedMarkdownRowColumns(row.cells, overlap.startCh, overlap.endCh);
      cols.forEach((col) => selected.push({ row: rowIndex, col }));
    });

    if (selected.length === 0) {
      return undefined;
    }

    return {
      startRow: Math.min(...selected.map((cell) => cell.row)),
      endRow: Math.max(...selected.map((cell) => cell.row)),
      startCol: Math.min(...selected.map((cell) => cell.col)),
      endCol: Math.max(...selected.map((cell) => cell.col)),
      totalRows: rows.length,
      totalCols: Math.max(...rows.map((row) => row.cells.length), 0)
    };
  }

  private getSourceLineSelectionOverlap(
    lineNumber: number,
    lineText: string,
    from: EditorPosition,
    to: EditorPosition
  ): { startCh: number; endCh: number } | null {
    if (lineNumber < from.line || lineNumber > to.line) {
      return null;
    }
    const startCh = lineNumber === from.line ? from.ch : 0;
    const endCh = lineNumber === to.line ? to.ch : lineText.length;
    const clampedStart = Math.max(0, Math.min(lineText.length, startCh));
    const clampedEnd = Math.max(0, Math.min(lineText.length, endCh));
    if (clampedEnd <= clampedStart) {
      return null;
    }
    return { startCh: clampedStart, endCh: clampedEnd };
  }

  private getSelectedMarkdownRowColumns(
    cells: Array<{ text: string; start: number; end: number }>,
    startCh: number,
    endCh: number
  ) {
    return cells
      .map((cell, col) => ({ cell, col }))
      .filter(({ cell }) => startCh < cell.end && endCh > cell.start)
      .map(({ col }) => col);
  }

  private getRenderedTableSelectionRangeFromSourceText(renderedRows: string[][], sourceSelectionText: string): TableEditRange | undefined {
    const sourceRows = sourceSelectionText
      .split(/\r?\n/)
      .filter((line) => this.isMarkdownTableLikeLine(line))
      .filter((line) => !this.isMarkdownTableSeparatorLine(line))
      .map((line) => this.splitMarkdownTableRow(line))
      .filter((row) => row.length > 0);
    if (sourceRows.length === 0) {
      return undefined;
    }

    const matches: number[] = [];
    for (let start = 0; start <= renderedRows.length - sourceRows.length; start += 1) {
      const isMatch = sourceRows.every((sourceRow, index) => this.tableCellsMatch(sourceRow, renderedRows[start + index] ?? []));
      if (isMatch) {
        matches.push(start);
      }
    }
    if (matches.length !== 1) {
      return undefined;
    }

    const startRow = matches[0];
    return {
      startRow,
      endRow: startRow + sourceRows.length - 1,
      startCol: 0,
      endCol: Math.max(...renderedRows.map((row) => row.length), 0) - 1,
      totalRows: renderedRows.length,
      totalCols: Math.max(...renderedRows.map((row) => row.length), 0)
    };
  }

  private tableCellsMatch(a: string[], b: string[]) {
    if (a.length !== b.length) {
      return false;
    }
    return a.every((cell, index) => this.normalizeTableCellText(cell) === this.normalizeTableCellText(b[index] ?? ""));
  }

  private getRenderedTableSelectionRangeFromText(renderedRows: string[][], selectionText: string): TableEditRange | undefined {
    const selected = this.normalizeTableCellText(selectionText);
    if (!selected) {
      return undefined;
    }
    const anchoredRows = renderedRows
      .map((row, rowIndex) => ({ row, rowIndex, anchor: this.normalizeTableCellText(row[0] ?? "") }))
      .filter((entry) => entry.rowIndex > 0 && entry.anchor && selected.includes(entry.anchor));
    if (anchoredRows.length > 0) {
      const selectedRows = anchoredRows.map((entry) => entry.rowIndex);
      return {
        startRow: Math.min(...selectedRows),
        endRow: Math.max(...selectedRows),
        startCol: 0,
        endCol: Math.max(...renderedRows.map((row) => row.length), 0) - 1,
        totalRows: renderedRows.length,
        totalCols: Math.max(...renderedRows.map((row) => row.length), 0)
      };
    }
    const cells: Array<{ row: number; col: number }> = [];
    renderedRows.forEach((row, rowIndex) => {
      const normalizedRow = row.map((cell) => this.normalizeTableCellText(cell));
      const rowText = normalizedRow.filter(Boolean).join(" ");
      const rowSelected = rowText && selected.includes(rowText);
      normalizedRow.forEach((cell, colIndex) => {
        if (!cell || cell.length < 2) {
          return;
        }
        if (rowSelected) {
          cells.push({ row: rowIndex, col: colIndex });
        }
      });
    });
    const dataCells = cells.filter((cell) => cell.row > 0);
    const usable = dataCells.length > 0 ? dataCells : cells;
    if (usable.length === 0) {
      return undefined;
    }
    const startRow = Math.min(...usable.map((cell) => cell.row));
    const endRow = Math.max(...usable.map((cell) => cell.row));
    const rowsInRange = renderedRows.slice(startRow, endRow + 1);
    const fullRowsSelected = rowsInRange.every((row) => {
      const rowText = row.map((cell) => this.normalizeTableCellText(cell)).filter(Boolean).join(" ");
      return rowText && selected.includes(rowText);
    });
    return {
      startRow,
      endRow,
      startCol: fullRowsSelected ? 0 : Math.min(...usable.map((cell) => cell.col)),
      endCol: fullRowsSelected ? Math.max(...renderedRows.map((row) => row.length), 0) - 1 : Math.max(...usable.map((cell) => cell.col)),
      totalRows: renderedRows.length,
      totalCols: Math.max(...renderedRows.map((row) => row.length), 0)
    };
  }

  private getRenderedTableSelectionRect(cells: HTMLTableCellElement[]): DOMRect | undefined {
    if (cells.length === 0) {
      return undefined;
    }
    const rects = cells
      .map((cell) => cell.getBoundingClientRect())
      .filter((rect) => !this.isEmptyDomRect(rect));
    if (rects.length === 0) {
      return undefined;
    }
    const left = Math.min(...rects.map((rect) => rect.left));
    const top = Math.min(...rects.map((rect) => rect.top));
    const right = Math.max(...rects.map((rect) => rect.right));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));
    return new DOMRect(left, top, right - left, bottom - top);
  }

  private isEmptyDomRect(rect: DOMRect | ClientRect | null | undefined) {
    return !rect || (rect.width === 0 && rect.height === 0);
  }

  private async openInlineEditForRenderedSelection(view: MarkdownView, selectedText: string, renderedTable?: RenderedTableSelection) {
    if (!view.file) {
      new Notice(this.tr("无法定位当前笔记。", "Cannot locate the active note."));
      return;
    }
    const source = await this.app.vault.cachedRead(view.file);
    const resolved = renderedTable
      ? this.resolveEditorSelectionTableInSource(source, renderedTable)
        ?? this.resolveMarkedRenderedTableInSource(source, renderedTable)
        ?? this.resolveExactRenderedTableInSource(source, renderedTable)
      : this.resolveRenderedSelectionInSource(source, selectedText);
    if (!resolved) {
      if (renderedTable) {
        const detail = this.describeRenderedTableLocateFailure(view, source, renderedTable);
        console.warn("[codex-ai-agent] Inline table locate failed", detail);
        new Notice(`${this.tr("无法可靠定位源码范围", "Could not safely locate the source range")}：${detail.reason}`);
        return;
      }
      new Notice(this.tr("无法可靠定位源码范围，请切到编辑模式后再试。", "Could not safely locate the source range. Try again in editing mode."));
      return;
    }
    const previousMode = typeof view.getMode === "function" ? view.getMode() : "preview";
    const previousSource = this.getMarkdownViewSourceFlag(view);
    const previousScrollTop = this.getActiveMarkdownScrollTop(view);
    await view.leaf.setViewState({
      type: "markdown",
      state: { file: view.file.path, mode: "source", source: true },
      active: true
    });
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView) ?? view;
    activeView.editor.setSelection(resolved.from, resolved.to);
    await this.openInlineEditForEditorSelection(activeView.editor, activeView, { previousMode, previousSource, previousScrollTop, sourceReady: true, tableEditRange: renderedTable?.editRange });
  }

  private hideSelectionAddButton() {
    this.selectionButtonEl?.remove();
    this.selectionButtonEl = null;
  }

  private async openInlineEditForEditorSelection(
    editor: Editor,
    view: MarkdownView,
    previousState?: { previousMode: "source" | "preview"; previousSource: boolean; previousScrollTop: number; sourceReady?: boolean; tableEditRange?: TableEditRange }
  ) {
    const selected = editor.getSelection();
    if (!selected.trim()) {
      new Notice(this.tr("请先选中要修改的内容。", "Select text to edit first."));
      return;
    }

    this.closeInlineEdit();
    let from = this.normalizeEditorPosition(editor.getCursor("from"));
    let to = this.normalizeEditorPosition(editor.getCursor("to"));
    const tableRange = this.getMarkdownTableRange(editor, from, to);
    const sourceTableEditRange = tableRange
      ? this.getSourceTableSelectionRange(editor, from, to, tableRange)
      : undefined;
    const isTableMode = Boolean(tableRange);
    if (tableRange) {
      if (!previousState?.sourceReady && view.file) {
        const previousMode = typeof view.getMode === "function" ? view.getMode() : "source";
        const previousSource = this.getMarkdownViewSourceFlag(view);
        const previousScrollTop = this.getActiveMarkdownScrollTop(view);
        await view.leaf.setViewState({
          type: "markdown",
          state: { file: view.file.path, mode: "source", source: true },
          active: true
        });
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView) ?? view;
        activeView.editor.setSelection(tableRange.from, tableRange.to);
        await this.openInlineEditForEditorSelection(activeView.editor, activeView, {
          previousMode: previousState?.previousMode ?? previousMode,
          previousSource: previousState?.previousSource ?? previousSource,
          previousScrollTop: previousState?.previousScrollTop ?? previousScrollTop,
          sourceReady: true,
          tableEditRange: previousState?.tableEditRange
        });
        return;
      }
      from = tableRange.from;
      to = tableRange.to;
      editor.setSelection(from, to);
    }
    const originalText = editor.getRange(from, to);
    const previousMode = previousState?.previousMode ?? (typeof view.getMode === "function" ? view.getMode() : "source");
    const previousSource = previousState?.previousSource ?? this.getMarkdownViewSourceFlag(view);
    const previousScrollTop = previousState?.previousScrollTop ?? this.getActiveMarkdownScrollTop(view);
    const id = `inline-edit:${Date.now()}:${Math.random().toString(16).slice(2)}`;
    const state: InlineEditSelectionState = {
      id,
      editor,
      view,
      file: view.file,
      from,
      to,
      originalText,
      beforeContext: this.getEditorContextBefore(editor, from),
      afterContext: this.getEditorContextAfter(editor, to),
      request: "",
      resultText: "",
      status: "idle",
      statusTitle: "",
      isTableMode,
      tableEditRange: isTableMode ? previousState?.tableEditRange ?? sourceTableEditRange : undefined,
      conversationMode: "current",
      quickCommands: this.getRunnableInlineEditQuickCommands(),
      previousMode,
      previousSource,
      previousScrollTop
    };
    this.inlineEditState = state;
    activeInlineEditController = this;
    this.applyInlineEditDecorations(state);
    editor.scrollIntoView({ from: to, to }, true);
    editor.focus();
  }

  async handleInlineEditSubmit(id: string, request: string, conversationModeOverride?: InlineEditConversationMode) {
    const state = this.inlineEditState;
    if (!state || state.id !== id || state.status === "running") {
      return;
    }
    const trimmed = request.trim();
    if (!trimmed) {
      new Notice(this.tr("请输入修改要求。", "Enter an edit request."));
      return;
    }
    const conversationMode = conversationModeOverride ?? state.conversationMode;
    const currentText = state.editor.getRange(state.from, state.to);
    if (currentText !== state.originalText) {
      this.updateInlineEditState({ status: "error", statusTitle: this.tr("选区内容已变化，请重新选择。", "Selection changed. Select it again.") });
      return;
    }
    const isQuestionOnly = this.isInlineEditQuestionRequest(trimmed);
    this.updateInlineEditState({ request: trimmed, conversationMode, status: "running", statusTitle: this.tr("思考中", "Thinking"), resultText: "" });
    const runId = ++this.inlineEditRunId;
    let buffer = "";
    const settings = this.getSettings();
    const cwd = this.getVaultBasePath();
    if (!cwd) {
      this.updateInlineEditState({ status: "error", statusTitle: this.tr("失败", "Failed") });
      return;
    }
    const codexBin = process.env.CODEX_BIN || settings.codexBin || DEFAULT_CODEX_BIN;
    const extraPath = this.getParentPath(settings.nodeBin);
    const adapter = settings.adapterMode === "exec-json" ? new ExecJsonAdapter() : new AppServerAdapter();
    const prompt = isQuestionOnly
      ? this.composeInlineEditQuestionPrompt({ ...state, request: trimmed })
      : this.composeInlineEditPrompt({ ...state, request: trimmed });
    const agentView = await this.activateView();
    const conversationRun = agentView?.beginInlineEditConversation(conversationMode, {
      request: trimmed,
      filePath: state.file?.path,
      originalText: state.originalText,
      isTableMode: state.isTableMode
    });
    this.updateInlineEditState({ conversationRun });
    const handle = adapter.start(
      {
        codexBin,
        extraPath,
        args: [
          "exec",
          "--json",
          "--color",
          "never",
          "--sandbox",
          "read-only",
          "--ephemeral",
          "--skip-git-repo-check",
          "-C",
          cwd,
          "-m",
          this.toCodexModel(settings.defaultModel),
          "-"
        ],
        cwd,
        prompt,
        threadId: conversationRun?.threadId,
        model: this.toCodexModel(settings.defaultModel),
        sandboxMode: "read-only",
        approvalPolicy: "never",
        reasoningEffort: this.toCodexReasoningEffort(settings.defaultReasoningLevel)
      },
      (event) => {
        if (runId !== this.inlineEditRunId || this.inlineEditState?.id !== id) {
          return;
        }
        const floatingTitle = this.getInlineEditFloatingEventTitle(event);
        if (floatingTitle && this.inlineEditState?.status === "running") {
          this.updateInlineEditState({ statusTitle: floatingTitle });
        }
        conversationRun?.onEvent(event);
        if (event.type === "message_delta") {
          buffer += event.delta;
          return;
        }
        if (event.type === "message") {
          buffer += event.markdown;
          return;
        }
        if (event.type === "error") {
          this.updateInlineEditState({ status: "error", statusTitle: this.tr("失败", "Failed") });
        }
      },
      (code) => {
        if (runId !== this.inlineEditRunId || this.inlineEditState?.id !== id) {
          return;
        }
        this.inlineEditHandle = null;
        if (code !== 0 && !buffer.trim()) {
          this.updateInlineEditState({ status: "error", statusTitle: this.tr("失败", "Failed") });
          conversationRun?.onError(this.tr("Inline Edit 失败", "Inline edit failed"), this.tr("Codex 没有返回替换内容。", "Codex did not return a replacement."));
          return;
        }
        if (isQuestionOnly) {
          this.updateInlineEditState({ status: "idle", statusTitle: "" });
          conversationRun?.onComplete();
          new Notice(this.tr("已在 Codex 对话中回答，未生成修改。", "Answered in the Codex conversation without generating an edit."));
          return;
        }
        const replacement = this.extractInlineEditReplacement(buffer);
        if (!replacement.trim()) {
          this.updateInlineEditState({ status: "error", statusTitle: this.tr("失败", "Failed") });
          conversationRun?.onError(this.tr("Inline Edit 失败", "Inline edit failed"), this.tr("Codex 返回了空替换内容。", "Codex returned an empty replacement."));
          return;
        }
        this.updateInlineEditState({ resultText: replacement, status: "result", statusTitle: this.tr("已完成", "Completed") });
        conversationRun?.onComplete();
      }
    );
    this.inlineEditHandle = handle;
  }

  handleInlineEditStop(id: string) {
    if (!this.inlineEditState || this.inlineEditState.id !== id) {
      return;
    }
    this.inlineEditRunId += 1;
    this.inlineEditHandle?.cancel();
    this.inlineEditHandle = null;
    this.updateInlineEditState({ status: "idle", statusTitle: "" });
  }

  handleInlineEditApply(id: string) {
    const state = this.inlineEditState;
    if (!state || state.id !== id || state.status !== "result") {
      return;
    }
    const currentText = state.editor.getRange(state.from, state.to);
    if (currentText !== state.originalText) {
      new Notice(this.tr("选区内容已变化，无法安全应用。", "Selection changed; cannot apply safely."));
      this.updateInlineEditState({ status: "error", statusTitle: this.tr("选区内容已变化", "Selection changed") });
      return;
    }
    if (state.isTableMode && state.tableEditRange && !this.validateTableEditRange(state.originalText, state.resultText, state.tableEditRange)) {
      new Notice(this.tr("Codex 修改了选区外的表格单元格，已阻止应用。", "Codex changed table cells outside the selected range, so the change was not applied."));
      this.updateInlineEditState({ status: "error", statusTitle: this.tr("选区外单元格被修改", "Cells outside selection changed") });
      return;
    }
    state.editor.replaceRange(state.resultText, state.from, state.to);
    this.closeInlineEdit(true);
  }

  handleInlineEditReject(id: string) {
    if (!this.inlineEditState || this.inlineEditState.id !== id) {
      return;
    }
    this.closeInlineEdit(true);
  }

  handleInlineEditClose(id: string) {
    if (!this.inlineEditState || this.inlineEditState.id !== id) {
      return;
    }
    this.closeInlineEdit(true);
  }

  handleInlineEditConversationMode(id: string, mode: InlineEditConversationMode) {
    if (!this.inlineEditState || this.inlineEditState.id !== id || this.inlineEditState.status === "running") {
      return;
    }
    this.updateInlineEditState({ conversationMode: mode });
  }

  handleInlineEditQuickCommand(id: string, commandId: string, mode: InlineEditConversationMode) {
    const state = this.inlineEditState;
    if (!state || state.id !== id || state.status === "running") {
      return;
    }
    const command = state.quickCommands.find((entry) => entry.id === commandId);
    if (!command || !command.prompt.trim()) {
      return;
    }
    this.handleInlineEditSubmit(id, command.prompt, mode);
  }

  private getRunnableInlineEditQuickCommands() {
    const settings = this.getSettings();
    return this.localizeInlineEditQuickCommands(settings.inlineEditQuickCommands, settings.language)
      .filter((command) => command.name.trim() && command.prompt.trim());
  }

  private updateInlineEditState(patch: Partial<InlineEditSelectionState>) {
    if (!this.inlineEditState) {
      return;
    }
    this.inlineEditState = { ...this.inlineEditState, ...patch };
    this.applyInlineEditDecorations(this.inlineEditState);
  }

  private applyInlineEditDecorations(state: InlineEditSelectionState) {
    const editorView = this.getCodeMirrorEditorView(state.editor);
    if (!editorView || !state.file) {
      return;
    }
    this.inlineEditEditorView = editorView;
    editorView.dispatch({
      effects: setInlineEditEffect.of({
        id: state.id,
        filePath: state.file.path,
        from: this.editorPositionToOffset(editorView, state.from),
        to: this.editorPositionToOffset(editorView, state.to),
        originalText: state.originalText,
        request: state.request,
        resultText: state.resultText,
        status: state.status,
        statusTitle: state.statusTitle,
        isTableMode: state.isTableMode,
        tableEditRange: state.tableEditRange,
        conversationMode: state.conversationMode,
        quickCommands: state.quickCommands,
        language: this.getSettings().language
      })
    });
  }

  private closeInlineEdit(restoreMode = false) {
    const state = this.inlineEditState;
    this.inlineEditRunId += 1;
    this.inlineEditHandle?.cancel();
    this.inlineEditHandle = null;
    this.hideSelectionAddButton();
    if (this.inlineEditEditorView) {
      this.inlineEditEditorView.dispatch({ effects: setInlineEditEffect.of(null) });
    }
    this.inlineEditEditorView = null;
    this.inlineEditState = null;
    if (activeInlineEditController === this) {
      activeInlineEditController = null;
    }
    if (restoreMode && state?.file && (state.previousMode === "preview" || state.previousSource === false)) {
      void this.restoreMarkdownViewMode(state.file.path, state.previousMode, state.previousSource, state.previousScrollTop);
    }
  }

  private async restoreMarkdownViewMode(filePath: string, mode: "source" | "preview", sourceMode: boolean, scrollTop: number) {
    const leaf = this.app.workspace.getLeavesOfType("markdown")
      .find((entry) => entry.view instanceof MarkdownView && entry.view.file?.path === filePath)
      ?? this.app.workspace.getActiveViewOfType(MarkdownView)?.leaf;
    if (!leaf) {
      return;
    }
    await leaf.setViewState({
      type: "markdown",
      state: { file: filePath, mode, source: sourceMode },
      active: true
    });
    this.app.workspace.revealLeaf(leaf);
    window.setTimeout(() => {
      const restoredView = leaf.view instanceof MarkdownView ? leaf.view : this.app.workspace.getActiveViewOfType(MarkdownView);
      if (restoredView) {
        this.setActiveMarkdownScrollTop(restoredView, scrollTop);
      }
    }, 50);
  }

  private getInlineEditFloatingEventTitle(event: AgentEvent) {
    if (event.type === "status") {
      return this.localizeInlineEditStatusTitle(event.title || "Thinking");
    }
    if (event.type === "message_delta" || event.type === "message") {
      return this.tr("生成中", "Generating");
    }
    if (event.type === "tool") {
      return event.title || this.tr("使用工具", "Using tool");
    }
    if (event.type === "command") {
      return event.status === "failed"
        ? this.tr("命令失败", "Command failed")
        : event.status === "done"
          ? this.tr("命令完成", "Command complete")
          : this.tr("运行命令", "Running command");
    }
    if (event.type === "plan") {
      return event.title || this.tr("计划", "Plan");
    }
    if (event.type === "diff") {
      return this.tr("Diff 已更新", "Diff updated");
    }
    if (event.type === "error") {
      return this.tr("失败", "Failed");
    }
    return "";
  }

  private localizeInlineEditStatusTitle(title: string) {
    const normalized = title.trim().toLowerCase();
    if (normalized === "thinking") {
      return this.tr("思考中", "Thinking");
    }
    if (normalized === "generating") {
      return this.tr("生成中", "Generating");
    }
    if (normalized === "failed") {
      return this.tr("失败", "Failed");
    }
    if (normalized === "completed") {
      return this.tr("已完成", "Completed");
    }
    if (normalized === "command failed") {
      return this.tr("命令失败", "Command failed");
    }
    if (normalized === "command complete") {
      return this.tr("命令完成", "Command complete");
    }
    if (normalized === "running command") {
      return this.tr("运行命令", "Running command");
    }
    if (normalized === "diff updated") {
      return this.tr("Diff 已更新", "Diff updated");
    }
    return title;
  }

  private composeInlineEditPrompt(state: InlineEditSelectionState) {
    return [
      "You are editing a selected range in an Obsidian Markdown note.",
      "Return only the replacement text for the selected range.",
      "Do not explain your changes. Do not use Markdown fences unless they are part of the replacement.",
      "Wrap the replacement exactly once in <replacement> and </replacement> tags.",
      "Do not run tools, do not read files, and do not modify files.",
      state.isTableMode ? "The selected range is a Markdown table source block. Preserve valid Markdown table syntax." : "Preserve the user's Markdown style unless the request requires changing it.",
      state.tableEditRange ? `Table edit scope: ${formatTableEditRange(state.tableEditRange, "en")}. The full Markdown table is provided as context, but you may only change cells inside that row and column rectangle. Preserve every cell outside that rectangle exactly.` : "",
      state.tableEditRange ? "If deleting table content, remove whole rows or columns only when the edit scope covers those full rows or columns. Otherwise, clear the selected cell contents while preserving table delimiters and dimensions." : "",
      "",
      `File: ${state.file?.path ?? "active note"}`,
      "",
      "User edit request:",
      state.request,
      "",
      "Context before selection:",
      state.beforeContext || "(none)",
      "",
      state.tableEditRange ? "Selected table cells inside edit scope:" : "",
      state.tableEditRange ? this.getSelectedTableScopeText(state.originalText, state.tableEditRange) : "",
      state.tableEditRange ? "" : "",
      "Selected text:",
      state.originalText,
      "",
      "Context after selection:",
      state.afterContext || "(none)"
    ].join("\n");
  }

  private composeInlineEditQuestionPrompt(state: InlineEditSelectionState) {
    return [
      "You are answering a question about a selected range in an Obsidian Markdown note.",
      "Do not modify the note. Do not return replacement tags. Answer the user's question directly and concisely.",
      state.isTableMode ? "The selected range is a Markdown table source block." : "The selected range is Markdown text.",
      state.tableEditRange ? `Selected table scope: ${formatTableEditRange(state.tableEditRange, "en")}.` : "",
      state.tableEditRange ? "Selected table cells:" : "",
      state.tableEditRange ? this.getSelectedTableScopeText(state.originalText, state.tableEditRange) : "",
      "",
      `File: ${state.file?.path ?? "active note"}`,
      "",
      "User question:",
      state.request,
      "",
      "Selected text:",
      state.originalText
    ].join("\n");
  }

  private getSelectedTableScopeText(markdown: string, range: TableEditRange) {
    const rows = this.parseMarkdownTableCells(markdown);
    return rows
      .slice(range.startRow, range.endRow + 1)
      .map((row) => row.slice(range.startCol, range.endCol + 1).join(" | "))
      .join("\n");
  }

  private isInlineEditQuestionRequest(request: string) {
    const normalized = request.replace(/\s+/g, "");
    const hasQuestionMarker = /[?？]|是什么|什么|哪些|为何|为什么|怎么|如何|是否|吗$|内容是什么/.test(normalized);
    const hasEditIntent = /改成|改为|替换|删除|新增|添加|补充|改写|润色|总结|翻译|生成|调整|优化|压缩|扩写|修正|重写|提炼|简化|合并|拆分|转换|变成/.test(normalized);
    return hasQuestionMarker && !hasEditIntent;
  }

  private extractInlineEditReplacement(output: string) {
    const tagged = output.match(/<replacement>\s*([\s\S]*?)\s*<\/replacement>/i);
    if (tagged) {
      return tagged[1].replace(/^\n+|\n+$/g, "");
    }
    const fenced = output.match(/^```(?:markdown|md|text)?\n([\s\S]*?)\n```$/i);
    return (fenced ? fenced[1] : output).replace(/^\n+|\n+$/g, "");
  }

  private resolveEditorSelectionTableInSource(source: string, renderedTable: RenderedTableSelection): { from: EditorPosition; to: EditorPosition } | null {
    const range = renderedTable.editorTableRange;
    if (!range) {
      return null;
    }
    const lines = source.split(/\r?\n/);
    if (range.from.line < 0 || range.to.line < range.from.line || range.to.line >= lines.length) {
      return null;
    }
    const tableLines = lines.slice(range.from.line, range.to.line + 1);
    if (!tableLines.some((line) => this.isMarkdownTableSeparatorLine(line))) {
      return null;
    }
    const sourceRows = tableLines
      .filter((line) => this.isMarkdownTableLikeLine(line))
      .filter((line) => !this.isMarkdownTableSeparatorLine(line))
      .map((line) => this.splitMarkdownTableRow(line));
    return this.tableRowsMatchSourceRows(sourceRows, renderedTable.rows) ? range : null;
  }

  private resolveMarkedRenderedTableInSource(source: string, renderedTable: RenderedTableSelection): { from: EditorPosition; to: EditorPosition } | null {
    const lines = source.split(/\r?\n/);
    const start = renderedTable.sourceStartLine;
    const end = renderedTable.sourceEndLine;
    if (typeof start !== "number" || typeof end !== "number" || start < 0 || end < start || end >= lines.length) {
      return null;
    }
    const tableLines = lines.slice(start, end + 1);
    if (!tableLines.some((line) => this.isMarkdownTableSeparatorLine(line))) {
      return null;
    }
    const rows = tableLines
      .filter((line) => this.isMarkdownTableLikeLine(line))
      .filter((line) => !this.isMarkdownTableSeparatorLine(line))
      .map((line) => this.splitMarkdownTableRow(line));
    const renderedRows = renderedTable.rows.map((row) => row.map((cell) => this.normalizeTableCellText(cell)));
    if (rows.length !== renderedRows.length) {
      return null;
    }
    const sourceCols = Math.max(...rows.map((row) => row.length), 0);
    const renderedCols = Math.max(...renderedRows.map((row) => row.length), 0);
    if (sourceCols !== renderedCols) {
      return null;
    }
    return {
      from: { line: start, ch: 0 },
      to: { line: end, ch: lines[end]?.length ?? 0 }
    };
  }

  private resolveExactRenderedTableInSource(source: string, renderedTable: RenderedTableSelection): { from: EditorPosition; to: EditorPosition } | null {
    const candidates = this.getMarkdownTableCandidates(source)
      .filter((candidate) => this.tableRowsMatchSourceRows(candidate.rows, renderedTable.rows));
    if (candidates.length !== 1) {
      return null;
    }
    const match = candidates[0];
    return {
      from: { line: match.start, ch: 0 },
      to: { line: match.end, ch: match.lines[match.lines.length - 1]?.length ?? 0 }
    };
  }

  private describeRenderedTableLocateFailure(view: MarkdownView, source: string, renderedTable: RenderedTableSelection) {
    const lines = source.split(/\r?\n/);
    const start = renderedTable.sourceStartLine;
    const end = renderedTable.sourceEndLine;
    const marked = typeof start === "number" && typeof end === "number";
    if (!marked) {
      const editorView = this.getCodeMirrorEditorView(view.editor);
      const table = renderedTable.table;
      let livePreviewProbe = "no-editor-view";
      if (editorView && table) {
        try {
          const range = this.getLivePreviewTableRange(editorView, table, lines);
          livePreviewProbe = range
            ? `mapped:${range.from.line}-${range.to.line}`
            : "not-mapped";
        } catch (error) {
          livePreviewProbe = `error:${error instanceof Error ? error.message : String(error)}`;
        }
      }
      return {
        reason: this.tr("当前表格没有源码标记", "Current table has no source marker"),
        mode: typeof view.getMode === "function" ? view.getMode() : "unknown",
        sourceLine: renderedTable.sourceLine,
        livePreviewProbe,
        editorTableRange: renderedTable.editorTableRange
          ? `${renderedTable.editorTableRange.from.line}-${renderedTable.editorTableRange.to.line}`
          : "none",
        rowCount: renderedTable.rows.length,
        colCount: Math.max(...renderedTable.rows.map((row) => row.length), 0),
        className: table?.className ?? ""
      };
    }
    if (start < 0 || end < start || end >= lines.length) {
      return {
        reason: this.tr("源码标记行号越界", "Source marker line range is invalid"),
        start,
        end,
        lineCount: lines.length
      };
    }
    const tableLines = lines.slice(start, end + 1);
    if (!tableLines.some((line) => this.isMarkdownTableSeparatorLine(line))) {
      return {
        reason: this.tr("源码标记范围不是 Markdown 表格", "Source marker range is not a Markdown table"),
        start,
        end,
        sourcePreview: tableLines.join("\n").slice(0, 240)
      };
    }
    const rows = tableLines
      .filter((line) => this.isMarkdownTableLikeLine(line))
      .filter((line) => !this.isMarkdownTableSeparatorLine(line))
      .map((line) => this.splitMarkdownTableRow(line));
    return {
      reason: this.tr("源码表格和渲染表格行列不一致", "Source and rendered table shape do not match"),
      start,
      end,
      sourceRows: rows.length,
      renderedRows: renderedTable.rows.length,
      sourceCols: Math.max(...rows.map((row) => row.length), 0),
      renderedCols: Math.max(...renderedTable.rows.map((row) => row.length), 0)
    };
  }

  private tableRowsMatchSourceRows(sourceRows: string[][], renderedRows: string[][]) {
    if (sourceRows.length !== renderedRows.length) {
      return false;
    }
    for (let row = 0; row < sourceRows.length; row += 1) {
      if (sourceRows[row].length !== renderedRows[row]?.length) {
        return false;
      }
      for (let col = 0; col < sourceRows[row].length; col += 1) {
        if (this.normalizeTableCellText(sourceRows[row][col]) !== this.normalizeTableCellText(renderedRows[row][col] ?? "")) {
          return false;
        }
      }
    }
    return true;
  }

  private resolveRenderedTableInSource(source: string, renderedTable: RenderedTableSelection): { from: EditorPosition; to: EditorPosition } | null {
    const candidates = this.getMarkdownTableCandidates(source);
    if (candidates.length === 0 || renderedTable.rows.length === 0) {
      return null;
    }
    const scored = candidates
      .map((candidate, index) => ({
        ...candidate,
        score: this.scoreMarkdownTableCandidate(candidate, index, renderedTable)
      }))
      .sort((a, b) => b.score - a.score);
    const best = scored[0];
    const second = scored[1];
    if (!best || best.score < 80 || (second && best.score - second.score < 24)) {
      return null;
    }
    return {
      from: { line: best.start, ch: 0 },
      to: { line: best.end, ch: best.lines[best.lines.length - 1]?.length ?? 0 }
    };
  }

  private getMarkdownTableCandidates(source: string): Array<{ start: number; end: number; lines: string[]; rows: string[][] }> {
    const lines = source.split(/\r?\n/);
    const candidates: Array<{ start: number; end: number; lines: string[]; rows: string[][] }> = [];
    for (let index = 0; index < lines.length; index += 1) {
      if (!this.isMarkdownTableLikeLine(lines[index])) {
        continue;
      }
      let start = index;
      while (start > 0 && this.isMarkdownTableLikeLine(lines[start - 1])) {
        start -= 1;
      }
      let end = index;
      while (end + 1 < lines.length && this.isMarkdownTableLikeLine(lines[end + 1])) {
        end += 1;
      }
      const tableLines = lines.slice(start, end + 1);
      if (tableLines.some((line) => this.isMarkdownTableSeparatorLine(line))) {
        const rows = tableLines
          .filter((line) => !this.isMarkdownTableSeparatorLine(line))
          .map((line) => this.splitMarkdownTableRow(line));
        if (rows.length > 0) {
          candidates.push({ start, end, lines: tableLines, rows });
        }
      }
      index = end;
    }
    return candidates;
  }

  private scoreMarkdownTableCandidate(
    candidate: { start: number; end: number; rows: string[][] },
    candidateIndex: number,
    renderedTable: RenderedTableSelection
  ) {
    const renderedRows = renderedTable.rows.map((row) => row.map((cell) => this.normalizeTableCellText(cell)));
    const candidateRows = candidate.rows.map((row) => row.map((cell) => this.normalizeTableCellText(cell)));
    const renderedColCount = Math.max(...renderedRows.map((row) => row.length), 0);
    const candidateColCount = Math.max(...candidateRows.map((row) => row.length), 0);
    let score = 0;

    if (candidateRows.length === renderedRows.length) {
      score += 35;
    } else {
      score -= Math.min(35, Math.abs(candidateRows.length - renderedRows.length) * 8);
    }
    if (candidateColCount === renderedColCount) {
      score += 30;
    } else {
      score -= Math.min(30, Math.abs(candidateColCount - renderedColCount) * 10);
    }

    score += this.scoreCellList(candidateRows[0] ?? [], renderedRows[0] ?? [], 12, 28);
    score += this.scoreCellList(
      candidateRows.slice(1).map((row) => row[0] ?? "").filter(Boolean),
      renderedRows.slice(1).map((row) => row[0] ?? "").filter(Boolean),
      8,
      24
    );
    score += this.scoreCellList(candidateRows.flat(), renderedRows.flat(), 2, 22);

    const selectedByCoordinate = this.getRenderedSelectedCoordinateTexts(renderedRows, renderedTable.editRange);
    if (selectedByCoordinate.length > 0) {
      let coordinateMatches = 0;
      selectedByCoordinate.forEach((entry) => {
        if ((candidateRows[entry.row]?.[entry.col] ?? "") === entry.text) {
          coordinateMatches += 1;
        }
      });
      score += coordinateMatches * 26;
      if (coordinateMatches === selectedByCoordinate.length) {
        score += 34;
      }
    } else {
      const selectedTexts = renderedTable.selectedTexts
        .map((text) => this.normalizeTableCellText(text))
        .filter(Boolean);
      score += this.scoreCellList(candidateRows.flat(), selectedTexts, 10, 26);
    }

    if (typeof renderedTable.sourceLine === "number") {
      if (renderedTable.sourceLine >= candidate.start && renderedTable.sourceLine <= candidate.end) {
        score += 14;
      } else {
        const distance = Math.min(Math.abs(renderedTable.sourceLine - candidate.start), Math.abs(renderedTable.sourceLine - candidate.end));
        score += Math.max(0, 8 - distance);
      }
    }
    if (candidateIndex === renderedTable.index) {
      score += 6;
    }
    return score;
  }

  private scoreCellList(candidateCells: string[], renderedCells: string[], perExact: number, maxOverlap: number) {
    const candidateSet = new Set(candidateCells.map((cell) => this.normalizeTableCellText(cell)).filter(Boolean));
    const rendered = renderedCells.map((cell) => this.normalizeTableCellText(cell)).filter(Boolean);
    if (candidateSet.size === 0 || rendered.length === 0) {
      return 0;
    }
    const exact = rendered.filter((cell) => candidateSet.has(cell)).length;
    const ratio = exact / rendered.length;
    return exact * perExact + Math.round(ratio * maxOverlap);
  }

  private getRenderedSelectedCoordinateTexts(rows: string[][], range?: TableEditRange) {
    if (!range) {
      return [];
    }
    const selected: Array<{ row: number; col: number; text: string }> = [];
    for (let row = range.startRow; row <= range.endRow; row += 1) {
      for (let col = range.startCol; col <= range.endCol; col += 1) {
        const text = this.normalizeTableCellText(rows[row]?.[col] ?? "");
        if (text) {
          selected.push({ row, col, text });
        }
      }
    }
    return selected;
  }

  private resolveRenderedSelectionInSource(source: string, selectedText: string, tableIndex?: number, sourceLine?: number): { from: EditorPosition; to: EditorPosition } | null {
    const exact = this.findUniqueSourceMatch(source, selectedText);
    if (exact) {
      return exact;
    }
    const byContent = this.findMarkdownTableRangeForRenderedSelection(source, selectedText);
    if (byContent) {
      return byContent;
    }
    if (typeof sourceLine === "number") {
      const byLine = this.findMarkdownTableRangeNearSourceLine(source, sourceLine);
      if (byLine) {
        return byLine;
      }
    }
    return this.findMarkdownTableRangeForRenderedSelection(source, selectedText, tableIndex, true);
  }

  private findMarkdownTableRangeNearSourceLine(source: string, sourceLine: number): { from: EditorPosition; to: EditorPosition } | null {
    const lines = source.split(/\r?\n/);
    const candidates = [
      sourceLine,
      sourceLine - 1,
      sourceLine + 1,
      sourceLine - 2,
      sourceLine + 2
    ].filter((line) => line >= 0 && line < lines.length);
    for (const line of candidates) {
      const range = this.getMarkdownTableRangeInLines(lines, line);
      if (range) {
        return range;
      }
    }
    return null;
  }

  private findUniqueSourceMatch(source: string, selectedText: string): { from: EditorPosition; to: EditorPosition } | null {
    const needle = selectedText.trim();
    if (!needle) {
      return null;
    }
    const first = source.indexOf(needle);
    if (first < 0 || source.indexOf(needle, first + needle.length) >= 0) {
      return null;
    }
    return {
      from: this.sourceIndexToEditorPosition(source, first),
      to: this.sourceIndexToEditorPosition(source, first + needle.length)
    };
  }

  private findMarkdownTableRangeForRenderedSelection(source: string, selectedText: string, tableIndex?: number, allowIndexFallback = false): { from: EditorPosition; to: EditorPosition } | null {
    const normalizedSelection = this.normalizeRenderedText(selectedText);
    if (!normalizedSelection) {
      return null;
    }
    const lines = source.split(/\r?\n/);
    const ranges: Array<{ start: number; end: number; rendered: string }> = [];
    for (let index = 0; index < lines.length; index += 1) {
      if (!this.isMarkdownTableLikeLine(lines[index])) {
        continue;
      }
      let start = index;
      while (start > 0 && this.isMarkdownTableLikeLine(lines[start - 1])) {
        start -= 1;
      }
      let end = index;
      while (end + 1 < lines.length && this.isMarkdownTableLikeLine(lines[end + 1])) {
        end += 1;
      }
      const hasSeparator = lines.slice(start, end + 1).some((line) => this.isMarkdownTableSeparatorLine(line));
      if (hasSeparator) {
        const rendered = this.normalizeRenderedText(lines.slice(start, end + 1).map((line) => line.replace(/\|/g, " ")).join(" "));
        ranges.push({ start, end, rendered });
      }
      index = end;
    }
    if (allowIndexFallback && typeof tableIndex === "number" && ranges[tableIndex]) {
      const match = ranges[tableIndex];
      return {
        from: { line: match.start, ch: 0 },
        to: { line: match.end, ch: lines[match.end]?.length ?? 0 }
      };
    }
    if (allowIndexFallback && ranges.length === 1) {
      return {
        from: { line: ranges[0].start, ch: 0 },
        to: { line: ranges[0].end, ch: lines[ranges[0].end]?.length ?? 0 }
      };
    }
    const tokens = normalizedSelection.split(/\s+/).filter((token) => token.length > 1);
    const scored = ranges
      .map((range) => {
        const matched = tokens.filter((token) => range.rendered.includes(token)).length;
        return {
          ...range,
          score: range.rendered.includes(normalizedSelection) ? tokens.length + 10 : matched
        };
      })
      .sort((a, b) => b.score - a.score);
    const match = scored[0];
    if (!match || match.score === 0 || scored[1]?.score === match.score) {
      return null;
    }
    return {
      from: { line: match.start, ch: 0 },
      to: { line: match.end, ch: lines[match.end]?.length ?? 0 }
    };
  }

  private normalizeRenderedText(text: string) {
    return text.replace(/\s+/g, " ").trim().toLowerCase();
  }

  private normalizeTableCellText(text: string) {
    return text.replace(/\s+/g, " ").trim().toLowerCase();
  }

  private splitMarkdownTableRow(line: string) {
    return this.splitMarkdownTableRowWithSpans(line).map((cell) => this.normalizeTableCellText(cell.text));
  }

  private splitMarkdownTableRowWithSpans(line: string): Array<{ text: string; start: number; end: number }> {
    const cells: Array<{ text: string; start: number; end: number }> = [];
    let current = "";
    let start = 0;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === "\\" && line[index + 1] === "|") {
        current += "|";
        index += 1;
        continue;
      }
      if (char === "|") {
        cells.push({ text: current, start, end: index });
        current = "";
        start = index + 1;
        continue;
      }
      current += char;
    }
    cells.push({ text: current, start, end: line.length });
    if (cells.length > 0 && cells[0].text.trim() === "") {
      cells.shift();
    }
    if (cells.length > 0 && cells[cells.length - 1].text.trim() === "") {
      cells.pop();
    }
    return cells;
  }

  private sourceIndexToEditorPosition(source: string, index: number): EditorPosition {
    const before = source.slice(0, index).split(/\n/);
    return {
      line: before.length - 1,
      ch: before[before.length - 1]?.length ?? 0
    };
  }

  private getMarkdownTableRange(editor: Editor, from: EditorPosition, to: EditorPosition): { from: EditorPosition; to: EditorPosition } | null {
    const startLine = Math.max(0, Math.min(from.line, to.line));
    const endLine = Math.min(editor.lineCount() - 1, Math.max(from.line, to.line));
    for (let line = startLine; line <= endLine; line += 1) {
      const range = this.getMarkdownTableRangeAtLine(editor, line);
      if (range) {
        return range;
      }
    }
    return this.getMarkdownTableRangeAtLine(editor, startLine);
  }

  private getMarkdownTableRangeAtLine(editor: Editor, line: number): { from: EditorPosition; to: EditorPosition } | null {
    if (!this.isMarkdownTableLikeLine(editor.getLine(line))) {
      return null;
    }
    let start = line;
    while (start > 0 && this.isMarkdownTableLikeLine(editor.getLine(start - 1))) {
      start -= 1;
    }
    let end = line;
    while (end + 1 < editor.lineCount() && this.isMarkdownTableLikeLine(editor.getLine(end + 1))) {
      end += 1;
    }
    let hasSeparator = false;
    for (let index = start; index <= end; index += 1) {
      if (this.isMarkdownTableSeparatorLine(editor.getLine(index))) {
        hasSeparator = true;
        break;
      }
    }
    if (!hasSeparator) {
      return null;
    }
    return {
      from: { line: start, ch: 0 },
      to: { line: end, ch: editor.getLine(end).length }
    };
  }

  private getMarkdownTableRangeInLines(lines: string[], line: number): { from: EditorPosition; to: EditorPosition } | null {
    if (!this.isMarkdownTableLikeLine(lines[line] ?? "")) {
      return null;
    }
    let start = line;
    while (start > 0 && this.isMarkdownTableLikeLine(lines[start - 1])) {
      start -= 1;
    }
    let end = line;
    while (end + 1 < lines.length && this.isMarkdownTableLikeLine(lines[end + 1])) {
      end += 1;
    }
    const hasSeparator = lines.slice(start, end + 1).some((entry) => this.isMarkdownTableSeparatorLine(entry));
    if (!hasSeparator) {
      return null;
    }
    return {
      from: { line: start, ch: 0 },
      to: { line: end, ch: lines[end]?.length ?? 0 }
    };
  }

  private isMarkdownTableLikeLine(line: string) {
    return line.includes("|") && line.trim().length > 0;
  }

  private isMarkdownTableSeparatorLine(line: string) {
    return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(line);
  }

  private validateTableEditRange(original: string, replacement: string, range: TableEditRange) {
    const originalRows = this.parseMarkdownTableCells(original);
    const replacementRows = this.parseMarkdownTableCells(replacement);
    if (this.validateFixedShapeTableEditRange(originalRows, replacementRows, range)) {
      return true;
    }
    if (this.isFullTableRowRange(range, originalRows) && this.validateTableRowBlockEditRange(originalRows, replacementRows, range)) {
      return true;
    }
    if (this.isFullTableColumnRange(range, originalRows) && this.validateTableColumnBlockEditRange(originalRows, replacementRows, range)) {
      return true;
    }
    console.warn("[codex-ai-agent] Inline table edit validation failed", {
      range,
      originalRows,
      replacementRows
    });
    return false;
  }

  private validateFixedShapeTableEditRange(originalRows: string[][], replacementRows: string[][], range: TableEditRange) {
    if (originalRows.length !== replacementRows.length) {
      return false;
    }
    for (let row = 0; row < originalRows.length; row += 1) {
      if (originalRows[row].length !== replacementRows[row]?.length) {
        return false;
      }
      for (let col = 0; col < originalRows[row].length; col += 1) {
        const inEditRange = row >= range.startRow && row <= range.endRow && col >= range.startCol && col <= range.endCol;
        if (!inEditRange && originalRows[row][col] !== replacementRows[row][col]) {
          return false;
        }
      }
    }
    return true;
  }

  private validateTableRowBlockEditRange(originalRows: string[][], replacementRows: string[][], range: TableEditRange) {
    const columnCount = this.getTableColumnCount(originalRows);
    if (!replacementRows.every((row) => row.length === columnCount)) {
      return false;
    }

    const prefixCount = Math.max(0, Math.min(range.startRow, originalRows.length));
    const suffixStart = Math.max(prefixCount, Math.min(range.endRow + 1, originalRows.length));
    const suffixCount = originalRows.length - suffixStart;
    if (replacementRows.length < prefixCount + suffixCount) {
      return false;
    }

    for (let row = 0; row < prefixCount; row += 1) {
      if (!this.tableCellsMatch(originalRows[row], replacementRows[row] ?? [])) {
        return false;
      }
    }

    const replacementSuffixStart = replacementRows.length - suffixCount;
    for (let offset = 0; offset < suffixCount; offset += 1) {
      if (!this.tableCellsMatch(originalRows[suffixStart + offset], replacementRows[replacementSuffixStart + offset] ?? [])) {
        return false;
      }
    }
    return true;
  }

  private validateTableColumnBlockEditRange(originalRows: string[][], replacementRows: string[][], range: TableEditRange) {
    if (originalRows.length !== replacementRows.length) {
      return false;
    }

    const columnCount = this.getTableColumnCount(originalRows);
    const prefixCount = Math.max(0, Math.min(range.startCol, columnCount));
    const suffixStart = Math.max(prefixCount, Math.min(range.endCol + 1, columnCount));
    const suffixCount = columnCount - suffixStart;

    for (let row = 0; row < originalRows.length; row += 1) {
      const originalRow = originalRows[row];
      const replacementRow = replacementRows[row] ?? [];
      if (replacementRow.length < prefixCount + suffixCount) {
        return false;
      }
      for (let col = 0; col < prefixCount; col += 1) {
        if (originalRow[col] !== replacementRow[col]) {
          return false;
        }
      }
      const replacementSuffixStart = replacementRow.length - suffixCount;
      for (let offset = 0; offset < suffixCount; offset += 1) {
        if (originalRow[suffixStart + offset] !== replacementRow[replacementSuffixStart + offset]) {
          return false;
        }
      }
    }
    return true;
  }

  private isFullTableRowRange(range: TableEditRange, rows: string[][]) {
    const columnCount = this.getTableColumnCount(rows);
    return columnCount > 0 && range.startCol <= 0 && range.endCol >= columnCount - 1;
  }

  private isFullTableColumnRange(range: TableEditRange, rows: string[][]) {
    return rows.length > 0 && range.startRow <= 0 && range.endRow >= rows.length - 1;
  }

  private getTableColumnCount(rows: string[][]) {
    return Math.max(...rows.map((row) => row.length), 0);
  }

  private parseMarkdownTableCells(markdown: string): string[][] {
    return markdown
      .split(/\r?\n/)
      .filter((line) => this.isMarkdownTableLikeLine(line))
      .filter((line) => !this.isMarkdownTableSeparatorLine(line))
      .map((line) => this.splitMarkdownTableRow(line));
  }

  private getEditorContextBefore(editor: Editor, from: EditorPosition) {
    const startLine = Math.max(0, from.line - 4);
    return editor.getRange({ line: startLine, ch: 0 }, from);
  }

  private getEditorContextAfter(editor: Editor, to: EditorPosition) {
    const endLine = Math.min(editor.lineCount() - 1, to.line + 4);
    return editor.getRange(to, { line: endLine, ch: editor.getLine(endLine).length });
  }

  private normalizeEditorPosition(position: EditorPosition): EditorPosition {
    return { line: position.line, ch: position.ch };
  }

  private compareEditorPositions(a: EditorPosition, b: EditorPosition) {
    if (a.line !== b.line) {
      return a.line - b.line;
    }
    return a.ch - b.ch;
  }

  private editorPositionToOffset(editorView: EditorView, position: EditorPosition) {
    const lineNumber = Math.min(Math.max(position.line + 1, 1), editorView.state.doc.lines);
    const line = editorView.state.doc.line(lineNumber);
    return Math.min(line.to, line.from + Math.max(position.ch, 0));
  }

  private getCodeMirrorEditorView(editor: Editor): EditorView | null {
    return (editor as any).cm instanceof EditorView ? (editor as any).cm : null;
  }

  private getVaultBasePath() {
    try {
      return (this.app.vault.adapter as any).getBasePath?.() ?? "";
    } catch {
      return "";
    }
  }

  private getParentPath(filePath: string) {
    const trimmed = filePath.trim();
    const index = trimmed.lastIndexOf("/");
    return index > 0 ? trimmed.slice(0, index) : "";
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

  private getActiveMarkdownScrollTop(view: MarkdownView) {
    const scroller = view.contentEl.querySelector<HTMLElement>(".cm-scroller, .markdown-preview-view");
    return scroller?.scrollTop ?? 0;
  }

  private getMarkdownViewSourceFlag(view: MarkdownView) {
    const state = typeof view.getState === "function" ? view.getState() : {};
    return typeof state.source === "boolean" ? state.source : view.getMode() === "source";
  }

  private setActiveMarkdownScrollTop(view: MarkdownView, scrollTop: number) {
    const scroller = view.contentEl.querySelector<HTMLElement>(".cm-scroller, .markdown-preview-view");
    if (scroller) {
      scroller.scrollTop = scrollTop;
    }
  }
}

class CodexAgentSettingTab extends PluginSettingTab {
  private setupStatusEl: HTMLElement | null = null;

  constructor(app: any, private owner: CodexForObsidianPlugin) {
    super(app, owner);
  }

  private tr(zh: string, en: string) {
    return this.owner.tr(zh, en);
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
    this.renderDataManagement(containerEl);
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
    containerEl.createEl("h3", { text: this.tr("设置", "Setup") });
    const status = containerEl.createDiv("codex-agent-settings-status");
    this.setupStatusEl = status;
    this.renderSetupStatus("idle", "Codex status has not been checked yet.", "Click Check Codex to verify your local Codex CLI.");

    new Setting(containerEl)
      .setName("Codex")
      .setDesc(this.tr("检查 Obsidian 是否能找到并运行本地 Codex CLI。", "Check whether Obsidian can find and run the local Codex CLI."))
      .addButton((button) => button
        .setButtonText(this.tr("检查 Codex", "Check Codex"))
        .setCta()
        .onClick(() => this.checkCodex(this.owner.getSettings().codexBin || DEFAULT_CODEX_BIN)))
      .addButton((button) => button
        .setButtonText(this.tr("尝试常见路径", "Try common locations"))
        .onClick(() => this.tryCommonCodexLocations()))
      .addButton((button) => button
        .setButtonText(this.tr("打开 Agent", "Open Agent"))
        .onClick(() => this.owner.openAgentView()));
  }

  private renderRuntime(containerEl: HTMLElement, settings: AgentPluginSettings) {
    containerEl.createEl("h3", { text: this.tr("运行时", "Runtime") });
    new Setting(containerEl)
      .setName(this.tr("Codex CLI 路径", "Codex CLI path"))
      .setDesc(this.tr("Codex 可执行文件路径。通常会自动检测；如果 Obsidian 找不到 Codex，请填写绝对路径。", "Path to the Codex executable. Usually auto-detected. If Obsidian cannot find Codex, enter an absolute path."))
      .addText((text) => text
        .setPlaceholder(DEFAULT_CODEX_BIN)
        .setValue(settings.codexBin)
        .onChange(async (value) => this.update({ codexBin: value.trim() || DEFAULT_CODEX_BIN })))
      .addButton((button) => button
        .setButtonText(this.tr("重置默认", "Reset to default"))
        .onClick(async () => {
          await this.update({ codexBin: DEFAULT_CODEX_BIN });
          this.display();
        }))
      .addButton((button) => button
        .setButtonText("Test")
        .onClick(() => this.testCommand(this.owner.getSettings().codexBin || DEFAULT_CODEX_BIN, ["--version"], "Codex CLI")));

    new Setting(containerEl)
      .setName(this.tr("Node.js 路径", "Node.js path"))
      .setDesc(this.tr("通常留空。仅当 Codex 依赖指定 Node，或 Obsidian 图形环境找不到 node 时设置。", "Usually leave blank. Only set this if an npm-installed Codex depends on a specific Node binary, or Obsidian cannot find node in the GUI environment."))
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
      .setName(this.tr("执行后端", "Execution backend"))
      .setDesc(this.tr("默认使用 App Server。Exec JSON 仅作为兼容回退。", "Uses App Server by default. Exec JSON is only a compatibility fallback."))
      .addDropdown((dropdown) => dropdown
        .addOption("app-server", "App Server")
        .addOption("exec-json", "Exec JSON fallback")
        .setValue(settings.adapterMode)
        .onChange(async (value) => this.update({ adapterMode: value as AdapterMode })));
  }

  private renderDefaults(containerEl: HTMLElement, settings: AgentPluginSettings) {
    containerEl.createEl("h3", { text: this.tr("默认设置", "Defaults") });
    new Setting(containerEl)
      .setName(this.tr("Language / 语言", "Language / 语言"))
      .setDesc(this.tr("选择界面语言。Agent、Ask、New Agent 等产品词保持英文。", "Choose the UI language. Product terms such as Agent, Ask, and New Agent stay in English."))
      .addDropdown((dropdown) => dropdown
        .addOption("zh", "中文")
        .addOption("en", "English")
        .setValue(settings.language)
        .onChange(async (value) => {
          const language = value as AppLanguage;
          await this.update({
            language,
            inlineEditQuickCommands: this.owner.localizeInlineEditQuickCommands(this.owner.getSettings().inlineEditQuickCommands, language)
          });
          this.display();
        }));

    new Setting(containerEl)
      .setName(this.tr("默认模式", "Default mode"))
      .setDesc(this.tr("新 Agent 标签页默认使用的模式。", "Default mode for new Agent tabs."))
      .addDropdown((dropdown) => dropdown
        .addOption("agent", "Agent")
        .addOption("ask", "Ask")
        .setValue(settings.defaultMode)
        .onChange(async (value) => this.update({ defaultMode: value as AgentMode })));

    new Setting(containerEl)
      .setName(this.tr("默认模型", "Default model"))
      .setDesc(this.tr("新 Agent 标签页默认使用的模型。", "Default model for new Agent tabs."))
      .addDropdown((dropdown) => {
        (["GPT-5.5", "GPT-5.4", "GPT-5.4 Mini", "GPT-5.3 Codex"] as ModelChoice[]).forEach((model) => dropdown.addOption(model, model));
        dropdown.setValue(settings.defaultModel).onChange(async (value) => this.update({ defaultModel: value as ModelChoice }));
      });

    new Setting(containerEl)
      .setName(this.tr("默认推理强度", "Default reasoning"))
      .setDesc(this.tr("新 Agent 标签页默认使用的推理强度。", "Default reasoning level for new Agent tabs. It is passed to App Server as effort."))
      .addDropdown((dropdown) => {
        (["Auto", "Low", "Medium", "High", "Extra High"] as ReasoningLevel[]).forEach((level) => dropdown.addOption(level, level));
        dropdown.setValue(settings.defaultReasoningLevel).onChange(async (value) => this.update({ defaultReasoningLevel: value as ReasoningLevel }));
      });
  }

  private renderContext(containerEl: HTMLElement, settings: AgentPluginSettings) {
    containerEl.createEl("h3", { text: this.tr("上下文", "Context") });
    new Setting(containerEl)
      .setName(this.tr("自动附加当前笔记", "Auto-attach active note"))
      .setDesc(this.tr("自动把当前笔记作为上下文。默认关闭，避免意外发送整篇笔记。", "Automatically attach the active note as context. Off by default to avoid sending full notes unexpectedly."))
      .addToggle((toggle) => toggle.setValue(settings.autoAttachActiveNote).onChange(async (value) => this.update({ autoAttachActiveNote: value })));

    new Setting(containerEl)
      .setName(this.tr('启用右键 "Add to Agent"', 'Enable right-click "Add to Agent"'))
      .setDesc(this.tr("在编辑器选区、文件和文件夹菜单中显示 Add to Agent。", "Show Add to Agent in editor selection, file, and folder context menus."))
      .addToggle((toggle) => toggle.setValue(settings.enableRightClickAddToAgent).onChange(async (value) => this.update({ enableRightClickAddToAgent: value })));

    new Setting(containerEl)
      .setName(this.tr("粘贴图片行为", "Pasted image behavior"))
      .setDesc(this.tr("将粘贴的图片转换为图片 chip。", "Convert pasted images into image chips. This can later expand to direct image context."))
      .addDropdown((dropdown) => dropdown.addOption("chip", "Convert to image chip").setValue(settings.pastedImageBehavior));

    this.renderInlineEditQuickCommands(containerEl, settings);
  }

  private renderInlineEditQuickCommands(containerEl: HTMLElement, settings: AgentPluginSettings) {
    containerEl.createEl("h3", { text: this.tr("Inline Edit 快捷指令", "Inline Edit quick commands") });
    containerEl.createEl("p", {
      cls: "codex-agent-settings-help",
      text: this.tr("这些指令会出现在“用 Codex 修改选中内容”的快捷指令下拉中。", "These commands appear in the quick command menu for Edit selection with Codex.")
    });
    settings.inlineEditQuickCommands.forEach((command, index) => {
      const displayCommand = this.owner.localizeInlineEditQuickCommand(command, settings.language);
      new Setting(containerEl)
        .setName(displayCommand.name || this.tr("未命名指令", "Untitled command"))
        .addText((text) => text
          .setPlaceholder(this.tr("名称，例如：润色", "Name, e.g. Polish"))
          .setValue(displayCommand.name)
          .onChange(async (value) => {
            const commands = [...this.owner.getSettings().inlineEditQuickCommands];
            commands[index] = { ...commands[index], name: value };
            await this.update({ inlineEditQuickCommands: commands });
          }))
        .addTextArea((text) => text
          .setPlaceholder(this.tr("Prompt，例如：润色选中内容...", "Prompt, e.g. Polish the selected text..."))
          .setValue(displayCommand.prompt)
          .onChange(async (value) => {
            const commands = [...this.owner.getSettings().inlineEditQuickCommands];
            commands[index] = { ...commands[index], prompt: value };
            await this.update({ inlineEditQuickCommands: commands });
          }))
        .addButton((button) => button
          .setButtonText(this.tr("删除", "Delete"))
          .onClick(async () => {
            const commands = this.owner.getSettings().inlineEditQuickCommands.filter((_, entryIndex) => entryIndex !== index);
            await this.update({ inlineEditQuickCommands: commands });
            this.display();
          }));
    });
    new Setting(containerEl)
      .setName(this.tr("新增快捷指令", "Add quick command"))
      .addButton((button) => button
        .setButtonText(this.tr("新增", "Add"))
        .setCta()
        .onClick(async () => {
          const commands = [
            ...this.owner.getSettings().inlineEditQuickCommands,
            { id: `custom-${Date.now()}`, name: this.tr("新指令", "New command"), prompt: "" }
          ];
          await this.update({ inlineEditQuickCommands: commands });
          this.display();
        }));
  }

  private renderSafety(containerEl: HTMLElement, settings: AgentPluginSettings) {
    containerEl.createEl("h3", { text: this.tr("安全", "Safety") });
    new Setting(containerEl)
      .setName(this.tr("外部路径访问", "External path access"))
      .setDesc(this.tr("访问当前 vault 外部路径时的策略。", "Policy for accessing paths outside the current vault."))
      .addDropdown((dropdown) => dropdown
        .addOption("ask-each-time", "Ask every time")
        .addOption("allow-session", "Allow for current session")
        .addOption("deny", "Deny")
        .setValue(settings.externalPathAccess)
        .onChange(async (value) => this.update({ externalPathAccess: value as ExternalPathAccess })));

    new Setting(containerEl)
      .setName(this.tr("显示详细审批说明", "Show detailed approval explanation"))
      .setDesc(this.tr("在审批卡片中显示操作、目标、目的、命令和原始原因。", "Show operation, target, purpose, command, and raw reason in approval cards."))
      .addToggle((toggle) => toggle.setValue(settings.showDetailedApprovals).onChange(async (value) => this.update({ showDetailedApprovals: value })));
  }

  private renderDisplay(containerEl: HTMLElement, settings: AgentPluginSettings) {
    containerEl.createEl("h3", { text: this.tr("显示", "Display") });
    new Setting(containerEl)
      .setName(this.tr("对话视图位置", "Chat view location"))
      .setDesc(this.tr("选择 Agent 视图打开的位置。", "Where to open the Agent view."))
      .addDropdown((dropdown) => dropdown
        .addOption("right-pane", "Right pane tabs")
        .addOption("left-pane", "Left pane tabs")
        .addOption("new-leaf", "New leaf")
        .setValue(settings.chatViewLocation)
        .onChange(async (value) => this.update({ chatViewLocation: value as ChatViewLocation })));

    new Setting(containerEl)
      .setName(this.tr("对话字号", "Chat font size"))
      .setDesc(this.tr("消息文字大小，单位为像素。推荐 14-17，可选 13-20。", "Message text size in pixels. Recommended range: 14-17. Allowed range: 13-20."))
      .addSlider((slider) => slider
        .setLimits(13, 20, 1)
        .setValue(settings.chatFontSize)
        .setDynamicTooltip()
        .onChange(async (value) => this.update({ chatFontSize: value })))
      .addButton((button) => button
        .setButtonText(this.tr("重置", "Reset"))
        .setTooltip(this.tr("重置对话字号", "Reset chat font size"))
        .onClick(async () => {
          await this.update({ chatFontSize: DEFAULT_SETTINGS.chatFontSize });
          this.display();
        }));

    new Setting(containerEl)
      .setName(this.tr("固定用户提示", "Sticky user prompts"))
      .setDesc(this.tr("滚动时显示当前用户提示的定位条。", "Show the current user prompt anchor while scrolling."))
      .addToggle((toggle) => toggle.setValue(settings.stickyUserPrompts).onChange(async (value) => this.update({ stickyUserPrompts: value })));

    new Setting(containerEl)
      .setName(this.tr("紧凑命令分组", "Compact command groups"))
      .setDesc(this.tr("默认将命令日志折叠为一行。", "Collapse command logs into one line by default."))
      .addToggle((toggle) => toggle.setValue(settings.compactCommandGroups).onChange(async (value) => this.update({ compactCommandGroups: value })));

    new Setting(containerEl)
      .setName(this.tr("Diff 行号", "Diff line numbers"))
      .setDesc(this.tr("在 diff 中显示旧行号和新行号。", "Show old and new line numbers in diffs."))
      .addToggle((toggle) => toggle.setValue(settings.diffLineNumbers).onChange(async (value) => this.update({ diffLineNumbers: value })));

    new Setting(containerEl)
      .setName(this.tr("改动审查", "Change review"))
      .setDesc(this.tr("显示 Codex 文件改动审查，包括 diff 预览和接受/拒绝控制。", "Show Codex file-change review, including diff preview plus accept/reject controls."))
      .addToggle((toggle) => toggle.setValue(settings.enableDiffReview).onChange(async (value) => this.update({ enableDiffReview: value })));

    new Setting(containerEl)
      .setName(this.tr("Git 管理", "Git management"))
      .setDesc(this.tr("显示暂存、提交和历史等 Git 操作。它与改动审查相互独立。", "Show Git-specific controls for staging, committing, and history. This is independent from Codex change review."))
      .addToggle((toggle) => toggle.setValue(settings.enableGitManagement).onChange(async (value) => this.update({ enableGitManagement: value })));
  }

  private renderDataManagement(containerEl: HTMLElement) {
    containerEl.createEl("h3", { text: this.tr("数据", "Data") });
    new Setting(containerEl)
      .setName(this.tr("用户数据", "User data"))
      .setDesc(this.tr("用户数据保存在 .obsidian/.codexaiagent/data.json，重装插件不会删除会话或审查状态。", "Stored outside the plugin install folder at .obsidian/.codexaiagent/data.json so reinstalling the plugin does not remove conversations or review state."))
      .addButton((button) => button
        .setButtonText(this.tr("清理用户数据", "Clear user data"))
        .setWarning()
        .onClick(() => {
          new CodexConfirmModal(
            this.app,
            this.tr("清理 Codex AI Agent 用户数据？", "Clear Codex AI Agent user data?"),
            this.tr("这会删除 .obsidian/.codexaiagent 下的会话、设置和 diff 审查状态。当前 Agent 面板会关闭，插件设置会恢复默认值。", "This deletes conversations, settings, and diff review state under .obsidian/.codexaiagent. The current Agent panel will close and settings will reset to defaults."),
            this.tr("确认清理", "Clear data"),
            true,
            () => void this.owner.clearUserData(),
            this.tr("取消", "Cancel")
          ).open();
        }));
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

class CodexConfirmModal extends Modal {
  constructor(
    app: any,
    private title: string,
    private message: string,
    private confirmLabel: string,
    private danger: boolean,
    private onConfirm: () => void,
    private cancelLabel = "Cancel"
  ) {
    super(app);
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass("codex-agent-approval-modal");
    contentEl.createEl("h3", { text: this.title });
    contentEl.createEl("p", { text: this.message });
    const actions = contentEl.createDiv("codex-agent-approval-modal-actions");
    const cancel = actions.createEl("button", { text: this.cancelLabel });
    const confirm = actions.createEl("button", { cls: this.danger ? "mod-warning" : "mod-cta", text: this.confirmLabel });
    cancel.addEventListener("click", () => this.close());
    confirm.addEventListener("click", () => {
      this.close();
      this.onConfirm();
    });
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
  private isRestoringComposer = false;
  private promptInput: HTMLElement | null = null;
  private promptPlaceholderEl: HTMLElement | null = null;
  private promptPickerEl: HTMLElement | null = null;
  private promptPickerItems: PickerItem[] = [];
  private promptPickerIndex = 0;
  private promptPickerTrigger: PromptTriggerState | null = null;
  private tabContainer: HTMLElement | null = null;
  private historyPanel: HTMLElement | null = null;
  private historyOutsideClickHandler: ((event: MouseEvent) => void) | null = null;
  private renamingHistorySessionId: string | null = null;
  private timelineContainer: HTMLElement | null = null;
  private stickyUserPromptEl: HTMLElement | null = null;
  private stickyUserPromptContentEl: HTMLElement | null = null;
  private stickyUserPromptIndex: number | null = null;
  private workbenchContainer: HTMLElement | null = null;
  private composerContainer: HTMLElement | null = null;
  private tokenUsageEl: HTMLElement | null = null;
  private gitChangesEl: HTMLElement | null = null;
  private gitChangesTimer: number | null = null;
  private gitDiffBackdropEl: HTMLElement | null = null;
  private gitDiffPanelEl: HTMLElement | null = null;
  private gitDiffExpandedFiles = new Set<string>();
  private gitDiffAcceptedFiles = new Set<string>();
  private gitDiffAcceptedHunks = new Set<string>();
  private gitDiffAcceptedLines = new Set<string>();
  private gitDiffRejectedFiles = new Set<string>();
  private gitDiffReviewFiles: DiffFileView[] = [];
  private activeGitReviewSection: GitReviewSection = "review";
  private gitDiffReviewFilter: DiffReviewFilter = "active";
  private gitDiffEditorReviewBarEl: HTMLElement | null = null;
  private inlineDiffEditorView: EditorView | null = null;
  private inlineDiffReviewFile: DiffFileView | null = null;
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
  private runningProcesses = new Map<string, AgentRunState>();
  private currentRunState: AgentRunState | null = null;
  private elapsedTimers = new Map<string, number>();
  private pendingApprovals = new Map<string, ApprovalRequestState>();
  private activeApprovalModal: CodexApprovalNoticeModal | null = null;
  private responseRenderTimer: number | null = null;
  private liveStatusEl: HTMLElement | null = null;
  private liveStatusTextEl: HTMLElement | null = null;
  private elapsedTimer: number | null = null;
  private shouldShowScrollBottomButton = false;

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
    this.restoreGitDiffReviewState(saved.diffReviewState);
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

  private restoreGitDiffReviewState(state: DiffReviewPersistedState) {
    this.gitDiffAcceptedFiles = new Set(state.acceptedFiles);
    this.gitDiffAcceptedHunks = new Set(state.acceptedHunks);
    this.gitDiffAcceptedLines = new Set(state.acceptedLines);
    this.gitDiffRejectedFiles = new Set(state.rejectedFiles);
  }

  private persistGitDiffReviewState() {
    this.owner.saveDiffReviewState({
      acceptedFiles: [...this.gitDiffAcceptedFiles],
      acceptedHunks: [...this.gitDiffAcceptedHunks],
      acceptedLines: [...this.gitDiffAcceptedLines],
      rejectedFiles: [...this.gitDiffRejectedFiles]
    });
  }

  private tr(zh: string, en: string) {
    return this.owner.tr(zh, en);
  }

  private localizeInlineEditStatusTitle(title: string) {
    const normalized = title.trim().toLowerCase();
    if (normalized === "thinking") {
      return this.tr("思考中", "Thinking");
    }
    if (normalized === "generating") {
      return this.tr("生成中", "Generating");
    }
    if (normalized === "failed") {
      return this.tr("失败", "Failed");
    }
    if (normalized === "completed") {
      return this.tr("已完成", "Completed");
    }
    if (normalized === "command failed") {
      return this.tr("命令失败", "Command failed");
    }
    if (normalized === "command complete") {
      return this.tr("命令完成", "Command complete");
    }
    if (normalized === "running command") {
      return this.tr("运行命令", "Running command");
    }
    if (normalized === "diff updated") {
      return this.tr("Diff 已更新", "Diff updated");
    }
    return title;
  }

  applyDisplaySettings() {
    const settings = this.owner.getSettings();
    const container = this.containerEl.children[1] as HTMLElement | undefined;
    container?.style.setProperty("--codex-chat-font-size", `${settings.chatFontSize}px`);
    this.promptPlaceholderEl?.setText(this.tr(
      "问 Codex 任何问题。用 @ 添加文件或文件夹，/ 选择技能...",
      "Ask Codex anything. Use @ to attach files or folders, / to choose a skill..."
    ));
    if (!settings.enableDiffReview) {
      this.liveDiffEl?.empty();
      this.liveDiffEl?.removeClass("is-visible");
      this.closeGitDiffEditorReviewBar();
      if (!settings.enableGitManagement || this.activeGitReviewSection === "review") {
        this.closeGitDiffPanel();
      }
    }
    if (!settings.enableGitManagement && !settings.enableDiffReview) {
      this.gitChangesEl?.empty();
      this.gitChangesEl?.removeClass("is-visible");
      this.closeGitDiffPanel();
    } else {
      void this.renderGitChanges();
    }
    this.renderLiveDiff();
  }

  async onClose() {
    this.saveComposerDraftToActiveSession();
    this.stopElapsedTimer();
    this.stopGitChangesTimer();
    this.closeGitDiffPanel();
    this.closeGitDiffEditorReviewBar();
    this.closeHistoryPanel();
    this.closePromptPicker();
    this.closeAuxModeMenu();
    this.activeApprovalModal?.close();
    this.activeApprovalModal = null;
    if (this.responseRenderTimer !== null) {
      window.clearTimeout(this.responseRenderTimer);
      this.responseRenderTimer = null;
    }
    [...this.runningProcesses.keys()].forEach((sessionId) => this.cancelRun(sessionId));
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
      const isRunning = this.isSessionRunning(session.id);
      const tab = this.tabContainer!.createEl("button", {
        cls: `codex-agent-tab ${session.id === this.activeSessionId ? "is-active" : ""} ${hasPendingApproval ? "has-pending-approval" : ""} ${isRunning ? "is-running" : ""}`
      });
      const tabIcon = tab.createSpan({ cls: "codex-agent-tab-icon" });
      setIcon(tabIcon, isRunning ? "loader-circle" : AGENT_ICON_ID);
      if (hasPendingApproval) {
        tabIcon.createSpan({ cls: "codex-agent-tab-alert-dot" });
      }
      tab.createSpan({ cls: "codex-agent-tab-title", text: session.title });
      const close = tab.createSpan({ cls: "codex-agent-tab-close", text: "×" });

      tab.addEventListener("click", () => {
        this.saveComposerDraftToActiveSession();
        this.activeSessionId = session.id;
        this.restoreComposerDraftFromActiveSession();
        this.persistSessions();
        this.renderSessionTabs();
        this.renderTimelineItems();
        this.renderTokenUsage();
        this.updateRunButtonDisabledState();
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
      const groups = this.groupHistorySessionsByDate(sessions);
      if (groups.length === 0) {
        list.createDiv({ cls: "codex-agent-history-empty", text: query ? "No matching sessions" : "No sessions" });
        return;
      }
      groups.forEach((group) => this.renderHistoryGroup(list, group.label, group.sessions, renderList));
    };
    search.addEventListener("input", renderList);
    renderList();
    search.focus();
  }

  private renderHistoryGroup(parent: HTMLElement, label: string, sessions: AgentSession[], onDelete: () => void) {
    parent.createDiv({ cls: "codex-agent-history-group", text: label });

    sessions.forEach((session) => {
      const item = parent.createDiv("codex-agent-history-item");
      item.createSpan({ cls: "codex-agent-history-icon", text: session.timeline.length > 0 ? "✓" : "✎" });
      const main = item.createDiv("codex-agent-history-main");
      if (this.renamingHistorySessionId === session.id) {
        const input = main.createEl("input", {
          cls: "codex-agent-history-rename-input",
          attr: { type: "text", value: session.title, "aria-label": "Session name" }
        });
        const commit = () => {
          const nextTitle = input.value.trim();
          this.renamingHistorySessionId = null;
          if (nextTitle && nextTitle !== session.title) {
            this.renameHistorySession(session.id, nextTitle);
          }
          onDelete();
        };
        input.addEventListener("click", (event) => event.stopPropagation());
        input.addEventListener("keydown", (event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          } else if (event.key === "Escape") {
            event.preventDefault();
            this.renamingHistorySessionId = null;
            onDelete();
          }
        });
        input.addEventListener("blur", commit);
        window.setTimeout(() => {
          input.focus();
          input.select();
        }, 0);
      } else {
        main.createSpan({ cls: "codex-agent-history-title", text: session.title });
      }
      main.createSpan({ cls: "codex-agent-history-time", text: this.formatHistorySessionTime(this.getSessionHistoryTime(session)) });
      const actions = item.createDiv("codex-agent-history-actions");
      const renameButton = actions.createEl("button", {
        cls: "codex-agent-history-action",
        attr: { type: "button", "aria-label": `Rename ${session.title}`, title: "Rename" }
      });
      setIcon(renameButton, "pencil");
      const deleteButton = actions.createEl("button", {
        cls: "codex-agent-history-delete",
        text: "×",
        attr: { type: "button", "aria-label": `Delete ${session.title}`, title: "Delete" }
      });
      item.addEventListener("click", () => {
        this.restoreSession(session.id);
        this.renderSessionTabs();
        this.renderTimelineItems();
        this.closeHistoryPanel();
      });
      renameButton.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.renamingHistorySessionId = session.id;
        onDelete();
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

  private groupHistorySessionsByDate(sessions: AgentSession[]) {
    const groups = new Map<string, { label: string; time: number; sessions: AgentSession[] }>();
    sessions.forEach((session) => {
      const time = this.getSessionHistoryTime(session);
      const key = this.getHistoryDateKey(time);
      const existing = groups.get(key);
      if (existing) {
        existing.sessions.push(session);
        return;
      }
      groups.set(key, {
        label: this.formatHistoryGroupLabel(time),
        time: this.startOfLocalDay(time),
        sessions: [session]
      });
    });
    return [...groups.values()].sort((a, b) => b.time - a.time);
  }

  private getHistoryDateKey(time: number) {
    const date = new Date(time);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  private formatHistoryGroupLabel(time: number) {
    const start = this.startOfLocalDay(time);
    const today = this.startOfLocalDay(Date.now());
    const day = 24 * 60 * 60 * 1000;
    const dateText = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: new Date(time).getFullYear() === new Date().getFullYear() ? undefined : "numeric"
    }).format(new Date(time));
    if (start === today) {
      return `Today · ${dateText}`;
    }
    if (start === today - day) {
      return `Yesterday · ${dateText}`;
    }
    return dateText;
  }

  private formatHistorySessionTime(time: number) {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(time));
  }

  private startOfLocalDay(time: number) {
    const date = new Date(time);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  }

  private getSessionHistoryTime(session: AgentSession) {
    return session.closedAt ?? session.updatedAt ?? session.createdAt;
  }

  private restoreSession(sessionId: string) {
    this.saveComposerDraftToActiveSession();
    const archived = this.archivedSessions.find((session) => session.id === sessionId);
    if (archived) {
      archived.closedAt = undefined;
      archived.updatedAt = Date.now();
      this.archivedSessions = this.archivedSessions.filter((session) => session.id !== sessionId);
      this.sessions = [...this.sessions, archived];
    }
    this.activeSessionId = sessionId;
    this.restoreComposerDraftFromActiveSession();
    this.persistSessions();
    this.updateRunButtonDisabledState();
    this.renderTokenUsage();
  }

  private renameHistorySession(sessionId: string, nextTitle: string) {
    const session = this.getSessionById(sessionId);
    if (!session) {
      return;
    }
    if (!nextTitle || nextTitle === session.title) {
      return;
    }
    session.title = nextTitle;
    this.persistSessions();
    this.renderSessionTabs();
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
    const files = byFile.length > 0
      ? byFile
      : (item.diffFiles ?? []).map((path) => ({ path, oldPath: path, headerLines: [], added: 0, removed: 0, lines: [], hunks: [] }));
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
      this.renderDiffFileIdentity(row, file.path);
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

  private renderDiffFileIdentity(parent: HTMLElement, filePath: string) {
    const displayPath = this.cleanDiffPath(filePath);
    const directory = this.getDisplayDirname(displayPath);
    const identity = parent.createSpan("codex-agent-diff-file-identity");
    const icon = identity.createSpan("codex-agent-diff-file-icon");
    setIcon(icon, this.getPickerFileIcon(displayPath));
    const text = identity.createSpan("codex-agent-diff-file-text");
    text.createSpan({ cls: "codex-agent-diff-file-name", text: this.getDisplayBasename(displayPath) });
    if (directory) {
      text.createSpan({ cls: "codex-agent-diff-file-path", text: directory });
    }
    identity.setAttr("title", displayPath);
  }

  private getDisplayBasename(filePath: string) {
    return filePath.split(/[\\/]/).filter(Boolean).pop() ?? filePath;
  }

  private getDisplayDirname(filePath: string) {
    const normalized = filePath.replace(/\\/g, "/").replace(/\/+$/, "");
    const index = normalized.lastIndexOf("/");
    return index > 0 ? normalized.slice(0, index) : "";
  }

  private cleanDiffPath(filePath: string) {
    return this.stripDiffPathPrefix(this.decodeGitPath(filePath)).replace(/\\/g, "/");
  }

  private stripDiffPathPrefix(filePath: string) {
    return filePath
      .replace(/^"+|"+$/g, "")
      .replace(/^a\//, "")
      .replace(/^b\//, "");
  }

  private decodeGitPath(filePath: string) {
    const trimmed = filePath.trim();
    const quoted = trimmed.startsWith("\"") && trimmed.endsWith("\"")
      ? trimmed.slice(1, -1)
      : trimmed;
    if (!quoted.includes("\\")) {
      return quoted;
    }
    try {
      const bytes: number[] = [];
      const encoder = new TextEncoder();
      for (let index = 0; index < quoted.length; index += 1) {
        const char = quoted[index];
        const octal = quoted.slice(index + 1, index + 4);
        if (char === "\\" && /^[0-7]{3}$/.test(octal)) {
          bytes.push(parseInt(octal, 8));
          index += 3;
          continue;
        }
        if (char === "\\" && index + 1 < quoted.length) {
          const next = quoted[index + 1];
          const mapped = next === "n" ? "\n" : next === "t" ? "\t" : next;
          bytes.push(...encoder.encode(mapped));
          index += 1;
          continue;
        }
        bytes.push(...encoder.encode(char));
      }
      return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
    } catch {
      return quoted;
    }
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
    this.liveDiffEl.setAttr("role", "button");
    this.liveDiffEl.setAttr("tabindex", "0");
    this.liveDiffEl.setAttr("title", "Review Codex file changes");
    this.liveDiffEl.addEventListener("click", () => this.openLiveDiffReviewPanel());
    this.liveDiffEl.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      this.openLiveDiffReviewPanel();
    });
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
      text: this.tr(
        "问 Codex 任何问题。用 @ 添加文件或文件夹，/ 选择技能...",
        "Ask Codex anything. Use @ to attach files or folders, / to choose a skill..."
      )
    });
    this.promptInput.addEventListener("input", () => {
      this.normalizePromptLeadingChipLayout();
      this.updatePromptEmptyState();
      this.saveComposerDraftToActiveSession();
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
    this.gitChangesEl = composer.createDiv("codex-agent-git-changes");
    this.gitChangesEl.setAttr("role", "button");
    this.gitChangesEl.setAttr("tabindex", "0");
    this.gitChangesEl.setAttr("title", "Review uncommitted changes");
    this.gitChangesEl.addEventListener("click", () => {
      void this.openGitDiffPanel();
    });
    this.gitChangesEl.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      void this.openGitDiffPanel();
    });
    this.renderGitChanges();
    this.startGitChangesTimer();
    this.restoreComposerDraftFromActiveSession();
  }

  private setRunButtonRunning(isRunning: boolean) {
    if (!this.runButton) {
      return;
    }
    this.runButton.empty();
    this.runButton.toggleClass("is-running", isRunning);
    this.runButton.disabled = isRunning ? false : !this.hasPromptContent();
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
      this.tokenUsageEl.createSpan({ cls: "codex-agent-token-label", text: this.tr("上下文：等待 Codex", "Context: waiting for Codex") });
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

  private async renderGitChanges() {
    if (!this.gitChangesEl) {
      return;
    }
    const targetEl = this.gitChangesEl;
    const settings = this.owner.getSettings();
    const reviewOnly = settings.enableDiffReview && !settings.enableGitManagement;
    if (!settings.enableGitManagement && !settings.enableDiffReview) {
      targetEl.empty();
      targetEl.removeClass("is-visible");
      return;
    }
    const vaultPath = this.getVaultBasePath();
    if (!vaultPath) {
      targetEl.empty();
      targetEl.removeClass("is-visible");
      return;
    }
    const stats = await this.getGitChangeStats(vaultPath);
    if (!this.gitChangesEl || this.gitChangesEl !== targetEl) {
      return;
    }
    if (!stats) {
      targetEl.empty();
      targetEl.removeClass("is-visible");
      return;
    }
    targetEl.empty();
    const isClean = stats.files === 0 && stats.untracked === 0;
    targetEl.addClass("is-visible");
    targetEl.setAttr(
      "title",
      reviewOnly
        ? this.tr("打开改动审查。当前未启用 Git 管理，因此只显示接受/拒绝。", "Open change review. Git management is disabled, so only accept/reject is shown.")
        : this.tr("打开 Git 工作区面板。Git 暂存/提交/历史与审查接受/拒绝是独立功能。", "Open Git workspace. Git staging/commit/history is separate from review accept/reject.")
    );
    setIcon(targetEl.createSpan("codex-agent-git-changes-icon"), reviewOnly ? "file-check-2" : isClean ? "git-branch" : "git-compare");
    const fileLabel = stats.files === 1
      ? this.tr("1 个改动文件", "1 changed file")
      : this.tr(`${stats.files} 个改动文件`, `${stats.files} changed files`);
    const untrackedLabel = stats.untracked > 0
      ? this.tr(` · ${stats.untracked} 个未跟踪`, ` · ${stats.untracked} untracked`)
      : "";
    targetEl.createSpan({
      cls: "codex-agent-git-changes-label",
      text: reviewOnly
        ? stats.files > 0 ? `${this.tr("审查改动", "Review changes")} · ${fileLabel}` : this.tr("审查改动 · 当前无待审查", "Review changes · Nothing to review")
        : isClean ? this.tr("Git 工作区干净 · 查看版本记录", "Git workspace clean · View history") : `${this.tr("Git 工作区", "Git workspace")} · ${fileLabel}${untrackedLabel}`
    });
    if (!isClean && !reviewOnly) {
      this.renderDiffCounts(targetEl, stats.added, stats.removed, false);
    } else if (reviewOnly && stats.files > 0) {
      this.renderDiffCounts(targetEl, stats.added, stats.removed, false);
    }
  }

  private async openGitDiffPanel() {
    const settings = this.owner.getSettings();
    if (!settings.enableGitManagement && !settings.enableDiffReview) {
      new Notice("Change review and Git management are disabled in Codex Agent settings.");
      return;
    }
    const vaultPath = this.getVaultBasePath();
    if (!vaultPath) {
      new Notice("Cannot locate vault path.");
      return;
    }
    const diffResult = await this.runGit(["-c", "core.quotepath=false", "diff", "--", "."], vaultPath);
    if (!diffResult.ok) {
      new Notice("Unable to read git diff.");
      return;
    }
    const stats = this.parseDiffStats(diffResult.stdout);
    this.activeGitReviewSection = settings.enableDiffReview && stats.files.length > 0 ? "review" : stats.files.length > 0 ? "stage" : "history";
    this.gitDiffReviewFilter = "active";
    this.renderGitDiffPanel(stats.files, stats.added, stats.removed, settings.enableGitManagement);
  }

  private openLiveDiffReviewPanel() {
    if (!this.owner.getSettings().enableDiffReview) {
      new Notice("Change review is disabled in Codex Agent settings.");
      return;
    }
    const stats = this.getActiveReviewDiffStats();
    if (!stats || stats.files.length === 0) {
      new Notice("No Codex file changes to review.");
      return;
    }
    this.activeGitReviewSection = "review";
    this.gitDiffReviewFilter = "active";
    this.renderGitDiffPanel(stats.files, stats.added, stats.removed, false);
  }

  private finalizePreviousDiffReviewForNextTurn() {
    const activeRun = this.getActiveRunState();
    const files = activeRun?.currentDiffStats?.files?.length ? activeRun.currentDiffStats.files as DiffFileView[] : this.gitDiffReviewFiles;
    files.forEach((file) => {
      if (this.gitDiffRejectedFiles.has(file.path)) {
        return;
      }
      this.gitDiffAcceptedFiles.add(file.path);
      file.hunks.forEach((hunk) => this.gitDiffAcceptedHunks.add(this.getDiffHunkKey(file.path, hunk.id)));
      file.hunks.forEach((hunk) => hunk.lines.forEach((line) => this.gitDiffAcceptedLines.add(this.getDiffLineKey(file.path, hunk.id, line))));
    });
    this.persistGitDiffReviewState();
    if (activeRun) {
      activeRun.currentDiffStats = null;
    }
    this.gitDiffReviewFiles = [];
    this.gitDiffExpandedFiles = new Set();
    this.gitDiffReviewFilter = "active";
    this.closeGitDiffPanel();
    this.renderLiveDiff();
  }

  private renderGitDiffPanel(files: DiffFileView[], added: number, removed: number, enableGitSections = this.owner.getSettings().enableGitManagement) {
    this.closeGitDiffPanel();
    this.pruneGitDiffReviewState(files);
    this.gitDiffReviewFiles = files;
    const enableReview = this.owner.getSettings().enableDiffReview;
    if (!enableGitSections) {
      this.activeGitReviewSection = "review";
    } else if (!enableReview && this.activeGitReviewSection === "review") {
      this.activeGitReviewSection = files.length > 0 ? "stage" : "history";
    }
    this.gitDiffExpandedFiles = new Set(files.length === 1 ? [files[0].path] : []);
    const backdrop = this.containerEl.createDiv("codex-agent-git-diff-backdrop");
    this.gitDiffBackdropEl = backdrop;
    backdrop.addEventListener("click", () => this.closeGitDiffPanel());
    const panel = this.containerEl.createDiv("codex-agent-git-diff-panel");
    this.gitDiffPanelEl = panel;

    const header = panel.createDiv("codex-agent-git-diff-header");
    const title = header.createDiv("codex-agent-git-diff-title");
    title.createSpan({
      text: enableGitSections
        ? enableReview ? this.tr("改动审查 / Git 工作区", "Change review / Git workspace") : this.tr("Git 工作区", "Git workspace")
        : this.tr("改动审查", "Change review")
    });
    this.renderDiffCounts(title, added, removed, false);
    header.createDiv({
      cls: "codex-agent-git-diff-subtitle",
      text: enableGitSections
        ? enableReview
          ? this.tr("审查用于接受或拒绝文件改动；Git 工作区用于暂存、提交和查看历史，二者不会自动同步。", "Review is for accepting or rejecting file changes. Git workspace is for staging, committing, and history. They do not sync automatically.")
          : this.tr("当前关闭改动审查；这里只查看 Git 工作区，并处理暂存、提交和版本记录。", "Change review is disabled. This panel only shows Git workspace, staging, commits, and history.")
        : this.tr("当前未启用 Git 管理；这里只处理接受/拒绝，不会暂存、提交或写入 Git 历史。", "Git management is disabled. This panel only handles accept/reject and will not stage, commit, or write Git history.")
    });
    const close = header.createEl("button", {
      cls: "codex-agent-git-diff-close",
      text: "×",
      attr: { type: "button", "aria-label": "Close diff review" }
    });
    close.addEventListener("click", () => this.closeGitDiffPanel());

    const stepsHost = panel.createDiv("codex-agent-git-review-steps-host");
    const sectionHost = panel.createDiv("codex-agent-git-section-host");
    const list = panel.createDiv("codex-agent-git-diff-list");
    const footerHost = panel.createDiv("codex-agent-git-review-footer-host");
    let refreshReview = () => {};
    const renderReviewSteps = () => {
      stepsHost.empty();
      if (!enableGitSections) {
        const banner = stepsHost.createDiv("codex-agent-review-only-banner");
        setIcon(banner.createSpan("codex-agent-review-only-icon"), "file-check-2");
        const text = banner.createSpan("codex-agent-review-only-text");
      text.createSpan({ cls: "codex-agent-review-only-title", text: this.tr("只审查改动", "Review only") });
      text.createSpan({ cls: "codex-agent-review-only-detail", text: this.tr("当前未启用 Git 管理；这里只处理接受/拒绝，不显示暂存、提交和版本记录。", "Git management is disabled. This only handles accept/reject and hides staging, commits, and history.") });
        return;
      }
      this.renderGitReviewSteps(stepsHost, files, this.activeGitReviewSection, enableReview, (section) => {
        this.activeGitReviewSection = section;
        renderPanelBody();
      });
    };
    const renderFiles = () => {
      list.empty();
    if (files.length === 0) {
      const empty = list.createDiv("codex-agent-git-diff-empty-state");
      setIcon(empty.createSpan("codex-agent-git-diff-empty-icon"), enableGitSections ? "git-branch" : "file-check-2");
      const text = empty.createDiv("codex-agent-git-diff-empty-text");
      text.createDiv({ cls: "codex-agent-git-diff-empty-title", text: enableGitSections ? this.tr("工作区干净", "Workspace clean") : this.tr("当前无待审查改动", "Nothing to review") });
      text.createDiv({
        cls: "codex-agent-git-diff-empty-detail",
        text: enableGitSections
          ? this.tr("没有未提交的文件改动。入口会继续保留，用于查看版本记录或发起下一次提交检查。", "There are no uncommitted file changes. The entry stays available for history or future commit checks.")
          : this.tr("审查功能已开启，但当前没有可接受或拒绝的文件改动。", "Change review is enabled, but there are no file changes to accept or reject.")
      });
      return;
    }
      const visibleFiles = this.getFilteredDiffFiles(files);
      if (visibleFiles.length === 0) {
        const empty = list.createDiv("codex-agent-git-diff-empty-state");
        setIcon(empty.createSpan("codex-agent-git-diff-empty-icon"), "filter");
        const text = empty.createDiv("codex-agent-git-diff-empty-text");
        text.createDiv({ cls: "codex-agent-git-diff-empty-title", text: this.tr("当前过滤下没有文件", "No files match this filter") });
        text.createDiv({ cls: "codex-agent-git-diff-empty-detail", text: this.tr("已处理文件会默认隐藏。切换到“全部”或“已接受”可以回看。", "Processed files are hidden by default. Switch to All or Accepted to review them.") });
        return;
      }
      visibleFiles.forEach((file) => {
        const expanded = this.gitDiffExpandedFiles.has(file.path);
        const accepted = this.gitDiffAcceptedFiles.has(file.path);
        const status = this.getDiffFileReviewStatus(file);
        const fileBlock = list.createDiv(`codex-agent-diff-file-block is-${status.key}`);
        const row = fileBlock.createDiv(`codex-agent-diff-file-row ${expanded ? "is-expanded" : ""}`);
        row.setAttr("role", "button");
        row.setAttr("tabindex", "0");
        row.addEventListener("click", () => {
          if (this.gitDiffExpandedFiles.has(file.path)) {
            this.gitDiffExpandedFiles.delete(file.path);
          } else {
            this.gitDiffExpandedFiles.add(file.path);
          }
          renderFiles();
        });
        row.addEventListener("keydown", (event) => {
          if (event.key !== "Enter" && event.key !== " ") {
            return;
          }
          event.preventDefault();
          row.click();
        });
        this.renderDiffFileIdentity(row, file.path);
        const meta = row.createSpan("codex-agent-diff-file-meta");
        const counts = meta.createSpan("codex-agent-diff-file-counts");
        this.renderDiffCounts(counts, file.added, file.removed, false);
        meta.createSpan({ cls: `codex-agent-diff-status is-${status.key}`, text: status.label });
        meta.createSpan({ cls: "codex-agent-diff-caret", text: expanded ? "⌃" : "⌄" });
        if (expanded) {
          const detail = fileBlock.createDiv("codex-agent-diff-file-detail");
          detail.createDiv({ cls: "codex-agent-diff-file-reason", text: this.describeDiffFileReason(file) });
          const actions = detail.createDiv("codex-agent-diff-file-actions");
          const open = actions.createEl("button", { cls: "codex-agent-diff-action", text: this.tr("打开文件", "Open file"), attr: { type: "button" } });
          open.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            void this.openDiffFileForReview(file);
          });
          const accept = actions.createEl("button", { cls: "codex-agent-diff-action", text: accepted ? this.tr("已接受", "Accepted") : this.tr("接受文件", "Accept file"), attr: { type: "button" } });
          accept.disabled = accepted;
          accept.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
          this.gitDiffAcceptedFiles.add(file.path);
          this.gitDiffRejectedFiles.delete(file.path);
          file.hunks.forEach((hunk) => this.gitDiffAcceptedHunks.add(this.getDiffHunkKey(file.path, hunk.id)));
          file.hunks.forEach((hunk) => hunk.lines.forEach((line) => this.gitDiffAcceptedLines.add(this.getDiffLineKey(file.path, hunk.id, line))));
          this.persistGitDiffReviewState();
          renderPanelBody();
          });
          const reject = actions.createEl("button", { cls: "codex-agent-diff-action is-danger", text: this.tr("拒绝文件", "Reject file"), attr: { type: "button" } });
          reject.disabled = status.key !== "pending";
          reject.setAttr("title", status.key === "pending" ? this.tr("拒绝整个文件改动", "Reject all changes in this file") : this.tr("已有接受记录，不能再整体拒绝", "This file already has accepted review items, so it cannot be rejected as a whole"));
          reject.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (reject.disabled) {
              return;
            }
            void this.rejectDiffFile(file);
          });
          this.renderDiffFileHunks(detail, file, () => {
            renderPanelBody();
          });
        }
      });
    };
    const renderSectionAction = (
      parent: HTMLElement,
      icon: string,
      titleText: string,
      detailText: string,
      prompt: string,
      notice: string
    ) => {
      const action = parent.createEl("button", {
        cls: "codex-agent-git-diff-quick-button",
        attr: { type: "button" }
      });
      setIcon(action.createSpan("codex-agent-git-diff-quick-icon"), icon);
      const actionText = action.createSpan("codex-agent-git-diff-quick-text");
      actionText.createSpan({ cls: "codex-agent-git-diff-quick-title", text: titleText });
      actionText.createSpan({ cls: "codex-agent-git-diff-quick-detail", text: detailText });
      action.addEventListener("click", () => {
        this.insertPromptText(prompt);
        new Notice(notice);
      });
    };
    const renderPanelBody = () => {
      renderReviewSteps();
      sectionHost.empty();
      list.empty();
      footerHost.empty();
      const section = sectionHost.createDiv(`codex-agent-git-section is-${this.activeGitReviewSection}`);
      if (this.activeGitReviewSection === "review") {
        if (!enableReview) {
          this.activeGitReviewSection = files.length > 0 ? "stage" : "history";
          renderPanelBody();
          return;
        }
        const quickActions = section.createDiv("codex-agent-git-diff-quick-actions is-single");
        renderSectionAction(
          quickActions,
          "file-text",
          this.tr("总结当前变更", "Summarize changes"),
          this.tr("只读分析，不暂存、不提交", "Read-only; no staging or commit"),
          this.tr(
            "请总结当前未提交变更，按文件分组说明修改目的、关键影响和需要我重点审查的风险；不要修改文件。",
            "Summarize the current uncommitted changes by file. Explain the purpose, key impact, and risks I should review closely. Do not modify files."
          ),
          this.tr("已填入总结当前变更的请求。", "Inserted the change-summary request.")
        );
        this.renderDiffReviewFilters(section, files, renderPanelBody);
        if (files.length > 0) {
          const bulkActions = section.createDiv("codex-agent-git-diff-bulk-actions");
          bulkActions.createEl("button", { cls: "codex-agent-diff-action", text: this.tr("全部接受", "Accept all"), attr: { type: "button" } })
            .addEventListener("click", () => this.confirmAcceptAllDiffFiles(files, refreshReview));
          bulkActions.createEl("button", { cls: "codex-agent-diff-action is-danger", text: this.tr("全部拒绝", "Reject all"), attr: { type: "button" } })
            .addEventListener("click", () => this.confirmRejectAllDiffFiles(files));
        }
        this.renderGitBoundaryNote(section, enableGitSections);
        renderFiles();
        this.renderGitFooter(footerHost, this.activeGitReviewSection, enableGitSections);
        return;
      }
      if (this.activeGitReviewSection === "stage") {
        this.renderGitOperationSection(
          section,
          "git-pull-request",
          this.tr("暂存变更", "Stage changes"),
          this.tr("暂存是 Git 的提交候选区，和上方审查标记相互独立。请先查看 Git 状态，再明确选择要暂存的文件。", "Staging is Git's commit candidate area and is independent from review markers. Check Git status first, then choose what to stage."),
          this.tr("选择暂存", "Choose staging"),
          this.tr(
            "请查看当前 Git 状态，列出工作区改动和暂存区内容；不要自动暂存，先让我选择要暂存的文件。",
            "Check the current Git status and list workspace changes plus staged content. Do not stage anything automatically; let me choose which files to stage first."
          ),
          this.tr("已新建 Agent 并发送 Git 暂存请求。", "Created a new Agent and sent the Git staging request."),
          true
        );
        this.renderGitFooter(footerHost, this.activeGitReviewSection, enableGitSections);
        return;
      }
      if (this.activeGitReviewSection === "commit") {
        this.renderGitOperationSection(
          section,
          "git-commit",
          this.tr("提交版本", "Commit version"),
          this.tr("提交会把暂存区保存成一次 Git 历史版本。提交前应先确认工作区、暂存区和提交说明，避免把未审查内容混进去。", "Commit saves the staging area as Git history. Confirm workspace, staging area, and commit message first."),
          this.tr("提交变更", "Commit changes"),
          this.tr(
            "请检查当前 Git 状态，确认工作区和暂存区没有明显问题后，暂存相关文件并创建一次语义清晰的 Git 提交。提交前先说明将包含哪些文件。",
            "Check the current Git status. After confirming the workspace and staging area look correct, stage the relevant files and create a clear semantic Git commit. Before committing, first explain which files will be included."
          ),
          this.tr("已新建 Agent 并发送 Git 提交请求。", "Created a new Agent and sent the Git commit request."),
          true
        );
        this.renderGitFooter(footerHost, this.activeGitReviewSection, enableGitSections);
        return;
      }
      this.renderGitOperationSection(
        section,
        "history",
        this.tr("版本记录", "Version history"),
        this.tr("版本记录只查看已经提交过的历史。这里适合对比、回看或讨论回退方案，不会改动当前文件。", "Version history only reads committed history. Use it for comparison, review, or rollback discussion."),
        this.tr("查看记录", "View history"),
        this.tr(
          "请查看最近 Git 提交记录，按时间列出版本说明，并提示是否存在适合回退或对比的版本；不要修改文件。",
          "Review the recent Git commit history. List version notes by time and mention whether any version is useful for rollback or comparison. Do not modify files."
        ),
        this.tr("已填入查看版本记录的请求。", "Inserted the history request.")
      );
      this.renderGitFooter(footerHost, this.activeGitReviewSection, enableGitSections);
    };
    refreshReview = () => {
      renderPanelBody();
    };
    renderPanelBody();
  }

  private pruneGitDiffReviewState(files: DiffFileView[]) {
    const filePaths = new Set(files.map((file) => file.path));
    const hunkKeys = new Set(files.flatMap((file) => file.hunks.map((hunk) => this.getDiffHunkKey(file.path, hunk.id))));
    const lineKeys = new Set(files.flatMap((file) => file.hunks.flatMap((hunk) => hunk.lines.map((line) => this.getDiffLineKey(file.path, hunk.id, line)))));
    this.gitDiffAcceptedFiles = new Set([...this.gitDiffAcceptedFiles].filter((filePath) => filePaths.has(filePath)));
    this.gitDiffRejectedFiles = new Set([...this.gitDiffRejectedFiles].filter((filePath) => filePaths.has(filePath)));
    this.gitDiffAcceptedHunks = new Set([...this.gitDiffAcceptedHunks].filter((hunkKey) => hunkKeys.has(hunkKey)));
    this.gitDiffAcceptedLines = new Set([...this.gitDiffAcceptedLines].filter((lineKey) => lineKeys.has(lineKey)));
    this.persistGitDiffReviewState();
  }

  private renderDiffReviewFilters(parent: HTMLElement, files: DiffFileView[], refresh: () => void) {
    if (files.length === 0) {
      return;
    }
    const statusCounts = files.reduce<Record<string, number>>((counts, file) => {
      const status = this.getDiffFileReviewStatus(file).key;
      counts[status] = (counts[status] ?? 0) + 1;
      return counts;
    }, {});
    const filters: Array<{ key: DiffReviewFilter; label: string; count: number }> = [
      { key: "active", label: this.tr("待审查", "To review"), count: (statusCounts.pending ?? 0) + (statusCounts.partial ?? 0) },
      { key: "accepted", label: this.tr("已接受", "Accepted"), count: statusCounts.accepted ?? 0 },
      { key: "rejected", label: this.tr("已拒绝", "Rejected"), count: statusCounts.rejected ?? 0 },
      { key: "all", label: this.tr("全部", "All"), count: files.length }
    ];
    const bar = parent.createDiv("codex-agent-diff-filter-bar");
    filters.forEach((filter) => {
      const button = bar.createEl("button", {
        cls: `codex-agent-diff-filter ${this.gitDiffReviewFilter === filter.key ? "is-active" : ""}`,
        attr: { type: "button" }
      });
      button.createSpan({ text: filter.label });
      button.createSpan({ cls: "codex-agent-diff-filter-count", text: String(filter.count) });
      button.addEventListener("click", () => {
        this.gitDiffReviewFilter = filter.key;
        refresh();
      });
    });
  }

  private getFilteredDiffFiles(files: DiffFileView[]) {
    return files.filter((file) => this.matchesDiffReviewFilter(file, this.gitDiffReviewFilter));
  }

  private matchesDiffReviewFilter(file: DiffFileView, filter: DiffReviewFilter) {
    const status = this.getDiffFileReviewStatus(file).key;
    if (filter === "all") {
      return true;
    }
    if (filter === "active") {
      return status === "pending" || status === "partial";
    }
    return status === filter;
  }

  private confirmAcceptAllDiffFiles(files: DiffFileView[], refresh: () => void) {
    new CodexConfirmModal(
      this.app,
      this.tr("接受所有文件？", "Accept all files?"),
      this.tr(`这会把当前 ${files.length} 个文件标记为已接受。文件内容不会额外改动，因为这些修改已经在工作区中。`, `This marks all ${files.length} files as accepted. File content will not be changed because these edits are already in the workspace.`),
      this.tr("确认接受", "Accept all"),
      false,
      () => {
        files.forEach((file) => {
          this.gitDiffAcceptedFiles.add(file.path);
          this.gitDiffRejectedFiles.delete(file.path);
          file.hunks.forEach((hunk) => this.gitDiffAcceptedHunks.add(this.getDiffHunkKey(file.path, hunk.id)));
          file.hunks.forEach((hunk) => hunk.lines.forEach((line) => this.gitDiffAcceptedLines.add(this.getDiffLineKey(file.path, hunk.id, line))));
        });
        this.persistGitDiffReviewState();
        refresh();
        new Notice(this.tr(`已接受 ${files.length} 个文件。`, `Accepted ${files.length} files.`));
      },
      this.tr("取消", "Cancel")
    ).open();
  }

  private confirmRejectAllDiffFiles(files: DiffFileView[]) {
    new CodexConfirmModal(
      this.app,
      this.tr("拒绝所有文件？", "Reject all files?"),
      this.tr(
        `这会实际撤回当前 ${files.length} 个文件的工作区修改。此操作会反向应用 patch，请确认这些改动都不要保留。`,
        `This will revert workspace changes in ${files.length} files by applying reverse patches. Confirm that none of these changes should be kept.`
      ),
      this.tr("确认拒绝", "Reject all"),
      true,
      () => void this.rejectAllDiffFiles(files),
      this.tr("取消", "Cancel")
    ).open();
  }

  private async rejectAllDiffFiles(files: DiffFileView[]) {
    const cwd = this.getVaultBasePath();
    if (!cwd) {
      new Notice("Cannot locate vault path.");
      return;
    }
    const patch = files.map((file) => this.buildDiffPatch(file, file.hunks)).join("");
    const result = await this.runGit(["apply", "--reverse", "--whitespace=nowarn", "-"], cwd, patch);
    if (!result.ok) {
      new Notice("Could not reject all changes. Some files may have changed since preview.");
      return;
    }
    files.forEach((file) => {
      this.gitDiffAcceptedFiles.delete(file.path);
      this.gitDiffRejectedFiles.add(file.path);
      file.hunks.forEach((hunk) => this.gitDiffAcceptedHunks.delete(this.getDiffHunkKey(file.path, hunk.id)));
      file.hunks.forEach((hunk) => hunk.lines.forEach((line) => this.gitDiffAcceptedLines.delete(this.getDiffLineKey(file.path, hunk.id, line))));
    });
    this.persistGitDiffReviewState();
    new Notice(`Rejected changes in ${files.length} files.`);
    await this.reloadGitDiffPanel(cwd);
  }

  private renderGitReviewSteps(
    parent: HTMLElement,
    files: DiffFileView[],
    activeSection: GitReviewSection,
    enableReview: boolean,
    onSelect: (section: GitReviewSection) => void
  ) {
    const hasFiles = files.length > 0;
    const steps = parent.createDiv("codex-agent-git-review-steps");
    const items: Array<{ section: GitReviewSection; label: string; detail: string }> = [];
    if (enableReview) {
      items.push({ section: "review", label: this.tr("审查改动", "Change review"), detail: hasFiles ? this.tr("接受或拒绝文件改动", "Accept or reject file changes") : this.tr("没有待审查文件", "No files to review") });
    }
    items.push(
      { section: "stage", label: this.tr("Git 暂存", "Git staging"), detail: hasFiles ? this.tr("管理提交候选区", "Manage commit candidates") : this.tr("查看暂存区", "View staging area") },
      { section: "commit", label: this.tr("Git 提交", "Git commit"), detail: hasFiles ? this.tr("创建一次提交", "Create a commit") : this.tr("检查提交状态", "Check commit status") },
      { section: "history", label: this.tr("版本记录", "Version history"), detail: this.tr("查看提交历史", "View commit history") }
    );
    items.forEach((step) => {
      const item = steps.createEl("button", {
        cls: `codex-agent-git-review-step ${activeSection === step.section ? "is-active" : ""}`,
        attr: { type: "button" }
      });
      item.addEventListener("click", () => onSelect(step.section));
      const text = item.createSpan("codex-agent-git-review-step-text");
      text.createSpan({ cls: "codex-agent-git-review-step-label", text: step.label });
      text.createSpan({ cls: "codex-agent-git-review-step-detail", text: step.detail });
    });
  }

  private renderGitOperationSection(
    parent: HTMLElement,
    icon: string,
    titleText: string,
    detailText: string,
    actionText: string,
    prompt: string,
    notice: string,
    autoRunInNewAgent = false
  ) {
    const card = parent.createDiv("codex-agent-git-operation-card");
    const iconEl = card.createSpan("codex-agent-git-operation-icon");
    setIcon(iconEl, icon);
    const body = card.createDiv("codex-agent-git-operation-body");
    body.createDiv({ cls: "codex-agent-git-operation-title", text: titleText });
    body.createDiv({ cls: "codex-agent-git-operation-detail", text: detailText });
    const action = card.createEl("button", { cls: "codex-agent-diff-action", text: actionText, attr: { type: "button" } });
    action.addEventListener("click", () => {
      if (autoRunInNewAgent) {
        this.startPromptInNewAgent(prompt, notice);
        return;
      }
      this.insertPromptText(prompt);
      new Notice(notice);
    });
  }

  private renderGitBoundaryNote(parent: HTMLElement, enableGitSections: boolean) {
    const note = parent.createDiv("codex-agent-git-boundary-note");
    note.createSpan({ cls: "codex-agent-git-boundary-kicker", text: this.tr("边界说明", "Boundary") });
    note.createSpan({
      cls: "codex-agent-git-boundary-text",
      text: enableGitSections
        ? this.tr("审查的接受/拒绝只影响是否保留工作区内容；Git 暂存/提交只管理版本记录，暂存时不会自动读取审查标记。", "Review accept/reject only decides whether workspace content is kept. Git staging/commit manages version history and does not automatically read review markers.")
        : this.tr("这里是审查模式：接受表示保留改动，拒绝会撤回改动；不涉及 Git 暂存、提交或历史版本。", "This is review mode. Accept keeps changes; reject reverts them. Git staging, commits, and history are not involved.")
    });
  }

  private renderGitFooter(parent: HTMLElement, activeSection: GitReviewSection, enableGitSections: boolean) {
    const footer = parent.createDiv("codex-agent-git-review-footer");
    const sectionLabels: Record<GitReviewSection, string> = {
      review: this.tr("审查改动", "Change review"),
      stage: this.tr("暂存变更", "Stage changes"),
      commit: this.tr("提交版本", "Commit version"),
      history: this.tr("版本记录", "Version history")
    };
    const summary = footer.createDiv("codex-agent-git-review-footer-summary");
    summary.createSpan({ text: enableGitSections ? `${this.tr("当前", "Current")} ${sectionLabels[activeSection]}` : this.tr("当前 只审查改动", "Current: review only") });
  }

  private getGitReviewAggregate(files: DiffFileView[]) {
    const accepted = files.filter((file) => this.getDiffFileReviewStatus(file).key === "accepted").length;
    const rejected = files.filter((file) => this.getDiffFileReviewStatus(file).key === "rejected").length;
    const partial = files.filter((file) => this.getDiffFileReviewStatus(file).key === "partial").length;
    const reviewed = accepted + rejected + partial;
    return {
      accepted,
      rejected,
      partial,
      reviewed,
      pending: Math.max(files.length - reviewed, 0)
    };
  }

  private getDiffFileReviewStatus(file: DiffFileView): { key: string; label: string } {
    if (this.gitDiffRejectedFiles.has(file.path)) {
      return { key: "rejected", label: this.tr("已拒绝", "Rejected") };
    }
    if (this.gitDiffAcceptedFiles.has(file.path)) {
      return { key: "accepted", label: this.tr("已接受", "Accepted") };
    }
    const acceptedHunks = file.hunks.filter((hunk) => this.gitDiffAcceptedHunks.has(this.getDiffHunkKey(file.path, hunk.id))).length;
    if (acceptedHunks > 0) {
      return { key: acceptedHunks >= file.hunks.length ? "accepted" : "partial", label: acceptedHunks >= file.hunks.length ? this.tr("已接受", "Accepted") : this.tr("部分接受", "Partially accepted") };
    }
    return { key: "pending", label: this.tr("未处理", "Pending") };
  }

  private renderDiffFileHunks(parent: HTMLElement, file: DiffFileView, onChange: () => void) {
    if (file.hunks.length === 0) {
      this.renderDiffFileLines(parent, file);
      return;
    }
    file.hunks.forEach((hunk, index) => {
      const accepted = this.gitDiffAcceptedFiles.has(file.path) || this.gitDiffAcceptedHunks.has(this.getDiffHunkKey(file.path, hunk.id));
      const block = parent.createDiv(`codex-agent-diff-hunk ${accepted ? "is-accepted" : ""}`);
      const head = block.createDiv("codex-agent-diff-hunk-head");
      head.createSpan({ cls: "codex-agent-diff-hunk-title", text: `Hunk ${index + 1}` });
      head.createSpan({ cls: "codex-agent-diff-hunk-header", text: hunk.header });
      const counts = head.createSpan("codex-agent-diff-file-counts");
      this.renderDiffCounts(counts, hunk.added, hunk.removed, false);
      const actions = head.createSpan("codex-agent-diff-hunk-actions");
      const accept = actions.createEl("button", { cls: "codex-agent-diff-action", text: accepted ? this.tr("已接受", "Accepted") : this.tr("接受 hunk", "Accept hunk"), attr: { type: "button" } });
      accept.disabled = accepted;
      accept.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.gitDiffAcceptedHunks.add(this.getDiffHunkKey(file.path, hunk.id));
        hunk.lines.forEach((line) => this.gitDiffAcceptedLines.add(this.getDiffLineKey(file.path, hunk.id, line)));
        this.gitDiffRejectedFiles.delete(file.path);
        if (file.hunks.every((entry) => this.gitDiffAcceptedHunks.has(this.getDiffHunkKey(file.path, entry.id)))) {
          this.gitDiffAcceptedFiles.add(file.path);
        }
        this.persistGitDiffReviewState();
        onChange();
      });
      const reject = actions.createEl("button", { cls: "codex-agent-diff-action is-danger", text: this.tr("拒绝 hunk", "Reject hunk"), attr: { type: "button" } });
      reject.disabled = accepted;
      reject.setAttr("title", accepted ? this.tr("已接受的 hunk 不能再拒绝", "Accepted hunks cannot be rejected") : this.tr("拒绝此 hunk", "Reject this hunk"));
      reject.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (reject.disabled) {
          return;
        }
        void this.rejectDiffHunk(file, hunk);
      });

      const table = block.createDiv("codex-agent-diff-lines");
      table.toggleClass("has-line-numbers", this.owner.getSettings().diffLineNumbers);
      hunk.lines.forEach((line) => this.renderDiffLine(table, line));
    });
  }

  private renderDiffLine(parent: HTMLElement, line: DiffLineView) {
    const row = parent.createDiv(`codex-agent-diff-line is-${line.type}`);
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
  }

  private getDiffHunkKey(filePath: string, hunkId: string) {
    return `${filePath}::${hunkId}`;
  }

  private getDiffLineKey(filePath: string, hunkId: string, line: DiffLineView) {
    const lineNo = line.type === "remove" ? line.oldLine : line.newLine;
    return `${filePath}::${hunkId}::${line.type}:${lineNo ?? "?"}:${line.text}`;
  }

  private describeDiffFileReason(file: DiffFileView) {
    const action = file.added > 0 && file.removed > 0
      ? "updates existing content"
      : file.added > 0
        ? "adds new content"
        : "removes existing content";
    const hunkText = file.hunks.length === 1 ? "1 local change block" : `${file.hunks.length} local change blocks`;
    return `Reason: ${file.path} ${action} across ${hunkText}. Review this file before keeping or reverting the change.`;
  }

  private async rejectDiffFile(file: DiffFileView) {
    const cwd = this.getVaultBasePath();
    if (!cwd) {
      new Notice("Cannot locate vault path.");
      return;
    }
    const patch = this.buildDiffPatch(file, file.hunks);
    const result = await this.runGit(["apply", "--reverse", "--whitespace=nowarn", "-"], cwd, patch);
    if (!result.ok) {
      new Notice("Could not reject file changes. The file may have changed since preview.");
      return;
    }
    this.gitDiffAcceptedFiles.delete(file.path);
    file.hunks.forEach((hunk) => this.gitDiffAcceptedHunks.delete(this.getDiffHunkKey(file.path, hunk.id)));
    file.hunks.forEach((hunk) => hunk.lines.forEach((line) => this.gitDiffAcceptedLines.delete(this.getDiffLineKey(file.path, hunk.id, line))));
    this.gitDiffRejectedFiles.add(file.path);
    this.persistGitDiffReviewState();
    new Notice(`Rejected changes in ${file.path}.`);
    await this.reloadGitDiffPanel(cwd);
  }

  private async rejectDiffHunk(file: DiffFileView, hunk: DiffHunkView) {
    const cwd = this.getVaultBasePath();
    if (!cwd) {
      new Notice("Cannot locate vault path.");
      return;
    }
    const patch = this.buildDiffPatch(file, [hunk]);
    const result = await this.runGit(["apply", "--reverse", "--whitespace=nowarn", "-"], cwd, patch);
    if (!result.ok) {
      new Notice("Could not reject hunk. The file may have changed since preview.");
      return;
    }
    this.gitDiffAcceptedHunks.delete(this.getDiffHunkKey(file.path, hunk.id));
    hunk.lines.forEach((line) => this.gitDiffAcceptedLines.delete(this.getDiffLineKey(file.path, hunk.id, line)));
    this.persistGitDiffReviewState();
    new Notice(`Rejected hunk in ${file.path}.`);
    await this.reloadGitDiffPanel(cwd);
    await this.refreshEditorReviewAfterFileChange(file.path, this.getNextDiffHunkId(file, hunk));
  }

  private async openDiffFileForReview(file: DiffFileView) {
    const target = this.getVaultItemByPath(file.path);
    if (!(target instanceof TFile)) {
      new Notice(`Cannot open ${file.path}.`);
      return;
    }
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.openFile(target, { active: true, state: { mode: "source", source: true } });
    await leaf.setViewState({
      type: "markdown",
      state: { file: target.path, mode: "source", source: true },
      active: true
    });
    this.app.workspace.revealLeaf(leaf);
    this.renderGitDiffEditorReviewBar(file);
    this.focusDiffHunkInEditor(file, file.hunks[0]);
  }

  private renderGitDiffEditorReviewBar(file: DiffFileView) {
    this.closeGitDiffEditorReviewBar();
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      return;
    }
    const bar = activeView.contentEl.createDiv("codex-agent-editor-review-bar");
    activeView.contentEl.prepend(bar);
    this.gitDiffEditorReviewBarEl = bar;
    const title = bar.createDiv("codex-agent-editor-review-title");
    title.createSpan({ cls: "codex-agent-editor-review-kicker", text: this.tr("正在审查", "Reviewing") });
    title.createSpan({ cls: "codex-agent-editor-review-file", text: this.cleanDiffPath(file.path) });
    const counts = title.createSpan("codex-agent-diff-file-counts");
    this.renderDiffCounts(counts, file.added, file.removed, false);
    const actions = bar.createDiv("codex-agent-editor-review-actions");
    const fileHasAcceptedReview = this.hasAcceptedDiffReviewInFile(file);
    const acceptAll = actions.createEl("button", { cls: "codex-agent-diff-action", text: fileHasAcceptedReview ? this.tr("已全部接受", "All accepted") : this.tr("全部接受", "Accept all"), attr: { type: "button" } });
    acceptAll.disabled = fileHasAcceptedReview;
    acceptAll.setAttr("title", fileHasAcceptedReview ? this.tr("已接受的改动不会再显示为待处理 diff", "Accepted changes no longer appear as pending diffs") : this.tr("接受全部改动", "Accept all changes"));
    acceptAll.addEventListener("click", () => {
      if (acceptAll.disabled) {
        return;
      }
      this.gitDiffAcceptedFiles.add(file.path);
      this.gitDiffRejectedFiles.delete(file.path);
      file.hunks.forEach((hunk) => this.gitDiffAcceptedHunks.add(this.getDiffHunkKey(file.path, hunk.id)));
      file.hunks.forEach((hunk) => hunk.lines.forEach((line) => this.gitDiffAcceptedLines.add(this.getDiffLineKey(file.path, hunk.id, line))));
      this.persistGitDiffReviewState();
      new Notice(`${this.tr("已接受文件改动", "Accepted changes in")}: ${file.path}`);
      void this.reloadActiveGitDiffPanel();
      this.renderGitDiffEditorReviewBar(file);
    });
    const rejectAll = actions.createEl("button", { cls: "codex-agent-diff-action is-danger", text: this.tr("全部拒绝", "Reject all"), attr: { type: "button" } });
    rejectAll.disabled = fileHasAcceptedReview;
    rejectAll.setAttr("title", fileHasAcceptedReview ? this.tr("已有接受记录，不能再全部拒绝", "This file already has accepted review items, so it cannot be rejected as a whole") : this.tr("拒绝全部改动", "Reject all changes"));
    rejectAll.addEventListener("click", () => {
      if (rejectAll.disabled) {
        return;
      }
      void this.rejectDiffFile(file);
    });
    actions.createEl("button", { cls: "codex-agent-diff-action", text: this.tr("上一处", "Previous"), attr: { type: "button" } })
      .addEventListener("click", () => this.focusAdjacentDiffHunk(file, -1));
    actions.createEl("button", { cls: "codex-agent-diff-action", text: this.tr("下一处", "Next"), attr: { type: "button" } })
      .addEventListener("click", () => this.focusAdjacentDiffHunk(file, 1));
    actions.createEl("button", { cls: "codex-agent-diff-action", text: this.tr("关闭审查窗口", "Close review tab"), attr: { type: "button" } })
      .addEventListener("click", () => this.closeReviewEditorLeaf(activeView));

    const overview = bar.createDiv("codex-agent-editor-review-overview");
    file.hunks.forEach((hunk, index) => {
      const status = this.getDiffHunkReviewStatus(file, hunk);
      const chip = overview.createEl("button", {
        cls: `codex-agent-editor-review-hunk-chip is-${status}`,
        attr: { type: "button", title: hunk.header }
      });
      chip.createSpan({ text: `H${index + 1}` });
      chip.createSpan({ cls: "codex-agent-editor-review-hunk-chip-count", text: `+${hunk.added} -${hunk.removed}` });
      chip.addEventListener("click", () => this.focusDiffHunkInEditor(file, hunk));
    });

    this.applyInlineDiffEditorDecorations(activeView, file);
  }

  handleInlineDiffAction(action: InlineDiffAction) {
    const file = this.inlineDiffReviewFile;
    if (!file || file.path !== action.filePath) {
      return;
    }
    const hunk = file.hunks.find((entry) => entry.id === action.hunkId);
    if (!hunk) {
      return;
    }
    if (action.action === "reject-hunk" && this.getDiffHunkReviewStatus(file, hunk) === "accepted") {
      new Notice("This hunk is already accepted.");
      return;
    }
    if (action.action === "accept-hunk") {
      this.gitDiffAcceptedHunks.add(this.getDiffHunkKey(file.path, hunk.id));
      hunk.lines.forEach((line) => this.gitDiffAcceptedLines.add(this.getDiffLineKey(file.path, hunk.id, line)));
      this.gitDiffRejectedFiles.delete(file.path);
      if (file.hunks.every((entry) => this.gitDiffAcceptedHunks.has(this.getDiffHunkKey(file.path, entry.id)))) {
        this.gitDiffAcceptedFiles.add(file.path);
      }
      this.persistGitDiffReviewState();
      new Notice(`Accepted hunk in ${file.path}.`);
      this.renderGitDiffEditorReviewBar(file);
      this.focusNextPendingDiffHunk(file, hunk);
      void this.reloadActiveGitDiffPanel();
      return;
    }
    if (action.action === "reject-hunk") {
      void this.rejectDiffHunk(file, hunk);
      return;
    }
    const line = action.lineKey ? hunk.lines.find((entry) => this.getDiffLineKey(file.path, hunk.id, entry) === action.lineKey) : null;
    if (!line) {
      return;
    }
    const lineAlreadyAccepted = this.gitDiffAcceptedFiles.has(file.path)
      || this.gitDiffAcceptedHunks.has(this.getDiffHunkKey(file.path, hunk.id))
      || this.gitDiffAcceptedLines.has(this.getDiffLineKey(file.path, hunk.id, line));
    if (action.action === "reject-line" && lineAlreadyAccepted) {
      new Notice("This line is already accepted.");
      return;
    }
    if (action.action === "accept-line") {
      this.gitDiffAcceptedLines.add(this.getDiffLineKey(file.path, hunk.id, line));
      this.gitDiffRejectedFiles.delete(file.path);
      if (hunk.lines.every((entry) => entry.type !== "add" && entry.type !== "remove" || this.gitDiffAcceptedLines.has(this.getDiffLineKey(file.path, hunk.id, entry)))) {
        this.gitDiffAcceptedHunks.add(this.getDiffHunkKey(file.path, hunk.id));
      }
      if (file.hunks.every((entry) => this.gitDiffAcceptedHunks.has(this.getDiffHunkKey(file.path, entry.id)))) {
        this.gitDiffAcceptedFiles.add(file.path);
      }
      this.persistGitDiffReviewState();
      new Notice(`Accepted line in ${file.path}.`);
      this.renderGitDiffEditorReviewBar(file);
      this.focusNextPendingDiffHunk(file, hunk);
      void this.reloadActiveGitDiffPanel();
      return;
    }
    void this.rejectDiffLineInEditor(file, hunk, line);
  }

  private applyInlineDiffEditorDecorations(markdownView: MarkdownView, file: DiffFileView) {
    const editorView = this.getCodeMirrorEditorView(markdownView);
    if (!editorView) {
      return;
    }
    activeInlineDiffReviewController = this;
    this.inlineDiffEditorView = editorView;
    this.inlineDiffReviewFile = file;
    editorView.dispatch({
      effects: setInlineDiffReviewEffect.of({
        file,
        acceptedFiles: [...this.gitDiffAcceptedFiles],
        acceptedHunks: [...this.gitDiffAcceptedHunks],
        acceptedLines: [...this.gitDiffAcceptedLines],
        language: this.owner.getSettings().language
      })
    });
  }

  private clearInlineDiffEditorDecorations() {
    if (this.inlineDiffEditorView) {
      this.inlineDiffEditorView.dispatch({ effects: setInlineDiffReviewEffect.of(null) });
    }
    this.inlineDiffEditorView = null;
    this.inlineDiffReviewFile = null;
    if (activeInlineDiffReviewController === this) {
      activeInlineDiffReviewController = null;
    }
  }

  private getCodeMirrorEditorView(markdownView: MarkdownView): EditorView | null {
    return (markdownView.editor as any).cm instanceof EditorView
      ? (markdownView.editor as any).cm
      : null;
  }

  private renderEditorReviewLines(parent: HTMLElement, file: DiffFileView, hunk: DiffHunkView) {
    const changes = hunk.lines.filter((line) => line.type === "add" || line.type === "remove");
    if (changes.length === 0) {
      return;
    }
    const list = parent.createDiv("codex-agent-editor-review-lines");
    changes.forEach((line) => {
      const accepted = this.gitDiffAcceptedFiles.has(file.path)
        || this.gitDiffAcceptedHunks.has(this.getDiffHunkKey(file.path, hunk.id))
        || this.gitDiffAcceptedLines.has(this.getDiffLineKey(file.path, hunk.id, line));
      const row = list.createDiv(`codex-agent-editor-review-line is-${line.type} ${accepted ? "is-accepted" : ""}`);
      row.createSpan({
        cls: "codex-agent-editor-review-line-marker",
        text: line.type === "add" ? "+" : "-"
      });
      row.createSpan({
        cls: "codex-agent-editor-review-line-number",
        text: String(line.type === "add" ? line.newLine ?? "" : line.oldLine ?? "")
      });
      row.createSpan({ cls: "codex-agent-editor-review-line-code", text: line.text || " " });
      const actions = row.createSpan("codex-agent-editor-review-line-actions");
      actions.createEl("button", { cls: "codex-agent-diff-action", text: this.tr("定位", "Locate"), attr: { type: "button" } })
        .addEventListener("click", () => this.focusDiffLineInEditor(file, hunk, line));
      const accept = actions.createEl("button", { cls: "codex-agent-diff-action", text: accepted ? this.tr("已接受", "Accepted") : this.tr("接受", "Accept"), attr: { type: "button" } });
      accept.disabled = accepted;
      accept.addEventListener("click", () => {
        this.gitDiffAcceptedLines.add(this.getDiffLineKey(file.path, hunk.id, line));
        this.gitDiffRejectedFiles.delete(file.path);
        if (hunk.lines.every((entry) => entry.type !== "add" && entry.type !== "remove" || this.gitDiffAcceptedLines.has(this.getDiffLineKey(file.path, hunk.id, entry)))) {
          this.gitDiffAcceptedHunks.add(this.getDiffHunkKey(file.path, hunk.id));
        }
        if (file.hunks.every((entry) => this.gitDiffAcceptedHunks.has(this.getDiffHunkKey(file.path, entry.id)))) {
          this.gitDiffAcceptedFiles.add(file.path);
        }
        this.persistGitDiffReviewState();
        new Notice(`Accepted line in ${file.path}.`);
        this.renderGitDiffEditorReviewBar(file);
        this.focusNextPendingDiffHunk(file, hunk);
      });
      actions.createEl("button", { cls: "codex-agent-diff-action is-danger", text: this.tr("拒绝", "Reject"), attr: { type: "button" } })
        .addEventListener("click", () => void this.rejectDiffLineInEditor(file, hunk, line));
    });
  }

  private getDiffHunkReviewStatus(file: DiffFileView, hunk: DiffHunkView) {
    if (this.gitDiffAcceptedFiles.has(file.path) || this.gitDiffAcceptedHunks.has(this.getDiffHunkKey(file.path, hunk.id))) {
      return "accepted";
    }
    const changedLines = hunk.lines.filter((line) => line.type === "add" || line.type === "remove");
    const acceptedLines = changedLines.filter((line) => this.gitDiffAcceptedLines.has(this.getDiffLineKey(file.path, hunk.id, line))).length;
    if (acceptedLines > 0) {
      return acceptedLines >= changedLines.length ? "accepted" : "partial";
    }
    return "pending";
  }

  private hasAcceptedDiffReviewInFile(file: DiffFileView) {
    return this.gitDiffAcceptedFiles.has(file.path)
      || file.hunks.some((hunk) => this.gitDiffAcceptedHunks.has(this.getDiffHunkKey(file.path, hunk.id)))
      || file.hunks.some((hunk) => hunk.lines.some((line) => this.gitDiffAcceptedLines.has(this.getDiffLineKey(file.path, hunk.id, line))));
  }

  private focusAdjacentDiffHunk(file: DiffFileView, direction: 1 | -1, currentHunk?: DiffHunkView) {
    if (file.hunks.length === 0) {
      return;
    }
    const currentIndex = currentHunk ? file.hunks.findIndex((hunk) => hunk.id === currentHunk.id) : this.findNearestDiffHunkIndex(file);
    const start = currentIndex >= 0 ? currentIndex : direction > 0 ? -1 : 0;
    for (let offset = 1; offset <= file.hunks.length; offset += 1) {
      const index = (start + direction * offset + file.hunks.length) % file.hunks.length;
      this.focusDiffHunkInEditor(file, file.hunks[index]);
      return;
    }
  }

  private focusNextPendingDiffHunk(file: DiffFileView, currentHunk: DiffHunkView) {
    const currentIndex = file.hunks.findIndex((hunk) => hunk.id === currentHunk.id);
    for (let offset = 1; offset <= file.hunks.length; offset += 1) {
      const index = (currentIndex + offset) % file.hunks.length;
      const hunk = file.hunks[index];
      if (this.getDiffHunkReviewStatus(file, hunk) !== "accepted") {
        this.focusDiffHunkInEditor(file, hunk);
        return;
      }
    }
  }

  private getNextDiffHunkId(file: DiffFileView, currentHunk: DiffHunkView) {
    const currentIndex = file.hunks.findIndex((hunk) => hunk.id === currentHunk.id);
    if (currentIndex < 0 || file.hunks.length <= 1) {
      return file.hunks[0]?.id;
    }
    return file.hunks[(currentIndex + 1) % file.hunks.length]?.id;
  }

  private findNearestDiffHunkIndex(file: DiffFileView) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      return 0;
    }
    const currentLine = activeView.editor.getCursor().line + 1;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    file.hunks.forEach((hunk, index) => {
      const line = this.getHunkFirstChangedLine(hunk);
      const distance = Math.abs(line - currentLine);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    return nearestIndex;
  }

  private getHunkFirstChangedLine(hunk: DiffHunkView) {
    const firstChange = hunk.lines.find((line) => line.type === "add" || line.type === "remove");
    if (!firstChange) {
      return this.getHunkNewStartLine(hunk);
    }
    return firstChange.type === "add"
      ? firstChange.newLine ?? this.getHunkNewStartLine(hunk)
      : this.findRemovedLineAnchor(hunk, firstChange);
  }

  private findRemovedLineAnchor(hunk: DiffHunkView, line: DiffLineView) {
    const index = hunk.lines.indexOf(line);
    for (let cursor = index + 1; cursor < hunk.lines.length; cursor += 1) {
      const next = hunk.lines[cursor];
      if ((next.type === "context" || next.type === "add") && typeof next.newLine === "number") {
        return next.newLine;
      }
    }
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      const previous = hunk.lines[cursor];
      if ((previous.type === "context" || previous.type === "add") && typeof previous.newLine === "number") {
        return previous.newLine;
      }
    }
    return this.getHunkNewStartLine(hunk);
  }

  private closeGitDiffEditorReviewBar() {
    this.gitDiffEditorReviewBarEl?.remove();
    this.gitDiffEditorReviewBarEl = null;
    this.clearInlineDiffEditorDecorations();
  }

  private closeReviewEditorLeaf(markdownView: MarkdownView) {
    this.closeGitDiffEditorReviewBar();
    markdownView.leaf.detach();
  }

  private focusDiffHunkInEditor(file: DiffFileView, hunk?: DiffHunkView) {
    if (!hunk) {
      return;
    }
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      return;
    }
    const anchorLine = this.getHunkFirstChangedLine(hunk);
    activeView.editor.setCursor({ line: Math.max(anchorLine - 1, 0), ch: 0 });
    activeView.editor.scrollIntoView({ from: { line: Math.max(anchorLine - 1, 0), ch: 0 }, to: { line: Math.max(anchorLine - 1, 0), ch: 0 } }, true);
    activeView.editor.focus();
  }

  private focusDiffLineInEditor(file: DiffFileView, hunk: DiffHunkView, line: DiffLineView) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView) {
      return;
    }
    const lineIndex = this.findEditorLineIndex(activeView.editor, line.newLine ?? this.getHunkNewStartLine(hunk), line.text);
    const targetLine = lineIndex >= 0 ? lineIndex : Math.max((line.newLine ?? this.getHunkNewStartLine(hunk)) - 1, 0);
    activeView.editor.setCursor({ line: targetLine, ch: 0 });
    activeView.editor.scrollIntoView({ from: { line: targetLine, ch: 0 }, to: { line: targetLine, ch: 0 } }, true);
    activeView.editor.focus();
  }

  private async rejectDiffLineInEditor(file: DiffFileView, hunk: DiffHunkView, line: DiffLineView) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || activeView.file?.path !== file.path) {
      new Notice(`Open ${file.path} before rejecting a line.`);
      return;
    }
    const editor = activeView.editor;
    if (line.type === "add") {
      const lineIndex = this.findEditorLineIndex(editor, line.newLine ?? this.getHunkNewStartLine(hunk), line.text);
      if (lineIndex < 0) {
        new Notice("Could not find the added line in the editor.");
        return;
      }
      const nextLine = Math.min(lineIndex + 1, editor.lineCount());
      if (lineIndex + 1 < editor.lineCount()) {
        editor.replaceRange("", { line: lineIndex, ch: 0 }, { line: nextLine, ch: 0 });
      } else {
        const previousLine = Math.max(lineIndex - 1, 0);
        const from = lineIndex === 0 ? { line: 0, ch: 0 } : { line: previousLine, ch: editor.getLine(previousLine).length };
        editor.replaceRange("", from, { line: lineIndex, ch: editor.getLine(lineIndex).length });
      }
    } else if (line.type === "remove") {
      const insertIndex = this.findRemovedLineInsertIndex(editor, hunk, line);
      editor.replaceRange(`${line.text}\n`, { line: insertIndex, ch: 0 });
    } else {
      return;
    }
    this.gitDiffAcceptedLines.delete(this.getDiffLineKey(file.path, hunk.id, line));
    this.gitDiffAcceptedHunks.delete(this.getDiffHunkKey(file.path, hunk.id));
    this.gitDiffAcceptedFiles.delete(file.path);
    this.persistGitDiffReviewState();
    if (activeView.file) {
      await this.app.vault.modify(activeView.file, editor.getValue());
    }
    new Notice(`Rejected line in ${file.path}.`);
    await this.reloadActiveGitDiffPanel();
    await this.refreshEditorReviewAfterFileChange(file.path, this.getNextDiffHunkId(file, hunk));
  }

  private async refreshEditorReviewAfterFileChange(filePath: string, preferredHunkId?: string) {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!activeView || activeView.file?.path !== filePath) {
      return;
    }
    const cwd = this.getVaultBasePath();
    if (!cwd) {
      this.closeGitDiffEditorReviewBar();
      return;
    }
    const diffResult = await this.runGit(["-c", "core.quotepath=false", "diff", "--", "."], cwd);
    if (!diffResult.ok) {
      this.closeGitDiffEditorReviewBar();
      return;
    }
    const nextFile = this.parseDiffStats(diffResult.stdout).files.find((entry) => entry.path === filePath);
    if (!nextFile) {
      this.closeGitDiffEditorReviewBar();
      return;
    }
    this.renderGitDiffEditorReviewBar(nextFile);
    const target = preferredHunkId
      ? nextFile.hunks.find((hunk) => hunk.id === preferredHunkId) ?? nextFile.hunks[0]
      : nextFile.hunks[0];
    this.focusDiffHunkInEditor(nextFile, target);
  }

  private findEditorLineIndex(editor: Editor, expectedOneBased: number, text: string) {
    const expected = Math.max(expectedOneBased - 1, 0);
    const max = editor.lineCount();
    const matches = (index: number) => editor.getLine(index) === text;
    for (let index = Math.max(expected - 6, 0); index < Math.min(expected + 7, max); index += 1) {
      if (matches(index)) {
        return index;
      }
    }
    for (let index = 0; index < max; index += 1) {
      if (matches(index)) {
        return index;
      }
    }
    return -1;
  }

  private findRemovedLineInsertIndex(editor: Editor, hunk: DiffHunkView, line: DiffLineView) {
    const hunkLineIndex = hunk.lines.indexOf(line);
    for (let index = hunkLineIndex + 1; index < hunk.lines.length; index += 1) {
      const next = hunk.lines[index];
      if ((next.type === "context" || next.type === "add") && typeof next.newLine === "number") {
        const nextIndex = this.findEditorLineIndex(editor, next.newLine, next.text);
        if (nextIndex >= 0) {
          return nextIndex;
        }
      }
    }
    for (let index = hunkLineIndex - 1; index >= 0; index -= 1) {
      const previous = hunk.lines[index];
      if ((previous.type === "context" || previous.type === "add") && typeof previous.newLine === "number") {
        const previousIndex = this.findEditorLineIndex(editor, previous.newLine, previous.text);
        if (previousIndex >= 0) {
          return Math.min(previousIndex + 1, editor.lineCount());
        }
      }
    }
    return Math.min(Math.max(this.getHunkNewStartLine(hunk) - 1, 0), editor.lineCount());
  }

  private getHunkNewStartLine(hunk: DiffHunkView) {
    const match = hunk.header.match(/\+(\d+)(?:,\d+)?/);
    return match ? Number(match[1]) : 1;
  }

  private async reloadActiveGitDiffPanel() {
    const cwd = this.getVaultBasePath();
    if (!cwd) {
      return;
    }
    await this.reloadGitDiffPanel(cwd);
  }

  private buildDiffPatch(file: DiffFileView, hunks: DiffHunkView[]) {
    return [
      ...file.headerLines,
      ...hunks.flatMap((hunk) => hunk.rawLines)
    ].join("\n") + "\n";
  }

  private async reloadGitDiffPanel(cwd: string) {
    await this.renderGitChanges();
    const diffResult = await this.runGit(["-c", "core.quotepath=false", "diff", "--", "."], cwd);
    if (!diffResult.ok) {
      this.closeGitDiffPanel();
      return;
    }
    const stats = this.parseDiffStats(diffResult.stdout);
    if (stats.files.length === 0) {
      this.activeGitReviewSection = "history";
    } else if (!this.owner.getSettings().enableDiffReview && this.activeGitReviewSection === "review") {
      this.activeGitReviewSection = "stage";
    }
    this.renderGitDiffPanel(stats.files, stats.added, stats.removed, true);
  }

  private closeGitDiffPanel() {
    this.gitDiffBackdropEl?.remove();
    this.gitDiffBackdropEl = null;
    this.gitDiffPanelEl?.remove();
    this.gitDiffPanelEl = null;
  }

  private startGitChangesTimer() {
    this.stopGitChangesTimer();
    this.gitChangesTimer = window.setInterval(() => {
      void this.renderGitChanges();
    }, 15000);
  }

  private stopGitChangesTimer() {
    if (this.gitChangesTimer !== null) {
      window.clearInterval(this.gitChangesTimer);
      this.gitChangesTimer = null;
    }
  }

  private getVaultBasePath() {
    try {
      return (this.app.vault.adapter as any).getBasePath?.() ?? "";
    } catch {
      return "";
    }
  }

  private async getGitChangeStats(cwd: string): Promise<{ files: number; added: number; removed: number; untracked: number } | null> {
    const inside = await this.runGit(["rev-parse", "--is-inside-work-tree"], cwd);
    if (!inside.ok || inside.stdout.trim() !== "true") {
      return null;
    }
    const diff = await this.runGit(["-c", "core.quotepath=false", "diff", "--numstat", "HEAD", "--"], cwd);
    if (!diff.ok) {
      return null;
    }
    let files = 0;
    let added = 0;
    let removed = 0;
    diff.stdout.split(/\r?\n/).forEach((line) => {
      if (!line.trim()) {
        return;
      }
      const [addRaw, removeRaw] = line.split(/\s+/);
      files += 1;
      const add = Number(addRaw);
      const remove = Number(removeRaw);
      if (Number.isFinite(add)) {
        added += add;
      }
      if (Number.isFinite(remove)) {
        removed += remove;
      }
    });
    const untrackedResult = await this.runGit(["ls-files", "--others", "--exclude-standard"], cwd);
    const untracked = untrackedResult.ok
      ? untrackedResult.stdout.split(/\r?\n/).filter((line) => line.trim()).length
      : 0;
    return { files, added, removed, untracked };
  }

  private runGit(args: string[], cwd: string, input?: string): Promise<{ ok: boolean; stdout: string }> {
    return new Promise((resolve) => {
      const child = spawn("git", args, { cwd, stdio: [input ? "pipe" : "ignore", "pipe", "ignore"] });
      let stdout = "";
      child.stdout.on("data", (chunk: any) => {
        stdout += chunk.toString();
      });
      if (input && child.stdin) {
        child.stdin.write(input);
        child.stdin.end();
      }
      child.on("error", () => resolve({ ok: false, stdout: "" }));
      child.on("close", (code: number | null) => resolve({ ok: code === 0, stdout }));
    });
  }

  private renderLiveDiff() {
    if (!this.liveDiffEl) {
      return;
    }
    this.liveDiffEl.empty();
    if (!this.owner.getSettings().enableDiffReview) {
      this.liveDiffEl.removeClass("is-visible");
      return;
    }
    const stats = this.getActiveReviewDiffStats();
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

  private getActiveReviewDiffStats() {
    const currentStats = this.getActiveRunState()?.currentDiffStats;
    const stats = currentStats?.files?.length ? currentStats : this.getLatestSessionDiffStats();
    if (!stats?.files?.length) {
      return null;
    }
    const hasReviewableFiles = stats.files.some((file: DiffFileView) => {
      const status = this.getDiffFileReviewStatus(file).key;
      return status === "pending" || status === "partial";
    });
    return hasReviewableFiles ? stats : null;
  }

  private getLatestSessionDiffStats() {
    const session = this.getActiveSession();
    for (let index = session.timeline.length - 1; index >= 0; index -= 1) {
      const item = session.timeline[index];
      if (!item.diffText) {
        continue;
      }
      const stats = this.parseDiffStats(item.diffText);
      if (stats.files.length > 0) {
        return { ...stats, diffText: item.diffText };
      }
    }
    return null;
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
    (["auto", "plan", "confirm-first", "mirror-not-echo", "deep-questions"] as TurnAuxMode[]).forEach((mode) => {
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
    if (mode === "mirror-not-echo") {
      return "Think With Me";
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
    if (mode === "mirror-not-echo") {
      return "Test reasoning, challenge weak assumptions, and name risks clearly.";
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
    new Notice(`${this.tr("已添加文件到Codex对话", "Added file to Codex conversation")}: ${file.name}`);
  }

  addFolderContext(folder: TFolder) {
    this.addContextChip({
      id: this.makeContextChipId("folder", folder.path),
      label: folder.name || folder.path,
      detail: folder.path,
      kind: "folder",
      path: folder.path
    });
    new Notice(`${this.tr("已添加文件夹到Codex对话", "Added folder to Codex conversation")}: ${folder.path}`);
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

  beginInlineEditConversation(mode: InlineEditConversationMode, payload: {
    request: string;
    filePath?: string;
    originalText: string;
    isTableMode: boolean;
  }): InlineEditConversationRun {
    this.saveComposerDraftToActiveSession();
    if (mode === "new") {
      const session = this.createSession(this.tr("Inline Edit", "Inline Edit"));
      this.sessions = [...this.sessions, session];
      this.activeSessionId = session.id;
      this.clearComposer();
    }
    const session = this.getActiveSession();
    if (!this.hasStartedConversation(session)) {
      session.title = this.makeSessionTitle(payload.request || "Inline Edit");
    }
    const contextChip: ContextChip = {
      id: this.makeContextChipId("selection", payload.filePath ?? "inline-edit"),
      kind: "selection",
      label: payload.isTableMode ? this.tr("Markdown 表格源码", "Markdown table source") : this.tr("选中内容", "Selected content"),
      detail: this.tr(
        `${payload.originalText.length} 个字符${payload.filePath ? `，来自 ${payload.filePath}` : ""}`,
        `${payload.originalText.length} characters${payload.filePath ? ` from ${payload.filePath}` : ""}`
      ),
      path: payload.filePath,
      text: payload.originalText
    };
    const statusIndex = session.timeline.length + 1;
    const responseIndex = session.timeline.length + 2;
    session.timeline = [
      ...session.timeline,
      {
        title: "You",
        body: payload.request,
        tone: "user",
        contextChips: [contextChip],
        messageParts: [
          { type: "text", text: payload.request },
          { type: "chip", chip: contextChip }
        ]
      },
      {
        title: this.tr("Inline Edit", "Inline Edit"),
        body: this.tr("思考中", "Thinking"),
        tone: "status"
      },
      {
        title: "",
        body: "",
        tone: "response",
        streaming: true
      }
    ];
    session.statusItemIndex = statusIndex;
    session.runStartedAt = Date.now();
    session.updatedAt = Date.now();
    this.persistSessions();
    this.renderSessionTabs();
    this.renderTimelineItems();
    this.renderTokenUsage();
    this.updateRunButtonDisabledState();
    window.requestAnimationFrame(() => this.scrollTimelineToBottom("smooth"));

    const updateTarget = (target: AgentSession, renderTabs = false) => {
      target.updatedAt = Date.now();
      this.persistSessions();
      if (this.activeSessionId === target.id) {
        this.renderTimelineItems();
        this.renderTokenUsage();
        if (renderTabs) {
          this.renderSessionTabs();
        }
      }
    };
    const findTarget = () => this.sessions.find((entry) => entry.id === session.id);
    const updateStatus = (target: AgentSession, title: string, body?: string) => {
      if (!target.timeline[statusIndex]) {
        return;
      }
      target.timeline[statusIndex] = {
        ...target.timeline[statusIndex],
        title: title || this.tr("Inline Edit", "Inline Edit"),
        body: body || title || this.tr("思考中", "Thinking"),
        tone: "status"
      };
    };
    const updateResponseBody = (target: AgentSession, body: string, streaming: boolean) => {
      if (!target.timeline[responseIndex]) {
        return;
      }
      target.timeline[responseIndex] = {
        ...target.timeline[responseIndex],
        body: this.sanitizeInlineEditConversationBody(body, !streaming),
        streaming
      };
    };
    const upsertTimelineItem = (target: AgentSession, predicate: (item: TimelineItem) => boolean, item: TimelineItem) => {
      const existingIndex = target.timeline.findIndex(predicate);
      if (existingIndex >= 0) {
        target.timeline[existingIndex] = item;
      } else {
        target.timeline = [...target.timeline, item];
      }
    };

    return {
      threadId: session.codexThreadId,
      onEvent: (event: AgentEvent) => {
        const target = findTarget();
        if (!target) {
          return;
        }
        if (event.type === "thread") {
          target.codexThreadId = event.threadId;
          updateTarget(target);
          return;
        }
        if (event.type === "status") {
          updateStatus(target, this.localizeInlineEditStatusTitle(event.title || "Thinking"), event.detail);
          updateTarget(target);
          return;
        }
        if (event.type === "message_delta") {
          if (!target.timeline[responseIndex]) {
            return;
          }
          updateResponseBody(target, `${target.timeline[responseIndex].body}${event.delta}`, true);
          updateTarget(target);
          return;
        }
        if (event.type === "message") {
          if (!target.timeline[responseIndex]) {
            return;
          }
          updateResponseBody(target, target.timeline[responseIndex].body || event.markdown, true);
          updateTarget(target);
          return;
        }
        if (event.type === "tool") {
          const body = [event.detail, `Status: ${event.status}`].filter(Boolean).join("\n");
          upsertTimelineItem(
            target,
            (item) => item.toolItemId === event.itemId,
            {
              title: event.title,
              body,
              tone: "tool",
              toolItemId: event.itemId
            }
          );
          updateStatus(target, event.title, body);
          updateTarget(target);
          return;
        }
        if (event.type === "command") {
          const itemId = event.itemId ?? `inline-command:${statusIndex}`;
          const title = event.status === "failed"
            ? this.tr("命令失败", "Command failed")
            : event.status === "done"
              ? this.tr("命令完成", "Command complete")
              : this.tr("运行命令", "Running command");
          const body = [event.command, event.cwd ? `cwd: ${event.cwd}` : "", `Status: ${event.status}`].filter(Boolean).join("\n");
          upsertTimelineItem(
            target,
            (item) => item.toolItemId === itemId,
            {
              title,
              body,
              tone: "tool",
              toolItemId: itemId
            }
          );
          updateStatus(target, title, body);
          updateTarget(target);
          return;
        }
        if (event.type === "plan") {
          const completed = event.items.filter((item) => item.status === "completed").length;
          upsertTimelineItem(
            target,
            (item) => item.planId === event.itemId,
            {
              title: event.title || this.tr("计划", "Plan"),
              body: event.items.map((item) => `${item.status}:${item.text}`).join("\n") || this.tr(`${event.items.length} 个计划项`, `${event.items.length} plan items`),
              tone: "tool",
              planId: event.itemId,
              planItems: event.items,
              planSummary: true
            }
          );
          updateStatus(target, this.tr(`${completed}/${event.items.length} 个计划项已完成`, `${completed}/${event.items.length} plan items complete`), event.title);
          updateTarget(target);
          return;
        }
        if (event.type === "token_usage") {
          target.tokenUsageTotal = event.totalTokens;
          target.tokenUsageInput = typeof event.inputTokens === "number" ? event.inputTokens : target.tokenUsageInput;
          target.tokenUsageLimit = typeof event.modelContextWindow === "number" ? event.modelContextWindow : null;
          updateTarget(target);
          return;
        }
        if (event.type === "diff") {
          upsertTimelineItem(
            target,
            (item) => item.diffId === `inline-edit-diff:${statusIndex}`,
            {
              title: this.tr("Diff 已更新", "Diff updated"),
              body: event.diff,
              tone: "tool",
              diffId: `inline-edit-diff:${statusIndex}`,
              diffText: event.diff
            }
          );
          updateStatus(target, this.tr("Diff 已更新", "Diff updated"), event.diff);
          updateTarget(target);
          return;
        }
        if (event.type === "error") {
          target.timeline = [
            ...target.timeline,
            { title: event.title, body: event.message, tone: "command" }
          ];
          target.statusItemIndex = null;
          updateTarget(target, true);
        }
      },
      onThread: (threadId: string) => {
        const target = this.sessions.find((entry) => entry.id === session.id);
        if (!target) {
          return;
        }
        target.codexThreadId = threadId;
        target.updatedAt = Date.now();
        this.persistSessions();
      },
      onStatus: (title: string) => {
        const target = this.sessions.find((entry) => entry.id === session.id);
        if (!target?.timeline[statusIndex]) {
          return;
        }
        target.timeline[statusIndex] = {
          ...target.timeline[statusIndex],
          body: title || this.tr("思考中", "Thinking")
        };
        target.updatedAt = Date.now();
        this.persistSessions();
        if (this.activeSessionId === session.id) {
          this.renderTimelineItems();
        }
      },
      onDelta: (delta: string) => {
        const target = this.sessions.find((entry) => entry.id === session.id);
        if (!target?.timeline[responseIndex]) {
          return;
        }
        target.timeline[responseIndex] = {
          ...target.timeline[responseIndex],
          body: `${target.timeline[responseIndex].body}${delta}`,
          streaming: true
        };
        target.updatedAt = Date.now();
        this.persistSessions();
        if (this.activeSessionId === session.id) {
          this.renderTimelineItems();
        }
      },
      onMessage: (markdown: string) => {
        const target = this.sessions.find((entry) => entry.id === session.id);
        if (!target?.timeline[responseIndex]) {
          return;
        }
        target.timeline[responseIndex] = {
          ...target.timeline[responseIndex],
          body: target.timeline[responseIndex].body || markdown,
          streaming: true
        };
        target.updatedAt = Date.now();
        this.persistSessions();
        if (this.activeSessionId === session.id) {
          this.renderTimelineItems();
        }
      },
      onComplete: () => {
        const target = this.sessions.find((entry) => entry.id === session.id);
        if (!target) {
          return;
        }
        if (target.timeline[responseIndex]) {
          updateResponseBody(target, target.timeline[responseIndex].body, false);
        }
        target.statusItemIndex = null;
        target.updatedAt = Date.now();
        this.persistSessions();
        if (this.activeSessionId === session.id) {
          this.renderTimelineItems();
          this.renderSessionTabs();
        }
      },
      onError: (title: string, message: string) => {
        const target = this.sessions.find((entry) => entry.id === session.id);
        if (!target) {
          return;
        }
        target.timeline = [
          ...target.timeline,
          { title, body: message, tone: "command" }
        ];
        target.statusItemIndex = null;
        target.updatedAt = Date.now();
        this.persistSessions();
        if (this.activeSessionId === session.id) {
          this.renderTimelineItems();
          this.renderSessionTabs();
        }
      }
    };
  }

  private sanitizeInlineEditConversationBody(body: string, complete: boolean) {
    const tagged = body.match(/<replacement>\s*([\s\S]*?)\s*<\/replacement>/i);
    if (tagged) {
      return tagged[1].replace(/^\n+|\n+$/g, "");
    }
    if (complete) {
      return body
        .replace(/^\s*<replacement>\s*/i, "")
        .replace(/\s*<\/replacement>\s*$/i, "")
        .replace(/^\n+|\n+$/g, "");
    }
    return body
      .replace(/^\s*<replacement>\s*/i, "")
      .replace(/\s*<\/replacement>\s*$/i, "");
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
    const normalized = this.normalizeContextChip(chip);
    this.contextChips = [normalized, ...this.contextChips];
    this.insertChipElement(normalized);
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
    const normalized = this.normalizeContextChip(chip);
    const chipEl = document.createElement("span");
    chipEl.addClass("codex-agent-chip", `is-${normalized.kind}`);
    chipEl.setAttr("contenteditable", "false");
    chipEl.setAttr("data-context-id", normalized.id);
    chipEl.setAttr("data-context-kind", normalized.kind);
    chipEl.setAttr("data-context-label", normalized.label);
    if (normalized.detail) {
      chipEl.setAttr("data-context-detail", normalized.detail);
    }
    if (normalized.path) {
      chipEl.setAttr("data-context-path", normalized.path);
    }
    if (normalized.text) {
      chipEl.setAttr("data-context-text", normalized.text);
    }
    const icon = chipEl.createSpan({ cls: `codex-agent-chip-icon is-${normalized.kind}` });
    setIcon(icon, this.getContextChipIcon(normalized));
    chipEl.createSpan({ cls: "codex-agent-chip-label", text: normalized.label });
    const remove = chipEl.createEl("button", {
      text: "×",
      attr: {
        type: "button",
        "aria-label": `Remove ${normalized.label}`
      }
    });
    remove.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.contextChips = this.contextChips.filter((item) => item.id !== normalized.id);
      chipEl.remove();
      this.updatePromptEmptyState();
      this.saveComposerDraftToActiveSession();
    });
    return chipEl;
  }

  private normalizeContextChip(chip: ContextChip): ContextChip {
    const normalizedPath = this.normalizeVaultRelativePath(chip.path);
    const detail = normalizedPath && (!chip.detail || chip.detail === chip.path)
      ? normalizedPath
      : chip.detail;
    return {
      ...chip,
      detail,
      path: normalizedPath
    };
  }

  private normalizeVaultRelativePath(filePath: string | undefined) {
    const rawPath = filePath?.trim();
    if (!rawPath) {
      return undefined;
    }
    const vaultPath = this.getVaultBasePath();
    const normalizedRaw = rawPath.replace(/\\/g, "/");
    if (vaultPath && path.isAbsolute(rawPath)) {
      const relative = path.relative(vaultPath, rawPath);
      if (!relative) {
        return "/";
      }
      if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
        return relative.replace(/\\/g, "/");
      }
    }
    if (vaultPath) {
      const normalizedVault = vaultPath.replace(/\\/g, "/").replace(/\/+$/, "");
      const shadowAbsolute = normalizedVault.replace(/^\/+/, "");
      if (normalizedRaw === shadowAbsolute || normalizedRaw.startsWith(`${shadowAbsolute}/`)) {
        const relative = normalizedRaw.slice(shadowAbsolute.length).replace(/^\/+/, "");
        return relative || "/";
      }
    }
    return normalizedRaw.replace(/^\.\//, "");
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

  private insertPromptText(text: string) {
    if (!this.promptInput) {
      return;
    }
    const hasPromptContent = this.stripPromptControlText(this.promptInput.innerText).trim().length > 0
      || Boolean(this.promptInput.querySelector(".codex-agent-chip"));
    if (!hasPromptContent) {
      this.promptInput.empty();
      this.promptInput.appendChild(document.createTextNode(text));
    } else {
      this.promptInput.appendChild(document.createTextNode(`\n${text}`));
    }
    this.updatePromptEmptyState();
    this.promptInput.focus();

    const range = document.createRange();
    range.selectNodeContents(this.promptInput);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  private startPromptInNewAgent(prompt: string, notice: string) {
    if (!this.promptInput) {
      return;
    }
    const session = this.createSession();
    this.saveComposerDraftToActiveSession();
    this.sessions = [...this.sessions, session];
    this.activeSessionId = session.id;
    this.mode = "agent";
    this.closeGitDiffPanel();
    this.clearComposer();
    this.renderSessionTabs();
    this.renderTimelineItems();
    this.renderTokenUsage();
    this.updateRunButtonDisabledState();
    this.updateComposerControls();
    this.insertPromptText(prompt);
    new Notice(notice);
    void this.runCodex();
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
      const normalized = this.normalizeContextChip(chip);
      pastedChips.push(normalized);
      fragment.appendChild(this.createPromptChipElement(normalized));
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
              path: this.normalizeVaultRelativePath(typeof part.chip.path === "string" ? part.chip.path : undefined),
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
    this.saveComposerDraftToActiveSession();
  }

  private hasPromptContent() {
    return Boolean(
      this.promptInput
      && (
        this.stripPromptControlText(this.promptInput.innerText).trim()
        || this.promptInput.querySelector(".codex-agent-chip")
      )
    );
  }

  private updateRunButtonDisabledState() {
    if (!this.runButton) {
      return;
    }
    this.setRunButtonRunning(this.isSessionRunning(this.activeSessionId));
  }

  private handlePromptKeydown(event: KeyboardEvent) {
    if (this.handlePromptPickerKeydown(event)) {
      return;
    }
    if (event.key !== "Enter" || event.shiftKey || event.isComposing) {
      return;
    }

    event.preventDefault();
    this.runCodex();
  }

  private async runCodex() {
    if (this.isSessionRunning(this.activeSessionId)) {
      this.cancelRun(this.activeSessionId);
      return;
    }

    if (!this.hasPromptContent()) {
      this.updateRunButtonDisabledState();
      return;
    }
    this.finalizePreviousDiffReviewForNextTurn();
    const messageParts = this.getPromptMessageParts();
    const prompt = this.getPromptText() || this.getPromptFallbackText(messageParts);
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
    const runMetaDetail = this.formatRunMetaDetail();
    const contextStatusDetail = attached > 0 ? `Read ${attached} context items: ${summary}` : "No context attached";
    const initialStatusBody = [runMetaDetail, contextStatusDetail].filter(Boolean).join("\n");

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
    const runId = `${session.id}:${session.runStartedAt}`;
    this.renderLiveDiff();
    this.persistSessions();
    this.renderSessionTabs();

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
    const handle = adapter.start(
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
      (event) => this.handleAgentEvent(session.id, runId, event),
      (code) => this.handleAgentClose(session.id, runId, code)
    );
    this.runningProcesses.set(session.id, {
      runId,
      handle,
      isCancelling: false,
      activeResponseItemId: null,
      activeResponseItemIndex: null,
      exploredFiles: new Set<string>(),
      currentDiffStats: null,
      statusTitle: "Thinking",
      statusBody: initialStatusBody,
      metaDetail: runMetaDetail
    });
    this.renderSessionTabs();
    this.startElapsedTimer(session.id);
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

  private saveComposerDraftToActiveSession() {
    if (this.isRestoringComposer) {
      return;
    }
    const session = this.getActiveSession();
    const draft = this.getComposerDraftParts();
    session.draftMessageParts = draft.length > 0 ? draft : undefined;
  }

  private getComposerDraftParts() {
    if (!this.promptInput) {
      return [];
    }
    const hasText = this.stripPromptControlText(this.promptInput.innerText).trim().length > 0;
    const hasChip = Boolean(this.promptInput.querySelector(".codex-agent-chip"));
    return hasText || hasChip ? this.getPromptMessageParts() : [];
  }

  private restoreComposerDraftFromActiveSession() {
    if (!this.promptInput) {
      return;
    }
    this.closePromptPicker();
    this.isRestoringComposer = true;
    try {
      this.contextChips = [];
      this.promptInput.empty();
      const parts = this.getActiveSession().draftMessageParts ?? [];
      parts.forEach((part) => {
        if (part.type === "text") {
          this.promptInput?.appendChild(document.createTextNode(part.text));
          return;
        }
        const chip = this.normalizeContextChip({
          id: part.chip.id,
          kind: part.chip.kind,
          label: part.chip.label,
          detail: part.chip.detail,
          path: part.chip.path,
          text: part.chip.text
        });
        this.contextChips.push(chip);
        this.promptInput?.appendChild(this.createPromptChipElement(chip));
        this.promptInput?.appendChild(document.createTextNode("\u200B"));
      });
      this.updatePromptEmptyState();
    } finally {
      this.isRestoringComposer = false;
    }
  }

  private getPromptText() {
    if (!this.promptInput) {
      return "";
    }

    const clone = this.promptInput.cloneNode(true) as HTMLElement;
    clone.querySelectorAll(".codex-agent-chip").forEach((node) => node.remove());
    return this.stripPromptControlText(clone.innerText).trim();
  }

  private getPromptFallbackText(parts: TimelineMessagePart[]) {
    const chips = parts.filter((part) => part.type === "chip").map((part) => part.chip);
    if (chips.length === 0) {
      return "";
    }

    if (chips.every((chip) => chip.kind === "image")) {
      return "Please respond to the attached pasted image context.";
    }

    return "Please use the attached context.";
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
          path: this.normalizeVaultRelativePath(chip?.path ?? element.getAttribute("data-context-path") ?? undefined),
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
    this.getActiveSession().draftMessageParts = undefined;
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
    const normalizedChips = chips.map((chip) => this.normalizeContextChip(chip));
    return {
      prompt,
      context: await Promise.all(normalizedChips.map(async (chip) => {
        if (chip.kind === "file" && chip.path) {
          const file = this.getVaultItemByPath(chip.path);
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
          const folder = this.getVaultItemByPath(chip.path);
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

  private getVaultItemByPath(filePath: string) {
    const normalized = this.normalizeVaultRelativePath(filePath);
    if (!normalized || normalized === "/") {
      return this.app.vault.getRoot();
    }
    return this.app.vault.getAbstractFileByPath(normalized);
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
    const vaultPath = this.getVaultBasePath();

    return [
      "You are running inside an Obsidian plugin compatibility test.",
      modeInstruction,
      "",
      "Path handling:",
      vaultPath ? `- Vault root is \`${vaultPath}\`.` : "- Vault root is the current working directory.",
      "- Attached file and folder paths are vault-relative unless explicitly marked otherwise.",
      "- If the user mentions an absolute path under the vault root, convert it to the equivalent vault-relative path before reading or writing.",
      "- Never create a shadow directory like `Users/...` inside the vault to mirror a macOS absolute path.",
      "- Example: `/Users/name/Documents/vault/folder/note.md` must be written as `folder/note.md`, not `Users/name/Documents/vault/folder/note.md`.",
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
    if (this.turnAuxMode === "mirror-not-echo") {
      return [
        "Think with me, not for me.",
        "",
        "Do not flatter, appease, or agree by default.",
        "Do not argue for sport either.",
        "",
        "Test my reasoning.",
        "Challenge weak assumptions.",
        "Name risks clearly.",
        "Ask when context is missing.",
        "Agree when the logic is sound.",
        "",
        "Help me reach the best conclusion, not the most comfortable one."
      ].join("\n");
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

  private handleAgentEvent(sessionId: string, runId: string, event: AgentEvent) {
    const runState = this.getRunState(sessionId, runId);
    if (!runState) {
      return;
    }

    this.withRunContext(sessionId, runState, () => this.handleAgentEventForRun(event));
  }

  private handleAgentEventForRun(event: AgentEvent) {

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
      this.upsertDiffTimelineItem(event.diff, false);
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
      if (this.currentRunState?.currentDiffStats) {
        this.upsertDiffTimelineItem(this.currentRunState.currentDiffStats.diffText, true);
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
      this.currentRunState?.exploredFiles.add(event.filePath);
      this.upsertReadSummaryTimelineItem();
    }

    const session = this.getTargetSession();
    const exploredFiles = this.currentRunState?.exploredFiles ?? new Set<string>();
    const exploredSummary = exploredFiles.size > 0
      ? `Explored ${exploredFiles.size} files`
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
    const files = [...(this.currentRunState?.exploredFiles ?? new Set<string>())].sort();
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
    if (this.currentRunState) {
      this.currentRunState.currentDiffStats = { ...stats, diffText };
    }
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

    if (this.currentRunState) {
      this.currentRunState.currentDiffStats = { ...stats, diffText };
    }
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
    let currentHunk: DiffHunkView | null = null;
    let oldLine: number | null = null;
    let newLine: number | null = null;

    const beginFile = (line: string) => {
      const quotedMatch = line.match(/^diff --git\s+("[\s\S]*?")\s+("[\s\S]*")$/);
      const plainMatch = line.match(/^diff --git\s+(a\/.+?)\s+(b\/.+)$/);
      const oldRaw = quotedMatch?.[1] ?? plainMatch?.[1] ?? "";
      const nextRaw = quotedMatch?.[2] ?? plainMatch?.[2] ?? line.replace(/^diff --git\s+/, "");
      const oldPath = this.cleanDiffPath(oldRaw);
      const nextPath = this.cleanDiffPath(nextRaw);
      current = {
        path: nextPath,
        oldPath: oldPath || nextPath,
        headerLines: [line],
        added: 0,
        removed: 0,
        lines: [],
        hunks: []
      };
      files.push(current);
      currentHunk = null;
      oldLine = null;
      newLine = null;
    };

    diffText.split(/\r?\n/).forEach((line) => {
      if (line.startsWith("diff --git ")) {
        beginFile(line);
        return;
      }
      if (!current) {
        return;
      }
      if (!currentHunk && (
        line.startsWith("index ")
        || line.startsWith("new file mode ")
        || line.startsWith("deleted file mode ")
        || line.startsWith("old mode ")
        || line.startsWith("new mode ")
        || line.startsWith("similarity index ")
        || line.startsWith("rename from ")
        || line.startsWith("rename to ")
        || line.startsWith("--- ")
        || line.startsWith("+++ ")
      )) {
        current.headerLines.push(line);
        if (line.startsWith("+++ b/")) {
          current.path = this.cleanDiffPath(line.slice(4));
        } else if (line.startsWith("+++ \"b/")) {
          current.path = this.cleanDiffPath(line.slice(4));
        } else if (line === "+++ /dev/null") {
          current.path = current.oldPath;
        } else if (line.startsWith("--- a/")) {
          current.oldPath = this.cleanDiffPath(line.slice(4));
        } else if (line.startsWith("--- \"a/")) {
          current.oldPath = this.cleanDiffPath(line.slice(4));
        }
        return;
      }
      if (line.startsWith("@@")) {
        const match = line.match(/^@@\s+-(\d+)(?:,\d+)?\s+\+(\d+)(?:,\d+)?\s+@@/);
        oldLine = match ? Number(match[1]) : null;
        newLine = match ? Number(match[2]) : null;
        currentHunk = {
          id: `${current.hunks.length + 1}:${line}`,
          header: line,
          added: 0,
          removed: 0,
          lines: [{ type: "hunk", text: line }],
          rawLines: [line]
        };
        current.hunks.push(currentHunk);
        current.lines.push({ type: "hunk", text: line });
        return;
      }
      if (!currentHunk || oldLine === null || newLine === null || line.startsWith("+++") || line.startsWith("---") || line.startsWith("index ")) {
        return;
      }
      currentHunk.rawLines.push(line);
      if (line.startsWith("+")) {
        const diffLine: DiffLineView = { type: "add", newLine, text: line.slice(1) };
        current.added += 1;
        currentHunk.added += 1;
        current.lines.push(diffLine);
        currentHunk.lines.push(diffLine);
        newLine += 1;
      } else if (line.startsWith("-")) {
        const diffLine: DiffLineView = { type: "remove", oldLine, text: line.slice(1) };
        current.removed += 1;
        currentHunk.removed += 1;
        current.lines.push(diffLine);
        currentHunk.lines.push(diffLine);
        oldLine += 1;
      } else if (line.startsWith(" ")) {
        const diffLine: DiffLineView = { type: "context", oldLine, newLine, text: line.slice(1) };
        current.lines.push(diffLine);
        currentHunk.lines.push(diffLine);
        oldLine += 1;
        newLine += 1;
      } else if (line === "\\ No newline at end of file") {
        const diffLine: DiffLineView = { type: "hunk", text: line };
        current.lines.push(diffLine);
        currentHunk.lines.push(diffLine);
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
    const runState = this.currentRunState;
    if (!runState) {
      return;
    }
    if (runState.activeResponseItemId !== itemId || runState.activeResponseItemIndex === null || !session.timeline[runState.activeResponseItemIndex]) {
      runState.activeResponseItemId = itemId;
      session.timeline = [
        ...session.timeline,
        {
          title: "",
          body: "",
          tone: "response",
          streaming: true
        }
      ];
      runState.activeResponseItemIndex = session.timeline.length - 1;
    }

    const index = runState.activeResponseItemIndex;
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
    const runState = this.currentRunState;
    if (runState?.activeResponseItemIndex !== null && runState?.activeResponseItemIndex !== undefined && session.timeline[runState.activeResponseItemIndex]?.tone === "response") {
      session.timeline[runState.activeResponseItemIndex].streaming = false;
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
        this.saveComposerDraftToActiveSession();
        this.activeSessionId = approval.sessionId;
        this.restoreComposerDraftFromActiveSession();
        this.persistSessions();
        this.app.workspace.revealLeaf(this.leaf);
        this.renderSessionTabs();
        this.renderTimelineItems();
        this.renderTokenUsage();
        this.updateRunButtonDisabledState();
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

  private handleAgentClose(sessionId: string, runId: string, code: number | null) {
    const runState = this.getRunState(sessionId, runId);
    if (!runState) {
      return;
    }

    if (runState.isCancelling) {
      this.finishCancelledRun(sessionId);
      return;
    }

    this.runningProcesses.delete(sessionId);
    this.stopElapsedTimer(sessionId);
    void this.renderGitChanges();
    this.withRunContext(sessionId, runState, () => {
      this.markActiveResponseComplete();
      this.setLiveStatus(code === 0 ? "done" : "error", code === 0 ? "Completed" : "Run failed");
      if (code !== 0) {
        this.finishRunStatus("Run failed", `Codex exited with code ${code ?? "unknown"}.`);
      } else {
        this.updateTranscriptStatus(this.getProcessedStatusTitle(), "");
      }
    });
    this.updateRunButtonDisabledState();
    this.renderSessionTabs();
    this.persistSessions();
  }

  private getRunState(sessionId: string, runId: string) {
    const runState = this.runningProcesses.get(sessionId);
    return runState?.runId === runId ? runState : null;
  }

  private getActiveRunState() {
    return this.runningProcesses.get(this.activeSessionId) ?? null;
  }

  private isSessionRunning(sessionId: string) {
    return this.runningProcesses.has(sessionId);
  }

  private finishCancelledRun(sessionId: string) {
    const runState = this.runningProcesses.get(sessionId);
    if (!runState) {
      return;
    }
    this.runningProcesses.delete(sessionId);
    this.stopElapsedTimer(sessionId);
    runState.currentDiffStats = null;
    this.withRunContext(sessionId, runState, () => {
      this.markActiveResponseComplete();
      this.renderLiveDiff();
      this.finishRunStatus("Stopped", "Codex process was stopped by the user.");
    });
    this.updateRunButtonDisabledState();
    this.renderSessionTabs();
    this.persistSessions();
  }

  private cancelRun(sessionId: string) {
    const runState = this.runningProcesses.get(sessionId);
    if (!runState) {
      return;
    }
    runState.isCancelling = true;
    runState.handle.cancel();
    this.finishCancelledRun(sessionId);
  }

  private withRunContext<T>(sessionId: string, runState: AgentRunState, callback: () => T): T {
    const previousRunningSessionId = this.runningSessionId;
    const previousRunState = this.currentRunState;
    this.runningSessionId = sessionId;
    this.currentRunState = runState;
    try {
      return callback();
    } finally {
      this.runningSessionId = previousRunningSessionId;
      this.currentRunState = previousRunState;
    }
  }

  private finishRunStatus(title: string, body = "") {
    const runState = this.currentRunState;
    if (runState) {
      runState.statusTitle = title;
      runState.statusBody = body;
    }
    this.updateTranscriptStatus(title, body);
  }

  private updateWorkingTranscriptStatus(title: string, body = "") {
    const formattedBody = this.formatRunStatusBody(body);
    const runState = this.currentRunState;
    if (runState) {
      runState.statusTitle = title;
      runState.statusBody = formattedBody;
    }
    this.updateTranscriptStatus(title, formattedBody);
  }

  private formatRunMetaDetail() {
    return `${this.modelChoice} · ${this.reasoningLevel} reason`;
  }

  private formatRunStatusBody(detail = "") {
    return [this.currentRunState?.metaDetail, detail].filter(Boolean).join("\n");
  }

  private getProcessedStatusTitle() {
    return `Processed ${this.getElapsedLabel()}`;
  }

  private setLiveStatus(status: "idle" | "thinking" | "running" | "done" | "error", text: string) {
    if (!this.liveStatusEl || !this.liveStatusTextEl) {
      return;
    }
    if (this.runningSessionId && this.runningSessionId !== this.activeSessionId) {
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
    if (this.currentRunState?.activeResponseItemIndex !== null
      && this.currentRunState?.activeResponseItemIndex !== undefined
      && session.id === this.runningSessionId
      && index < this.currentRunState.activeResponseItemIndex) {
      this.currentRunState.activeResponseItemIndex -= 1;
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

  private startElapsedTimer(sessionId: string) {
    this.stopElapsedTimer(sessionId);
    const timer = window.setInterval(() => {
      const runState = this.runningProcesses.get(sessionId);
      if (runState) {
        this.withRunContext(sessionId, runState, () => {
          this.updateTranscriptStatus(runState.statusTitle, runState.statusBody);
        });
      }
    }, 1000);
    this.elapsedTimers.set(sessionId, timer);
  }

  private stopElapsedTimer(sessionId?: string) {
    if (sessionId) {
      const timer = this.elapsedTimers.get(sessionId);
      if (timer !== undefined) {
        window.clearInterval(timer);
        this.elapsedTimers.delete(sessionId);
      }
      return;
    }
    this.elapsedTimers.forEach((timer) => window.clearInterval(timer));
    this.elapsedTimers.clear();
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
    this.saveComposerDraftToActiveSession();
    this.sessions = [...this.sessions, session];
    this.activeSessionId = session.id;
    this.restoreComposerDraftFromActiveSession();
    this.persistSessions();
    this.renderSessionTabs();
    this.renderTimelineItems();
    this.renderTokenUsage();
    this.updateRunButtonDisabledState();
  }

  private closeSession(sessionId: string) {
    this.saveComposerDraftToActiveSession();
    const closingSession = this.sessions.find((session) => session.id === sessionId);
    if (this.isSessionRunning(sessionId)) {
      this.cancelRun(sessionId);
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
    this.restoreComposerDraftFromActiveSession();
    this.persistSessions();
    this.renderSessionTabs();
    this.renderTimelineItems();
    this.renderTokenUsage();
    this.updateRunButtonDisabledState();
  }

  private deleteHistorySession(sessionId: string) {
    this.saveComposerDraftToActiveSession();
    if (this.isSessionRunning(sessionId)) {
      this.cancelRun(sessionId);
    }

    this.sessions = this.sessions.filter((session) => session.id !== sessionId);
    this.archivedSessions = this.archivedSessions.filter((session) => session.id !== sessionId);
    if (this.sessions.length === 0) {
      this.sessions = [this.createSession()];
    }
    if (!this.sessions.some((session) => session.id === this.activeSessionId)) {
      this.activeSessionId = this.sessions[0].id;
    }
    this.restoreComposerDraftFromActiveSession();
    this.persistSessions();
    this.renderSessionTabs();
    this.renderTimelineItems();
    this.renderTokenUsage();
    this.updateRunButtonDisabledState();
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
