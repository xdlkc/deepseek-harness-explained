# DeepSeek Harness Explained

English | [简体中文](./README.zh-CN.md)

An unofficial architectural teardown and evidence repository for [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness).

- **Pinned snapshot**: commit [`47f943859bef60e4160492346772ded9b24f765a`](https://github.com/deepseek-ai/deepseek-harness/commit/47f943859bef60e4160492346772ded9b24f765a) (`0.1.0-rc.5` developer preview package version; upstream had no Git tags at snapshot time). Upstream changes after this commit are not silently backported into v1 conclusions.
- **Full essay**: [xdlkc.github.io/deepseek-harness/](https://xdlkc.github.io/deepseek-harness/)
- **Language note**: The full report ([`ANALYSIS_REPORT.md`](./ANALYSIS_REPORT.md)), module drafts (`drafts/`), and research records (`research/`) are written in **Simplified Chinese**. This README provides the English entry point and repository guide.

## Core Research Questions Answered

1. **Where the architecture comes from and what Cordis actually does**: Why `"Everything is a plugin"` still rests on a framework kernel (`Context` / realm isolation, `Fiber` / `effect` disposal ownership, compensatory reload transactions, and why Cordis was vendored in-repo).
2. **Why there are two interlocking kernels**: How **Cordis Runtime** (mutable, hot-reloadable live instances) pairs with **Session Event Log** (append-only durable facts, `Surface` projection, `request/header` epochs, and Host single-point projections).
3. **How execution wires together end-to-end**: How **Profile / Bundle** (entry ID assembly and patches), **Agent Scope** (`global → preset → agent` lookup and per-preset standing mounts), **Agent Loop** (thin policy, turn/step coordination, concurrent tool execution with deterministic model-order commit), and **Tool / LLM Capability** (Definition / Provider / Consumer boundaries validated by `llm-deepseek` and `llm-pi-ai`) connect for a single user input.
4. **How the design evolved across 12,293 reachable commits (972 first-parent commits)**: Which abstractions were removed or reverted—deleting transient `agent/*` event mirrors, pulling client-side domain projection back to Host, and retiring generic `dsh-mode` in favor of Plan Mode.
5. **How documentation operates as an engineering gate**: How `pnpm run doc-sync`, CI type-equivalence checks, generated catalogs, per-package `Model Experience`, and 541 active + 142 archived Agent Notes keep human, agent, and CI views aligned—and where semantic drift still slipped through.

## Evidence Discipline & Coverage

Every claim in [`ANALYSIS_REPORT.md`](./ANALYSIS_REPORT.md) uses one of three explicit tiers:

- **Verified (`已证实`)**: Directly backed by source code, tests, commit messages, Agent Notes, or official docs at the pinned commit.
- **Reasonable Inference (`合理推断`)**: Supported by multiple independent artifacts without an explicit author statement.
- **Still Unknown (`仍然未知`)**: Insufficient public evidence in the repo (for example, the full product rationale behind deleting the TUI).

Selected core-module reading coverage totals **`32,766 / 32,766` lines** across six systems (`Cordis Runtime`, `Profile / Bundle`, `Agent Scope`, `Agent Loop`, `Session Event Log`, and `Tool / LLM Capability`), with independent adversarial review completed for all 6 module drafts and the final report. Per-module denominators and exclusions are documented in [`drafts/08-coverage.md`](./drafts/08-coverage.md).

## Keyless Session Replay Experiment

[`experiment/`](./experiment/README.md) reads the official `headless-profile` session snapshot directly and invokes `Session.create()`, `requestHeader()`, and `deriveMessages()` from the pinned DeepSeek Harness checkout—no `DEEPSEEK_API_KEY` required.

Place an official `deepseek-harness` checkout next to this repository and run:

```bash
cd ../deepseek-harness
pnpm install
cd ../deepseek-harness-explained
./experiment/run.sh
```

The replay demonstrates how `32` persisted seed events project into `5` model-visible Surface nodes across `2` `request/header` epochs. See [`experiment/README.md`](./experiment/README.md) for details and scope limits.

## Repository Guide

| Path | Contents (Chinese) |
|---|---|
| [`ANALYSIS_REPORT.md`](./ANALYSIS_REPORT.md) | Complete long-form architectural teardown and takeaways |
| [`research/evolution-timeline.md`](./research/evolution-timeline.md) | Commit-backed design evolution evidence table and key reversals |
| [`research/documentation-system.md`](./research/documentation-system.md) | Analysis of DeepSeek Harness documentation tiers, `doc-sync` gates, and Agent Notes |
| [`drafts/03-plan.md`](./drafts/03-plan.md) | Initial research scope, line-count breakdown, and review rules |
| [`drafts/03-research.md`](./drafts/03-research.md) | Repository survey and reading plan |
| [`drafts/04-design-direction.md`](./drafts/04-design-direction.md) | Visual layout and information design notes for the published essay |
| [`drafts/05-modules-plan.md`](./drafts/05-modules-plan.md) | Narrative structure linking the six core subsystems |
| [`drafts/06-module-cordis.md`](./drafts/06-module-cordis.md) | Module deep-dive: Cordis Runtime & Loader |
| [`drafts/06-module-profile-bundle.md`](./drafts/06-module-profile-bundle.md) | Module deep-dive: Profile & Bundle composition |
| [`drafts/06-module-agent-scope.md`](./drafts/06-module-agent-scope.md) | Module deep-dive: Agent Scope & standing presets |
| [`drafts/06-module-agent-loop.md`](./drafts/06-module-agent-loop.md) | Module deep-dive: Agent Loop & turn/step orchestration |
| [`drafts/06-module-session-log.md`](./drafts/06-module-session-log.md) | Module deep-dive: Session Event Log, Surface, Persistence & Projection |
| [`drafts/06-module-capabilities.md`](./drafts/06-module-capabilities.md) | Module deep-dive: Tool & LLM Capability seams |
| [`drafts/07-cross-validation.md`](./drafts/07-cross-validation.md) | Cross-module conflict resolution and documentation drift findings |
| [`drafts/08-coverage.md`](./drafts/08-coverage.md) | Reading denominators (`32,766 / 32,766`) and adversarial review status |
| [`drafts/08-insights.md`](./drafts/08-insights.md) | Synthesized architectural, evolutionary, and product insights |
| [`experiment/`](./experiment/README.md) | Runnable replay script ([`inspect-session-replay.ts`](./experiment/inspect-session-replay.ts), [`run.sh`](./experiment/run.sh)) |
| [`site-assets/architecture-explorer.html`](./site-assets/architecture-explorer.html) | Interactive architecture diagram markup used in the published site |
| [`CHANGELOG.md`](./CHANGELOG.md) | Snapshot and research changelog |

## License & Disclaimer

Licensed under the [MIT License](./LICENSE).

This is an independent research project unaffiliated with DeepSeek. All referenced source code, docs, and commit history belong to [`deepseek-ai/deepseek-harness`](https://github.com/deepseek-ai/deepseek-harness); commentary and inferences are the responsibility of this repository's author.
