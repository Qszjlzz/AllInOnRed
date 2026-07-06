/**
 * 结局判定与重玩记忆
 */
import { BALANCE } from './balance.js';
import { COPY } from './copy.js';

export const REPLAY_KEY = 'biean_last_ending';
export const UNLOCKED_ENDINGS_KEY = 'biean_unlocked_endings';

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

const EARLY_ENDINGS = COPY.cycles?.[1]?.earlyEndings || {};

export const ENDING_CATALOG = [
  {
    id: 'rules_quit',
    title: EARLY_ENDINGS.rules_quit?.title || '及时离开的人',
    clue: '看完规则以后立刻离开',
    tone: 'good',
    art: 'assets/pixel/ending-awaken.png',
  },
  {
    id: 'stop_after_1',
    title: EARLY_ENDINGS.stop_after_1?.title || '见好就收的人',
    clue: '第一次赢后就停手',
    tone: 'good',
    art: 'assets/pixel/ending-awaken.png',
  },
  {
    id: 'stop_after_2',
    title: EARLY_ENDINGS.stop_after_2?.title || '有克制力的人',
    clue: '第二次赢后主动收手',
    tone: 'good',
    art: 'assets/pixel/ending-awaken.png',
  },
  {
    id: 'stop_after_3',
    title: EARLY_ENDINGS.stop_after_3?.title || '及时回头的人',
    clue: '第一次输以后立刻回头',
    tone: 'good',
    art: 'assets/pixel/ending-awaken.png',
  },
  {
    id: 'quit_colleague',
    title: EARLY_ENDINGS.quit_colleague?.title || '有人在等你回家',
    clue: '被同事打断以后直接回家',
    tone: 'good',
    art: 'assets/pixel/ending-awaken.png',
  },
  {
    id: 'phone_dead',
    title: EARLY_ENDINGS.phone_dead?.title || '被迫中断的人',
    clue: '一路按到手机彻底没电',
    tone: 'bad',
    art: 'assets/pixel/ending-ruin.png',
  },
  {
    id: 'perfect',
    title: COPY.endings.perfect.title,
    clue: '低债务、低按键次数地回家',
    tone: 'good',
    art: 'assets/pixel/ending-awaken.png',
  },
  {
    id: 'awaken',
    title: COPY.endings.awaken.title,
    clue: '中等亏空时停住最后一下',
    tone: 'good',
    art: 'assets/pixel/ending-awaken.png',
  },
  {
    id: 'stop_loss',
    title: COPY.endings.stop_loss.title,
    clue: '高债务下也选择及时止损',
    tone: 'good',
    art: 'assets/pixel/ending-awaken.png',
  },
  {
    id: 'ruin',
    title: COPY.endings.ruin.title,
    clue: '第一次在最后真的按下去',
    tone: 'bad',
    art: 'assets/pixel/ending-ruin.png',
  },
  {
    id: 'memory',
    title: COPY.endings.memory.title,
    clue: '坏结局之后重新忍住',
    tone: 'loop',
    art: 'assets/pixel/ending-awaken.png',
  },
  {
    id: 'delusion',
    title: COPY.endings.delusion.title,
    clue: '坏结局之后再次按下去',
    tone: 'bad',
    art: 'assets/pixel/ending-ruin.png',
  },
];

const ENDING_LOOKUP = Object.fromEntries(ENDING_CATALOG.map((entry, index) => [
  entry.id,
  { ...entry, index: index + 1 },
]));

export function getLastEnding() {
  try {
    return localStorage.getItem(REPLAY_KEY);
  } catch {
    return null;
  }
}

export function getEndingEntry(id) {
  return ENDING_LOOKUP[id] || null;
}

export function getUnlockedEndings() {
  try {
    const raw = localStorage.getItem(UNLOCKED_ENDINGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id) => ENDING_LOOKUP[id]);
  } catch {
    return [];
  }
}

export function unlockEnding(id) {
  if (!ENDING_LOOKUP[id]) {
    return { isNewUnlock: false, unlockedEndings: getUnlockedEndings() };
  }

  const unlocked = new Set(getUnlockedEndings());
  const isNewUnlock = !unlocked.has(id);
  unlocked.add(id);

  try {
    localStorage.setItem(UNLOCKED_ENDINGS_KEY, JSON.stringify([...unlocked]));
  } catch {
    // ignore storage failures
  }

  return {
    isNewUnlock,
    unlockedEndings: [...unlocked],
  };
}

export function getEndingProgress() {
  const unlocked = new Set(getUnlockedEndings());
  const lastEnding = getLastEnding();
  const lastEntry = getEndingEntry(lastEnding);

  return {
    total: ENDING_CATALOG.length,
    unlockedCount: unlocked.size,
    unlockedEndings: [...unlocked],
    hasReplayMemory: Boolean(lastEnding && !NON_REPLAY_ENDINGS.has(lastEnding)),
    lastEnding,
    lastEndingTitle: lastEntry?.title || '',
    entries: ENDING_CATALOG.map((entry, index) => ({
      ...entry,
      index: index + 1,
      unlocked: unlocked.has(entry.id),
    })),
  };
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
