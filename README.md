# A 股社区线索实验基线

这是一个无依赖 Node.js 研究基线，用来发现、保存、复核和回放真实市场线索。仓库已经包含 point-in-time 研究 memo、SHA-256 冻结、历史 replay、matched-control 对照、前向样本以及对应测试。它仍是研究系统而不是交易建议，也不把测试 fixture 或事后案例冒充 alpha 证明。

需要 Node.js 24 或更高版本。

## AI Research Skill

仓库现在把“研究判断”和“程序约束”分开：

- AI 研究员：负责跨来源搜索、真伪核验、因果链推演、价值链映射、预期差与估值判断、反证和下一步研究；
- 程序审计员：负责时间戳、`availableAt`、证据引用、独立来源、历史截点和价格回放，避免未来函数与事后挑样本。

当前实验版本是 **Stock Rador v0.5**：

- Skill：[skills/stock-rador/versions/0.5.0/SKILL.md](skills/stock-rador/versions/0.5.0/SKILL.md)
- 评估协议：[skills/stock-rador/versions/0.5.0/EVALS.md](skills/stock-rador/versions/0.5.0/EVALS.md)
- Memo 模板：[skills/stock-rador/versions/0.5.0/opportunity-memo.template.json](skills/stock-rador/versions/0.5.0/opportunity-memo.template.json)
- 回测 manifest 模板：[skills/stock-rador/versions/0.5.0/backtest-manifest.template.json](skills/stock-rador/versions/0.5.0/backtest-manifest.template.json)

旧版 Skill 保留不覆盖，因为旧 backtest 的 lock 依赖原文件哈希。版本索引见 [skills/stock-rador/README.md](skills/stock-rador/README.md)。

v0.5 不预设 AI、存储、新能源、农业等行业白名单，而是从“现实世界发生了什么变化”开始，并把两个问题严格分开：

1. **Hypothesis gate**：产业/经济机会是不是真的、是否存在预期差；
2. **Selection gate**：某一只股票是否真的优于当时可选的同行/near-miss。

只有 `High-priority selection` 进入主选股指标。一个产业机会可以是 `High-priority hypothesis`，同时结论仍然是 `No selection` 或 `Research selection`。

每一版 Skill 都必须先冻结研究材料、screening、memo、同行对照和实现代码，再允许打开后续收益。修改后的 Skill 必须换新 holdout；历史 replay 还要防模型记忆和搜索结果未来摘要污染。最终标准是 **forward-frozen** 样本。

## 快速开始

仓库已经包含 6 条真实论坛记录。先校验并查看当前评级：

```powershell
node src/cli.js validate research/forum_leads.json
node src/cli.js review research/forum_leads.json
node scripts/collect-hn.cjs
node scripts/collect-hn.cjs --audit-latest
node scripts/collect-hn-generic.cjs --start 2025-01-01 --end 2025-04-01
npm test

# 研究材料冻结后
node scripts/lock-skill-run.cjs backtests/runs/<run-id>/manifest.json

# 只有已经允许揭盲的历史/到期 forward run 才执行：
node scripts/evaluate-skill-run.cjs backtests/runs/<run-id>/lock.json backtests/runs/<run-id>/prices.json
```

采集协议及失败、截断和事后过滤边界见 [docs/HN_CAPTURE.md](docs/HN_CAPTURE.md)。

## 新建空库

如需开始另一批研究，先创建访问范围文件 `scope.json`：

```json
{
  "description": "Public forum pages manually reviewed on 2026-09-21",
  "collectionMethod": "manual public-web review",
  "includedPlatforms": ["雪球", "Reddit"],
  "limitations": ["No login-only pages", "Deleted posts may be unavailable"]
}
```

使用新的文件名初始化，避免覆盖现有样本：

```powershell
node src/cli.js init research/new_leads.json scope.json
node src/cli.js add research/new_leads.json path/to/real-lead.json
node src/cli.js validate research/new_leads.json
node src/cli.js review research/new_leads.json
node src/cli.js review research/new_leads.json --as-of 2026-09-21T08:00:00.000Z
node src/cli.js review research/new_leads.json --write
```

`review` 输出 Reject/Watch/A/S。默认截点是当前时间；`--as-of` 同时排除截点后才发布或可获得的来源、证据和预期判断。`--write` 只写入评审时间和评级，不改变来源时间。`truthStatus` 非 `unknown` 时必须填写 `truthAssessedAt`，历史截点前尚未形成的判断不会用于升级。评级只是录入元数据门槛，必须人工打开原文核验内容和独立性；它不等于历史策略回放或 alpha 证明。

命令在 JSON 损坏、字段缺失、时间顺序错误、重复 ID、引用不存在或反向证据、非法 store、未知选项以及 `init` 覆盖已有文件时返回非零。校验器对时间、访问范围、失效指标和证据元数据 fail closed。实验设计和历史复核边界见 [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)。


## 当前验证状态

历史 replay 用于发现流程问题，不等价于真实预测 alpha。仓库已经保留了 v0.2-v0.4 的失败与改进轨迹，例如：

- v0.2：发现 `Research` 被错误当成可行动信号；
- v0.3：加入 `actionableAt` 与预注册兑现周期；
- v0.4：加入 matched controls，成功识别“跑赢沪深300但跑输同行”的 sector beta 假成功；
- v0.5：进一步拆分 **产业机会** 与 **公司选择** 两道 gate，并加入 best-control 比较。

首个 v0.5 真正前向冻结样本位于
[backtests/runs/2026-09-22-forward-v0.5-001](backtests/runs/2026-09-22-forward-v0.5-001)。
该目录当前只有发现、证据、screening、memo、manifest 与 `lock.json`，**不应提前出现 `prices.json` 或 `outcome.json`**。
