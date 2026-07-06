/**
 * 结局判定与重玩记忆
 */
import { BALANCE } from './balance.js';

export const REPLAY_KEY = 'biean_last_ending';

const NON_REPLAY_ENDINGS = new Set([
  'perfect',
  'awaken',
  'rules_quit',
  'stop_after_1',
  'stop_after_2',
  'stop_after_3',
  'quit_colleague',
  'early_family',
  'memory',
]);

export function getLastEnding() {
  try {
    return localStorage.getItem(REPLAY_KEY);
  } catch {
    return null;
  }
}

export function saveLastEnding(id) {
  if (!id || NON_REPLAY_ENDINGS.has(id)) return;
  try {
    localStorage.setItem(REPLAY_KEY, id);
  } catch {
    // ignore storage failures
  }
}

export function getDebtRatioFromState(state) {
  const assets = state.cash + state.virtualBalance * BALANCE.debt.virtualWeight;
  return Math.max(0, state.billTotal - assets) / state.billTotal;
}

export function determineFinalEnding({ pressed, state, lastEnding = getLastEnding() }) {
  const ratio = getDebtRatioFromState(state);
  const hasBadReplayMemory = Boolean(lastEnding && !NON_REPLAY_ENDINGS.has(lastEnding));

  if (pressed) {
    return hasBadReplayMemory ? 'delusion' : 'ruin';
  }

  if (hasBadReplayMemory) {
    return 'memory';
  }

  if (ratio < BALANCE.debt.perfectRatio && state.stats.gambleCount <= 4) {
    return 'perfect';
  }

  if (ratio < BALANCE.debt.awakenRatio) {
    return 'awaken';
  }

  return 'stop_loss';
}
