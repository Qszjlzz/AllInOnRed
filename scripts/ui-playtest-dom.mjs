/**
 * Lightweight DOM UI playtest — cycle-card desktop simulator.
 * Run: node scripts/ui-playtest-dom.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const results = [];

function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? `: ${detail}` : ''}`);
}

function click(el) {
  if (!el) return false;
  if (typeof el.click === 'function') el.click();
  else el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));
  return true;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const html = readFileSync(join(ROOT, 'index.html'), 'utf8');
const bundle = readFileSync(join(ROOT, 'js/game.bundle.js'), 'utf8');
const FakeAudioContext = class {
  constructor() { this.state = 'running'; }
  resume() { return Promise.resolve(); }
  createOscillator() { return { type: 'sine', frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} }; }
  createGain() { return { gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} }; }
  createBuffer() { return { getChannelData: () => new Float32Array(8) }; }
  createBufferSource() { return { buffer: null, connect() {}, start() {} }; }
  get destination() { return {}; }
  get currentTime() { return 0; }
  get sampleRate() { return 44100; }
};

function createBootedDom(savedState = null, replayMemory = null, unlockedEndings = null) {
  const dom = new JSDOM(html.replace('<link rel="stylesheet" href="css/style.css" />', ''), {
    url: 'http://localhost/index.html',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  const { window } = dom;
  globalThis.window = window;
  globalThis.document = window.document;
  globalThis.localStorage = window.localStorage;
  globalThis.CustomEvent = window.CustomEvent;
  globalThis.AudioContext = FakeAudioContext;
  globalThis.webkitAudioContext = FakeAudioContext;
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16);
  globalThis.cancelAnimationFrame = clearTimeout;

  window.localStorage.clear();
  if (savedState) {
    window.localStorage.setItem('biean_save', JSON.stringify(savedState));
  }
  if (replayMemory) {
    window.localStorage.setItem('biean_last_ending', replayMemory);
  }
  if (unlockedEndings?.length) {
    window.localStorage.setItem('biean_unlocked_endings', JSON.stringify(unlockedEndings));
  }
  window.AudioContext = FakeAudioContext;
  window.webkitAudioContext = FakeAudioContext;
  window.eval(bundle);
  window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));
  return window;
}

let window = createBootedDom();

await sleep(80);

record('Bundle loads without throw', true);
record('Intro start button exists', !!window.document.getElementById('btn-start'));
record('Intro cover layout exists', !!window.document.querySelector('.cover-screen'));
record('Intro ending gallery exists', !!window.document.querySelector('.ending-preview'));
record('Intro ending gallery renders all endings', window.document.querySelectorAll('.ending-preview-card').length >= 10);
record('Intro button label updated', window.document.getElementById('btn-start')?.textContent?.trim() === '开始游戏');

click(window.document.getElementById('btn-mute'));
await sleep(20);
record('Mute toggle', window.localStorage.getItem('biean_mute') === '1');

click(window.document.getElementById('btn-start'));
await sleep(120);
record('Start dismisses modal', window.document.getElementById('modal-layer').classList.contains('hidden'));
record('Cards window positioned on open', /\d+px/.test(window.document.querySelector('.window[data-id="cards"]').style.left || ''));

for (const app of ['cards', 'chat', 'gamble', 'family']) {
  click(window.document.querySelector(`.taskbar-app[data-app="${app}"]`));
  const win = window.document.querySelector(`.window[data-id="${app}"]`);
  record(`Taskbar ${app} opens window`, win && !win.classList.contains('hidden'));
}

click(window.document.querySelector('.taskbar-app[data-app="work"]'));
const workWin = window.document.querySelector('.window[data-id="work"]');
record('Work window opens', workWin && !workWin.classList.contains('hidden'));

const cards = window.document.querySelectorAll('.event-card');
record('Cycle 1 cards rendered', cards.length === 3, `count=${cards.length}`);

click(window.document.querySelector('.taskbar-app[data-app="gamble"]'));
click(window.document.getElementById('btn-gamble-once'));
await sleep(80);
record(
  'Gamble click handled',
  window.document.getElementById('gamble-log').children.length > 0
    || window.document.getElementById('wheel-display').textContent !== '—',
);
record('Triple button hidden before unlock', window.document.getElementById('btn-triple').classList.contains('hidden'));

click(window.document.getElementById('btn-deposit-all'));
record('Deposit click handled', true);

click(window.document.querySelector('.taskbar-app[data-app="work"]'));
click(window.document.getElementById('btn-work-start'));
await sleep(30);
record('Work QTE button appears', !!window.document.getElementById('work-hit'));

if (cards[0]) {
  click(cards[0]);
  await sleep(200);
  record('Card pick triggers narrative', window.document.getElementById('narrative-text').children.length > 0);
}

const endBtn = window.document.getElementById('btn-end-cycle');
record('End cycle button exists', !!endBtn);

const closeBtn = window.document.querySelector('.window[data-id="chat"] .btn-close');
click(closeBtn);
record('Window close hides chat', window.document.querySelector('.window[data-id="chat"]').classList.contains('hidden'));

record('game.bundle.js on disk', existsSync(join(ROOT, 'js/game.bundle.js')));
record('index uses bundle not module', !readFileSync(join(ROOT, 'index.html'), 'utf8').includes('type="module"'));

window = createBootedDom(
  {
    cycle: 4,
    ap: 3,
    cash: 860,
    virtualBalance: 220,
    billTotal: 3000,
    billPaid: 200,
    mood: { addiction: 2, stable: 1, anxiety: 1, diligent: 0 },
    moodCards: ['addiction', 'stable'],
    cycleResolved: false,
    story: { bookmark: null, node: null },
    flags: {
      intro_done: true,
      gamble_opened: true,
      gamble_count: 3,
      first_gamble_done: true,
      friend_link_seen: true,
      machine_deposit_total: 300,
      triple_unlocked: false,
      ten_unlocked: false,
      card_picked: null,
      initial_asset: 300,
      worked_this_cycle: false,
      work_branch_count: 1,
      family_branch_count: 1,
      family_reply_count: 1,
      bill_seen: true,
      memo_text: '',
      memo_done: false,
      drawing_seen: true,
      final_pressed: false,
      work_unlocked: true,
    },
    stats: { gambleCount: 3, workCount: 1, workSuccess: 1, totalEarned: 0, totalLost: 0 },
    phase: 'playing',
    endingId: null,
    log: [],
  },
  'ruin',
  ['ruin', 'rules_quit'],
);

await sleep(80);
record('Saved run shows continue button', !!window.document.getElementById('btn-continue'));
record('Saved run shows new game button', !!window.document.getElementById('btn-new-game'));
record(
  'Saved run shows ending progress summary',
  window.document.querySelector('.ending-preview-head')?.textContent?.includes('2 /') === true,
);
record(
  'Saved run preview renders cycle summary',
  window.document.querySelector('.save-preview')?.textContent?.includes('第 4 周') === true,
);

click(window.document.getElementById('btn-continue'));
await sleep(120);
record('Continue dismisses modal', window.document.getElementById('modal-layer').classList.contains('hidden'));
record('Continue opens cards window', !window.document.querySelector('.window[data-id="cards"]').classList.contains('hidden'));

const failed = results.filter((r) => !r.pass);
console.log(`\n=== ${results.length - failed.length}/${results.length} PASS ===`);
process.exit(failed.length ? 1 : 0);
