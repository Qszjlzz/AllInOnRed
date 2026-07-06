/**
 * 数值配置 — 数值策划维护
 * Demo v1.0 — 见 docs/BALANCE.md
 */
export const BALANCE = {
  days: 3,
  apPerDay: 3,
  apPerCycle: 3,
  cycles: 5,
  startCash: [800, 1200],
  billTotal: [3000, 5000],
  work: {
    success: [400, 700],
    fail: [80, 150],
    hitsRequired: 3,
    totalHits: 5,
    diligentBonusChance: 0.15,
  },
  gamble: {
    firstFree: true,
    betCash: [80, 150],
    addictionChance: [0.15, 0.25, 0.4],
  },
  /** 基础转盘格 — 实际权重由 getDynamicWheel 按天数调整 */
  wheelBase: [
    { id: 'small_win', label: '小赢', weight: 25, effect: 'cash', range: [50, 150] },
    { id: 'mid_win', label: '中赢', weight: 10, effect: 'cash', range: [150, 300] },
    { id: 'big_win', label: '大赢', weight: 3, effect: 'cash', range: [300, 500] },
    { id: 'small_loss', label: '小亏', weight: 30, effect: 'loss', range: [50, 120] },
    { id: 'mid_loss', label: '中亏', weight: 20, effect: 'loss', range: [120, 250] },
    { id: 'double', label: '翻倍', weight: 5, effect: 'double' },
    { id: 'clear', label: '清空', weight: 7, effect: 'clear' },
  ],
  /** 天数偏置：day1 偏赢，day3 偏亏 */
  dayBias: {
    1: { win: 1.4, loss: 0.7, double: 1.2, clear: 0.5 },
    2: { win: 1.0, loss: 1.0, double: 1.0, clear: 1.0 },
    3: { win: 0.6, loss: 1.5, double: 0.8, clear: 1.4 },
  },
  withdraw: [200, 500],
  mood: {
    addictionForce: 3,
    anxietyTrigger: 3,
    workPenaltyThreshold: 3,
    workSpeedPenalty: [0.85, 0.7, 0.55],
  },
  debt: {
    perfectRatio: 0.3,
    awakenRatio: 0.7,
    virtualWeight: 0.5,
  },
};

/** @param {[number, number]} range */
export function randRange(range) {
  const [min, max] = range;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** 加权随机 */
export function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (total <= 0) return items[0];
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

/**
 * 按天数与上瘾度返回动态转盘权重
 * @param {number} day
 * @param {number} addiction
 */
export function getDynamicWheel(day, addiction) {
  const bias = BALANCE.dayBias[day] || BALANCE.dayBias[2];
  const addictionLossBoost = 1 + addiction * 0.12;

  return BALANCE.wheelBase.map((seg) => {
    let w = seg.weight;
    if (seg.effect === 'cash') w *= bias.win;
    if (seg.effect === 'loss') w *= bias.loss * addictionLossBoost;
    if (seg.id === 'double') w *= bias.double;
    if (seg.id === 'clear') w *= bias.clear;
    return { ...seg, weight: Math.max(0, Math.round(w)) };
  }).filter((s) => s.weight > 0);
}
