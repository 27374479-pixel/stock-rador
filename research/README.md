# Research data policy

This repository keeps only `forum_leads.json`, the small canonical fixture used by the default validation and review commands.

The collection scripts write raw API responses, price snapshots, replay results, and review exports under `research/`. Those files are intentionally local and ignored because they are generated artifacts rather than required source code. Recreate them with the scripts when needed:

```powershell
node scripts/collect-hn.cjs
node scripts/fetch-china-prices.cjs
```

The protocol and reproducibility notes live in `docs/`.
