# DeepSeek Harness 设计演进证据表

固定快照：`47f943859bef60e4160492346772ded9b24f765a`。时间以 Git author date 为主；进入主线较晚的分支同时在正文标 committer date。

| 时间 | Commit | 已证实的变化 | 可说到哪里 | 不能替作者说什么 |
|---|---|---|---|---|
| 06-10 | `b67e81ac` / `804eede9` | 初始化仓库；`AGENTS.md` 链接 MVP 需求分析和微内核设计文档 | 公开代码之前已有前置设计材料 | 不能断言来自某个私有仓库；外部文档正文未归档 |
| 06-11 | `72688a38` | Cordis 及周边包以源码形式 vendor；记录上游版本、SHA 和同步流程 | 微内核不是后期包装 | 没证据表明团队完整比较过所有 DI/插件框架 |
| 06-11 | `d5a1d9bb` / `43f42582` | LLM、Session、Prompt、Tools、Agent 接口与具体 Loop 成套落地 | 首版已经有服务边界和事件溯源 Session | 不能把数分钟的公开提交顺序当成真实设计用时 |
| 06-11 至 06-16 | `d2fb352f`、`bfb03483`、`630bbddf`、`dabc2ff4` | 最大严格度 TS、逐文件 100% 覆盖率、构建器和包管理器迁移 | 工程门禁先于多数产品功能建立 | “为了未来某次具体重构”只是推断 |
| 06-15 至 06-22 | `df4b7d3d`、`9126697d`、`7aabd2a3`、`f393043b` | persistence 与 subagent 都用多个机制不同的 provider 验证 seam | 能总结出 Definition/Provider/Consumer 的反复实践 | 不把偶然开发顺序写成正式团队方法论，除非 Note 明说 |
| 07-02 至 07-06 | `140f818a`、`b84d4828`、`c6d2eeea`、`2093a889` | 删除 turn/step/chunk/steering 的瞬态镜像；每次请求从日志重建 | Session Log 从数据结构变成跨系统唯一事实源 | 不说“事件总线失败”，被删的是重复事实源 |
| 07-08 | `32db205c` | 增加 per-agent scoped context；同一事实驱动可见性和生命周期 | 共享基础设施与局部能力开始分开 | preset generation 和后续产品化要按当前代码补充，不能投射回首版 |
| 07-10 至 07-22 | `63ced3e0` / `f4185122` | 先建通用 Mode，再删除 abstraction、保留专用 Plan | 团队确实撤回过过宽抽象 | 删除 commit 无 body，触发原因未知 |
| 06-19 至 08-04 | `072f97c1`、`1119c537`、`a6a3807a`、`4cadf096`、`10bb9cbf` | stdio 被抽包；新增 TUI；Web 骨架进入；随后 stdio Agent、TUI 与旧入口被删 | 当前前门已收敛到 Web + headless | TUI 删除原因未知，不能擅写成“维护成本”或“Web 更好” |
| 07-27 | `fbebe175` / `f72f06e8` / `91312529` | 先做客户端领域 projection cell，同日 RFC 收敛到 Host 单一计算并删掉客户端 fold | 可明确讲“双实现与一致性风险”导致架构反转，commit body 有证据 | 不能扩大成“客户端永远不做计算” |
| 07-28 | `c330c1cd` | projection cache 和 cold-read ladder 落地 | Host 单一计算不等于每次全量重放 | 缓存是性能层，不是第二事实源 |
| 08-06 | `2365b2c5` / `9235d0f9` / `cd6b4ee3` | base/web/headless Bundle、Profile 机器和 pnpm 插件管理落地 | 插件树从内部架构变成用户分发模型 | manifest 字段后续有改名，正文以当前源码为准 |
| 08-13 | `a2d0f7f4` | 全仓实施 naming contract，不保留 alias/shim | developer preview 允许一次性清理词汇和包边界 | 不能把所有改名都说成职责变化；commit 明确说不改职责 |

## 三条最适合正文展开的反转

### 瞬态事件镜像被逐个删掉

这条线最能解释“model-visible ⟺ logged”为何不是口号。早期同时有 durable Session Event 和 `agent/*` 实时镜像。实际消费者迁到 Session 后，镜像只剩重复事实，且可能让监听顺序产生差异，于是 turn、step、chunk、steering 依次删除。

### 客户端领域投影当天被撤回

`fbebe175` 先把领域折叠逻辑放入客户端 cell；`f72f06e8` 的 RFC 随即确定 Host 是唯一计算点；`91312529` 删除 661 行客户端 projection machinery。这里的证据足以说明原因：同一领域 fold 在 Host 与 Client 各写一份会制造一致性风险。客户端后来只接收带 seq 的通用值。

### 通用 Mode 退回专用 Plan Mode

通用 `dsh-mode` 曾经有完整的日志状态、Prompt 过滤和 Tool gate。十二天后，`f4185122` 删除通用抽象。仓库能证明抽象被撤回，却没有留下完整理由。正文应该保留这个缺口，并把它列为采访问题。

## 两个时间陷阱

1. 仓库没有 Git tags。`0.1.0-rc.5` 只能称为 HEAD package version / release commit，不写成 tagged stable release。
2. `a6a3807a` 这类分支的 author date 早于进入主线的 committer date。交互时间线应同时展示“开始开发”和“进入主线”，或明确只展示其中一种。
