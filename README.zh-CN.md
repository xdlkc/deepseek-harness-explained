# DeepSeek Harness Explained

[English](./README.md) | 简体中文

这是 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的非官方中文深度拆解与证据库。

- **固定快照**：commit [`47f943859bef60e4160492346772ded9b24f765a`](https://github.com/deepseek-ai/deepseek-harness/commit/47f943859bef60e4160492346772ded9b24f765a)，对应当时快照的 `0.1.0-rc.5` developer preview 包版本（仓库当时无 Git tag）。后续上游版本变化不会悄悄回写到首版结论中。
- **发布长文**：[xdlkc.github.io/deepseek-harness/](https://xdlkc.github.io/deepseek-harness/)
- **文档语言**：主分析报告（[`ANALYSIS_REPORT.md`](./ANALYSIS_REPORT.md)）、模块研究草稿（`drafts/`）与演进/文档专题（`research/`）均为**简体中文**。

## 这里要回答什么

1. **Cordis 与微内核从哪里来**：为什么 `"Everything is a plugin"` 依然依赖框架内核（`Context` / realm 隔离、`Fiber` / `effect` 所有权回收、热更新补偿事务，以及源码 vendor 的原因）。
2. **为什么真正的两根支柱是 Cordis 运行时与 Session Event Log**：前者管理可撤销、可替换的运行实例，后者记录不可随意撤销的持久事实并派生模型上下文与 Host 投影。
3. **一次输入如何走完整条链**：Profile / Bundle 装配树、Agent Scope（`global → preset → agent` 与 standing preset mount）、Agent Loop（策略薄、并发执行工具但按模型顺序提交）、Tool / LLM Capability（由 `llm-deepseek` 与 `llm-pi-ai` 双实现验证的 Definition / Provider / Consumer 边界）怎样互相咬合。
4. **设计如何从 12,293 次可达提交（972 次 first-parent）中演进**：哪些抽象被删除或推翻——逐个删掉 `agent/*` 瞬态事件镜像、撤回客户端领域投影回收到 Host 单点计算、放弃通用 `dsh-mode` 退回专用 Plan Mode。
5. **DeepSeek 如何把文档建成工程门禁**：`pnpm run doc-sync`、类型等价校验、生成目录、Package README 的 `Model Experience`、以及 541 份活跃 + 142 份归档 Agent Notes 如何同时服务人类、Coding Agent 与 CI，又在哪些地方仍存在语义漂移。

## 证据规则与阅读覆盖率

正文严格区分三种证据等级：

- **已证实**：源码、测试、提交说明、Agent Note 或官方文档直接支持；
- **合理推断**：多份独立证据共同支持，但作者未明说；
- **仍然未知**：仓库材料不足（例如 TUI 被删除的完整产品原因），留待采访而不编造动机。

六个核心系统（Cordis Runtime、Profile / Bundle、Agent Scope、Agent Loop、Session Event Log、Tool / LLM Capability）的公开阅读分母合计 **`32,766 / 32,766` 行（100%）**，每份模块草稿与最终总稿均经过独立对抗审查。逐模块分母、排除范围与验证边界见 [`drafts/08-coverage.md`](./drafts/08-coverage.md)。

## 无密钥重放实验

[`experiment/`](./experiment/README.md) 直接读取官方仓库的 `headless-profile` 会话快照，调用固定源码中的 `Session.create()`、`requestHeader()` 与 `deriveMessages()`，无需 `DEEPSEEK_API_KEY`。

将官方 `deepseek-harness` 仓库放在相邻目录并安装依赖后运行：

```bash
cd ../deepseek-harness
pnpm install
cd ../deepseek-harness-explained
./experiment/run.sh
```

实验会展示 `32` 条持久 seed 事件如何投影成 `5` 个模型可见 Surface 节点，并还原 `2` 个 `request/header` epoch 各自的请求历史。详见 [`experiment/README.md`](./experiment/README.md)。

## 仓库导览

| 路径 | 内容说明 |
|---|---|
| [`ANALYSIS_REPORT.md`](./ANALYSIS_REPORT.md) | 完整中文深度拆解总稿 |
| [`research/evolution-timeline.md`](./research/evolution-timeline.md) | 提交历史演进证据表与三次核心架构反转 |
| [`research/documentation-system.md`](./research/documentation-system.md) | 文档分层、`doc-sync` 机械门禁与 Agent Notes 研究 |
| [`drafts/03-plan.md`](./drafts/03-plan.md) | 研究计划、代码规模统计与审查标准 |
| [`drafts/03-research.md`](./drafts/03-research.md) | 仓库调研与阅读路线 |
| [`drafts/04-design-direction.md`](./drafts/04-design-direction.md) | 长文视觉与“运行时剖面图”信息设计说明 |
| [`drafts/05-modules-plan.md`](./drafts/05-modules-plan.md) | 六大模块串联叙事骨架 |
| [`drafts/06-module-cordis.md`](./drafts/06-module-cordis.md) | 模块拆解：Cordis Runtime 与 Loader |
| [`drafts/06-module-profile-bundle.md`](./drafts/06-module-profile-bundle.md) | 模块拆解：Profile 与 Bundle 装配语言 |
| [`drafts/06-module-agent-scope.md`](./drafts/06-module-agent-scope.md) | 模块拆解：Agent Scope 与 standing mount |
| [`drafts/06-module-agent-loop.md`](./drafts/06-module-agent-loop.md) | 模块拆解：Agent Loop 与 turn/step 编排 |
| [`drafts/06-module-session-log.md`](./drafts/06-module-session-log.md) | 模块拆解：Session Event Log、Surface、持久化与投影 |
| [`drafts/06-module-capabilities.md`](./drafts/06-module-capabilities.md) | 模块拆解：Tool 与 LLM Capability 边界 |
| [`drafts/07-cross-validation.md`](./drafts/07-cross-validation.md) | 跨模块冲突交叉验证与文档漂移清单 |
| [`drafts/08-coverage.md`](./drafts/08-coverage.md) | 核心阅读覆盖率（`32,766 / 32,766`）与审查状态 |
| [`drafts/08-insights.md`](./drafts/08-insights.md) | 架构、演进与独立开发者实践洞察汇总 |
| [`experiment/`](./experiment/README.md) | 无密钥 Session Log 重放脚本（[`inspect-session-replay.ts`](./experiment/inspect-session-replay.ts)、[`run.sh`](./experiment/run.sh)） |
| [`site-assets/architecture-explorer.html`](./site-assets/architecture-explorer.html) | 发布站交互式架构剖面图 HTML 源文件 |
| [`CHANGELOG.md`](./CHANGELOG.md) | 快照固定与研究更新记录 |

## 许可与声明

本仓库采用 [MIT License](./LICENSE) 开源。

这是独立研究项目，与 DeepSeek 官方没有隶属关系。引用的源码、文档与提交历史归 [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness) 原作者所有；评论、推断与可能存在的疏漏由本仓库作者负责。
