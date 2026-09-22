const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

function assertFinitePositive(value, name) {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${name} must be a finite positive number`);
}

function assertBars(bars, label = 'bars') {
  if (!Array.isArray(bars) || bars.length < 2) throw new Error(`${label} must contain at least two bars`);
  let previousDate = null;
  for (let index = 0; index < bars.length; index += 1) {
    const bar = bars[index];
    if (!bar || typeof bar !== 'object') throw new Error(`${label}[${index}] must be an object`);
    if (!CALENDAR_DATE.test(bar.date)) throw new Error(`${label}[${index}].date must be YYYY-MM-DD`);
    if (previousDate && bar.date <= previousDate) throw new Error(`${label} must be strictly sorted by date`);
    previousDate = bar.date;
    for (const key of ['open', 'close', 'high', 'low']) assertFinitePositive(bar[key], `${label}[${index}].${key}`);
    if (!Number.isFinite(bar.volume) || bar.volume < 0) throw new Error(`${label}[${index}].volume must be finite and non-negative`);
    if (bar.limitRate !== undefined && (!Number.isFinite(bar.limitRate) || bar.limitRate <= 0 || bar.limitRate >= 1)) {
      throw new Error(`${label}[${index}].limitRate must be between 0 and 1 when provided`);
    }
  }
}

function resolveLimitRate(bar, fallbackLimitRate) {
  const value = bar.limitRate ?? fallbackLimitRate;
  if (!Number.isFinite(value) || value <= 0 || value >= 1) {
    throw new Error('A historical limitRate must be supplied on the bar or as fallbackLimitRate');
  }
  return value;
}

function onePriceMove(bar, previousBar) {
  const onePrice = bar.open === bar.high && bar.high === bar.low && bar.low === bar.close;
  return {
    onePrice,
    moveFromPreviousClose: bar.open / previousBar.close - 1
  };
}

function executionCheck(bars, index, side, fallbackLimitRate, tolerance = 0.005) {
  if (!['buy', 'sell'].includes(side)) throw new Error('side must be buy or sell');
  const bar = bars[index];
  const previousBar = bars[index - 1];
  if (!bar || !previousBar) throw new Error('executionCheck requires a bar and its previous trading bar');

  const limitRate = resolveLimitRate(bar, fallbackLimitRate);
  const suspended = bar.volume <= 0;
  const { onePrice, moveFromPreviousClose } = onePriceMove(bar, previousBar);
  const onePriceLimitUp = onePrice && moveFromPreviousClose >= limitRate - tolerance;
  const onePriceLimitDown = onePrice && moveFromPreviousClose <= -limitRate + tolerance;
  const blocked = suspended || (side === 'buy' ? onePriceLimitUp : onePriceLimitDown);

  return {
    blocked,
    side,
    suspended,
    onePriceLimitUp,
    onePriceLimitDown,
    limitRate,
    moveFromPreviousClose,
    reason: suspended
      ? 'zero-volume session'
      : side === 'buy' && onePriceLimitUp
        ? 'one-price limit-up blocks a strict buy fill'
        : side === 'sell' && onePriceLimitDown
          ? 'one-price limit-down blocks a strict sell fill'
          : 'daily bar does not show a suspension or one-price price-limit blocker'
  };
}

function firstTradingIndexAfter(bars, signalDate) {
  if (!CALENDAR_DATE.test(signalDate)) throw new Error('signalDate must be YYYY-MM-DD');
  return bars.findIndex((bar) => bar.date > signalDate);
}

function returnAfterCost(entryPrice, exitPrice, buyCostRate = 0.001, sellCostRate = buyCostRate) {
  assertFinitePositive(entryPrice, 'entryPrice');
  assertFinitePositive(exitPrice, 'exitPrice');
  for (const [name, value] of [['buyCostRate', buyCostRate], ['sellCostRate', sellCostRate]]) {
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new Error(`${name} must be in [0, 1)`);
  }
  return exitPrice / entryPrice * (1 - sellCostRate) / (1 + buyCostRate) - 1;
}

function findBarByDate(bars, date) {
  return bars.find((bar) => bar.date === date);
}

function findBarIndexByDate(bars, date) {
  return bars.findIndex((bar) => bar.date === date);
}

function backtestEvent(options) {
  const {
    bars,
    executionBars = bars,
    signalDate,
    holdingTradingDays,
    fallbackLimitRate,
    entryDelayBars = 0,
    buyCostRate = 0.001,
    sellCostRate = buyCostRate,
    benchmarkBars = null
  } = options ?? {};

  assertBars(bars);
  assertBars(executionBars, 'executionBars');
  if (!Number.isInteger(holdingTradingDays) || holdingTradingDays < 1) {
    throw new Error('holdingTradingDays must be a positive integer');
  }
  if (!Number.isInteger(entryDelayBars) || entryDelayBars < 0) {
    throw new Error('entryDelayBars must be a non-negative integer');
  }
  if (benchmarkBars !== null) assertBars(benchmarkBars, 'benchmarkBars');

  const firstAfterSignal = firstTradingIndexAfter(bars, signalDate);
  if (firstAfterSignal < 1) {
    return { status: 'insufficient_data', reason: 'no next trading bar after signalDate' };
  }

  const entryIndex = firstAfterSignal + entryDelayBars;
  const entryBar = bars[entryIndex];
  if (!entryBar) {
    return { status: 'insufficient_data', reason: 'entryDelayBars runs past available data' };
  }

  const executionEntryIndex = findBarIndexByDate(executionBars, entryBar.date);
  if (executionEntryIndex < 1) {
    return { status: 'insufficient_execution_data', reason: `missing execution bar for ${entryBar.date}` };
  }
  const entryExecution = executionCheck(executionBars, executionEntryIndex, 'buy', fallbackLimitRate);
  if (entryExecution.blocked) {
    return {
      status: 'blocked_entry',
      signalDate,
      entryDate: entryBar.date,
      entryExecution
    };
  }

  const exitIndex = entryIndex + holdingTradingDays - 1;
  const exitBar = bars[exitIndex];
  if (!exitBar) {
    return {
      status: 'insufficient_data',
      reason: 'holding window runs past available data',
      signalDate,
      entryDate: entryBar.date
    };
  }

  const executionExitIndex = findBarIndexByDate(executionBars, exitBar.date);
  if (executionExitIndex < 1) {
    return { status: 'insufficient_execution_data', reason: `missing execution bar for ${exitBar.date}` };
  }
  const exitExecution = executionCheck(executionBars, executionExitIndex, 'sell', fallbackLimitRate);
  if (exitExecution.blocked) {
    return {
      status: 'blocked_exit',
      signalDate,
      entryDate: entryBar.date,
      exitDate: exitBar.date,
      entryExecution,
      exitExecution
    };
  }

  const netReturn = returnAfterCost(entryBar.open, exitBar.close, buyCostRate, sellCostRate);
  let benchmarkReturn = null;
  let excessReturn = null;
  if (benchmarkBars !== null) {
    const benchmarkEntry = findBarByDate(benchmarkBars, entryBar.date);
    const benchmarkExit = findBarByDate(benchmarkBars, exitBar.date);
    if (!benchmarkEntry || !benchmarkExit) {
      return {
        status: 'insufficient_benchmark_data',
        signalDate,
        entryDate: entryBar.date,
        exitDate: exitBar.date
      };
    }
    benchmarkReturn = benchmarkExit.close / benchmarkEntry.open - 1;
    excessReturn = netReturn - benchmarkReturn;
  }

  return {
    status: 'executed',
    signalDate,
    entryDate: entryBar.date,
    exitDate: exitBar.date,
    entryPrice: entryBar.open,
    exitPrice: exitBar.close,
    holdingTradingDays,
    entryDelayBars,
    buyCostRate,
    sellCostRate,
    netReturn,
    benchmarkReturn,
    excessReturn,
    entryExecution,
    exitExecution,
    assumptions: {
      tPlusOne: true,
      entryRule: 'first trading session strictly after signalDate, plus entryDelayBars, at open',
      exitRule: 'holdingTradingDays counts the entry session as day 1; exit at target close',
      blockedFillRule: 'no fill is assumed on zero-volume sessions, one-price limit-up buys, or one-price limit-down sells',
      historicalLimitRule: 'limitRate must be supplied from point-in-time data; board/ST rules are not inferred from the current ticker',
      adjustedPriceRule: executionBars === bars
        ? 'the same bar series was used for return and execution checks'
        : 'returns use adjusted bars while execution blockers use separately supplied unadjusted bars aligned by date'
    }
  };
}

module.exports = {
  assertBars,
  backtestEvent,
  executionCheck,
  firstTradingIndexAfter,
  returnAfterCost
};
