# 交叉验证记录

固定快照：`47f943859bef60e4160492346772ded9b24f765a`。

这份记录不重复六个模块结论，只保存模块之间互相校验时发现的边界冲突。最终正文采用“当前源码 > 当前测试 > 已实施 Note > proposed RFC / 旧文档”的证据顺序；历史材料仍用于解释演进，但不替现状作证。

## 已解决的冲突

| 议题 | 表面冲突 | 交叉验证后的结论 |
|---|---|---|
| Loop 与 Persistence | 旧 cancellation / lifecycle Note 写成 Loop 在 turn 末 `flush()` | 现行 Loop 不调用 `flush()`；持久化屏障属于 `session-checkpoint-policy`。Loop 产生命周期事实，policy 选择耐久边界。 |
| Request reconstruction | 旧 Note 容易读成生产时从 fresh Session 完整重建 | 生产 invariant 使用 live `Session.deriveMessages()`，并只比较部分 Header 字段；fresh-Session reconstruction 由测试覆盖。 |
| Header 与请求计数 | fixture 有两个 `request/header`，看起来像每次调用一个 marker | Header 是 epoch。首个 Loop、resume 或字段变化时才写；不能把 marker 数当模型调用数。 |
| Tool 并发 | ToolRuntime 定义执行流水线，Agent Loop 又有 scheduler | ToolRuntime 拥有单次调用的 prepare/dispatch/finalize；Loop 拥有 sibling 分组、并发窗口和 `tool/result` 有序提交。 |
| Tool 与 Session | “Loop 拥有 tool call/result”容易扩大成工具不能写 Session | 类型仍暴露 `exec.agent`。模型直调路径的配对提交归 Loop，工具可写自己领域内的事件。 |
| Cordis rollback | “transactional reload”容易理解成隔离事务 | 它是补偿事务。候选副作用可能短暂可见；补偿也失败时抛 `AggregateError`，不保证旧树完整。 |
| Scope 实例隔离 | per-preset standing mount 容易理解成每 Agent 一份实例 | 同一 preset generation 的插件实例被多个 Agent 共享；隔离依赖 scope-aware registry 与按 Session/Agent 分桶。 |
| Preset recompose | README / 旧测试文案说 unmount-then-mount | 现行实现先确保目标 generation，再 rebind parent；目标失败时旧 binding 未动。 |
| Projection RFC | proposed RFC 写了候选规则，基础设施代码已落地 | RFC 只说明取舍。当前实现允许同 key、同 stateVersion 的共享 unit；不同版本才拒绝。 |
| Projection failure | “observer containment”看起来能隔离坏 unit | Session 事实不回滚，但 unit drive 内无逐 unit 隔离。坏 unit 可让自己和后续 unit 漏事件，普通 history 也可能整体失败。 |
| LLM snapshot | `prepareCall()` 容易概括成“整次调用配置冻结” | 它固定 registry owner 与 core call config。Provider settings 在 `resolveModel()` 和 `stream()` 各取 snapshot，二者之间没有共同快照。 |
| Model catalog | UI 有 catalog，看起来是运行白名单 | Registry 路由 provider；具体 model 是否接受由 adapter 决定。DeepSeek 可透传未知 model，pi-ai 要能在 collection 中解析。 |

## 当前文档漂移

以下材料对理解历史仍有价值，但不能按字面描述当前实现：

1. `docs/agent-lifecycle.md` 的图把 System Prompt assembly 放在 `user/message` 之后；源码在 pre-step、`step/start` 之前组装。
2. Scope glossary / subsystem 文档仍主要描述 flat global + exact layer；当前已有 `global → preset → agent` parent chain。
3. Agent Presets README 把 recompose 描述为 unmount-then-mount；当前是受控 binding rebind。
4. 旧生命周期 Note 说 Loop 在 turn 末 flush；当前 checkpoint policy 接管。
5. Projection RFC 仍处于 proposed 目录，但 registry、cache 和 Host carrier 已实现。状态名不能直接代替代码现状。

## 没有被解决的问题

- 通用 Mode 删除与 TUI 删除的完整产品原因没有公开证据。
- Session 记录 preset id，不记录 composition generation；代码与配置变化后的历史行为复现边界仍在。
- Projection unit 失败后的 per-unit catch-up 尚无当前实现。
- `resolveModel()` 与 `stream()` 之间是否需要共享 Provider snapshot，没有公开决策。
- 外部飞书里的初始 MVP / 微内核设计正文未归档，无法独立引用。

这些项在最终文章中标成“仍然未知”或维护者采访问题，不用合理故事填空。

