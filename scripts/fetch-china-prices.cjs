const fs = require('fs');
const path = require('path');

const stocks = [
  { code: '300408', em: '0.300408', tx: 'sz300408', dates: ['2025-12-31', '2026-06-15', '2026-09-21'] },
  { code: '600183', em: '1.600183', tx: 'sh600183', dates: ['2025-12-31', '2026-06-10', '2026-09-21'] },
  { code: '002636', em: '0.002636', tx: 'sz002636', dates: ['2025-12-31', '2026-06-10', '2026-09-21'] }
];

async function getJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.json();
}

function byDate(rows, dates, closeIndex) {
  const selected = Object.fromEntries(rows.filter(row => dates.includes(row[0])).map(row => [row[0], Number(row[closeIndex])]));
  for (const date of dates) if (!Number.isFinite(selected[date])) throw new Error(`Missing or invalid close for ${date}`);
  return selected;
}

(async () => {
  const fetchedAt = new Date().toISOString();
  const results = [];
  for (const stock of stocks) {
    const eastmoneyUrl = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${stock.em}&klt=101&fqt=1&beg=20251231&end=20260921&fields1=f1,f2,f3&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61`;
    const tencentUrl = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${stock.tx},day,2025-12-31,2026-09-21,400,qfq`;
    const [eastmoney, tencent] = await Promise.all([getJson(eastmoneyUrl), getJson(tencentUrl)]);
    if (!Array.isArray(eastmoney?.data?.klines) || !eastmoney.data.klines.length) throw new Error(`Empty Eastmoney data for ${stock.code}`);
    if (!Array.isArray(tencent?.data?.[stock.tx]?.qfqday) || !tencent.data[stock.tx].qfqday.length) throw new Error(`Empty Tencent data for ${stock.code}`);
    const emRows = eastmoney.data.klines.map(line => line.split(','));
    const txRows = tencent.data[stock.tx].qfqday;
    const emSelected = byDate(emRows, stock.dates, 2);
    const txSelected = byDate(txRows, stock.dates, 2);
    for (const date of stock.dates) if (Math.abs(emSelected[date] - txSelected[date]) > 0.01) throw new Error(`Source mismatch ${stock.code} ${date}`);
    results.push({
      code: stock.code,
      requested_dates: stock.dates,
      selected_close: {
        eastmoney_qfq: emSelected,
        tencent_qfq: txSelected
      },
      sources: {
        eastmoney: { url: eastmoneyUrl, adjustment: 'fqt=1 (前复权)', raw_response: eastmoney },
        tencent: { url: tencentUrl, adjustment: 'qfq (前复权)', raw_response: tencent }
      }
    });
  }
  const output = { fetched_at_utc: fetchedAt, note: '收盘价；两个来源均为前复权。raw_response 为抓取时的完整解析响应。', results };
  const outputPath = path.join(__dirname, '..', 'research', 'china_prices.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(outputPath);
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
