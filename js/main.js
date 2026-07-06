/**
 * 主入口 — 周期卡牌 + 像素桌面
 */
import { getState, resetGame, exportState, loadState, syncGambleUnlocks, getDebt } from './state.js';
import {
  initCards,
  beginCycle,
  placeCard,
  advanceCycleManually,
  gamble,
  depositToMachine,
  withdrawFromMachine,
  startWorkQTE,
  isStoryBusy,
} from './cards.js';
import { COPY } from './copy.js';
import { initAudio, bindButtonSounds, play } from './audio.js';
import {
  initUI,
  updateHUD,
  updateGambleButtons,
  showNotification,
  showIntro,
  showTextEntry,
  showFinalDecision,
  showGambleChoice,
  showGambleDelta,
  triggerGambleChoice,
  isGambleChoiceActive,
  appendChatMessage,
  openWindow,
  setGambleLog,
  renderWheelResult,
  narrate,
  narrateSequential,
  showChoices,
  setNarrativeChoices,
  renderCardTable,
  addMoodCard,
  flashMood,
  showEndingScreen,
  clearChat,
  resetTransientView,
} from './ui.js';

const SAVE_KEY = 'biean_save';
const REPLAY_KEY = 'biean_last_ending';

function boot() {
  initAudio();
  bindButtonSounds();
  const hasSave = tryLoadSave();
  const saveSummary = hasSave ? getSaveSummary() : null;

  initCards({
    openWindow,
    narrate,
    narrateSequential,
    showChoices,
    setNarrativeChoices,
    renderCardTable,
    appendChat: appendChatMessage,
    addMoodCard,
    flashMood,
    updateHUD,
    updateGambleButtons,
    renderWheelResult,
    setGambleLog,
    showEndingScreen,
    clearChat,
    resetTransientView,
    showTextEntry,
    showFinalDecision,
    showGambleChoice,
    showGambleDelta,
    getWorkArea: () => document.getElementById('work-area'),
    notify: showNotification,
    persistCycleStartSave,
    clearSavedRun,
    onCycleComplete: () => {
      play('dayEnd');
    },
  });

  initUI({
    onOpenApp(id) {
      if (id === 'gamble') getState().flags.gamble_opened = true;
      updateHUD();
    },
    onEndCycle: () => {
      if (isStoryBusy()) return;
      play('dayEnd');
      advanceCycleManually();
    },
    onPlaceCard: (cardId) => {
      if (isStoryBusy()) return;
      placeCard(cardId);
    },
  });

  bindGambleUI();
  bindWorkUI();
  bindDepositUI();

  showIntro({
    hasSave,
    saveSummary,
    onStart: () => startFreshRun(),
    onContinue: hasSave ? () => continueSavedRun() : null,
    onNewGame: hasSave ? () => startFreshRun() : null,
  });
}

function tryLoadSave() {
  resetGame();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved.phase === 'playing' && saved.cycle >= 1) {
        loadState(saved);
        syncGambleUnlocks();
        return true;
      }
    }
  } catch {
    resetGame();
  }
  return false;
}

function saveGame() {
  try {
    if (getState().phase === 'playing' && getState().story?.cycleStartSave) {
      persistCycleStartSave(getState().story.cycleStartSave);
    }
  } catch { /* ignore */ }
}

function persistCycleStartSave(snapshot = getState().story?.cycleStartSave) {
  try {
    if (snapshot) {
      localStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
    }
  } catch { /* ignore */ }
}

function clearSavedRun() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch { /* ignore */ }
}

function getSaveSummary() {
  const state = getState();
  return {
    cycle: state.cycle,
    cash: state.cash,
    debt: Math.round(getDebt()),
    presses: state.stats.gambleCount,
    hasMemory: readReplayMemory(),
  };
}

function readReplayMemory() {
  try {
    return Boolean(localStorage.getItem(REPLAY_KEY));
  } catch {
    return false;
  }
}

function startFreshRun() {
  clearSavedRun();
  resetGame();
  syncGambleUnlocks();
  getState().flags.intro_done = true;
  startDesktopRun(COPY.intro.hint);
}

function continueSavedRun() {
  getState().flags.intro_done = true;
  startDesktopRun(COPY.intro.continueHint(getState().cycle));
}

function startDesktopRun(introMessage) {
  resetTransientView();
  updateHUD();
  updateGambleButtons();
  showNotification(COPY.meta.title, introMessage);
  play('notify');
  openWindow('cards');
  beginCycle();
}

function bindGambleUI() {
  document.getElementById('btn-gamble-once')?.addEventListener('click', () => {
    if (triggerGambleChoice('press')) return;
    doGamble(1);
  });
  document.getElementById('btn-triple')?.addEventListener('click', () => {
    if (triggerGambleChoice('triple')) return;
    doGamble(3);
  });
  document.getElementById('btn-ten')?.addEventListener('click', () => {
    if (triggerGambleChoice('ten')) return;
    doGamble(10);
  });
}

async function doGamble(spinCount) {
  if (isStoryBusy()) return;
  const s = getState();
  if (s.phase !== 'playing') return;

  const btn = document.getElementById('btn-gamble-once');
  const triple = document.getElementById('btn-triple');
  const ten = document.getElementById('btn-ten');
  [btn, triple, ten].forEach((b) => { if (b) b.disabled = true; });

  syncGambleUnlocks();
  if (spinCount === 3 && !s.flags.triple_unlocked) {
    showNotification(COPY.notify.tripleLocked.title, COPY.notify.tripleLocked.body);
    updateGambleButtons();
    return;
  }
  if (spinCount === 10 && !s.flags.ten_unlocked) {
    showNotification(COPY.notify.tenLocked.title, COPY.notify.tenLocked.body);
    updateGambleButtons();
    return;
  }

  play('gamble');
  const result = gamble(spinCount);
  if (!result.ok) {
    showNotification('赌博', result.error);
    updateGambleButtons();
    return;
  }

  openWindow('gamble');
  syncGambleUnlocks();

  for (const r of result.results) {
    renderWheelResult(r.segment.label);
    setGambleLog(r.message);
    showGambleDelta({
      title: r.segment.label,
      before: r.beforeState,
      after: r.afterState,
      extras: r.moodGained
        ? [{
          label: '心情',
          text: `${COPY.mood[r.moodGained] || r.moodGained} +1`,
          tone: r.moodGained === 'anxiety' ? 'warn' : 'good',
        }]
        : [],
    });
    play(r.delta >= 0 ? 'win' : 'loss');
    if (r.moodGained) {
      flashMood(r.moodGained);
      addMoodCard(r.moodGained);
    }
    await sleep(400);
  }

  updateHUD();
  updateGambleButtons();
  saveGame();
}

function bindWorkUI() {
  document.getElementById('btn-work-start')?.addEventListener('click', () => {
    if (isStoryBusy()) return;
    const area = document.getElementById('work-area');
    if (!area) return;
    startWorkQTE(area, ({ message, moodsGained, success }) => {
      showNotification('工作', message);
      (moodsGained || []).forEach((type) => {
        flashMood(type);
        addMoodCard(type);
      });
      play(success ? 'win' : 'loss');
      updateHUD();
      saveGame();
    });
  });
}

function bindDepositUI() {
  document.getElementById('btn-deposit-all')?.addEventListener('click', () => {
    if (isGambleChoiceActive()) return;
    const s = getState();
    const before = snapshotEconomy();
    const r = depositToMachine(s.cash);
    if (r.ok) {
      setGambleLog(COPY.gamble.depositOk(r.amount));
      showGambleDelta({
        title: '筹码已存入',
        before,
        after: r.afterState || snapshotEconomy(),
      });
      showNotification('赌博机', COPY.gamble.depositNotify(r.amount));
    } else {
      showNotification('赌博机', r.error);
    }
    updateHUD();
    saveGame();
  });

  document.getElementById('btn-withdraw')?.addEventListener('click', () => {
    if (isGambleChoiceActive()) return;
    const before = snapshotEconomy();
    const r = withdrawFromMachine();
    if (r.ok) {
      setGambleLog(COPY.gamble.withdrawOk(r.amount));
      showGambleDelta({
        title: '筹码已取出',
        before,
        after: r.afterState || snapshotEconomy(),
      });
      showNotification('赌博机', COPY.gamble.withdrawNotify(r.amount));
    } else {
      showNotification('赌博机', r.error);
    }
    updateHUD();
    saveGame();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function snapshotEconomy() {
  return {
    cash: getState().cash,
    virtualBalance: getState().virtualBalance,
    debt: Math.round(getDebt()),
  };
}

document.addEventListener('DOMContentLoaded', boot);

// 定期存档
setInterval(saveGame, 5000);
