/**
 * 赌博系统 — 按键 + 转盘
 */
import { BALANCE, randRange, pickWeighted, getDynamicWheel } from './balance.js';
import { COPY } from './copy.js';
import {
  getState,
  addCash,
  addVirtual,
  addMood,
  pushLog,
} from './state.js';

function formatSegmentMessage(segment, delta, useVirtual) {
  const abs = Math.abs(delta);
  const id = segment.id;
  const templates = COPY.gamble.segmentMessages;
  if (id === 'double') return templates.double(getState().virtualBalance);
  if (id === 'clear') return templates.clear(abs);
  if (segment.effect === 'cash') {
    if (id === 'small_win') return `${templates.small_win(abs)}（${segment.label}）`;
    if (id === 'mid_win') return `${templates.mid_win(abs)}（${segment.label}）`;
    if (id === 'big_win') return `${templates.big_win(abs)}（${segment.label}）`;
    return `+¥${abs}（${segment.label}）`;
  }
  if (segment.effect === 'loss') {
    if (id === 'small_loss') return `${templates.small_loss(abs)}（${segment.label}）`;
    if (id === 'mid_loss') return `${templates.mid_loss(abs)}（${segment.label}）`;
    return `-¥${abs}（${segment.label}）`;
  }
  return templates.default;
}

/**
 * 执行一次转盘
 */
export function spinOnce(useVirtual = true) {
  const state = getState();
  const wheel = getDynamicWheel(state.cycle || 1, state.mood.addiction);
  const segment = pickWeighted(wheel);
  let delta = 0;
  let message = '';

  switch (segment.effect) {
    case 'cash': {
      const gain = randRange(segment.range);
      if (useVirtual && state.virtualBalance > 0) {
        addVirtual(gain);
      } else {
        addCash(gain);
      }
      delta = gain;
      message = formatSegmentMessage(segment, gain, useVirtual);
      break;
    }
    case 'loss': {
      const loss = randRange(segment.range);
      if (useVirtual && state.virtualBalance >= loss) {
        addVirtual(-loss);
      } else {
        const fromCash = Math.min(state.cash, loss);
        addCash(-fromCash);
        if (useVirtual && state.virtualBalance > 0) {
          const rest = loss - fromCash;
          addVirtual(-Math.min(rest, state.virtualBalance));
        }
      }
      delta = -loss;
      message = formatSegmentMessage(segment, -loss, useVirtual);
      break;
    }
    case 'double': {
      const before = state.virtualBalance;
      const doubled = Math.min(before * 2, 5000);
      state.virtualBalance = doubled;
      delta = doubled - before;
      message = formatSegmentMessage(segment, delta, true);
      break;
    }
    case 'clear': {
      const cleared = state.virtualBalance;
      state.virtualBalance = 0;
      delta = -cleared;
      message = formatSegmentMessage(segment, delta, true);
      break;
    }
    default:
      message = COPY.gamble.segmentMessages.default;
  }

  return { segment, delta, message };
}

/**
 * 赌博一次（只受剧情状态影响，不再消耗行动点）
 */
export function gamble(spinCount = 1) {
  const state = getState();
  const results = [];
  let firstNarrative = null;

  const bet = randRange(BALANCE.gamble.betCash);
  if (state.virtualBalance >= bet) {
    addVirtual(-bet);
  } else if (state.cash >= bet) {
    addCash(-bet);
  } else if (state.cash + state.virtualBalance >= bet) {
    const fromV = state.virtualBalance;
    addVirtual(-fromV);
    addCash(-(bet - fromV));
  }

  const prevCount = state.flags.gamble_count;

  for (let i = 0; i < spinCount; i++) {
    const useVirtual = state.virtualBalance > 0 || state.flags.gamble_count > 0;
    results.push(spinOnce(useVirtual));
  }

  state.flags.gamble_count += spinCount;
  state.stats.gambleCount += spinCount;
  state.flags.first_gamble_done = true;
  state.flags.gamble_opened = true;
  state.flags.triple_unlocked = state.stats.gambleCount >= 5;
  state.flags.ten_unlocked = state.stats.gambleCount >= 10;

  if (prevCount === 0 && results.length > 0) {
    firstNarrative = results[0].delta >= 0 ? COPY.gamble.firstWin : COPY.gamble.firstLoss;
  }

  const addictionIdx = Math.min(state.mood.addiction, 2);
  const chance = BALANCE.gamble.addictionChance[addictionIdx];
  let moodGained = null;
  if (Math.random() < chance + (spinCount > 1 ? 0.15 : 0)) {
    addMood('addiction', 1);
    moodGained = 'addiction';
    results[results.length - 1].message += COPY.gamble.addictionEcho;
  }

  if (results.some((r) => r.delta < 0) && Math.random() < 0.15) {
    addMood('anxiety', 1);
    if (!moodGained) moodGained = 'anxiety';
  }

  if (moodGained) {
    results[results.length - 1].moodGained = moodGained;
  }

  pushLog(`赌博 ${spinCount} 次`);
  return { ok: true, results, firstNarrative };
}

/** 存入虚拟余额 */
export function depositToMachine(amount) {
  const state = getState();
  const amt = Math.min(Math.max(0, amount), state.cash);
  if (amt <= 0) return { ok: false, error: COPY.gamble.depositError };
  addCash(-amt);
  addVirtual(amt);
  state.flags.gamble_opened = true;
  state.flags.machine_deposit_total = (state.flags.machine_deposit_total || 0) + amt;
  pushLog(`存入机器 ¥${amt}`);
  return { ok: true, amount: amt };
}

/** 取出 — 消耗 1 AP */
export function withdrawFromMachine() {
  const state = getState();
  if (state.virtualBalance <= 0) {
    return { ok: false, error: COPY.gamble.withdrawError };
  }
  if (!spendAp(1)) {
    return { ok: false, error: COPY.gamble.withdrawApError };
  }
  const maxOut = randRange(BALANCE.withdraw);
  const amt = Math.min(state.virtualBalance, maxOut);
  addVirtual(-amt);
  addCash(amt);
  pushLog(`从机器取出 ¥${amt}`);
  return { ok: true, amount: amt };
}
