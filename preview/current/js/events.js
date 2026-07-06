/**
 * 剧情事件调度 — v8.1 节拍 + copy 模块
 */
import { getState, getDebtRatio, addMood, setEnding } from './state.js';
import { BALANCE } from './balance.js';
import { COPY } from './copy.js';

/** @type {Map<string, Function>} */
const handlers = new Map();

const REPLAY_KEY = 'biean_last_ending';

export function getLastEnding() {
  try {
    return localStorage.getItem(REPLAY_KEY);
  } catch {
    return null;
  }
}

export function saveLastEnding(id) {
  try {
    if (id && id !== 'perfect' && id !== 'early' && id !== 'early_family') {
      localStorage.setItem(REPLAY_KEY, id);
    }
  } catch { /* ignore */ }
}

function registerEvents() {
  handlers.set('d1_subway', () => ({
    notify: COPY.events.d1_subway.notify,
  }));

  handlers.set('d1_friend_msg', () => ({
    channel: 'chat',
    messages: COPY.events.d1_friend_msg.messages,
    notify: COPY.events.d1_friend_msg.notify,
  }));

  handlers.set('d1_colleague', () => ({
    notify: COPY.events.d1_colleague.notify,
    channel: 'chat',
    messages: COPY.events.d1_colleague.messages,
    thenEvent: 'd1_colleague_choice',
  }));

  handlers.set('d1_colleague_choice', () => ({
    modal: COPY.events.d1_colleague_choice.modal,
    earlyChoiceType: 'colleague',
  }));

  handlers.set('d1_early_choice', () => ({
    modal: COPY.events.d1_early_choice.modal,
    earlyChoiceType: 'gamble',
  }));

  handlers.set('d1_phone_dead', () => ({
    notify: COPY.events.d1_phone_dead.notify,
    modal: COPY.events.d1_phone_dead.modal,
    phoneDead: true,
  }));

  handlers.set('d2_commute', () => ({
    notify: COPY.events.d2_commute.notify,
  }));

  handlers.set('d2_work_notify', () => ({
    notify: COPY.events.d2_work_notify.notify,
    setFlag: { work_unlocked: true },
    channel: 'work',
    messages: COPY.events.d2_work_notify.messages,
  }));

  handlers.set('d2_family', () => ({
    channel: 'family',
    messages: COPY.events.d2_family.messages,
    notify: COPY.events.d2_family.notify,
    familyChoices: COPY.events.d2_family.choices,
  }));

  handlers.set('d2_triple', () => ({
    notify: COPY.events.d2_triple.notify,
    unlockTriple: true,
    setFlag: { d2_triple_shown: true },
  }));

  handlers.set('d2_deposit_hint', () => ({
    notify: COPY.events.d2_deposit_hint.notify,
    setFlag: { deposit_hint: true },
  }));

  handlers.set('d3_bill', () => ({
    notify: COPY.events.d3_bill.notify,
    modal: COPY.events.d3_bill.modal,
  }));

  handlers.set('d3_drawing', () => ({
    channel: 'family',
    messages: COPY.events.d3_drawing.messages,
    notify: COPY.events.d3_drawing.notify,
    drawingChoices: COPY.events.d3_drawing.choices,
    setFlag: { drawing_event_started: true },
  }));

  handlers.set('d3_memo_force', () => ({
    notify: COPY.events.d3_memo_force.notify,
    forceMemo: true,
  }));

  handlers.set('final_choice', () => ({
    finalOverlay: true,
  }));

  handlers.set('addiction_force', () => ({
    modal: COPY.events.addiction_force.modal,
    forceGamble: true,
  }));

  handlers.set('anxiety_event', () => ({
    notify: COPY.events.anxiety_event.notify,
    modal: COPY.events.anxiety_event.modal,
  }));
}

registerEvents();

/**
 * 检查并触发事件 — 返回待处理事件 ID 列表
 */
export function collectPendingEvents() {
  const state = getState();
  const f = state.flags;
  const queue = [];

  if (state.day === 1 && !f.subway_seen) {
    f.subway_seen = true;
    queue.push('d1_subway');
  }

  if (state.day === 1 && !f.intro_done) {
    f.intro_done = true;
    queue.push('d1_friend_msg');
  }

  if (state.day === 1 && f.gamble_count >= 1 && !f.colleague_interrupt) {
    f.colleague_interrupt = true;
    queue.push('d1_colleague');
  }

  if (state.day === 1 && f.gamble_count >= 2 && !f.early_choice_shown && !f.early_stopped) {
    f.early_choice_shown = true;
    queue.push('d1_early_choice');
  }

  if (
    state.day === 1 &&
    f.gamble_count >= 5 &&
    !f.phone_dead_shown &&
    !f.early_stopped &&
    !f.early_family
  ) {
    f.phone_dead_shown = true;
    queue.push('d1_phone_dead');
  }

  if (state.day === 2 && !f.d2_commute_seen) {
    f.d2_commute_seen = true;
    queue.push('d2_commute');
  }

  if (state.day === 2 && f.intro_done && !f.d2_work_notify) {
    f.d2_work_notify = true;
    queue.push('d2_work_notify');
  }

  if (state.day === 2 && !f.family_seen && (state.ap <= 2 || f.gamble_count >= 2)) {
    f.family_seen = true;
    queue.push('d2_family');
  }

  if (
    state.day === 2 &&
    !f.triple_unlocked &&
    !f.d2_triple_shown &&
    (state.mood.addiction >= 1 || f.gamble_count >= 3)
  ) {
    queue.push('d2_triple');
  }

  if (state.day === 2 && f.gamble_opened && !f.deposit_hint) {
    queue.push('d2_deposit_hint');
  }

  if (state.day === 3 && !f.d3_bill) {
    f.d3_bill = true;
    queue.push('d3_bill');
  }

  if (state.day === 3 && !f.drawing_seen && !f.drawing_event_started && (state.ap <= 2 || f.d3_bill)) {
    queue.push('d3_drawing');
  }

  if (state.day === 3 && f.drawing_seen && !f.memo_done && !f.memo_prompt) {
    f.memo_prompt = true;
    queue.push('d3_memo_force');
  }

  if (
    state.mood.addiction >= BALANCE.mood.addictionForce &&
    !f.addiction_force_done &&
    state.day >= 2
  ) {
    f.addiction_force_done = true;
    queue.push('addiction_force');
  }

  if (
    state.mood.anxiety >= BALANCE.mood.anxietyTrigger &&
    !f.anxiety_event_done &&
    state.day >= 2
  ) {
    f.anxiety_event_done = true;
    queue.push('anxiety_event');
  }

  if (f.final_ready && f.memo_done && !f.final_done && !f.final_triggered) {
    f.final_triggered = true;
    queue.push('final_choice');
  }

  return queue;
}

export function getEventPayload(id) {
  return handlers.get(id)?.() || null;
}

/** 早期止损 */
export function handleEarlyChoice(choiceId, type = 'gamble') {
  const state = getState();
  if (choiceId === 'stop' && type === 'gamble') {
    state.flags.early_stopped = true;
    setEnding('early');
    return 'early';
  }
  if (choiceId === 'family' && type === 'colleague') {
    state.flags.early_family = true;
    setEnding('early_family');
    return 'early_family';
  }
  if (choiceId === 'continue') {
    state.flags.continued_after_interrupt = true;
  }
  return null;
}

/** 手机没电结局 */
export function handlePhoneDead() {
  setEnding('phone_dead');
  return 'phone_dead';
}

/** 家庭群回复 Day2 */
export function handleFamilyReply(replyId) {
  const state = getState();
  if (state.flags.family_replied) return { text: null, followUp: null };
  state.flags.family_replied = true;

  if (replyId === 'good') {
    addMood('stable', 1);
    return {
      text: COPY.events.d2_family_good.player,
      followUp: COPY.events.d2_family_good.followUp,
      moodToast: 'stable',
    };
  }
  addMood('anxiety', 1);
  return {
    text: null,
    followUp: COPY.events.d2_family_ignore.followUp,
    moodToast: 'anxiety',
  };
}

/** Day3 女儿画作选择 */
export function handleDrawingChoice(choiceId) {
  const state = getState();
  if (state.flags.drawing_replied) return null;
  state.flags.drawing_replied = true;
  state.flags.drawing_seen = true;

  if (choiceId === 'look') {
    addMood('stable', 1);
    return {
      text: COPY.events.d3_drawing_look.player,
      followUp: COPY.events.d3_drawing_look.followUp,
      moodToast: 'stable',
    };
  }
  addMood('anxiety', 1);
  return {
    text: COPY.events.d3_drawing_wait.player,
    followUp: COPY.events.d3_drawing_wait.followUp,
    moodToast: 'anxiety',
  };
}

/** 最终抉择 */
export function handleFinalChoice(pressed) {
  const state = getState();
  state.flags.final_done = true;
  state.flags.final_pressed = pressed;
  const ratio = getDebtRatio();
  const lastEnding = getLastEnding();
  let id;

  if (pressed) {
    id = lastEnding && lastEnding !== 'perfect' ? 'delusion' : 'ruin';
  } else if (lastEnding && lastEnding !== 'perfect' && lastEnding !== 'early' && lastEnding !== 'early_family') {
    id = 'memory';
  } else if (ratio < BALANCE.debt.perfectRatio && state.stats.gambleCount <= 4) {
    id = 'perfect';
  } else if (ratio < BALANCE.debt.awakenRatio) {
    id = 'awaken';
  } else {
    id = 'stop_loss';
  }

  setEnding(id);
  saveLastEnding(id);
  return id;
}

export const ENDINGS = COPY.endings;

export function showMoodToast(type) {
  const map = {
    addiction: COPY.notify.moodAddiction,
    stable: COPY.notify.moodStable,
    anxiety: COPY.notify.moodAnxiety,
    diligent: COPY.notify.moodDiligent,
  };
  return map[type] || null;
}
