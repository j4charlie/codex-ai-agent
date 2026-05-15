# Codex App Server Adapter 设计方案

日期：2026-05-15

## 1. 背景与目标

当前插件目标是把 Obsidian 封装成类似 Cursor Agent 的本地 Agent 工作区。前期 demo 已完成侧边栏 UI、上下文 chip、标签页、历史面板、Codex CLI 执行流和事件中间层。

但继续基于 `codex exec --json` 做完整 Agent 会遇到核心限制：

- 每轮请求都是一次性进程，不能天然延续上下文。
- 要多轮对话只能由插件手动拼接历史，token 会随对话增长。
- 运行中审批不稳定，因为 `exec --json` 不是双向交互协议。
- 图片输入需要通过 `--image` 启动参数传入，后续轮次动态追加图片困难。

因此后续执行层建议从 `exec-json` 迁移到 Codex `app-server` 协议。`app-server` 提供 thread/turn 模型、结构化事件、结构化审批、图片输入和 diff 通知，更接近目标产品形态。

## 2. 当前项目构建情况

### 2.1 项目路径

项目源码：

```text
/Users/charlieli/Documents/codex-for-obsidian
```

当前安装到测试 vault 的插件目录：

```text
/Users/charlieli/Documents/ref-cyms/.obsidian/plugins/codex-for-obsidian
```

### 2.2 文件结构

关键文件：

```text
manifest.json
main.js
styles.css
src/main.ts
docs/
```

其中 `main.js` 是 Obsidian 实际加载的插件入口。当前项目还没有真正的 TypeScript 打包流程，`package.json` 里的脚本是：

```json
{
  "build": "tsc -noEmit -skipLibCheck",
  "typecheck": "tsc -noEmit -skipLibCheck"
}
```

这意味着：

- `src/main.ts` 是源码参考和类型化版本。
- `main.js` 需要同步维护，否则 Obsidian 不会加载 TS 改动。
- 当前本机项目没有安装 `node_modules`，`npm run typecheck` 会因为 `tsc` 不存在而失败。
- 目前可用的最低验证方式是 `node --check main.js`。

### 2.3 已实现能力

插件当前已实现：

- Obsidian 侧边栏 Agent 视图。
- 不修改 Obsidian 原生功能，全部通过插件 API 注册：
  - ribbon icon
  - command
  - editor menu
  - file menu
  - 自定义 view
- 输入框内 inline chip：
  - 选中文本
  - 文件
  - 文件夹
- context payload：
  - 文件 chip 传 path，并读取文件内容。
  - 文件夹 chip 传 path，并读取目录树。
  - 选中文本 chip 传 path + text。
- 标签页：
  - 新建会话
  - 切换会话
  - 关闭会话
  - 历史面板
- 会话持久化：
  - 使用 Obsidian 插件自己的 `data.json`
  - 不修改 Obsidian 原生配置
  - 首轮发送后保存会话
  - 关闭 tab 后归档到历史
- 当前执行层：
  - `ExecJsonAdapter`
  - 基于 `codex exec --json`
  - 输出映射为统一 `AgentEvent`
- 已预留：
  - `CodexAdapter`
  - `PtyCodexAdapter` stub
  - UI 不直接依赖 JSONL，改为消费 `AgentEvent`

### 2.4 当前执行层问题

`exec-json` 适合单轮任务和 demo 验证，不适合作为最终 Agent 内核：

- 多轮上下文不能自然延续。
- 每轮都要重建 prompt。
- 如果插件拼历史，会增加 token 消耗。
- approval 无法稳定在中途交互。
- 图片只能作为进程启动参数，不适合会话中动态追加。
- Codex 进程每轮结束，无法提供 Cursor/Codex TUI 那种持续会话体验。

## 3. App Server 调研情况

### 3.1 CLI 能力

本机 Codex CLI 暴露：

```bash
codex app-server --help
codex exec-server --help
codex remote-control --help
```

`app-server` 标注为 experimental：

```text
[experimental] Run the app server or related tooling
```

支持：

```bash
codex app-server --listen stdio://
codex app-server --listen unix://
codex app-server --listen unix://PATH
codex app-server daemon start
codex app-server daemon stop
codex app-server generate-ts --out <DIR>
codex app-server generate-json-schema --out <DIR>
```

本机 daemon 当前未运行，执行：

```bash
codex app-server daemon version
```

返回 socket 不存在：

```text
failed to connect to /Users/charlieli/.codex/app-server-control/app-server-control.sock
```

这不是能力缺失，只说明 managed daemon 当前没有启动。插件侧可以优先采用 `stdio://` 子进程模式做 adapter spike，避免依赖全局 daemon 状态。

### 3.2 协议生成

已通过以下命令生成临时协议文件进行调研：

```bash
codex app-server generate-ts --out /private/tmp/codex-app-server-ts
codex app-server generate-json-schema --out /private/tmp/codex-app-server-schema
```

协议是 JSON-RPC 风格，包含：

- `ClientRequest`
- `ServerNotification`
- `ServerRequest`
- JSON Schema
- TypeScript bindings

### 3.3 Thread / Turn 模型

核心客户端请求包括：

```text
initialize
thread/start
thread/resume
thread/read
thread/archive
thread/unarchive
thread/compact/start
turn/start
turn/steer
turn/interrupt
```

关键类型：

```ts
ThreadStartParams = {
  model?: string | null;
  cwd?: string | null;
  approvalPolicy?: AskForApproval | null;
  approvalsReviewer?: ApprovalsReviewer | null;
  sandbox?: SandboxMode | null;
  baseInstructions?: string | null;
  developerInstructions?: string | null;
  ephemeral?: boolean | null;
}
```

```ts
TurnStartParams = {
  threadId: string;
  input: Array<UserInput>;
  cwd?: string | null;
  approvalPolicy?: AskForApproval | null;
  approvalsReviewer?: ApprovalsReviewer | null;
  sandboxPolicy?: SandboxPolicy | null;
  model?: string | null;
}
```

这说明 app-server 原生支持同一个 thread 下连续多个 turn，适合多轮 Agent。

### 3.4 多模态输入

`UserInput` 支持：

```ts
UserInput =
  | { type: "text"; text: string; text_elements: Array<TextElement> }
  | { type: "image"; url: string }
  | { type: "localImage"; path: string }
  | { type: "skill"; name: string; path: string }
  | { type: "mention"; name: string; path: string };
```

这比 PTY 更适合图片输入：

- 不需要把图片二进制写入终端。
- 不需要每轮重启进程传 `--image`。
- 可在任意 turn 中附加 `localImage`。

### 3.5 结构化审批

`ServerRequest` 包含：

```text
item/commandExecution/requestApproval
item/fileChange/requestApproval
item/permissions/requestApproval
item/tool/requestUserInput
mcpServer/elicitation/request
```

命令审批参数：

```ts
CommandExecutionRequestApprovalParams = {
  threadId: string;
  turnId: string;
  itemId: string;
  startedAtMs: number;
  approvalId?: string | null;
  reason?: string | null;
  command?: string | null;
  cwd?: AbsolutePathBuf | null;
  commandActions?: Array<CommandAction> | null;
  proposedExecpolicyAmendment?: ExecPolicyAmendment | null;
  proposedNetworkPolicyAmendments?: Array<NetworkPolicyAmendment> | null;
}
```

命令审批响应：

```ts
CommandExecutionApprovalDecision =
  | "accept"
  | "acceptForSession"
  | "decline"
  | "cancel"
  | { acceptWithExecpolicyAmendment: { execpolicy_amendment: ExecPolicyAmendment } }
  | { applyNetworkPolicyAmendment: { network_policy_amendment: NetworkPolicyAmendment } };
```

文件变更审批参数：

```ts
FileChangeRequestApprovalParams = {
  threadId: string;
  turnId: string;
  itemId: string;
  startedAtMs: number;
  reason?: string | null;
  grantRoot?: string | null;
}
```

这能直接支撑 UI 中的审批卡：

- 允许一次
- 本会话允许
- 拒绝
- 取消
- 展示 command/cwd/reason/commandActions

### 3.6 结构化信息流

`ServerNotification` 包含：

```text
thread/started
thread/status/changed
thread/name/updated
thread/tokenUsage/updated
turn/started
turn/completed
turn/diff/updated
turn/plan/updated
item/started
item/completed
item/agentMessage/delta
item/plan/delta
item/commandExecution/outputDelta
item/commandExecution/terminalInteraction
item/fileChange/outputDelta
item/fileChange/patchUpdated
item/reasoning/summaryTextDelta
item/reasoning/textDelta
thread/compacted
error
warning
```

关键通知：

```ts
AgentMessageDeltaNotification = {
  threadId: string;
  turnId: string;
  itemId: string;
  delta: string;
}
```

```ts
CommandExecutionOutputDeltaNotification = {
  threadId: string;
  turnId: string;
  itemId: string;
  delta: string;
}
```

```ts
TurnDiffUpdatedNotification = {
  threadId: string;
  turnId: string;
  diff: string;
}
```

```ts
ThreadItem =
  | { type: "userMessage"; id: string; content: Array<UserInput> }
  | { type: "agentMessage"; id: string; text: string; phase: MessagePhase | null }
  | { type: "plan"; id: string; text: string }
  | { type: "reasoning"; id: string; summary: Array<string>; content: Array<string> }
  | { type: "commandExecution"; id: string; command: string; cwd: string; status: CommandExecutionStatus; aggregatedOutput: string | null; exitCode: number | null }
  | { type: "fileChange"; id: string; changes: Array<FileUpdateChange>; status: PatchApplyStatus }
  | { type: "imageView"; id: string; path: string }
  | { type: "imageGeneration"; id: string; status: string; result: string };
```

这说明 app-server 可以比 PTY 更稳定地映射到插件现有 `AgentEvent`。

### 3.7 与 PTY 对比

| 维度 | PTY | app-server |
|---|---|---|
| 多轮上下文 | 可行，依赖长期终端进程 | 原生 thread/turn |
| approval | 需要解析终端文本 | 结构化 ServerRequest |
| 图片输入 | 不天然支持，需要绕 `--image` 或 resume | 原生 `image/localImage` |
| diff | 需要解析输出或另行读取 git diff | 原生 `turn/diff/updated` |
| 命令输出 | 终端文本 | 结构化 delta |
| UI 映射稳定性 | 易受 TUI 文案影响 | 协议字段稳定性更好 |
| 风险 | node-pty 原生依赖和终端解析 | experimental 协议 |
| 推荐定位 | 兜底方案 | 主方案 |

## 4. 推荐实现方案

### 4.1 总体架构

保留当前中间层：

```text
UI Timeline
  -> AgentEvent
  -> CodexAdapter
      -> ExecJsonAdapter
      -> AppServerAdapter
```

新增 `AppServerAdapter`，把 app-server JSON-RPC 事件转换成现有 `AgentEvent`。

现有 `ExecJsonAdapter` 作为 fallback：

- app-server 启动失败
- 协议异常
- 用户临时选择兼容模式

### 4.2 Adapter 职责

`AppServerAdapter` 负责：

- 启动 app-server 子进程：

```bash
codex app-server --listen stdio://
```

- JSON-RPC 通信：
  - 发送 request
  - 接收 response
  - 接收 notification
  - 接收 server request
  - 回复 server request

- 会话生命周期：
  - `initialize`
  - `thread/start`
  - `thread/resume`
  - `turn/start`
  - `turn/interrupt`
  - `thread/archive`

- 事件转换：
  - `item/agentMessage/delta` -> assistant message buffer
  - `item/commandExecution/outputDelta` -> command output
  - `turn/diff/updated` -> diff event
  - `turn/completed` -> done
  - `item/commandExecution/requestApproval` -> approval event
  - `item/fileChange/requestApproval` -> file approval event

### 4.3 会话映射

插件 `AgentSession` 需要新增：

```ts
interface AgentSession {
  id: string;              // 插件会话 id
  codexThreadId?: string;  // app-server thread id
  title: string;
  timeline: TimelineItem[];
  statusItemIndex: number | null;
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
}
```

行为：

- 新建 tab 时先创建插件 session。
- 第一轮发送时调用 `thread/start`，保存 `codexThreadId`。
- 后续发送调用 `turn/start`，复用同一个 `codexThreadId`。
- 关闭 tab 时不删除历史，只归档 UI session。
- 恢复历史时：
  - 如果有 `codexThreadId`，调用 `thread/resume`。
  - 然后调用 `thread/read(includeTurns=true)` 重建 UI 或校验已有 UI。

### 4.4 输入模型

插件输入框中的内容转换为 `UserInput[]`：

文本：

```ts
{ type: "text", text: userText, text_elements: [] }
```

图片：

```ts
{ type: "localImage", path: "/absolute/path/to/image.png" }
```

当前 chip 处理策略：

- 文件 chip：
  - 短期：继续把文件内容拼入 text input。
  - 中期：使用 mention 或 path text element 表示文件引用。
- 文件夹 chip：
  - 短期：传目录树文本。
  - 中期：让 agent 使用 fs 工具按路径读取。
- 选中文本 chip：
  - 传 path + selected text。

### 4.5 审批交互

UI 新增 approval card，来源是 `ServerRequest`：

#### 命令审批

来源：

```text
item/commandExecution/requestApproval
```

展示：

- command
- cwd
- reason
- commandActions
- 风险提示

按钮：

- 允许一次 -> `{ decision: "accept" }`
- 本会话允许 -> `{ decision: "acceptForSession" }`
- 拒绝 -> `{ decision: "decline" }`
- 取消 -> `{ decision: "cancel" }`

#### 文件变更审批

来源：

```text
item/fileChange/requestApproval
```

展示：

- reason
- grantRoot
- 当前 diff

按钮：

- 允许
- 拒绝
- 取消

### 4.6 信息流映射

建议扩展 `AgentEvent`：

```ts
type AgentEvent =
  | { type: "status"; state: "thinking" | "running" | "done" | "error"; title: string; detail?: string }
  | { type: "user_message"; text: string }
  | { type: "message_delta"; itemId: string; delta: string }
  | { type: "message_done"; itemId: string; markdown: string }
  | { type: "command"; itemId: string; command: string; cwd?: string; status: "running" | "done" | "failed"; output?: string }
  | { type: "approval"; id: string; approvalKind: "command" | "file" | "permissions"; title: string; detail: string; payload: unknown }
  | { type: "diff"; diff: string }
  | { type: "error"; title: string; message: string };
```

短期可以先复用现有：

- `message`
- `command`
- `approval`
- `status`
- `error`

但为了流式回复，后续应支持 delta buffer。

### 4.7 启动策略

优先采用插件内子进程：

```bash
codex app-server --listen stdio://
```

原因：

- 不依赖全局 daemon 是否启动。
- 生命周期由插件控制。
- 插件 disable/unload 时可关闭进程。

后续可以增加 daemon 模式：

```bash
codex app-server daemon start
codex app-server proxy
```

但这更适合稳定后再做。

## 5. 分阶段落地计划

### 阶段 1：App Server Spike

目标：验证 app-server 最小闭环。

范围：

- 新增 `AppServerAdapter` 原型。
- 启动 `codex app-server --listen stdio://`。
- 发送 `initialize`。
- 发送 `thread/start`。
- 发送 `turn/start`，仅文本输入。
- 接收：
  - `thread/started`
  - `turn/started`
  - `item/agentMessage/delta`
  - `turn/completed`
- 映射到现有 timeline。

验收：

- 插件内可以完成一轮文本问答。
- 不影响现有 `ExecJsonAdapter`。
- app-server 启动失败时能 fallback 或显示明确错误。

### 阶段 2：多轮上下文

目标：同一个 tab 下连续多轮对话。

范围：

- 保存 `codexThreadId`。
- 后续发送使用 `turn/start`。
- UI timeline 追加用户消息和 assistant 回复。
- 不再覆盖旧 timeline。
- 保存 thread id 到插件 `data.json`。

验收：

- 第二轮问题能基于第一轮上下文回答。
- 不需要插件手动拼完整历史。

### 阶段 3：结构化审批

目标：实现 Codex 原生审批体验。

范围：

- 处理 `ServerRequest`：
  - `item/commandExecution/requestApproval`
  - `item/fileChange/requestApproval`
  - `item/permissions/requestApproval`
- UI 显示 approval card。
- 用户点击后回 JSON-RPC response。

验收：

- 命令审批可允许/拒绝。
- 本会话允许可用。
- 拒绝后 agent 能继续收到结果。

### 阶段 4：图片输入

目标：支持图片作为上下文。

范围：

- 输入框支持图片 chip。
- vault 图片转 absolute path。
- 发送为：

```ts
{ type: "localImage", path }
```

验收：

- 同一 thread 的任意 turn 都能附加图片。
- 图片不会被转成普通文本路径。

### 阶段 5：历史恢复与 resume

目标：关闭 tab 或重启 Obsidian 后恢复真实 Codex thread。

范围：

- 恢复历史时调用 `thread/resume`。
- 调用 `thread/read(includeTurns=true)` 同步 UI。
- 如果 resume 失败，保留本地 UI 历史，并提示无法恢复真实 agent 上下文。

验收：

- 重启后历史对话可打开。
- 有 `codexThreadId` 的会话可恢复继续问。

## 6. 风险与处理

### 6.1 app-server experimental

风险：

- 协议字段可能变化。
- 事件名称可能调整。

处理：

- 不删除 `ExecJsonAdapter`。
- Adapter 内部集中处理协议版本。
- 只依赖生成 schema 中确认过的核心方法。

### 6.2 JSON-RPC 实现复杂度

风险：

- 需要处理 request/response/notification/server request 四类消息。
- 需要维护 pending request map。

处理：

- 先实现最小 JSON-RPC client。
- 所有协议细节封装在 `AppServerAdapter` 内。
- UI 只消费 `AgentEvent`。

### 6.3 Obsidian 插件生命周期

风险：

- 插件关闭时子进程未清理。
- 多个 view 重复启动 app-server。

处理：

- app-server 进程归 adapter manager 管理。
- 插件 unload 时统一 terminate。
- 一个插件实例共享一个 app-server client。

### 6.4 数据兼容

风险：

- 旧 `data.json` 里没有 `codexThreadId`。

处理：

- normalize 时允许缺省。
- 没有 `codexThreadId` 的旧会话只恢复 UI 历史，不能恢复真实 Codex 上下文。

## 7. 推荐结论

不建议继续把 `exec-json` 强行扩展成完整 Agent。

推荐方案：

```text
短期：保留 ExecJsonAdapter 作为 fallback
主线：实现 AppServerAdapter
兜底：PTY 仅作为 app-server 不可用时的实验备选
```

原因：

- app-server 原生支持多轮 thread/turn。
- app-server 原生支持结构化 approval。
- app-server 原生支持图片输入。
- app-server 原生支持 diff、命令输出、状态和 token usage。
- 与当前 `AgentEvent` 中间层可以自然衔接。

下一步应做 `AppServerAdapter` spike，而不是继续推进 PTY。

