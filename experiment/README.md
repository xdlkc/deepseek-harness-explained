# 无密钥实验：从 Session Log 重建模型所见

这个实验读取 DeepSeek Harness 自带的 `headless-profile` 快照。快照记录了一次完整的两步工具回合：模型先调用 Bash，工具结果进入日志，下一次模型请求再读取这段历史。

实验直接调用固定源码快照中的三个公开入口：

- `Session.create()` 校验并重放事件；
- `requestHeader()` 从 `request/header` 事件恢复系统提示词、工具 schema 和调用配置；
- `deriveMessages()` 从带 `surfaceOp` 的事件恢复模型消息历史。

## 运行

先在相邻目录准备官方源仓库并安装依赖：

```text
/path/to/
├── deepseek-harness/
└── deepseek-harness-explained/
```

```bash
cd deepseek-harness
pnpm install
cd ../deepseek-harness-explained
./experiment/run.sh
```

不需要 `DEEPSEEK_API_KEY`。默认输入是官方仓库的：

```text
examples/headless-agent/tests/snapshots/headless-profile/session.expected.jsonl
```

也可以传入另一份 packed session JSONL：

```bash
./experiment/run.sh ../deepseek-harness/examples/headless-agent/tests/snapshots/headless-profile/session.expected.jsonl
```

## 观察什么

第一次 `request/header` 出现时，模型历史只有用户输入和运行时上下文。Bash 的 `tool-call` 与 `tool-result` 落入日志后，第二次请求的历史会多出这两条消息。

这里有个容易忽略的区别：Session Log 中有 turn、step、流式 chunk、用量和其他运行事件，但 `deriveMessages()` 不会把它们全塞给模型。只有进入 Session Surface 的事件才成为模型历史。

实验中的 system prompt 和 tool schema 在官方快照里使用占位符，脚本分别替换成说明文字和空数组。因此实验验证的是重放机制和消息边界，不用于检查默认提示词的完整内容。
