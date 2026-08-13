# 核心研究覆盖率

覆盖率分母是每个子研究在开始前选择的核心生产源码、关键测试和直接文档。它回答“这份模块结论是否读完了自己的核心证据”，不回答“读完了多少全仓代码”。外围 UI、生成文件、快照和与主线无关的 authoring 测试不计入分母。

| 核心系统 | 已读行数 | 分母 | 覆盖率 | 独立对抗审查 |
|---|---:|---:|---:|---|
| Cordis Runtime | 6,090 | 6,090 | 100% | 已完成 |
| Profile / Bundle | 4,990 | 4,990 | 100% | 已完成 |
| Agent Scope | 4,135 | 4,135 | 100% | 已完成 |
| Agent Loop | 3,884 | 3,884 | 100% | 已完成 |
| Session Event Log | 6,173 | 6,173 | 100% | 已完成 |
| Tool / LLM Capability | 7,494 | 7,494 | 100% | 已完成 |
| **合计** | **32,766** | **32,766** | **100%** | **6 / 6** |

每个模块的逐文件分母和排除理由在对应 `drafts/06-module-*.md` 末尾。对抗审查不是重新逐行阅读全部分母；reviewer 抽查关键结论、反例、引用和历史证据，并直接修订草稿。

## 外围范围

Web、ACP、Python SDK、Typer RPC 和 Client UI 只在与 Host projection、Session carrier、Profile/Bundle 或能力边界相接处定点阅读。MVP 不做 UI 组件目录导览，也不给它们虚构一个低意义的全量覆盖率。

## 已运行验证

- 无密钥 Session replay 实验已实际运行；固定 fixture 的 32 个事件得到 5 个 model-visible nodes。
- 六个模块引用的关键 commit 由作者或 reviewer 检查存在性。
- Mermaid 围栏与 Markdown 结构做过静态检查；部分官方仓库 focused test 受现有依赖元数据 / DOMPurify 环境错误阻塞，未把“测试全部通过”写成事实。
- 官方源仓库 tracked files 在研究后保持 clean。

