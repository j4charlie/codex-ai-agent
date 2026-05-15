import { ItemView, Plugin, WorkspaceLeaf } from "obsidian";

const VIEW_TYPE_CODEX_AGENT = "codex-agent-view";

export default class CodexForObsidianPlugin extends Plugin {
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

  private async activateView() {
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
}

class CodexAgentView extends ItemView {
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
    container.createEl("h2", { text: "Codex Agent" });
    container.createEl("p", {
      text: "Local Codex CLI agent panel scaffold. Implementation will add context, streaming, diff review, and command approval."
    });
  }
}

