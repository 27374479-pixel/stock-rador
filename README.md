# A 股社区线索实验基线

这是一个无依赖 Node.js 基线，用来采集、保存和复核真实论坛线索。仓库保留可运行源码、测试、协议文档和最小的 `research/forum_leads.json` 样本；原始抓取响应、价格快照、回放结果和临时审阅数据默认不入库，详见 [research/README.md](research/README.md)。它仍不具备定时监控或历史热度回测能力，不推荐交易，也不把测试 fixture 冒充真实样本。

需要 Node.js 24 或更高版本。

## 快速开始

仓库已经包含 6 条真实论坛记录。先校验并查看当前评级：

```powershell
node src/cli.js validate research/forum_leads.json
node src/cli.js review research/forum_leads.json
node scripts/collect-hn.cjs
node scripts/collect-hn.cjs --audit-latest
npm test
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
