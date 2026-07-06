import { BALANCE, randRange, pickWeighted, getDynamicWheel } from './balance.js';
import { COPY } from './copy.js';
import {
  getState,
  addCash,
  addVirtual,
  addMood,
  spendAp,
  pushLog,
} from './state.js';

function formatSegmentMessage(segment, delta) {
  const amount = Math.abs(delta);
  const templates = COPY.gamble.segmentMessages;

  switch (segment.id) {
    case 'small_win':
      return `${templates.small_win(amount)} · ${segment.label}`;
    case 'mid_win':
      return `${templates.mid_win(amount)} · ${segment.label}`;
    case 'big_win':
      return `${templates.big_win(amount)} · ${segment.label}`;
    case 'small_loss':
      return `${templates.small_loss(amount)} · ${segment.label}`;
    case 'mid_loss':
      return `${templates.mid_loss(amount)} · ${segment.label}`;
    case 'double':
      return templates.double(getState().virtualBalance);
    case 'clear':
      return templates.clear(amount);
    default:
      return templates.default;
  }
}

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
      message = formatSegmentMessage(segment, delta);
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
      message = formatSegmentMessage(segment, delta);
      break;
    }
    case 'double': {
      const before = state.virtualBalance;
      const doubled = Math.min(before * 2, 5000);
      state.virtualBalance = doubled;
      delta = doubled - before;
      message = formatSegmentMessage(segment, delta);
      break;
    }
    case 'clear': {
      const cleared = state.virtualBalance;
      state.virtualBalance = 0;
      delta = -cleared;
      message = formatSegmentMessage(segment, delta);
      break;
    }
    default:
      message = COPY.gamble.segmentMessages.default;
  }

  return { segment, delta, message };
}

export function gamble(spinCount = 1) {
  const state = getState();
  const results = [];
  let firstNarrative = null;
  const overallBefore = captureEconomy(state);

  const bet = randRange(BALANCE.gamble.betCash);
  if (state.virtualBalance >= bet) {
    addVirtual(-bet);
  } else if (state.cash >= bet) {
    addCash(-bet);
  } else if (state.cash + state.virtualBalance >= bet) {
    const fromVirtual = state.virtualBalance;
    addVirtual(-fromVirtual);
    addCash(-(bet - fromVirtual));
  }

  const prevCount = state.flags.gamble_count;

  for (let i = 0; i < spinCount; i += 1) {
    const beforeSpin = i === 0 ? overallBefore : captureEconomy(state);
    const useVirtual = state.virtualBalance > 0 || state.flags.gamble_count > 0;
    const spin = spinOnce(useVirtual);
    spin.beforeState = beforeSpin;
    spin.afterState = captureEconomy(state);
    results.push(spin);
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

  if (results.some((result) => result.delta < 0) && Math.random() < 0.15) {
    addMood('anxiety', 1);
    if (!moodGained) moodGained = 'anxiety';
  }

  if (moodGained) {
    results[results.length - 1].moodGained = moodGained;
  }

  pushLog(`gamble ${spinCount}`);
  return {
    ok: true,
    results,
    firstNarrative,
    beforeState: overallBefore,
    afterState: captureEconomy(state),
  };
}

export function depositToMachine(amount) {
  const state = getState();
  const beforeState = captureEconomy(state);
  const actual = Math.min(Math.max(0, amount), state.cash);
  if (actual <= 0) {
    return { ok: false, error: COPY.gamble.depositError };
  }

  addCash(-actual);
  addVirtual(actual);
  state.flags.gamble_opened = true;
  state.flags.machine_deposit_total = (state.flags.machine_deposit_total || 0) + actual;
  pushLog(`deposit ${actual}`);

  return {
    ok: true,
    amount: actual,
    beforeState,
    afterState: captureEconomy(state),
  };
}

export function withdrawFromMachine() {
  const state = getState();
  const beforeState = captureEconomy(state);

  if (state.virtualBalance <= 0) {
    return { ok: false, error: COPY.gamble.withdrawError };
  }
  if (!spendAp(1)) {
    return { ok: false, error: COPY.gamble.withdrawApError };
  }

  const maxOut = randRange(BALANCE.withdraw);
  const actual = Math.min(state.virtualBalance, maxOut);
  addVirtual(-actual);
  addCash(actual);
  pushLog(`withdraw ${actual}`);

  return {
    ok: true,
    amount: actual,
    beforeState,
    afterState: captureEconomy(state),
  };
}

function captureEconomy(state = getState()) {
  const debt = Math.max(0, state.billTotal - (state.cash + state.virtualBalance * BALANCE.debt.virtualWeight));
  return {
    cash: state.cash,
    virtualBalance: state.virtualBalance,
    debt: Math.round(debt),
  };
}
