# Agent Scope：一棵插件树，怎样长出不同的 Agent

> 研究快照：`deepseek-harness` commit `47f943859bef60e4160492346772ded9b24f765a`（2026-08-13）。本章把当前源码当作事实源；提交与 Agent Note 用来解释演进。

上一章说清了 Cordis 如何让插件树可靠地装上、卸下。可一旦同一进程同时服务多个 Agent，另一个问题马上出现：插件都挂在同一棵树上，为什么 A 能有自己的工具和 persona，B 却看不到？Agent Scope 给出的答案不是再造一棵树，而是给共享注册表增加按 Agent 解析的视图。

## 先记住四个结论

1. `agent.ctx` 同时决定注册项“谁能看见”和“跟谁一起销毁”。这两个事实来自同一个 Cordis Context，避免可见性与生命周期各管一套账。依据：`packages/core/scope/src/index.ts:104-146`、`packages/core/scope/src/store.ts:219-266`。
2. 当前查找顺序是 `agent → preset → global`。同名项由更近的 layer 覆盖；事件反向传播，agent 事件能被 preset listener 听见，却不会传给 sibling preset。依据：`packages/core/scope/src/index.ts:29-39,93-101,158-184`、`packages/core/scope/src/store.ts:172-217`。
3. 同一 preset 的同一 generation 在一个进程中只挂载一次。多个 Agent 共享这批插件实例，通过 scope parent 加入；文件变化后，后续 Agent 会加入新 generation。session 隔离依赖插件按 `Session` / `Agent` 存状态，不依赖“每会话一份实例”。依据：`packages/preset/agent-presets/src/index.ts:1-20,241-287,490-533`、`packages/preset/agent-presets/tests/mount.spec.ts:275-289,653-659`。
4. preset YAML 是装配模板，不是安全边界。只有主动采用 scope 的 registry 才会隔离；普通 Cordis service 仍可能泄漏到进程全局，因此 mount 会拒绝 root-realm service。依据：`packages/core/scope/README.md:25-37`、`packages/preset/agent-presets/src/mount.ts:178-202,322-380`。

## 它在系统里的角色

Cordis 解决“插件怎样组合和卸载”，Session Log 解决“发生过什么”。Agent Scope 位于两者之间，负责回答一次运行时查询该看见哪批注册项。

如果删掉 Scope，工具、prompt section、restriction 和 listener 只能全局注册。做一个 reviewer persona，会把所有 Agent 都改成 reviewer；给子 Agent 加一个结果回传工具，也会污染主 Agent。反过来，如果每个 Agent 都复制完整 Cordis service graph，共享的模型适配器、持久化、Web Host 又会被重复创建。最初的 Agent Scope Agent Note 正是从这组矛盾出发：共享基础设施，局部注册行为（`.agents/notes/implemented/architecture/2026-07-08-agent-scope-contexts.md:7-17`）。

它不是 Agent 的全部配置。模型路由、持久化、Host RPC 等仍由各自模块决定。Scope 只提供一套身份、注册层和事件路由原语，具体 registry 决定怎么 merge、过滤或执行。

## 核心数据结构

理解当前实现只需抓住五个对象。

```ts
type ScopeKey = object

interface Scope {
  ctx: Context
  rawDispose: () => Promise<void> | void
  dispose(): Promise<void>
}

interface ScopeParentBinding {
  rebind(parent: ScopeKey): void
}
```

`ScopeKey` 只比较对象身份。Agent Loop 直接拿 live `Agent` 对象当 key；standing preset 用 `{ agentPreset: id }` 这样的合成对象。Scope 不读取对象字段，所以底层包不依赖 Agent 或 preset 类型（`packages/core/scope/src/index.ts:14-18,104-146`）。

`createScope()` 在传入 Context 下挂一个 no-op plugin fiber，再用 `extend()` 写入 scope tag。所有通过 `Scope.ctx` 创建的 effect 都归这个 fiber 所有。`dispose()` 会等待 fiber 的异步惯性清空；多次或竞态调用共享同一个 Promise（`packages/core/scope/src/index.ts:114-146`；`packages/core/scope/tests/scope.spec.ts:41-88`）。

`scopeParents: WeakMap<ScopeKey, ScopeKey>` 保存层级。普通调用只能首次绑定，只有首次绑定返回的 `ScopeParentBinding` 能改 parent；每次 bind/rebind 都检查环（`packages/core/scope/src/index.ts:29-82`）。AgentPresets 私有持有这些 binding，因此别的插件不能把 Agent 偷偷挪到另一套 composition（`packages/preset/agent-presets/src/index.ts:254-286,458-470`）。

`ScopedLayers` 是 registry 共用的存储骨架：一个 eager global layer，加若干 lazy scoped layer。`chainLayers()` 返回最远祖先到当前 scope，`merge()` 依次覆盖同名项，所以最近的 layer 最后写入并获胜（`packages/core/scope/src/store.ts:152-217`）。

`AgentPresets.standing` 是 `Map<presetId, Promise<StandingMount>>`。Promise 让同一 preset 的首次并发使用只创建一个 generation；`bindings` 是 `WeakMap<agentKey, ScopeParentBinding>`，只保存可重绑能力，不保存第二份 composition 状态（`packages/preset/agent-presets/src/index.ts:241-260`）。

## 一次 Agent 创建怎样穿过 Scope

```mermaid
sequenceDiagram
  participant Host
  participant Loop as Agent Loop
  participant Scope as dsh-scope
  participant Presets as AgentPresets
  participant Loader
  participant Registry as Tools / SystemPrompt

  Host->>Loop: createAgent(setup)
  Loop->>Scope: createScope(loopCtx, agent)
  Scope-->>Loop: agent.ctx + dispose
  Loop->>Presets: setup(agent.ctx): mount(presetId)
  Presets->>Presets: ensureStanding(preset)
  alt 首次使用或文件有新 generation
    Presets->>Scope: createScope(selfCtx, standingKey)
    Presets->>Loader: mountPreset(standing.ctx, agent.cordis.yml)
    Loader->>Registry: rows 通过 standing.ctx 注册
    Registry-->>Registry: 写入 preset layer，effect 归 standing fiber
  end
  Presets->>Scope: bindScopeParent(agentKey, standingKey)
  Loop->>Host: setup 成功后才发布 Agent / Session
  Note over Registry: 查询 agentKey 时按 global → preset → agent 合并
```

Agent Scope 在构造器里就创建，`agent.ctx` 是 scope context 再附加 `{ agent }` 的派生 Context（`packages/core/agent-loop/src/agent.ts:63-97`）【待主 agent 验证】。Agent factory 随后执行 `setup(agent.ctx)`，失败会调用同一条 memoized teardown，停止 driver、等待 idle、销毁 agent scope，再从 registry 移除 Agent 和 Session（`packages/core/agent-loop/src/index.ts:453-520,624-644`）【待主 agent 验证】。

这里有一个容易看错的地方：preset subtree 不挂在 agent fiber 下，而是挂在 `AgentPresets` 自己的 untraced `selfCtx` 下。它必须比单个 Agent 活得久，冷读历史时也要存在；若从 traced `this.ctx` 创建，Cordis 的 service resolution 会从调用方 shadow fiber 起步，preset row 反而拿不到自己声明注入的 service（`packages/preset/agent-presets/src/index.ts:120-135,490-533`；standing-mount Agent Note `2026-08-08-per-preset-standing-mounts.md:23-28`）。

同 preset 的多个 Agent 因而共享插件对象。它们仍互不串线，前提是插件把可变状态按 Session/Agent 分桶，注册表查询时携带 agent key。测试直接证明两个 Agent 读取的是同一个 realm-private service instance（`packages/preset/agent-presets/tests/mount.spec.ts:275-289`）。这是一条对 preset 插件作者的硬约束；“standing mount 会自动隔离内部 mutable field”是错误理解。

## 一条 parent chain，两个相反方向

Scope parent 同时服务两件事，方向正好相反。

注册表读取向下继承：先读 global，再读 preset，最后读 agent 自己。preset 的工具和 prompt section 因此能覆盖 global 默认；agent 自己的注册又能覆盖 preset。`ScopedLayers.peek()` 故意不沿链查询，因为“只看我自己注册了什么”常被 restriction、guard 等策略使用（`packages/core/scope/src/store.ts:172-217`）。

事件接纳向上传播：对 agent key 发出的 scoped event，会进入 unscoped listener、agent listener 和它的 preset ancestor listener；不会进入另一个 preset，也不会把 preset event 向下广播给 agent。`scopeTarget()` 在 dispatch 时沿 key 的 parent 逐级检查 listener tag（`packages/core/scope/src/index.ts:158-184`；`packages/core/scope/tests/scope.spec.ts:195-220`）。

这让 standing composition 里的 plan、compaction、jobs 等 listener 能观察所属 Agent 的事件，同时 sibling preset 保持安静。开发期 invariant 还会检查 scoped event 是否携带 carrier，以及 carrier key 是否与 payload 中的 subject 是同一对象（`packages/core/scope/src/invariant.ts:15-32`）。

子 Agent 不挂在 parent Agent key 下，而是直接加入 parent 所在的 standing preset。否则它会继承 parent 的 per-agent restriction，而且 parent 先销毁时，child 会悬在一个已死亡的 key 下。`composeFrom()` 复用同一个 generation，也避免 preset 文件刚被改过时，parent 和 child 落到两代配置（`packages/preset/agent-presets/src/index.ts:290-337`；`.agents/notes/implemented/bug-fix/2026-08-10-child-agents-join-their-parent-preset.md:15-31`）。

## persona 怎样做到只换一个 Agent

`dsh-system-prompt` 在 global layer 无条件注册 `deployment:persona`。`dsh-persona` 不创建第二套 prompt registry，它只在 preset scope 用同一个名字再注册一项。Prompt assembly 按 global → scope chain merge，同名 section 被最近 layer 覆盖（`packages/preset/persona/src/index.ts:1-23,54-68`；`packages/core/system-prompt/src/index.ts:457-505`）【待主 agent 验证】。

这套遮蔽有几个刻意保留的边角：

- `text: ''` 仍占住名字，所以 global persona 被遮掉；空 section 到 render 才消失（`packages/preset/persona/tests/persona.spec.ts:51-60`）。
- `complete: true` 让这段 persona 成为最终唯一 prompt section；`includeRuntimeContext: false` 则只在该 scope 压掉动态 context（`packages/preset/persona/src/index.ts:33-52,60-68`；测试 `89-127`）。
- 全局挂载 persona row 会和 system-prompt 自己的默认项撞名并立即失败。这不是遗漏，而是避免出现两个 global owner（`packages/preset/persona/tests/persona.spec.ts:20-37`）。

persona 说明了 Scope 的基本手法：不用 `if (agentId === ...)` 塞进共享逻辑，只需在正确 Context 上注册同名实现。

## 工具与 service 解析：scope 能管什么，不能管什么

Tools 和 SystemPrompt 主动采用了 `ScopedLayers`，所以它们理解 parent chain。Tool view 先合并 global 与祖先层，再应用链上的 restrictions，最后放入 agent 自己注册的工具；自己的回传工具不会被自己的 allow-list 删掉（`packages/core/tools/src/index.ts:1130-1183`）【待主 agent 验证】。

普通 Cordis service 没有这层语义。一个 preset row 若把 service 发布到 root realm，它就是进程全局的：第二个 preset 可能撞名，Host 也可能误读另一套 composition 的实例。`mountPreset()` 会审计已激活 row 和 root-realm service，失败时销毁整个 subtree（`packages/preset/agent-presets/src/mount.ts:274-380`）。真正属于 preset 的 service 要放进 Cordis `isolate` realm；Host 若已经持有 Agent，可通过 `serviceForAgent()` 按 standing mount 的 fiber membership 定位对应实例（同文件 `232-271`）。

所以，配置模板与运行时能力边界必须分开看：

| 层次 | 它决定什么 | 它不保证什么 |
|---|---|---|
| `agent.cordis.yml` | 这套 preset 尝试装哪些 plugin row | 不自动隔离 service，不授予安全权限 |
| scope layer | 工具、prompt、listener 等 scope-aware 注册项的可见性和销毁归属 | 不限制插件直接调用同进程 service |
| Cordis `isolate` realm | 同名 service provider 在 composition 之间不碰撞 | 不是 OS sandbox |
| Session Log | 记录并恢复 session 选择的 preset id | 不保存 composition generation；配置编辑或重启后，不能保证还原完全相同的工具与提示词 |

`AgentPreset.trust` 表示来源，也参与编辑策略：user preset 可写，system preset 不可删除；但它不是运行时权限或安全沙箱。源码明确说 user preset 与 shell access 同等可信，Scope 不会据此限制插件能力（`packages/preset/agent-presets/src/preset.ts:3-18`、`src/authoring.ts:65-70,182-195`）。

## 为什么已有内容后不能切 preset

Scope 机制本身允许随时 rebind，但它不知道 Session 里有没有历史。真正的产品规则在 Host gateway：`blank` 的定义是日志里尚无 `turn/start`；选择操作按 session 串行，再次检查 blank，随后调用 `recompose()`，成功后才追加 `agent-preset/selected`（`packages/host/apiproxy/src/api-proxy.ts:500-519,3083-3132`）【待主 agent 验证】。

当前 `recompose()` 也不是卸载旧 subtree 再挂新 subtree。它先确保目标 standing generation 可用，再通过 roster 私有保存的 binding 改 parent。目标 mount 失败，旧 parent 根本没动（`packages/preset/agent-presets/src/index.ts:437-471`）。

锁定的原因不是实现做不到，而是日志语义会断裂。旧历史里可能有新 preset 不认识的 tool call，prompt section 也不同；中途切换后，后续请求无法由一套稳定 composition 解释。blank switch 则没有模型 turn，完成 rebind 后把 preset id 记成 session event，`resolveSessionPreset()` 用最后一次选择覆盖 creation header（`packages/preset/agent-presets/src/session.ts:1-54`）。

## 它是怎样演进到这里的

| 日期 | 证据 | 设计变化 |
|---|---|---|
| 7 月 8 日 | `32db205c10` | 新建 `dsh-scope`：scope tag、carrier、fiber-owned dispose。 |
| 7 月 9 日 | `3d16026eb0`、`f387b774a9` | Tools/SystemPrompt 从单一全局 Map 变成 global + agent layer；Agent 获得 `agent.ctx` 和 setup window。 |
| 7 月 21 日 | `8351cdbe65` | 抽出 `ScopedLayers`、`NamedEntries`、`AnonymousEntries`，把重复的 effect/undo/layer 回收交给公共原语。 |
| 8 月 3 日 | `18fe174897`、`739042a804` | preset 和 persona 上线。第一版是一 session 一次 mount；Agent Note 明确测得约 3ms、600KB/会话（`2026-08-03-per-session-agent-presets.md:7-30`）。 |
| 8 月 8 日 | `e18aa2745c`、`d770fb21cc` | 冷 transcript presenter、projection、Host service 等读取方暴露 per-session mount 的缺口，改为 per-preset standing mount，并给 scope 增加 parent chain（`2026-08-08-per-preset-standing-mounts.md:7-28`）。 |
| 8 月 10 日 | `1eb9acaba9`、`bdcf940eea`、`e53f448650` | rebind 权限收进首次 bind 返回的 binding；child 直接加入 parent 的 standing preset，并修正工具 restriction 对祖先层的理解。 |

从这条历史可以做一个合理推断：团队最初有意保持 flat scope，避免把 conversation lineage 误当能力继承；standing mount 不是预先设计好的宏大层级，而是冷读取者与共享插件实例逼出的第二层。后来 child 也不连接 parent Agent，而是连接 standing preset，说明他们仍在限制层级语义，不愿把 parent chain 变成通用继承树。证据是早期 Note 明确拒绝 parent scope inheritance（`2026-07-08-agent-scope-contexts.md:141-167`），standing-mount Note 才引入合成 parent。

仍然未知：7 月设计 Agent Scope 时，团队是否已经计划过 preset。现有 commit message 和 Agent Note 没有直接证据，不应把后来的契合写成早有预谋。

## 亮点与问题

我最欣赏的是“同一个 Context 同时决定可见性与销毁”。如果注册 API 分别接收 `{ scope, owner }`，两者迟早会错配；这里用 Cordis effect ownership 把错误组合从 API 里删掉。parent chain 也没有侵入每个 registry 的配置格式，Tools 与 SystemPrompt 只需共享遍历顺序。

standing mount 的代价同样真实。一个 composition generation 一旦被 Agent 加入，就保留到整棵 Cordis tree 销毁；文件每改一代就多留一组 watcher 和插件实例。代码有 TODO，当前没有 joined-agent count 回收旧 generation（`packages/preset/agent-presets/src/index.ts:490-511`）。

`recompose()` 把“必须 blank”的检查交给调用者，底层 binding 看不到日志。这保持了包边界，但也意味着新的调用入口若绕开 gateway，可能在已有历史后改 parent。README 已明确写 caller owns the check（`packages/preset/agent-presets/README.md:19`）；这个约束需要所有新入口持续遵守。

文档目前存在几处可验证的漂移：`docs/glossary.md:13-21` 仍说 scope 只有 flat 两层且不继承；`docs/subsystems/scope.md:45-59` 只描述 global + exact layer；`packages/preset/agent-presets/README.md:47-51` 和 `tests/mount.spec.ts:501-512` 仍把 recompose 说成 unmount-then-mount，但当前代码只是 parent rebind；`package.json:3` 仍写 per-session composition。这些旧叙述正好暴露了 8 月 8 日架构反转留下的文档债。

Scope 解决了“这个 Agent 能看见哪些运行时能力”。下一章的 Agent Loop 会接过这个已经装配好的 `agent.ctx`：每一步从 Session Log 重建消息，再用当前 scope 组装 prompt、tool schema 和 scoped hooks，真正发起一次模型请求。

## 事实、推断与未知

- **已证实**：上文带源码行号、测试、commit 或 Agent Note 的当前行为与历史变化。
- **合理推断**：flat scope 到受控 parent chain 的变化，是 cold-reader 与共享实例压力下的局部扩展，而非通用继承模型；依据见演进表与 alternatives。
- **仍然未知**：7 月初是否已有 preset 路线图；为什么没有在 8 月 8 日同时修完所有旧文档。仓库没有可靠说明。

## 文件覆盖率

核心选定文件包括三个包的全部运行时源码、Scope 全部单测、AgentPresets 的 mount/session 行为测试、Persona 全部单测与三份英文 README。其余 AgentPresets authoring/discovery 测试不属于本章运行时主线；对应实现源码仍已全文阅读。

| 文件 | 总行数 | 已读行数 | 覆盖率 | 未读原因 |
|---|---:|---:|---:|---|
| `packages/core/scope/README.md` | 37 | 37 | 100% | — |
| `packages/core/scope/src/index.ts` | 204 | 204 | 100% | — |
| `packages/core/scope/src/store.ts` | 267 | 267 | 100% | — |
| `packages/core/scope/src/invariant.ts` | 41 | 41 | 100% | — |
| `packages/core/scope/src/scoped-events.generated.ts` | 49 | 49 | 100% | — |
| `packages/core/scope/tests/scope.spec.ts` | 222 | 222 | 100% | — |
| `packages/core/scope/tests/store.spec.ts` | 289 | 289 | 100% | — |
| `packages/core/scope/tests/invariant.spec.ts` | 108 | 108 | 100% | — |
| `packages/preset/agent-presets/README.md` | 154 | 154 | 100% | — |
| `packages/preset/agent-presets/src/authoring.ts` | 196 | 196 | 100% | — |
| `packages/preset/agent-presets/src/discovery.ts` | 186 | 186 | 100% | — |
| `packages/preset/agent-presets/src/index.ts` | 572 | 572 | 100% | — |
| `packages/preset/agent-presets/src/invariant.ts` | 80 | 80 | 100% | — |
| `packages/preset/agent-presets/src/metadata.ts` | 105 | 105 | 100% | — |
| `packages/preset/agent-presets/src/mount.ts` | 381 | 381 | 100% | — |
| `packages/preset/agent-presets/src/preset.ts` | 93 | 93 | 100% | — |
| `packages/preset/agent-presets/src/session.ts` | 54 | 54 | 100% | — |
| `packages/preset/agent-presets/src/types.ts` | 17 | 17 | 100% | — |
| `packages/preset/agent-presets/tests/mount.spec.ts` | 736 | 736 | 100% | — |
| `packages/preset/agent-presets/tests/session.spec.ts` | 62 | 62 | 100% | — |
| `packages/preset/persona/README.md` | 41 | 41 | 100% | — |
| `packages/preset/persona/src/index.ts` | 68 | 68 | 100% | — |
| `packages/preset/persona/src/invariant.ts` | 31 | 31 | 100% | — |
| `packages/preset/persona/tests/persona.spec.ts` | 142 | 142 | 100% | — |
| **合计** | **4135** | **4135** | **100%** | **达标 ✅（核心最低 90%）** |

验证补充：尝试运行上述 focused tests 时，`pnpm` 在自动依赖状态检查阶段因缺少 `eslint@10.5.0` 的 package metadata 报 `ENOENT`，测试未启动；`git status --short` 仍为空，源仓库无 tracked 改动。因此本章不把“测试当前通过”列为已验证事实，只把已经全文阅读的测试当作行为证据。
