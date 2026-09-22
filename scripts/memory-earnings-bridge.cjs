const marketCap = 159864316356.21;

const annual2025 = {
  revenue: 22766169990.55,
  cost: 18349871088.36,
  parentProfit: 1423298162.88,
  adjustedParentProfit: 1289178618.90,
  operatingCashFlow: -1201201037.10,
};

const priorH1 = {
  revenue: 10195655370.19,
  cost: 8874758785.95,
  parentProfit: 14766262.08,
  adjustedParentProfit: 32206912.13,
  operatingCashFlow: 692900395.33,
};

const h1 = {
  revenue: 24088363284.95,
  cost: 9899767031.09,
  taxAndSurcharges: 56751045.21,
  selling: 611482376.33,
  administration: 435869335.29,
  research: 851431666.36,
  finance: 437675229.74,
  pretaxProfit: 12730047853.43,
  incomeTax: 2012398361.41,
  netProfit: 10717649492.02,
  parentProfit: 10576875808.95,
  adjustedParentProfit: 10047374676.56,
  operatingCashFlow: -3151429914.77,
};

const ttm = {};
for (const key of ["revenue", "cost", "parentProfit", "adjustedParentProfit", "operatingCashFlow"]) {
  ttm[key] = annual2025[key] - priorH1[key] + h1[key];
}
ttm.grossMargin = (ttm.revenue - ttm.cost) / ttm.revenue;
ttm.reportedPE = marketCap / ttm.parentProfit;
ttm.adjustedPE = marketCap / ttm.adjustedParentProfit;

const model = {
  revenue: h1.revenue * 2,
  annualOperatingLoad: 2 * (
    h1.taxAndSurcharges + h1.selling + h1.administration + h1.research + h1.finance
  ),
  taxRate: h1.incomeTax / h1.pretaxProfit,
  parentShare: h1.parentProfit / h1.netProfit,
};

function profitAtGrossMargin(grossMargin) {
  return (model.revenue * grossMargin - model.annualOperatingLoad) *
    (1 - model.taxRate) * model.parentShare;
}

function requiredGrossMargin(pe) {
  const profit = marketCap / pe;
  return (profit / ((1 - model.taxRate) * model.parentShare) + model.annualOperatingLoad) /
    model.revenue;
}

const output = {
  ttm,
  model,
  grossMarginSensitivity: [0.20, 0.30, 0.40, 0.50, 0.59].map((grossMargin) => {
    const parentProfit = profitAtGrossMargin(grossMargin);
    return { grossMargin, parentProfit, impliedPE: marketCap / parentProfit };
  }),
  impliedProfitSensitivity: [8, 10, 12, 15, 20].map((pe) => ({
    pe,
    parentProfit: marketCap / pe,
    requiredGrossMargin: requiredGrossMargin(pe),
  })),
};

console.log(JSON.stringify(output, null, 2));
