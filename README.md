# DeepSeek Harness Explained

这是 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的非官方中文深度拆解与证据库。

首版固定在 commit [`47f943859bef60e4160492346772ded9b24f765a`](https://github.com/deepseek-ai/deepseek-harness/commit/47f943859bef60e4160492346772ded9b24f765a)，对应 `0.1.0-rc.5` developer preview。这里研究的是这一个快照，不把后续版本的行为悄悄写回首版结论。

## 这里要回答什么

- 这套 Harness 的架构从哪里来，Cordis 在里面到底做了什么；
- 为什么真正的两根支柱是 Cordis 运行时与 Session Event Log；
- Profile、Scope、Agent Loop、Tool 和 LLM 怎样连成一次完整执行；
- 哪些抽象被删除或推翻，当前设计如何从提交历史中长出来；
- DeepSeek 如何让文档同时服务人类、Coding Agent 和 CI。

最终长文发布在 [xdlkc.github.io](https://xdlkc.github.io/)。本仓库保留研究计划、模块草稿、证据表、覆盖率和可运行实验。

## 证据规则

正文使用三种明确标记：

- **已证实**：源码、测试、提交说明、Agent Note 或官方文档直接支持；
- **合理推断**：多份证据共同支持，但作者没有明说；
- **仍然未知**：仓库材料不足，例如 TUI 被删除的完整产品原因。

不使用 Star、代码量或提交数替代架构判断。提交历史能证明设计如何变化，不能替作者描述未写下来的心理活动。

## 目录

```text
drafts/       研究计划、核心模块分析、交叉验证和覆盖率
research/     演进时间线、文档体系、证据索引
experiment/   无密钥 Session Log 重放实验
site-assets/  发布用静态资源的源文件或说明
```

## 无密钥实验

[`experiment/`](experiment/) 直接读取官方仓库的 headless 快照，再调用固定源码中的 `Session.create()`、`requestHeader()` 和 `deriveMessages()`。它会显示 32 个持久事件如何投影成 5 条模型可见消息，并还原两次模型请求各自的历史。

```bash
./experiment/run.sh
```

详见 [实验说明](experiment/README.md)。

## 更新策略

首版快照永久保留。上游变化单独记录“与首版相比发生了什么”，不会无提示地改写旧结论。若一个源码链接与当前 `master` 不同，请先核对 URL 中的固定 commit。

## 声明

这是独立研究项目，与 DeepSeek 官方没有隶属关系。引用的代码、文档和提交历史来自原仓库；评论与推断由本项目作者负责。
