# 外部与仓库研究笔记

## 项目解决的问题

DeepSeek Harness 不是单一聊天循环，而是一套可分发的 Coding Agent Runtime。固定快照同时支持 Web 与 headless 入口，允许插件化模型、工具、持久化、策略和 per-agent preset，并把长期 Session 作为恢复与 UI 的共同事实源。

它要同时满足几组互相拉扯的需求：

- 产品能力可热替换，但生命周期、依赖和清理必须确定；
- 多个 Agent 共用基础设施，但工具、persona 和 listener 要局部可见；
- 模型请求追求流式低延迟，已经发生的外部副作用又必须有耐久边界；
- Web、headless 和 SDK 需要同一份领域事实，却不能各写一套 fold；
- Provider 保留真实差异，Agent Loop 又不能认识每家 SDK。

## 为什么单独做一个 Harness

官方仓库没有一篇“为什么不直接在既有 Coding Agent 上扩展”的竞品说明。能确认的是，这套产品把运行时 composition、Session replay、per-agent scope 和 Provider seams 都做成了一等边界，而不是只在模型循环外包一层 CLI。

【合理推断】独立 Harness 的价值在于控制这些跨层合同：request/header、tool ordered commit、checkpoint、Host projection 和 plugin lifecycle 很难作为彼此独立的小补丁叠在一个只暴露 messages/tools API 的框架上。不能把这个推断写成官方选型理由。

## 设计来源与已知证据缺口

首批提交在极短时间内放入 Cordis、五组接口、Agent Loop 和架构文档，说明公开仓库开始前已经存在成套设计。早期 `AGENTS.md` 曾指向两份仓库外的需求与架构材料；正文没有保存在 Git 中。找不到这些材料时，只能还原 Git 可证实的设计演进，不能声称知道团队内部的完整心路。

## 同类设计对照

MVP 不做大型竞品横评。对比只在具体设计旁出现，例如事件日志与可变消息数组、插件树与固定循环、Host 单一投影与客户端重复计算。

## 官方材料清单

- 根 `README.md`、`docs/architecture.md` 与 `docs/agent-lifecycle.md`；
- `docs/subsystems/**` 的 Session、Persistence、Tools、LLM、Scope 资料；
- Cordis 七章教程与 vendored Runtime / Loader / Include 源码；
- 六个核心系统的 Package README、实现与 focused tests；
- `.agents/notes/implemented/**`、`proposed/**`、`archive/**` 与 postmortems；
- Config、Tool、Persistence event、依赖图等 generated catalogs；
- 完整 Git DAG、first-parent 历史、关键 commit body 与 diff；
- 官方 headless Session fixture，用于无密钥 replay 实验。

研究索引见：

- [`research/evolution-timeline.md`](../research/evolution-timeline.md)
- [`research/documentation-system.md`](../research/documentation-system.md)
- [`drafts/07-cross-validation.md`](07-cross-validation.md)
- [`drafts/08-coverage.md`](08-coverage.md)
