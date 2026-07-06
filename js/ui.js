/**
 * UI — 像素桌面、卡牌牌桌、底部剧情框
 */
import { getState, getDebt, canAct, syncGambleUnlocks } from './state.js';
import { COPY } from './copy.js';
import { CYCLE_COUNT } from './cycles.js';
import { play } from './audio.js';
import { getEndingEntry, getEndingProgress, unlockEnding } from './endings.js';

let clockInterval = null;
let windowStack = 20;
let uiCallbacks = null;
/** @type {Record<string, boolean>} */
const windowMinimized = {};
let activeGambleChoice = null;

const MOOD_ART = {
  addiction: 'assets/pixel/mood-addiction.png',
  stable: 'assets/pixel/mood-stable.png',
  anxiety: 'assets/pixel/mood-anxiety.png',
  diligent: 'assets/pixel/mood-diligent.png',
};

const AVATAR_ART = {
  '阿凯': 'assets/pixel/avatar-friend.png',
  '小雅': 'assets/pixel/avatar-wife.png',
  '朵朵': 'assets/pixel/avatar-daughter.png',
};

const BAD_ENDINGS = new Set(['ruin', 'delusion', 'phone_dead']);

const WINDOW_STAGGERS = [
  { x: 0, y: 0 },
  { x: -180, y: -36 },
  { x: 170, y: 24 },
  { x: -110, y: 90 },
  { x: 115, y: -72 },
];

export function initUI(callbacks) {
  uiCallbacks = callbacks;
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
  bindTaskbar(callbacks);
  bindWindowChrome();
  bindGlobalActions(callbacks);
  bindCardDrag(callbacks);
  updateHUD();
  renderMoodTrayFromState();
  updateGambleButtons();
}

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const el = document.getElementById('clock');
  if (el) el.textContent = `${h}:${m}`;
}

function bindTaskbar(callbacks) {
  document.querySelectorAll('.taskbar-app').forEach((btn) => {
    btn.addEventListener('click', () => {
      openWindow(btn.dataset.app);
      callbacks.onOpenApp?.(btn.dataset.app);
    });
  });
}

function bindGlobalActions(callbacks) {
  document.getElementById('btn-end-cycle')?.addEventListener('click', () => {
    callbacks.onEndCycle?.();
  });
}

function bindCardDrag(callbacks) {
  const slot = document.getElementById('action-slot');
  if (!slot) return;

  slot.addEventListener('dragover', (e) => {
    e.preventDefault();
    slot.classList.add('drag-over');
  });
  slot.addEventListener('dragleave', () => slot.classList.remove('drag-over'));
  slot.addEventListener('drop', (e) => {
    e.preventDefault();
    slot.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/card');
    if (id) callbacks.onPlaceCard?.(id);
  });
}

function bindWindowChrome() {
  document.querySelectorAll('.window').forEach((win) => {
    const id = win.dataset.id;
    win.querySelector('.btn-close')?.addEventListener('click', () => closeWindow(id));
    win.querySelector('.btn-minimize')?.addEventListener('click', () => minimizeWindow(id));
    makeDraggable(win);
  });
}

function makeDraggable(win) {
  const bar = win.querySelector('.title-bar');
  if (!bar) return;
  let ox = 0;
  let oy = 0;
  let dragging = false;
  let moved = false;

  bar.addEventListener('mousedown', (e) => {
    if (e.target.closest('.window-controls')) return;
    dragging = true;
    moved = false;
    const rect = win.getBoundingClientRect();
    ox = e.clientX - rect.left;
    oy = e.clientY - rect.top;
    win.style.zIndex = String(++windowStack);
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const desktop = document.getElementById('windows-container') || document.getElementById('desktop');
    const dRect = desktop.getBoundingClientRect();
    let x = e.clientX - dRect.left - ox;
    let y = e.clientY - dRect.top - oy;
    x = Math.max(0, Math.min(x, Math.max(0, dRect.width - win.offsetWidth)));
    y = Math.max(0, Math.min(y, Math.max(0, dRect.height - win.offsetHeight)));
    win.style.left = `${x}px`;
    win.style.top = `${y}px`;
    moved = true;
  });

  document.addEventListener('mouseup', () => {
    if (dragging && moved) {
      win.dataset.userMoved = 'true';
      win.dataset.positioned = 'true';
    }
    dragging = false;
  });
}

export function openWindow(id) {
  const win = document.querySelector(`.window[data-id="${id}"]`);
  if (!win) return;
  const container = document.getElementById('windows-container');
  const wasHidden = win.classList.contains('hidden') || win.classList.contains('minimized');
  windowMinimized[id] = false;
  win.classList.remove('hidden', 'minimized');
  win.style.zIndex = String(++windowStack);
  if ((wasHidden || win.dataset.positioned !== 'true') && win.dataset.userMoved !== 'true') {
    positionWindow(win);
  }
  if (container && container.clientWidth < 700) {
    document.querySelectorAll('.window').forEach((other) => {
      if (other === win || other.classList.contains('hidden')) return;
      other.classList.add('minimized');
      windowMinimized[other.dataset.id] = true;
    });
    win.classList.remove('minimized');
    windowMinimized[id] = false;
  }
  play('windowOpen');

  document.querySelectorAll('.taskbar-app').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.app === id);
  });
}

export function closeWindow(id) {
  document.querySelector(`.window[data-id="${id}"]`)?.classList.add('hidden');
  document.querySelector(`.taskbar-app[data-app="${id}"]`)?.classList.remove('active');
  play('windowClose');
}

export function minimizeWindow(id) {
  const win = document.querySelector(`.window[data-id="${id}"]`);
  if (!win) return;
  windowMinimized[id] = true;
  win.classList.add('minimized');
  document.querySelector(`.taskbar-app[data-app="${id}"]`)?.classList.remove('active');
  play('windowMinimize');
}

export function flashMood(type) {
  const el = document.querySelector(`.mood.${type}`);
  if (!el) return;
  el.classList.add('mood-flash');
  setTimeout(() => el.classList.remove('mood-flash'), 700);
}

export function addMoodCard(type) {
  const tray = document.getElementById('mood-cards');
  if (!tray) return;
  const chip = document.createElement('div');
  chip.className = `mood-chip mood-${type}`;
  chip.title = COPY.mood[type] || type;
  chip.innerHTML = `<img src="${MOOD_ART[type] || ''}" alt="" onerror="this.style.display='none'"/><span>${COPY.mood[type] || type}</span>`;
  tray.appendChild(chip);
}

function renderMoodTrayFromState() {
  const tray = document.getElementById('mood-cards');
  if (!tray) return;
  tray.innerHTML = '';
  getState().moodCards.forEach((type) => addMoodCard(type));
}

export function updateHUD() {
  const s = getState();
  const debt = getDebt();
  const set = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set('hud-cycle', COPY.hud.cycleLabel(s.cycle, CYCLE_COUNT));
  set('hud-ap', `${s.ap} / 3`);
  set('hud-cash', `¥${s.cash}`);
  set('hud-virtual', `¥${s.virtualBalance}`);
  set('hud-debt', `¥${Math.round(debt)} / ¥${s.billTotal}`);
  set('hud-addiction', String(s.mood.addiction));
  set('hud-stable', String(s.mood.stable));
  set('hud-anxiety', String(s.mood.anxiety));
  set('hud-diligent', String(s.mood.diligent || 0));
  set('hud-press', COPY.hud.pressCount(s.stats.gambleCount));

  const bar = document.getElementById('bill-bar-fill');
  if (bar) {
    const paid = Math.max(0, s.billTotal - debt);
    bar.style.width = `${Math.min(100, (paid / s.billTotal) * 100)}%`;
  }

  updateGambleButtons();
}

export function updateGambleButtons() {
  syncGambleUnlocks();
  const s = getState();
  const gambleBtn = document.getElementById('btn-gamble-once');
  const tripleBtn = document.getElementById('btn-triple');
  const tenBtn = document.getElementById('btn-ten');
  const depositBtn = document.getElementById('btn-deposit-all');
  const withdrawBtn = document.getElementById('btn-withdraw');
  const endBtn = document.getElementById('btn-end-cycle');
  const armedChoice = activeGambleChoice?.buttonId || null;
  const storyArmed = Boolean(armedChoice);

  if (gambleBtn) {
    gambleBtn.disabled = storyArmed ? armedChoice !== 'press' : !canAct();
    gambleBtn.classList.toggle('hidden', s.stats.gambleCount < 0);
    gambleBtn.classList.toggle('gamble-btn-armed', storyArmed && armedChoice === 'press');
  }
  if (tripleBtn) {
    tripleBtn.classList.toggle('hidden', !s.flags.triple_unlocked);
    tripleBtn.disabled = storyArmed ? armedChoice !== 'triple' : !canAct();
    tripleBtn.classList.toggle('gamble-btn-armed', storyArmed && armedChoice === 'triple');
  }
  if (tenBtn) {
    tenBtn.classList.toggle('hidden', !s.flags.ten_unlocked);
    tenBtn.disabled = storyArmed ? armedChoice !== 'ten' : !canAct();
    tenBtn.classList.toggle('gamble-btn-armed', storyArmed && armedChoice === 'ten');
  }
  if (depositBtn) depositBtn.disabled = storyArmed || !canAct();
  if (withdrawBtn) withdrawBtn.disabled = storyArmed || !canAct();
  if (endBtn) endBtn.disabled = !canAct();
}

export function showNotification(title, body) {
  const area = document.getElementById('notifications');
  if (!area) return;
  const n = document.createElement('div');
  n.className = 'notification toast-in';
  n.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span>`;
  area.appendChild(n);
  setTimeout(() => {
    n.classList.add('toast-out');
    setTimeout(() => n.remove(), 400);
  }, 4000);
}

/** 底部剧情框 — 单段文字（打字机） */
export function narrate(text) {
  return typewrite(text);
}

/** 多段叙事顺序播放 */
export async function narrateSequential(lines) {
  for (const line of lines) {
    await typewrite(line);
    await sleep(350);
  }
}

function typewrite(text) {
  return new Promise((resolve) => {
    const box = document.getElementById('narrative-text');
    if (!box) {
      resolve();
      return;
    }
    const p = document.createElement('p');
    p.className = 'narrative-line';
    box.appendChild(p);
    box.scrollTop = box.scrollHeight;

    const raw = String(text).replace(/\*\*(.+?)\*\*/g, '$1');
    let i = 0;
    const tick = () => {
      if (i <= raw.length) {
        p.textContent = raw.slice(0, i);
        i += 2;
        box.scrollTop = box.scrollHeight;
        setTimeout(tick, 18);
      } else {
        resolve();
      }
    };
    tick();
  });
}

/** @returns {Promise<string>} */
export function showChoices(choices, prompt = '') {
  return new Promise((resolve) => {
    const area = document.getElementById('narrative-choices');
    if (!area) {
      resolve(choices[0]?.id || 'ok');
      return;
    }
    area.innerHTML = '';
    if (prompt) {
      const hint = document.createElement('p');
      hint.className = 'choice-prompt';
      hint.textContent = prompt;
      area.appendChild(hint);
    }
    choices.forEach((c) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `btn choice-btn ${c.primary ? 'btn-primary' : 'btn-ghost'}`;
      btn.textContent = c.label;
      if (c.desc) {
        const small = document.createElement('small');
        small.textContent = c.desc;
        btn.appendChild(small);
      }
      btn.addEventListener('click', () => {
        area.innerHTML = '';
        resolve(c.id);
      });
      area.appendChild(btn);
    });
  });
}

export function isGambleChoiceActive() {
  return Boolean(activeGambleChoice);
}

export function triggerGambleChoice(id = 'press') {
  if (!activeGambleChoice?.finish) return false;
  if (id !== activeGambleChoice.buttonId) {
    return true;
  }
  activeGambleChoice.finish(activeGambleChoice.resolveId);
  return true;
}

export function clearGambleChoice() {
  activeGambleChoice = null;
  const prompt = document.getElementById('gamble-story-prompt');
  if (prompt) {
    prompt.classList.add('hidden');
    prompt.innerHTML = '';
  }
  updateGambleButtons();
}

export function showGambleChoice({
  prompt = '',
  buttonId = 'press',
  resolveId = buttonId,
  primaryLabel = COPY.buttons.gambleOnce,
  altChoices = [],
} = {}) {
  return new Promise((resolve) => {
    clearGambleChoice();
    document.getElementById('narrative-choices')?.replaceChildren();
    openWindow('gamble');

    const panel = document.getElementById('gamble-story-prompt');
    const finish = (choiceId) => {
      clearGambleChoice();
      resolve(choiceId);
    };

    activeGambleChoice = { buttonId, resolveId, finish };
    if (panel) {
      panel.classList.remove('hidden');
      panel.innerHTML = `
        <div class="gamble-story-copy">
          <strong>直接点按钮：${escapeHtml(primaryLabel)}</strong>
          ${prompt ? `<p>${escapeHtml(prompt)}</p>` : ''}
        </div>
        <div class="gamble-story-actions">
          ${altChoices.map((choice) => `
            <button type="button" class="btn ${choice.primary ? 'btn-primary' : 'btn-ghost'} btn-sm" data-choice-id="${escapeHtml(choice.id)}">
              ${escapeHtml(choice.label)}
            </button>
          `).join('')}
        </div>
      `;
      panel.querySelectorAll('[data-choice-id]').forEach((button) => {
        button.addEventListener('click', () => finish(button.dataset.choiceId || ''));
      });
    }

    updateGambleButtons();
  });
}

export function setNarrativeChoices(choices) {
  const area = document.getElementById('narrative-choices');
  if (area) area.innerHTML = '';
}

/** 渲染卡牌牌桌 */
export function renderCardTable(cards, pickedId) {
  const pool = document.getElementById('card-pool');
  const slot = document.getElementById('action-slot');
  if (!pool || !slot) return;

  pool.innerHTML = '';
  slot.innerHTML = `<span class="slot-label">${COPY.cards.ui.slotLabel}</span>`;

  cards.forEach((card) => {
    const meta = COPY.cards[card.id] || { title: card.id, desc: '' };
    const el = document.createElement('div');
    el.className = 'event-card';
    el.draggable = !pickedId;
    el.dataset.cardId = card.id;
    if (pickedId && pickedId !== card.id) el.classList.add('forfeited');
    if (pickedId === card.id) el.classList.add('picked');

    el.innerHTML = `
      <div class="card-art" style="background-image:url('${card.art}')"></div>
      <div class="card-title">${escapeHtml(meta.title)}</div>
      <div class="card-desc">${escapeHtml(meta.desc)}</div>
    `;

    if (!pickedId) {
      el.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/card', card.id);
      });
      el.addEventListener('click', () => {
        play('cardPick');
        uiCallbacks?.onPlaceCard?.(card.id);
      });
    }
    pool.appendChild(el);
  });

  if (!pickedId) {
    // cards clickable
  } else if (pickedId) {
    const picked = cards.find((c) => c.id === pickedId);
    if (picked) {
      const meta = COPY.cards[picked.id] || { title: picked.id, desc: '' };
      slot.innerHTML = `
        <div class="event-card picked-in-slot">
          <div class="card-art" style="background-image:url('${picked.art}')"></div>
          <div class="card-title">${escapeHtml(meta.title)}</div>
        </div>`;
    }
  }
}

// removed registerPlaceCard hack

export function showIntro({
  hasSave = false,
  saveSummary = null,
  endingProgress = null,
  onStart = null,
  onContinue = null,
  onNewGame = null,
} = {}) {
  const layer = document.getElementById('modal-layer');
  const progress = endingProgress || getEndingProgress();
  layer.classList.remove('hidden');
  layer.innerHTML = `
    <div class="modal intro-screen cover-screen">
      <div class="cover-hero">
        <div class="intro-brand">
          <img class="intro-icon pixel-border" src="assets/pixel/game-icon-v2-256.png" alt="" onerror="this.style.display='none'"/>
          <h1>${escapeHtml(COPY.meta.title)}</h1>
          ${COPY.meta.titleEn ? `<p class="intro-title-en">${escapeHtml(COPY.meta.titleEn)}</p>` : ''}
          ${COPY.meta.theme ? `<p class="intro-tagline">${escapeHtml(COPY.meta.theme)}</p>` : ''}
        </div>
        <div class="cover-copy">
          <p class="subtitle">${escapeHtml(COPY.meta.subtitle)}</p>
          <div class="intro-body">
            <p>${escapeHtml(COPY.intro.p1)}</p>
            <p>${escapeHtml(COPY.intro.p2)}</p>
            <p>${escapeHtml(COPY.intro.p3)}</p>
          </div>
        </div>
      </div>
      <div class="intro-actions">
        ${hasSave && saveSummary ? `
          <div class="save-preview pixel-border">
            <strong>${escapeHtml(COPY.intro.saveTitle)}</strong>
            <div class="save-preview-grid">
              <span>${escapeHtml(COPY.intro.saveCycle(saveSummary.cycle))}</span>
              <span>${escapeHtml(COPY.intro.saveCash(saveSummary.cash))}</span>
              <span>${escapeHtml(COPY.intro.saveDebt(saveSummary.debt))}</span>
              <span>${escapeHtml(COPY.intro.savePresses(saveSummary.presses))}</span>
              <span class="save-preview-memory">${escapeHtml(COPY.intro.saveMemory(saveSummary.hasMemory))}</span>
            </div>
          </div>
        ` : ''}
        <div class="intro-menu">
          ${hasSave
            ? `
              <button type="button" class="btn btn-primary" id="btn-continue">${escapeHtml(COPY.intro.continue)}</button>
              <button type="button" class="btn btn-ghost" id="btn-new-game">${escapeHtml(COPY.intro.newGame)}</button>
            `
            : `<button type="button" class="btn btn-primary" id="btn-start">${escapeHtml(COPY.intro.start)}</button>`}
        </div>
        <p class="intro-hint">${escapeHtml(hasSave ? COPY.intro.saveHint : COPY.intro.startHint)}</p>
        ${renderEndingPreview(progress)}
      </div>
    </div>
  `;

  const closeIntro = (callback) => {
    play('start');
    layer.classList.add('hidden');
    layer.innerHTML = '';
    callback?.();
  };

  layer.querySelector('#btn-start')?.addEventListener('click', () => closeIntro(onStart));
  layer.querySelector('#btn-continue')?.addEventListener('click', () => closeIntro(onContinue));
  layer.querySelector('#btn-new-game')?.addEventListener('click', () => closeIntro(onNewGame));
}

function renderEndingPreview(progress) {
  if (!progress?.total) return '';

  return `
    <div class="ending-preview pixel-border">
      <div class="ending-preview-head">
        <strong>结局图鉴</strong>
        <span>${progress.unlockedCount} / ${progress.total} 已解锁</span>
      </div>
      <p class="ending-preview-hint">
        ${escapeHtml(progress.hasReplayMemory
          ? '坏结局会留下记忆，重玩时最后抉择会变得不一样。'
          : '在不同节点停手、回头或继续，都会把故事带去不同结局。')}
      </p>
      ${progress.lastEndingTitle
        ? `<p class="ending-preview-memory">最近的回响：${escapeHtml(progress.lastEndingTitle)}</p>`
        : ''}
      <div class="ending-preview-grid">
        ${progress.entries.map((entry) => `
          <div class="ending-preview-card ${entry.unlocked ? 'unlocked' : 'locked'} tone-${escapeHtml(entry.tone)}">
            <div class="ending-preview-thumb" ${entry.unlocked ? `style="background-image:url('${escapeHtml(entry.art)}')"` : ''}></div>
            <span class="ending-preview-index">#${String(entry.index).padStart(2, '0')}</span>
            <strong>${escapeHtml(entry.unlocked ? entry.title : '未解锁')}</strong>
            <span>${escapeHtml(entry.unlocked ? entry.clue : '留给下一次不同的选择')}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

export function showTextEntry({ title, prompt, placeholder = '', initialValue = '', confirmLabel = COPY.memo.confirm }) {
  return new Promise((resolve) => {
    const layer = document.getElementById('modal-layer');
    if (!layer) {
      resolve(initialValue || '');
      return;
    }

    layer.classList.remove('hidden');
    layer.innerHTML = `
      <div class="modal text-entry-modal pixel-border">
        <h2>${escapeHtml(title)}</h2>
        <p class="text-entry-prompt">${escapeHtml(prompt)}</p>
        <textarea id="text-entry-input" class="text-entry-input" placeholder="${escapeHtml(placeholder)}">${escapeHtml(initialValue)}</textarea>
        <div class="text-entry-actions">
          <button type="button" class="btn btn-primary" id="btn-text-confirm">${escapeHtml(confirmLabel)}</button>
        </div>
      </div>
    `;

    const input = layer.querySelector('#text-entry-input');
    const confirm = layer.querySelector('#btn-text-confirm');

    setTimeout(() => input?.focus(), 0);

    confirm?.addEventListener('click', () => {
      const value = input?.value?.trim() || '';
      if (!value) {
        showNotification(COPY.notify.memoEmpty.title, COPY.notify.memoEmpty.body);
        input?.focus();
        return;
      }
      layer.classList.add('hidden');
      layer.innerHTML = '';
      resolve(value);
    });
  });
}

export function showFinalDecision({ title, body, replayPrefix, memoText, pressLabel, notPressLabel }) {
  return new Promise((resolve) => {
    const layer = document.getElementById('modal-layer');
    if (!layer) {
      resolve('not_press');
      return;
    }

    layer.classList.remove('hidden');
    layer.innerHTML = `
      <div class="modal final-choice-modal pixel-border">
        <h2>${escapeHtml(title)}</h2>
        <p class="final-choice-body">${escapeHtml(body)}</p>
        <div class="final-choice-note pixel-border">
          <span class="final-choice-prefix">${escapeHtml(replayPrefix)}</span>
          <blockquote>${escapeHtml(memoText)}</blockquote>
        </div>
        <div class="final-choice-actions">
          <button type="button" class="btn btn-danger" id="btn-final-press">${escapeHtml(pressLabel)}</button>
          <button type="button" class="btn btn-primary" id="btn-final-not">${escapeHtml(notPressLabel)}</button>
        </div>
      </div>
    `;

    layer.querySelector('#btn-final-press')?.addEventListener('click', () => {
      layer.classList.add('hidden');
      layer.innerHTML = '';
      resolve('press');
    });
    layer.querySelector('#btn-final-not')?.addEventListener('click', () => {
      layer.classList.add('hidden');
      layer.innerHTML = '';
      resolve('not_press');
    });
  });
}

const CHANNEL_MAP = {
  chat: 'chat-messages',
  family: 'family-messages',
  work: 'work-messages',
};

export function appendChatMessage(channel, msg) {
  const listId = CHANNEL_MAP[channel] || `${channel}-messages`;
  const list = document.getElementById(listId);
  if (!list) return;

  const row = document.createElement('div');
  const bubbleTone = msg.from === '你' ? 'self' : channel === 'family' ? 'family' : 'friend';
  row.className = `chat-msg bubble-${bubbleTone} ${msg.from === '系统' ? 'system' : ''} ${msg.from === '你' ? 'sender-self' : ''}`.trim();

  const avatar = AVATAR_ART[msg.from];
  const avatarHtml = avatar
    ? `<img class="chat-avatar pixel-border" src="${avatar}" alt="" onerror="this.style.display='none'"/>`
    : '';
  const nameHtml = msg.from ? `<span class="chat-name">${escapeHtml(msg.from)}</span>` : '';

  if (msg.file) {
    row.innerHTML = `
      ${avatarHtml}
      <div class="chat-bubble-wrap">
        ${nameHtml}
        <div class="file-card pixel-border" data-open="gamble">
          <img class="file-icon" src="assets/pixel/file-icon-html.png" alt="" onerror="this.style.display='none'"/>
          <div class="file-copy">
            <strong>${escapeHtml(COPY.gamble.fileCard.name)}</strong>
            <small>${escapeHtml(COPY.gamble.fileCard.desc)}</small>
          </div>
        </div>
      </div>
    `;
    row.querySelector('.file-card')?.addEventListener('click', () => {
      openWindow('gamble');
    });
  } else if (msg.image) {
    row.innerHTML = `
      ${avatarHtml}
      <div class="chat-bubble-wrap">
        ${nameHtml}
        <div class="chat-image-card pixel-border">
          <img src="${escapeHtml(msg.image)}" alt="${escapeHtml(msg.alt || msg.text || '')}" onerror="this.style.display='none'"/>
          <p>${escapeHtml(msg.text || '')}</p>
        </div>
      </div>
    `;
  } else {
    row.innerHTML = `
      ${avatarHtml}
      <div class="chat-bubble-wrap">
        ${nameHtml}
        <p>${escapeHtml(msg.text)}</p>
      </div>
    `;
  }
  list.appendChild(row);
  list.scrollTop = list.scrollHeight;
}

export function clearChat(channel) {
  const listId = CHANNEL_MAP[channel];
  const list = listId ? document.getElementById(listId) : null;
  if (list) list.innerHTML = '';
}

export function resetTransientView() {
  clearGambleChoice();
  document.getElementById('narrative-text')?.replaceChildren();
  document.getElementById('narrative-choices')?.replaceChildren();
  document.getElementById('notifications')?.replaceChildren();
  document.getElementById('gamble-log')?.replaceChildren();
  clearGambleDelta();

  const wheel = document.getElementById('wheel-display');
  if (wheel) {
    wheel.textContent = '—';
    wheel.classList.remove('spin-flash');
  }

  clearChat('chat');
  clearChat('family');
  clearChat('work');

  document.querySelectorAll('.window').forEach((win) => {
    if (win.dataset.id !== 'cards') {
      win.classList.add('hidden');
    }
    win.classList.remove('minimized');
  });
}

export function showEndingScreen(endingId, endingCopy) {
  const e = endingCopy || COPY.cycles?.[1]?.earlyEndings?.[endingId] || COPY.endings[endingId] || {
    title: '结局',
    body: '',
  };
  const s = getState();
  const layer = document.getElementById('ending-layer');
  const unlockState = unlockEnding(endingId);
  const progress = getEndingProgress();
  const endingEntry = getEndingEntry(endingId);
  layer.classList.remove('hidden');

  play(BAD_ENDINGS.has(endingId) ? 'endingBad' : 'endingGood');

  const stats = COPY.endingStats;
  const tone = BAD_ENDINGS.has(endingId) ? 'bad' : 'good';
  const art = endingEntry?.art || (BAD_ENDINGS.has(endingId)
    ? 'assets/pixel/ending-ruin.png'
    : 'assets/pixel/ending-awaken.png');
  layer.innerHTML = `
    <div class="ending-screen pixel-border ending-${tone}">
      <div class="ending-art pixel-border" style="background-image:url('${art}')"></div>
      <p class="ending-progress">${unlockState.isNewUnlock ? '新结局已收录 · ' : ''}结局图鉴 ${progress.unlockedCount} / ${progress.total}</p>
      ${e.achievement ? `<p class="achievement">${escapeHtml(e.achievement)}</p>` : ''}
      <h1>${escapeHtml(e.title)}</h1>
      <p class="ending-body">${escapeHtml(e.body)}</p>
      ${e.bodyExtra ? `<p class="ending-body ending-body-secondary">${escapeHtml(e.bodyExtra)}</p>` : ''}
      <div class="ending-stats">
        <span>${stats.cycles} <strong>${s.cycle}</strong></span>
        <span>${stats.gambles} <strong>${s.stats.gambleCount}</strong></span>
        <span>${stats.cash} <strong>¥${s.cash}</strong></span>
        <span>${stats.virtual} <strong>¥${s.virtualBalance}</strong></span>
        <span>${stats.debt} <strong>¥${Math.round(getDebt())}</strong></span>
      </div>
      <div class="ending-actions">
        <button type="button" class="btn btn-primary" id="btn-restart">${COPY.buttons.restart}</button>
        <button type="button" class="btn btn-ghost" id="btn-menu">${COPY.buttons.menu}</button>
      </div>
    </div>
  `;
  layer.querySelector('#btn-restart')?.addEventListener('click', () => {
    localStorage.removeItem('biean_save');
    location.reload();
  });
  layer.querySelector('#btn-menu')?.addEventListener('click', () => {
    location.reload();
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function setGambleLog(text) {
  const el = document.getElementById('gamble-log');
  if (!el) return;
  const p = document.createElement('p');
  p.textContent = text;
  el.appendChild(p);
  el.scrollTop = el.scrollHeight;
}

export function clearGambleDelta() {
  const el = document.getElementById('gamble-impact');
  if (!el) return;
  el.classList.add('hidden');
  el.innerHTML = '';
}

export function showGambleDelta({ title = '本次变化', before = null, after = null, extras = [] } = {}) {
  const el = document.getElementById('gamble-impact');
  if (!el) return;

  const chips = [];
  if (before && after) {
    pushDeltaChip(chips, '现金', (after.cash || 0) - (before.cash || 0));
    pushDeltaChip(chips, '机器', (after.virtualBalance || 0) - (before.virtualBalance || 0));
    pushDeltaChip(chips, '待还', (after.debt || 0) - (before.debt || 0), true);
  }
  extras.forEach((extra) => {
    if (!extra?.text) return;
    chips.push({
      label: extra.label || '状态',
      text: extra.text,
      tone: extra.tone || 'warn',
    });
  });

  if (!chips.length) {
    clearGambleDelta();
    return;
  }

  el.classList.remove('hidden');
  el.innerHTML = `
    <div class="gamble-impact-title">${escapeHtml(title)}</div>
    <div class="gamble-impact-chips">
      ${chips.map((chip) => `
        <span class="gamble-impact-chip ${escapeHtml(chip.tone)}">
          <strong>${escapeHtml(chip.label)}</strong>${escapeHtml(chip.text)}
        </span>
      `).join('')}
    </div>
  `;
  el.classList.remove('gamble-impact-flash');
  void el.offsetWidth;
  el.classList.add('gamble-impact-flash');
}

export function renderWheelResult(label) {
  const wheel = document.getElementById('wheel-display');
  if (!wheel) return;
  wheel.textContent = label;
  wheel.classList.add('spin-flash');
  setTimeout(() => wheel.classList.remove('spin-flash'), 600);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function pushDeltaChip(target, label, delta, reverseTone = false) {
  if (!delta) return;
  const tone = reverseTone
    ? (delta < 0 ? 'good' : 'bad')
    : (delta > 0 ? 'good' : 'bad');
  const prefix = delta > 0 ? '+' : '-';
  target.push({
    label,
    text: `${prefix}¥${Math.abs(delta)}`,
    tone,
  });
}

function positionWindow(win) {
  const container = document.getElementById('windows-container');
  if (!container) return;

  if (!win.dataset.baseWidth) {
    win.dataset.baseWidth = win.style.width || `${win.offsetWidth}px`;
  }
  if (!win.dataset.baseHeight) {
    win.dataset.baseHeight = win.style.height || `${win.offsetHeight}px`;
  }

  const baseWidth = Number.parseFloat(win.dataset.baseWidth) || win.offsetWidth;
  const baseHeight = Number.parseFloat(win.dataset.baseHeight) || win.offsetHeight;
  const maxWidth = Math.max(280, container.clientWidth - 16);
  const maxHeight = Math.max(220, container.clientHeight - 16);

  win.style.width = `${Math.min(baseWidth, maxWidth)}px`;
  win.style.height = `${Math.min(baseHeight, maxHeight)}px`;

  const visibleWindows = [...container.querySelectorAll('.window:not(.hidden):not(.minimized)')]
    .filter((other) => other !== win);
  const offset = WINDOW_STAGGERS[visibleWindows.length % WINDOW_STAGGERS.length];
  const left = (container.clientWidth - win.offsetWidth) / 2 + offset.x;
  const top = (container.clientHeight - win.offsetHeight) / 2 + offset.y;
  const maxLeft = Math.max(0, container.clientWidth - win.offsetWidth);
  const maxTop = Math.max(0, container.clientHeight - win.offsetHeight);

  win.style.left = `${Math.max(0, Math.min(left, maxLeft))}px`;
  win.style.top = `${Math.max(0, Math.min(top, maxTop))}px`;
  win.dataset.positioned = 'true';
}
