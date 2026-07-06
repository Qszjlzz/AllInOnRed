/**
 * 游戏状态管理 — 周期卡牌版
 */
import { BALANCE, randRange } from './balance.js';
import { CYCLE_COUNT } from './cycles.js';

export function createInitialState() {
  return {
    cycle: 1,
    ap: BALANCE.apPerCycle,
    cash: randRange(BALANCE.startCash),
    virtualBalance: 0,
    billTotal: randRange(BALANCE.billTotal),
    billPaid: 0,
    mood: { addiction: 0, stable: 0, anxiety: 0, diligent: 0 },
    moodCards: [],
    cycleResolved: false,
    story: { bookmark: null, node: null },
    flags: {
      intro_done: false,
      gamble_opened: false,
      gamble_count: 0,
      first_gamble_done: false,
      friend_link_seen: false,
      machine_deposit_total: 0,
      triple_unlocked: false,
      ten_unlocked: false,
      card_picked: null,
      initial_asset: 0,
      worked_this_cycle: false,
      work_branch_count: 0,
      family_branch_count: 0,
      family_reply_count: 0,
      bill_seen: false,
      memo_text: '',
      memo_done: false,
      drawing_seen: false,
      final_pressed: false,
      work_unlocked: true,
    },
    stats: { gambleCount: 0, workCount: 0, workSuccess: 0, totalEarned: 0, totalLost: 0 },
    phase: 'playing',
    endingId: null,
    log: [],
  };
}

let state = createInitialState();

export function getState() {
  return state;
}

export function resetGame() {
  state = createInitialState();
  return state;
}

export function loadState(saved) {
  if (saved && typeof saved === 'object') {
    state = {
      ...createInitialState(),
      ...saved,
      flags: { ...createInitialState().flags, ...saved.flags },
      story: { ...createInitialState().story, ...saved.story },
      moodCards: saved.moodCards || [],
    };
  }
  return state;
}

export function exportState() {
  return JSON.parse(JSON.stringify(state));
}

export function spendAp(n = 1) {
  if (state.ap < n) return false;
  state.ap -= n;
  return true;
}

export function addCash(n) {
  state.cash = Math.max(0, state.cash + n);
  if (n > 0) state.stats.totalEarned += n;
  if (n < 0) state.stats.totalLost += Math.abs(n);
}

export function addVirtual(n) {
  state.virtualBalance = Math.max(0, state.virtualBalance + n);
}

export function getDebt() {
  const assets = state.cash + state.virtualBalance * BALANCE.debt.virtualWeight;
  return Math.max(0, state.billTotal - assets);
}

export function getDebtRatio() {
  return getDebt() / state.billTotal;
}

export function addMood(type, n = 1) {
  state.mood[type] = Math.max(0, (state.mood[type] || 0) + n);
  for (let i = 0; i < n; i++) {
    state.moodCards.push(type);
  }
  if (type === 'stable' && state.mood.anxiety > 0) {
    state.mood.anxiety = Math.max(0, state.mood.anxiety - 1);
  }
  if (type === 'diligent' && state.mood.addiction > 0) {
    state.mood.addiction = Math.max(0, state.mood.addiction - 1);
  }
  return type;
}

export function pushLog(msg) {
  state.log.push({ cycle: state.cycle, text: msg });
}

export function endCycle() {
  if (state.cycle >= CYCLE_COUNT) return false;
  state.cycle += 1;
  state.ap = BALANCE.apPerCycle;
  state.cycleResolved = false;
  state.flags.worked_this_cycle = false;
  state.flags.card_picked = null;
  return true;
}

export function canAct() {
  return state.phase === 'playing';
}

export function setEnding(id) {
  state.phase = 'ending';
  state.endingId = id;
}

export function payBill(amount) {
  const pay = Math.min(amount, state.cash, getDebt());
  if (pay <= 0) return 0;
  state.cash -= pay;
  state.billPaid += pay;
  return pay;
}

export function getWorkSpeedMultiplier() {
  const addiction = state.mood.addiction;
  if (addiction >= BALANCE.mood.workPenaltyThreshold) return BALANCE.mood.workSpeedPenalty[2];
  if (addiction >= 2) return BALANCE.mood.workSpeedPenalty[1];
  if (addiction >= 1) return BALANCE.mood.workSpeedPenalty[0];
  if (state.mood.diligent >= 1) return 1.1;
  return 1;
}

export function getWorkIncomeMultiplier() {
  const addiction = state.mood.addiction;
  if (addiction >= BALANCE.mood.workPenaltyThreshold) return 0.6;
  if (addiction >= 2) return 0.75;
  if (addiction >= 1) return 0.9;
  return 1;
}

/** 按按键次数解锁赌博模式 */
export function syncGambleUnlocks() {
  const n = state.stats.gambleCount;
  state.flags.triple_unlocked = n >= 5;
  state.flags.ten_unlocked = n >= 10;
}
