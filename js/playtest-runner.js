/**
 * 周期卡牌逻辑自动化验证
 * node js/playtest-runner.js
 */
if (typeof globalThis.localStorage === 'undefined') {
  const store = {};
  globalThis.localStorage = {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
  };
}

import { resetGame, getState, endCycle, addMood, syncGambleUnlocks, payBill } from './state.js';
import { getCardsForCycle, CYCLE_COUNT } from './cycles.js';
import { COPY } from './copy.js';
import { gamble } from './gambling.js';
import {
  determineFinalEnding,
  getDebtRatioFromState,
  getEndingProgress,
  unlockEnding,
} from './endings.js';
import { auditStoryContinuity, resolveEndingCopy, resolveFinalDecisionCopy } from './story-logic.js';

const results = [];

function pass(name) {
  results.push({ name, status: 'PASS' });
}

function fail(name, detail) {
  results.push({ name, status: 'FAIL', detail });
}

function run(name, fn) {
  try {
    resetGame();
    fn();
    pass(name);
  } catch (error) {
    fail(name, error.message);
  }
}

run('cycles: 5 cycle defs', () => {
  for (let cycle = 1; cycle <= CYCLE_COUNT; cycle += 1) {
    const cards = getCardsForCycle(cycle);
    if (cards.length !== 3) throw new Error(`cycle ${cycle} has ${cards.length} cards`);
  }
});

run('cycle1 cards match script', () => {
  const ids = getCardsForCycle(1).map((card) => card.id);
  if (!ids.includes('friend_link') || !ids.includes('work_report') || !ids.includes('wife_msg')) {
    throw new Error(JSON.stringify(ids));
  }
});

run('copy: cycle1 early endings exist', () => {
  const endings = COPY.cycles[1].earlyEndings;
  for (const key of ['rules_quit', 'stop_after_1', 'phone_dead']) {
    if (!endings[key]) throw new Error(`missing ${key}`);
  }
});

run('copy: cycles 2-5 have full branch data', () => {
  const required = {
    2: ['gamble_again', 'wife_breakfast', 'work_daily'],
    3: ['work_hard', 'gamble_big', 'family_drawing'],
    4: ['bill_reminder', 'memo_prompt', 'anxiety_ping'],
    5: ['final_prep', 'family_wait', 'one_more_gamble'],
  };
  Object.entries(required).forEach(([cycle, ids]) => {
    const branches = COPY.cycles[Number(cycle)]?.branches;
    ids.forEach((id) => {
      if (!branches?.[id]) throw new Error(`missing cycle ${cycle} branch ${id}`);
    });
  });
});

run('mood cards accumulate', () => {
  addMood('stable', 1);
  addMood('addiction', 2);
  const state = getState();
  if (state.moodCards.length !== 3) throw new Error(String(state.moodCards.length));
});

run('endCycle advances', () => {
  getState().cycleResolved = true;
  const ok = endCycle();
  if (!ok || getState().cycle !== 2) throw new Error(String(getState().cycle));
});

run('gamble unlock by press count', () => {
  const state = getState();
  state.virtualBalance = 500;
  state.ap = 15;
  for (let i = 0; i < 5; i += 1) {
    const result = gamble(1);
    if (!result.ok) throw new Error(`press ${i + 1}: ${result.error}`);
  }
  syncGambleUnlocks();
  if (!state.flags.triple_unlocked) throw new Error('triple not unlocked at 5');
  for (let i = 0; i < 5; i += 1) {
    const result = gamble(1);
    if (!result.ok) throw new Error(`press ${i + 6}: ${result.error}`);
  }
  syncGambleUnlocks();
  if (!state.flags.ten_unlocked) throw new Error('ten not unlocked at 10');
});

run('gamble no longer costs AP', () => {
  const state = getState();
  state.ap = 0;
  state.virtualBalance = 300;
  const result = gamble(1);
  if (!result.ok) throw new Error(result.error || 'gamble blocked');
  if (state.ap !== 0) throw new Error(`ap changed to ${state.ap}`);
});

run('copy: memo and final prompt exist', () => {
  if (!COPY.memo.prompt || !COPY.final.title || !COPY.final.notPress) {
    throw new Error('memo/final copy incomplete');
  }
});

run('final copy: no memo does not pretend a note was written', () => {
  const copy = resolveFinalDecisionCopy({
    flags: {},
    stats: { gambleCount: 0 },
    virtualBalance: 0,
    billPaid: 0,
  });
  if (copy.replayPrefix.includes('写下')) {
    throw new Error(copy.replayPrefix);
  }
});

run('final copy: written memo uses saved note', () => {
  const copy = resolveFinalDecisionCopy({
    flags: { memo_done: true, memo_text: '今晚先回家。' },
    stats: { gambleCount: 0 },
    virtualBalance: 0,
    billPaid: 0,
  });
  if (!copy.replayPrefix.includes('写下')) {
    throw new Error(copy.replayPrefix);
  }
  if (copy.memoText !== '今晚先回家。') {
    throw new Error(copy.memoText);
  }
});

run('story continuity audit passes', () => {
  const issues = auditStoryContinuity();
  if (issues.length) throw new Error(issues.join('; '));
});

run('ending gallery tracks unlock progress', () => {
  localStorage.removeItem('biean_unlocked_endings');
  unlockEnding('rules_quit');
  unlockEnding('ruin');
  const progress = getEndingProgress();
  if (progress.total < 10) throw new Error(`total ${progress.total}`);
  if (progress.unlockedCount !== 2) throw new Error(`count ${progress.unlockedCount}`);
  if (!progress.entries.find((entry) => entry.id === 'ruin')?.unlocked) {
    throw new Error('ruin not unlocked');
  }
});

run('perfect ending copy stays outcome-based', () => {
  if (COPY.endings.perfect.body.includes('机器里的钱')) {
    throw new Error(COPY.endings.perfect.body);
  }
});

run('ending copy: family epilogue appears on good ending', () => {
  const copy = resolveEndingCopy('perfect', {
    flags: { family_branch_count: 1, family_reply_count: 1 },
    stats: { gambleCount: 2, workCount: 1 },
    virtualBalance: 0,
    billPaid: 400,
  });
  if (!copy?.bodyExtra?.includes('一直有人在等你')) {
    throw new Error(copy?.bodyExtra || 'missing family epilogue');
  }
});

run('ending copy: work epilogue appears on bad ending without family history', () => {
  const copy = resolveEndingCopy('ruin', {
    flags: { work_branch_count: 1 },
    stats: { gambleCount: 6, workCount: 1 },
    virtualBalance: 0,
    billPaid: 0,
  });
  if (!copy?.bodyExtra?.includes('工作窗口')) {
    throw new Error(copy?.bodyExtra || 'missing work epilogue');
  }
});

run('payBill reduces debt safely', () => {
  const state = getState();
  state.cash = 1200;
  state.billTotal = 3000;
  const paid = payBill(500);
  if (paid !== 500) throw new Error(`paid ${paid}`);
  if (state.cash !== 700) throw new Error(`cash ${state.cash}`);
});

run('debt ratio reflects machine weight', () => {
  const state = getState();
  state.cash = 1000;
  state.virtualBalance = 1000;
  state.billTotal = 3000;
  const ratio = getDebtRatioFromState(state);
  if (ratio !== 0.5) throw new Error(`ratio ${ratio}`);
});

run('final ending: ruin on first press', () => {
  const ending = determineFinalEnding({ pressed: true, state: getState(), lastEnding: null });
  if (ending !== 'ruin') throw new Error(ending);
});

run('final ending: delusion on replay press', () => {
  const ending = determineFinalEnding({ pressed: true, state: getState(), lastEnding: 'ruin' });
  if (ending !== 'delusion') throw new Error(ending);
});

run('final ending: memory after bad replay', () => {
  const ending = determineFinalEnding({ pressed: false, state: getState(), lastEnding: 'ruin' });
  if (ending !== 'memory') throw new Error(ending);
});

run('final ending: perfect under low debt and low gambling', () => {
  const state = getState();
  state.cash = 2600;
  state.virtualBalance = 400;
  state.billTotal = 3000;
  state.stats.gambleCount = 3;
  const ending = determineFinalEnding({ pressed: false, state, lastEnding: null });
  if (ending !== 'perfect') throw new Error(ending);
});

run('final ending: awaken under medium debt', () => {
  const state = getState();
  state.cash = 1200;
  state.virtualBalance = 300;
  state.billTotal = 3000;
  state.stats.gambleCount = 6;
  const ending = determineFinalEnding({ pressed: false, state, lastEnding: null });
  if (ending !== 'awaken') throw new Error(ending);
});

run('final ending: stop_loss under high debt', () => {
  const state = getState();
  state.cash = 300;
  state.virtualBalance = 0;
  state.billTotal = 3000;
  state.stats.gambleCount = 9;
  const ending = determineFinalEnding({ pressed: false, state, lastEnding: null });
  if (ending !== 'stop_loss') throw new Error(ending);
});

results.forEach((result) => {
  console.log(`${result.status} — ${result.name}${result.detail ? `: ${result.detail}` : ''}`);
});

const failed = results.filter((result) => result.status === 'FAIL');
console.log(`\n=== ${results.length - failed.length}/${results.length} PASS ===`);
process.exit(failed.length ? 1 : 0);
