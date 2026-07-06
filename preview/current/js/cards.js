/**
 * 卡牌系统 + 五周期剧情推进
 */
import { COPY } from './copy.js';
import { getCardsForCycle, CYCLE_COUNT } from './cycles.js';
import {
  getState,
  addMood,
  endCycle,
  setEnding,
  payBill,
  exportState,
  loadState,
} from './state.js';
import { determineFinalEnding, saveLastEnding } from './endings.js';
import { gamble, depositToMachine, withdrawFromMachine } from './gambling.js';
import { startWorkQTE } from './work.js';
import { play } from './audio.js';
import {
  resolveBranchCopy,
  resolveCycleOpening,
  resolveFinalDecisionCopy,
} from './story-logic.js';

let uiCallbacks = null;
let storyBusy = false;

const MOOD_TOASTS = {
  addiction: COPY.notify.moodAddiction,
  stable: COPY.notify.moodStable,
  anxiety: COPY.notify.moodAnxiety,
  diligent: COPY.notify.moodDiligent,
};

const CYCLE1_REWIND_NOTICE = '时间向后退了一小格。你回到了那个还来得及重选的时候。';

export function initCards(callbacks) {
  uiCallbacks = callbacks;
}

export function isStoryBusy() {
  return storyBusy;
}

export function getCycleCards() {
  return getCardsForCycle(getState().cycle);
}

export async function beginCycle() {
  const state = getState();
  const cycleOpening = resolveCycleOpening(state.cycle, state);
  if (!COPY.cycles[state.cycle]) return;

  state.cycleResolved = false;
  state.flags.card_picked = null;

  uiCallbacks.openWindow('cards');
  uiCallbacks.renderCardTable(getCycleCards(), null);

  if (cycleOpening?.length) {
    await uiCallbacks.narrateSequential(cycleOpening);
  }

  uiCallbacks.setNarrativeChoices([]);
  await uiCallbacks.narrate(COPY.cards.ui.pickOne);
}

export async function placeCard(cardId) {
  const state = getState();
  if (state.cycleResolved || storyBusy || state.phase !== 'playing') return;

  const cards = getCardsForCycle(state.cycle);
  if (!cards.some((card) => card.id === cardId)) return;

  state.cycleResolved = true;
  state.flags.card_picked = cardId;
  uiCallbacks.renderCardTable(cards, cardId);
  await uiCallbacks.narrate(COPY.cards.ui.forfeited);

  if (state.cycle === 1) {
    await runCycle1Branch(cardId);
    return;
  }

  if (state.cycle === 2) {
    await runCycle2Branch(cardId);
    return;
  }

  if (state.cycle === 3) {
    await runCycle3Branch(cardId);
    return;
  }

  if (state.cycle === 4) {
    await runCycle4Branch(cardId);
    return;
  }

  await runCycle5Branch(cardId);
}

async function runCycle1Branch(cardId) {
  const branch = resolveBranchCopy(1, cardId, getState());
  if (!branch) {
    await finishCycle();
    return;
  }

  switch (cardId) {
    case 'friend_link':
      await runFriendLinkBranch(branch);
      break;
    case 'work_report':
      await runWorkReportBranch(branch);
      break;
    case 'wife_msg':
      await runWifeMsgBranch(branch);
      break;
    default:
      await finishCycle();
  }
}

async function runCycle2Branch(cardId) {
  const branch = resolveBranchCopy(2, cardId, getState());
  if (!branch) {
    await finishCycle();
    return;
  }

  storyBusy = true;
  try {
    if (cardId === 'gamble_again') {
      await runGambleAgainBranch(branch);
      return;
    }
    if (cardId === 'wife_breakfast') {
      await runWifeBreakfastBranch(branch);
      return;
    }
    if (cardId === 'work_daily') {
      await runWorkBranch(branch);
      return;
    }
    await finishCycle();
  } finally {
    storyBusy = false;
  }
}

async function runCycle3Branch(cardId) {
  const branch = resolveBranchCopy(3, cardId, getState());
  if (!branch) {
    await finishCycle();
    return;
  }

  storyBusy = true;
  try {
    if (cardId === 'work_hard') {
      await runWorkBranch(branch);
      return;
    }
    if (cardId === 'gamble_big') {
      await runGambleBigBranch(branch);
      return;
    }
    if (cardId === 'family_drawing') {
      await runFamilyDrawingBranch(branch);
      return;
    }
    await finishCycle();
  } finally {
    storyBusy = false;
  }
}

async function runCycle4Branch(cardId) {
  const branch = resolveBranchCopy(4, cardId, getState());
  if (!branch) {
    await finishCycle();
    return;
  }

  storyBusy = true;
  try {
    if (cardId === 'bill_reminder') {
      await runBillReminderBranch(branch);
      return;
    }
    if (cardId === 'memo_prompt') {
      await runMemoPromptBranch(branch);
      return;
    }
    if (cardId === 'anxiety_ping') {
      await runAnxietyPingBranch(branch);
      return;
    }
    await finishCycle();
  } finally {
    storyBusy = false;
  }
}

async function runCycle5Branch(cardId) {
  const branch = resolveBranchCopy(5, cardId, getState());
  if (!branch) {
    await launchFinalDecision();
    return;
  }

  storyBusy = true;
  try {
    if (cardId === 'final_prep') {
      await uiCallbacks.narrateSequential(branch.pick);
      await launchFinalDecision();
      return;
    }
    if (cardId === 'family_wait') {
      await runFamilyWaitBranch(branch);
      return;
    }
    if (cardId === 'one_more_gamble') {
      await runOneMoreGambleBranch(branch);
      return;
    }
    await launchFinalDecision();
  } finally {
    storyBusy = false;
  }
}

async function runWorkReportBranch(branch) {
  storyBusy = true;
  try {
    markWorkBranch();
    await uiCallbacks.narrateSequential(branch.pick);
    uiCallbacks.openWindow('work');
    await uiCallbacks.narrateSequential(branch.work);
    awardMood('diligent');
    await uiCallbacks.narrate(branch.done);
    await finishCycle();
  } finally {
    storyBusy = false;
  }
}

async function runWifeMsgBranch(branch) {
  storyBusy = true;
  try {
    markFamilyBranch();
    await uiCallbacks.narrateSequential(branch.pick);
    uiCallbacks.openWindow('family');
    appendMessages('family', branch.chat);

    const choice = await uiCallbacks.showChoices(
      [
        { id: 'good', label: branch.replyGood, primary: true },
        { id: 'late', label: branch.replyLate },
      ],
      '要不要回她？',
    );

    if (choice === 'good') {
      appendMessages('family', branch.replyGoodFollow);
      markFamilyReply();
      awardMood('stable');
    } else {
      appendMessages('family', branch.replyLateFollow);
      markFamilyReply();
      awardMood('anxiety');
    }

    await finishCycle();
  } finally {
    storyBusy = false;
  }
}

async function runFriendLinkBranch(branch) {
  storyBusy = true;
  try {
    const state = getState();
    state.flags.friend_link_seen = true;
    state.flags.gamble_opened = true;
    await uiCallbacks.narrateSequential(branch.pick);
    uiCallbacks.openWindow('chat');
    appendMessages('chat', branch.chat);
    uiCallbacks.openWindow('gamble');
    await uiCallbacks.narrateSequential(branch.openGamble);

    const asset = await uiCallbacks.showChoices(
      branch.assets.map((option) => ({
        id: String(option.id),
        label: option.label,
        desc: option.desc,
        primary: option.id === 300,
      })),
      branch.assetPrompt,
    );

    const amount = Number(asset) || 300;
    state.flags.initial_asset = amount;
    const deposit = depositToMachine(Math.min(amount, getState().cash));
    if (!deposit.ok) {
      await uiCallbacks.narrate(COPY.gamble.depositError);
    }

    uiCallbacks.updateHUD();
    await uiCallbacks.narrate(branch.assetThought);
    await uiCallbacks.narrateSequential(branch.gambleReady);

    saveBookmark('c1_first_choice');
    const first = await uiCallbacks.showChoices(
      [
        { id: 'try', label: branch.firstChoice.try, primary: true },
        { id: 'rules', label: branch.firstChoice.rules },
      ],
      branch.firstChoice.prompt,
    );

    if (first === 'rules') {
      await showRules(branch);
      return;
    }

    await runPressSequence(branch);
  } finally {
    storyBusy = false;
  }
}

async function showRules(branch) {
  await uiCallbacks.narrate(`**${branch.rules.title}**`);
  await uiCallbacks.narrateSequential(branch.rules.body);
  saveBookmark('c1_after_rules');

  const pick = await uiCallbacks.showChoices(
    [
      { id: 'continue', label: branch.rules.continue, primary: true },
      { id: 'quit', label: branch.rules.quit },
    ],
    '看完以后，你还想继续吗？',
  );

  if (pick === 'quit') {
    await uiCallbacks.narrateSequential(branch.rulesQuit);
    await showEarlyEnding('rules_quit', 'c1_after_rules');
    return;
  }

  await runPressSequence(branch);
}

async function runPressSequence(branch) {
  await doScriptedPress(branch.press1, 50);
  saveBookmark('c1_after_press1');
  let pick = await uiCallbacks.showChoices([
    { id: 'again', label: branch.press1.again, primary: true },
    { id: 'stop', label: branch.press1.stop },
  ]);
  if (pick === 'stop') {
    await uiCallbacks.narrateSequential(branch.stopAfter1);
    await showEarlyEnding('stop_after_1', 'c1_after_press1');
    return;
  }

  await continueAfterPress1(branch);
}

async function continueAfterPress1(branch) {
  await doScriptedPress(branch.press2, 80);
  saveBookmark('c1_after_press2');
  const pick = await uiCallbacks.showChoices([
    { id: 'again', label: branch.press2.again, primary: true },
    { id: 'stop', label: branch.press2.stop },
  ]);
  if (pick === 'stop') {
    await uiCallbacks.narrateSequential(branch.stopAfter2);
    await showEarlyEnding('stop_after_2', 'c1_after_press2');
    return;
  }

  await continueAfterPress2(branch);
}

async function continueAfterPress2(branch) {
  await doScriptedPress(branch.press3, -120);
  saveBookmark('c1_after_press3');
  const pick = await uiCallbacks.showChoices([
    { id: 'again', label: branch.press3.again, primary: true },
    { id: 'stop', label: branch.press3.stop },
  ]);
  if (pick === 'stop') {
    await uiCallbacks.narrateSequential(branch.stopAfter3);
    await showEarlyEnding('stop_after_3', 'c1_after_press3');
    return;
  }

  await showColleagueDecision(branch);
}

async function showColleagueDecision(branch) {
  await uiCallbacks.narrateSequential(branch.colleague);
  saveBookmark('c1_colleague');

  const pick = await uiCallbacks.showChoices(
    [
      { id: 'oneMore', label: branch.afterColleague.oneMore, primary: true },
      { id: 'quit', label: branch.afterColleague.quit },
    ],
    branch.afterColleague.prompt,
  );

  if (pick === 'quit') {
    await uiCallbacks.narrateSequential(branch.quitAfterColleague);
    await showEarlyEnding('quit_colleague', 'c1_colleague');
    return;
  }

  await uiCallbacks.narrateSequential(branch.press4.lines);
  await showEarlyEnding('phone_dead', 'c1_colleague', true);
}

async function doScriptedPress(pressCopy, delta) {
  const state = getState();
  state.stats.gambleCount += 1;
  state.flags.gamble_count = (state.flags.gamble_count || 0) + 1;
  state.flags.gamble_opened = true;
  state.flags.first_gamble_done = true;

  if (delta >= 0) {
    getState().virtualBalance += delta;
  } else {
    getState().virtualBalance = Math.max(0, getState().virtualBalance + delta);
  }

  if (delta >= 0) {
    awardMood('addiction');
  }

  uiCallbacks.renderWheelResult(pressCopy.result);
  uiCallbacks.setGambleLog(pressCopy.result);
  uiCallbacks.updateHUD();
  uiCallbacks.updateGambleButtons();
  await uiCallbacks.narrateSequential(pressCopy.lines);
}

async function runGambleAgainBranch(branch) {
  markGambleWindowSeen();
  await uiCallbacks.narrateSequential(branch.pick);
  uiCallbacks.openWindow('chat');
  appendMessages('chat', branch.chat);
  uiCallbacks.openWindow('gamble');
  await uiCallbacks.narrateSequential(branch.intro);

  const choice = await uiCallbacks.showChoices(
    [
      { id: 'press', label: branch.choices.press, primary: true },
      { id: 'store', label: branch.choices.store },
      { id: 'close', label: branch.choices.close },
    ],
    branch.prompt,
  );

  if (choice === 'store') {
    const amount = Math.min(300, getState().cash);
    const result = depositToMachine(amount);
    if (result.ok) {
      uiCallbacks.setGambleLog(COPY.gamble.depositOk(result.amount));
      uiCallbacks.notify('机器', COPY.gamble.depositNotify(result.amount));
      uiCallbacks.updateHUD();
      await uiCallbacks.narrateSequential(branch.storeLines);
    } else {
      await uiCallbacks.narrate(result.error);
    }
    await finishCycle();
    return;
  }

  if (choice === 'close') {
    await uiCallbacks.narrateSequential(branch.closeLines);
    await finishCycle();
    return;
  }

  const gambleResult = await executeGamble(1);
  if (gambleResult.ok) {
    await uiCallbacks.narrateSequential(gambleResult.netDelta >= 0 ? branch.resultGood : branch.resultBad);
  }
  await finishCycle();
}

async function runWifeBreakfastBranch(branch) {
  markFamilyBranch();
  await uiCallbacks.narrateSequential(branch.pick);
  uiCallbacks.openWindow('family');
  appendMessages('family', branch.chat);

  const choice = await uiCallbacks.showChoices(
    [
      { id: 'good', label: branch.choices.good, primary: true },
      { id: 'late', label: branch.choices.late },
    ],
    '你的回复会留下痕迹。',
  );

  if (choice === 'good') {
    appendMessages('family', branch.goodFollow);
    markFamilyReply();
    awardMood('stable');
  } else {
    appendMessages('family', branch.lateFollow);
    markFamilyReply();
    awardMood('anxiety');
  }

  await finishCycle();
}

async function runWorkBranch(branch) {
  markWorkBranch();
  await uiCallbacks.narrateSequential(branch.pick);
  uiCallbacks.openWindow('work');
  if (branch.intro?.length) {
    await uiCallbacks.narrateSequential(branch.intro);
  }

  const area = uiCallbacks.getWorkArea?.();
  if (!area) {
    await uiCallbacks.narrate('工作模块没有准备好。');
    await finishCycle();
    return;
  }

  const result = await new Promise((resolve) => startWorkQTE(area, resolve));
  (result.moodsGained || []).forEach((type) => addMoodFeedback(type));

  play(result.success ? 'win' : 'loss');
  uiCallbacks.updateHUD();
  uiCallbacks.notify('工作', result.message);
  await uiCallbacks.narrate(result.message);

  if (result.success && branch.success?.length) {
    await uiCallbacks.narrateSequential(branch.success);
  } else if (!result.success && branch.fail?.length) {
    await uiCallbacks.narrateSequential(branch.fail);
  }

  await finishCycle();
}

async function runGambleBigBranch(branch) {
  markGambleWindowSeen();
  await uiCallbacks.narrateSequential(branch.pick);
  uiCallbacks.openWindow('gamble');
  await uiCallbacks.narrateSequential(branch.intro);

  const stake = await uiCallbacks.showChoices(
    [
      { id: 'small', label: branch.stakeChoices.small, primary: true },
      { id: 'large', label: branch.stakeChoices.large },
      { id: 'leave', label: branch.stakeChoices.leave },
    ],
    branch.stakePrompt,
  );

  if (stake === 'leave') {
    awardMood('stable');
    await uiCallbacks.narrateSequential(branch.leaveLines);
    await finishCycle();
    return;
  }

  const requestedAmount = stake === 'large' ? 600 : 300;
  const amount = Math.min(requestedAmount, getState().cash);
  const deposit = depositToMachine(amount);
  if (!deposit.ok) {
    await uiCallbacks.narrate(branch.noCash);
    await finishCycle();
    return;
  }

  uiCallbacks.setGambleLog(COPY.gamble.depositOk(deposit.amount));
  uiCallbacks.updateHUD();
  await uiCallbacks.narrate(`你先往机器里压了 ¥${deposit.amount}。这一次你不想玩“小打小闹”。`);

  let spinCount = 1;
  if (getState().flags.triple_unlocked) {
    const mode = await uiCallbacks.showChoices(
      [
        { id: 'once', label: branch.modeChoices.once },
        { id: 'triple', label: branch.modeChoices.triple, primary: true },
      ],
      branch.modePrompt,
    );
    spinCount = mode === 'triple' ? 3 : 1;
  }

  const gambleResult = await executeGamble(spinCount);
  if (gambleResult.ok) {
    await uiCallbacks.narrateSequential(gambleResult.netDelta >= 0 ? branch.afterGood : branch.afterBad);
  }
  await finishCycle();
}

async function runFamilyDrawingBranch(branch) {
  const state = getState();
  markFamilyBranch();
  await uiCallbacks.narrateSequential(branch.pick);
  uiCallbacks.openWindow('family');
  appendMessages('family', branch.chat);

  const choice = await uiCallbacks.showChoices(
    [
      { id: 'look', label: branch.choices.look, primary: true },
      { id: 'wait', label: branch.choices.wait },
    ],
    '你要不要马上看？',
  );

  state.flags.drawing_seen = true;
  if (choice === 'look') {
    appendMessages('family', branch.lookFollow);
    markFamilyReply();
    awardMood('stable');
  } else {
    appendMessages('family', branch.waitFollow);
    markFamilyReply();
    awardMood('anxiety');
  }

  await finishCycle();
}

async function runBillReminderBranch(branch) {
  getState().flags.bill_seen = true;
  await uiCallbacks.narrateSequential(branch.pick);
  await uiCallbacks.narrateSequential(branch.intro);

  const choice = await uiCallbacks.showChoices(
    [
      { id: 'small', label: branch.choices.small, primary: true },
      { id: 'all', label: branch.choices.all },
      { id: 'delay', label: branch.choices.delay },
    ],
    branch.prompt,
  );

  if (choice === 'delay') {
    awardMood('anxiety');
    await uiCallbacks.narrateSequential(branch.delay);
    await finishCycle();
    return;
  }

  const paid = payBill(choice === 'all' ? getState().cash : 500);
  uiCallbacks.updateHUD();
  if (choice === 'all') {
    await uiCallbacks.narrate(branch.paidAll(paid));
  } else {
    await uiCallbacks.narrate(branch.paidSmall(paid));
  }

  if (paid > 0) {
    awardMood('stable');
  }

  await finishCycle();
}

async function runMemoPromptBranch(branch) {
  const state = getState();
  await uiCallbacks.narrateSequential(branch.pick);

  const text = await uiCallbacks.showTextEntry({
    title: COPY.memo.title,
    prompt: branch.prompt,
    placeholder: COPY.memo.placeholder,
    initialValue: state.flags.memo_text || '',
    confirmLabel: COPY.memo.confirm,
  });

  if (!text) {
    uiCallbacks.notify(COPY.notify.memoEmpty.title, COPY.notify.memoEmpty.body);
    await runMemoPromptBranch(branch);
    return;
  }

  state.flags.memo_text = text;
  state.flags.memo_done = true;
  uiCallbacks.notify(COPY.notify.memoSaved.title, COPY.notify.memoSaved.body);
  await uiCallbacks.narrateSequential(branch.afterSave);
  await finishCycle();
}

async function runAnxietyPingBranch(branch) {
  markFamilyBranch();
  await uiCallbacks.narrateSequential(branch.pick);
  uiCallbacks.openWindow('family');
  appendMessages('family', branch.chat);

  const choice = await uiCallbacks.showChoices(
    [
      { id: 'reply', label: branch.choices.reply, primary: true },
      { id: 'avoid', label: branch.choices.avoid },
    ],
    '要不要回过去？',
  );

  if (choice === 'reply') {
    appendMessages('family', branch.replyFollow);
    markFamilyReply();
    awardMood('stable');
  } else {
    appendMessages('family', branch.avoidFollow);
    awardMood('anxiety');
  }

  await finishCycle();
}

async function runFamilyWaitBranch(branch) {
  markFamilyBranch();
  await uiCallbacks.narrateSequential(branch.pick);
  uiCallbacks.openWindow('family');
  appendMessages('family', branch.chat);

  const choice = await uiCallbacks.showChoices(
    [
      { id: 'reply', label: branch.choices.reply, primary: true },
      { id: 'silent', label: branch.choices.silent },
    ],
    '你最后要不要回这句？',
  );

  if (choice === 'reply') {
    appendMessages('family', branch.replyFollow);
    markFamilyReply();
    awardMood('stable');
  } else {
    appendMessages('family', branch.silentFollow);
    awardMood('anxiety');
  }

  await launchFinalDecision();
}

async function runOneMoreGambleBranch(branch) {
  markGambleWindowSeen();
  await uiCallbacks.narrateSequential(branch.pick);
  uiCallbacks.openWindow('gamble');

  const choice = await uiCallbacks.showChoices(
    [
      { id: 'press', label: branch.choices.press, primary: true },
      { id: 'stop', label: branch.choices.stop },
    ],
    branch.prompt,
  );

  if (choice === 'stop') {
    await uiCallbacks.narrateSequential(branch.stopLines);
    await launchFinalDecision();
    return;
  }

  const gambleResult = await executeGamble(1);
  if (gambleResult.ok) {
    await uiCallbacks.narrateSequential(gambleResult.netDelta >= 0 ? branch.afterGood : branch.afterBad);
  }

  await launchFinalDecision();
}

async function executeGamble(spinCount) {
  uiCallbacks.openWindow('gamble');
  const result = gamble(spinCount);
  if (!result.ok) {
    uiCallbacks.notify('赌博', result.error);
    uiCallbacks.updateGambleButtons();
    await uiCallbacks.narrate(result.error);
    return { ok: false, error: result.error, netDelta: 0 };
  }

  let netDelta = 0;
  if (result.firstNarrative) {
    await uiCallbacks.narrate(result.firstNarrative);
  }

  for (const spin of result.results) {
    netDelta += spin.delta;
    uiCallbacks.renderWheelResult(spin.segment.label);
    uiCallbacks.setGambleLog(spin.message);
    play(spin.delta >= 0 ? 'win' : 'loss');
    if (spin.moodGained) {
      addMoodFeedback(spin.moodGained);
    }
    uiCallbacks.updateHUD();
    uiCallbacks.updateGambleButtons();
    await sleep(260);
  }

  return { ok: true, netDelta, results: result.results };
}

async function launchFinalDecision() {
  const state = getState();
  const choice = await uiCallbacks.showFinalDecision(resolveFinalDecisionCopy(state));
  state.flags.final_pressed = choice === 'press';

  const endingId = determineFinalEnding({
    pressed: choice === 'press',
    state,
  });

  setEnding(endingId);
  saveLastEnding(endingId);
  uiCallbacks.showEndingScreen(endingId, COPY.endings[endingId]);
}

function appendMessages(channel, messages) {
  messages.forEach((message) => uiCallbacks.appendChat(channel, message));
}

function awardMood(type, amount = 1) {
  addMood(type, amount);
  addMoodFeedback(type, amount);
}

function addMoodFeedback(type, amount = 1) {
  for (let i = 0; i < amount; i += 1) {
    uiCallbacks.addMoodCard(type);
  }
  uiCallbacks.flashMood(type);
  uiCallbacks.updateHUD();
  const toast = MOOD_TOASTS[type];
  if (toast) {
    uiCallbacks.notify(toast.title, toast.body);
  }
}

function saveBookmark(id) {
  const state = getState();
  const snapshot = exportState();
  if (snapshot.story) {
    snapshot.story.bookmark = null;
  }
  state.story.bookmark = {
    id,
    cardId: state.flags.card_picked,
    snapshot,
  };
}

async function showEarlyEnding(endingKey, rewindBookmark, canContinueCycle = false) {
  const ending = COPY.cycles[1].earlyEndings[endingKey] || COPY.endings[endingKey];
  if (!ending) return;

  await uiCallbacks.narrate(COPY.cycles[1].demoEndPrompt);
  const pick = await uiCallbacks.showChoices([
    { id: 'rewind', label: COPY.narrative.choices.rewind, primary: true },
    { id: 'menu', label: COPY.narrative.choices.mainMenu },
    ...(canContinueCycle
      ? [{ id: 'continue', label: '进入周期 2' }]
      : [{ id: 'continue_line', label: COPY.narrative.choices.continueDemo }]),
  ]);

  if (pick === 'rewind') {
    await rewindToBookmark(rewindBookmark);
    return;
  }

  if (pick === 'continue' && canContinueCycle) {
    endCycle();
    uiCallbacks.updateHUD();
    await beginCycle();
    return;
  }

  setEnding(endingKey);
  uiCallbacks.showEndingScreen(endingKey, ending);
}

async function rewindToBookmark(bookmarkId) {
  const bookmark = getState().story?.bookmark;
  if (!bookmark?.snapshot || bookmark.id !== bookmarkId) {
    const state = getState();
    state.phase = 'playing';
    state.endingId = null;
    state.cycleResolved = false;
    state.flags.card_picked = null;
    uiCallbacks.resetTransientView?.();
    uiCallbacks.updateHUD();
    await beginCycle();
    return;
  }

  loadState(bookmark.snapshot);
  const restored = getState();
  restored.phase = 'playing';
  restored.endingId = null;
  restored.cycleResolved = true;
  restored.flags.card_picked = restored.flags.card_picked || bookmark.cardId || 'friend_link';
  restored.story.bookmark = bookmark;

  uiCallbacks.resetTransientView?.();
  uiCallbacks.openWindow('cards');
  uiCallbacks.renderCardTable(getCycleCards(), restored.flags.card_picked);
  uiCallbacks.updateHUD();
  uiCallbacks.updateGambleButtons();
  await uiCallbacks.narrate(CYCLE1_REWIND_NOTICE);
  await resumeCycle1Bookmark(bookmarkId);
}

async function resumeCycle1Bookmark(bookmarkId) {
  const branch = resolveBranchCopy(1, 'friend_link', getState());
  if (!branch) {
    await finishCycle();
    return;
  }

  restoreCycle1BookmarkWindows(branch);

  switch (bookmarkId) {
    case 'c1_after_rules':
      await resumeCycle1AfterRules(branch);
      return;
    case 'c1_after_press1':
      await resumeCycle1AfterPress1(branch);
      return;
    case 'c1_after_press2':
      await resumeCycle1AfterPress2(branch);
      return;
    case 'c1_after_press3':
      await resumeCycle1AfterPress3(branch);
      return;
    case 'c1_colleague':
      await resumeCycle1Colleague(branch);
      return;
    case 'c1_first_choice':
    default:
      await resumeCycle1FirstChoice(branch);
  }
}

function restoreCycle1BookmarkWindows(branch) {
  uiCallbacks.openWindow('chat');
  appendMessages('chat', branch.chat);
  uiCallbacks.openWindow('gamble');
}

async function resumeCycle1FirstChoice(branch) {
  const first = await uiCallbacks.showChoices(
    [
      { id: 'try', label: branch.firstChoice.try, primary: true },
      { id: 'rules', label: branch.firstChoice.rules },
    ],
    branch.firstChoice.prompt,
  );

  if (first === 'rules') {
    await showRules(branch);
    return;
  }

  await runPressSequence(branch);
}

async function resumeCycle1AfterRules(branch) {
  await uiCallbacks.narrate(`**${branch.rules.title}**`);
  await uiCallbacks.narrateSequential(branch.rules.body);

  const pick = await uiCallbacks.showChoices(
    [
      { id: 'continue', label: branch.rules.continue, primary: true },
      { id: 'quit', label: branch.rules.quit },
    ],
    '看完以后，你还想继续吗？',
  );

  if (pick === 'quit') {
    await uiCallbacks.narrateSequential(branch.rulesQuit);
    await showEarlyEnding('rules_quit', 'c1_after_rules');
    return;
  }

  await runPressSequence(branch);
}

async function resumeCycle1AfterPress1(branch) {
  uiCallbacks.renderWheelResult(branch.press1.result);
  uiCallbacks.setGambleLog(branch.press1.result);
  await uiCallbacks.narrateSequential(branch.press1.lines);

  const pick = await uiCallbacks.showChoices([
    { id: 'again', label: branch.press1.again, primary: true },
    { id: 'stop', label: branch.press1.stop },
  ]);
  if (pick === 'stop') {
    await uiCallbacks.narrateSequential(branch.stopAfter1);
    await showEarlyEnding('stop_after_1', 'c1_after_press1');
    return;
  }

  await continueAfterPress1(branch);
}

async function resumeCycle1AfterPress2(branch) {
  uiCallbacks.renderWheelResult(branch.press2.result);
  uiCallbacks.setGambleLog(branch.press2.result);
  await uiCallbacks.narrateSequential(branch.press2.lines);

  const pick = await uiCallbacks.showChoices([
    { id: 'again', label: branch.press2.again, primary: true },
    { id: 'stop', label: branch.press2.stop },
  ]);
  if (pick === 'stop') {
    await uiCallbacks.narrateSequential(branch.stopAfter2);
    await showEarlyEnding('stop_after_2', 'c1_after_press2');
    return;
  }

  await continueAfterPress2(branch);
}

async function resumeCycle1AfterPress3(branch) {
  uiCallbacks.renderWheelResult(branch.press3.result);
  uiCallbacks.setGambleLog(branch.press3.result);
  await uiCallbacks.narrateSequential(branch.press3.lines);

  const pick = await uiCallbacks.showChoices([
    { id: 'again', label: branch.press3.again, primary: true },
    { id: 'stop', label: branch.press3.stop },
  ]);
  if (pick === 'stop') {
    await uiCallbacks.narrateSequential(branch.stopAfter3);
    await showEarlyEnding('stop_after_3', 'c1_after_press3');
    return;
  }

  await showColleagueDecision(branch);
}

async function resumeCycle1Colleague(branch) {
  await uiCallbacks.narrateSequential(branch.colleague);
  saveBookmark('c1_colleague');

  const pick = await uiCallbacks.showChoices(
    [
      { id: 'oneMore', label: branch.afterColleague.oneMore, primary: true },
      { id: 'quit', label: branch.afterColleague.quit },
    ],
    branch.afterColleague.prompt,
  );

  if (pick === 'quit') {
    await uiCallbacks.narrateSequential(branch.quitAfterColleague);
    await showEarlyEnding('quit_colleague', 'c1_colleague');
    return;
  }

  await uiCallbacks.narrateSequential(branch.press4.lines);
  await showEarlyEnding('phone_dead', 'c1_colleague', true);
}

async function finishCycle() {
  await uiCallbacks.narrate(COPY.hud.cycleReady);
}

function markGambleWindowSeen() {
  const state = getState();
  state.flags.gamble_opened = true;
}

function markFamilyBranch() {
  const state = getState();
  state.flags.family_branch_count = (state.flags.family_branch_count || 0) + 1;
}

function markFamilyReply() {
  const state = getState();
  state.flags.family_reply_count = (state.flags.family_reply_count || 0) + 1;
}

function markWorkBranch() {
  const state = getState();
  state.flags.work_branch_count = (state.flags.work_branch_count || 0) + 1;
}

export function advanceCycleManually() {
  const state = getState();
  if (!state.cycleResolved) {
    uiCallbacks.notify('提示', '请先选择一张事件牌。');
    return false;
  }

  const advanced = endCycle();
  uiCallbacks.updateHUD();
  if (advanced) {
    const nextNotice = COPY.notify.newCycle(getState().cycle);
    uiCallbacks.notify(nextNotice.title, nextNotice.body);
    beginCycle();
  } else {
    uiCallbacks.notify(COPY.notify.lastCycle.title, COPY.notify.lastCycle.body);
  }
  return advanced;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export { gamble, depositToMachine, withdrawFromMachine, startWorkQTE };
