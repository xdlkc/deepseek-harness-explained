# 文档系统：它服务的不是一种读者

固定快照：`47f943859bef60e4160492346772ded9b24f765a`。

## 文档的真实分工

| 材料 | 主要读者 | 负责的问题 | 不负责的问题 |
|---|---|---|---|
| 根 README | 初次接触者 | 项目定位、安装、启动 | 设计取舍 |
| `docs/user/guide` | Web UI 用户 | 从配置模型到完成第一项任务 | 框架原理 |
| `docs/user/develop` | 插件作者 | Basic → Framework → Practice 的学习路线 | 全量 API |
| Cordis 教程 | 想理解底层框架的开发者 | Context、服务、事件、插件生命周期 | Harness 各子系统细节 |
| `docs/architecture.md` | 修改 `packages/` 的贡献者 | 当前系统地图、循环和扩展点 | 类型细节、历史故事 |
| `docs/subsystems` | 深入某个子系统的人 | 类型、事件与服务语义 | 教程叙事 |
| Package README | 某个包的使用者与维护者 | 配置、限制、扩展点、模型体验 | 其他包的职责 |
| Agent Notes | 维护者与架构研究者 | 为什么这样选、放弃了什么 | 日常操作教程 |
| Postmortem | 事故调查者 | 时间线、根因、修复和教训 | 普通变更历史 |
| 生成目录与图谱 | 查表者、CI | 配置、工具、持久事件、依赖的穷尽事实 | 解释这些事实为何重要 |
| AGENTS / Skills | Coding Agent | 当前任务必须遵守的约束和流程 | 产品说明 |

这套分层有一条很硬的规则：一个事实只有一个正式归属。架构文档不能塞入类型定义，Package README 不能重述生成目录，耐久文档不能叙述“以前如何”。`docs/AGENTS.md` 把这种分工写成门禁，而不是建议。

## 三条阅读路径

官方材料实际提供了三条逐步加深的路径：

1. 产品路径：根 README → Web 快速开始 → 模型与工作区配置。
2. 插件作者路径：第一个插件 → Tool / Config → 生命周期、服务、事件 → LLM Adapter。
3. 框架理解路径：Cordis 七章教程 → Harness 架构 → 子系统与 API。

路径设计不差。真正的断层在另一个方向：读者想问“这版为什么长成这样”，当前文档会把他送到 541 份活跃 Agent Note、142 份归档 Note 和 Git 历史里。官方文档有地图，也有档案柜，缺一条替外部读者串好的演进故事。

## 文档怎样被代码约束

`pnpm run doc-sync` 不是拼写检查。它串起二十多项门禁，包括：

- 从源码和 JSDoc 生成 Cordis、Tool、Config、Persistence 目录；
- `ts type-equiv` 对照文档中的类型声明；
- Markdown 链接、source ref、package path 和 Mermaid 校验；
- 英中配对、结构与 freshness hash；
- Agent Note 生命周期目录与固定格式；
- 每个 Package README 的 Model Experience 与 Known Limitations；
- 文档字数预算和 VitePress 构建。

这里最值得写进正文的，不是“文档很多”，而是代码、文档和 CI 之间的机械联系。比如工具目录会真实启动插件读取 schema；Package README 必须说清模型能看到什么、Token 和 KV Cache 会受到什么影响。文档变成了接口的一部分。

## Agent Notes 是设计记忆，不是博客

活跃 Agent Note 的结构固定为：

```text
Problem
Decision / Proposal
Alternatives considered
Consequences / Risks
```

状态由目录和头部共同表达，门禁交叉验证。一个实施记录如果只说采用了什么，却不记录真实考虑过的替代方案，会被视为不完整。

这里也有明确代价。Agent Notes 不建集中索引，目录和搜索就是入口。对熟悉仓库的人，这减少了另一个会腐烂的目录；对外部读者和阅读障碍者，五百多份记录几乎等于没有入口。我们的长文不会复制全部 Notes，而是挑十条主干决策，并给每条一个可展开的证据入口。

## 双语系统的一个摩擦

英文是 canonical，中文使用配对文件和 hash freshness 保持同步。普通 Markdown 相对链接仍指向英文 canonical 文件；文档站在投影时把路由映射到中文页。在 GitHub 里直接阅读中文文件，读者可能点进英文页。这是机器一致性与仓库内中文阅读之间的真实取舍。

## 我们从中借用的阅读形态

- 用架构图和事件矩阵承担多对多关系，不把所有边画在一张巨图上。
- 每个设计节点用 `Problem → Decision → Alternatives → Consequences` 的证据卡展开。
- 把“模型看到什么”与代码结构分开说明。
- 长目录、diff 和源码默认折叠，正文只保留读懂结论所需的最小片段。

这篇拆解与官方文档的分工也要明确：官方文档拥有当前事实，我们负责把当前事实与历史证据连成一条低负担的解释路径。
