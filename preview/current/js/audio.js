/**
 * 音效 — Web Audio API 程序化合成
 * 无需外部资源
 */
const STORAGE_KEY = 'biean_mute';

let ctx = null;
let muted = false;

function ensureCtx() {
  if (!ctx) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    } catch {
      return null;
    }
  }
  if (!ctx) return null;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

export function isMuted() {
  return muted;
}

export function setMuted(value) {
  muted = !!value;
  try {
    localStorage.setItem(STORAGE_KEY, muted ? '1' : '0');
  } catch { /* ignore */ }
  updateMuteButton();
}

export function toggleMute() {
  setMuted(!muted);
  if (!muted) play('click');
}

let muteBusy = false;

export function initAudio() {
  try {
    muted = localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    muted = false;
  }
  updateMuteButton();
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#btn-mute')) return;
    if (muteBusy) return;
    muteBusy = true;
    try { ensureCtx(); } catch { /* headless / file:// without gesture */ }
    toggleMute();
    queueMicrotask(() => { muteBusy = false; });
  });
  document.addEventListener(
    'click',
    () => ensureCtx(),
    { once: true, capture: true },
  );
}

function updateMuteButton() {
  const btn = document.getElementById('btn-mute');
  if (!btn) return;
  btn.textContent = muted ? '🔇' : '🔊';
  btn.title = muted ? '开启音效' : '静音';
  btn.setAttribute('aria-pressed', muted ? 'true' : 'false');
}

function tone(freq, duration, type = 'sine', gain = 0.12, when = 0) {
  const ac = ensureCtx();
  if (!ac || muted) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function noise(duration, gain = 0.06) {
  const ac = ensureCtx();
  if (!ac || muted) return;
  const t0 = ac.currentTime;
  const bufferSize = ac.sampleRate * duration;
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }
  const src = ac.createBufferSource();
  const g = ac.createGain();
  src.buffer = buffer;
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
  src.connect(g);
  g.connect(ac.destination);
  src.start(t0);
}

const SFX = {
  click() {
    tone(880, 0.06, 'square', 0.06);
    tone(1200, 0.04, 'sine', 0.04, 0.02);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'sine', 0.1, i * 0.1));
  },
  loss() {
    tone(220, 0.25, 'sawtooth', 0.08);
    tone(180, 0.35, 'sawtooth', 0.06, 0.08);
    noise(0.15, 0.04);
  },
  notify() {
    tone(660, 0.08, 'sine', 0.09);
    tone(880, 0.12, 'sine', 0.07, 0.08);
  },
  dayEnd() {
    tone(392, 0.3, 'triangle', 0.08);
    tone(294, 0.5, 'triangle', 0.06, 0.25);
  },
  start() {
    [262, 392, 523, 659].forEach((f, i) => tone(f, 0.16, 'triangle', 0.08, i * 0.08));
  },
  cardPick() {
    tone(740, 0.06, 'square', 0.05);
    tone(980, 0.08, 'triangle', 0.04, 0.04);
  },
  windowOpen() {
    tone(520, 0.08, 'square', 0.05);
    tone(700, 0.1, 'triangle', 0.04, 0.03);
  },
  windowClose() {
    tone(320, 0.09, 'triangle', 0.05);
  },
  windowMinimize() {
    tone(410, 0.06, 'triangle', 0.05);
    tone(280, 0.08, 'triangle', 0.04, 0.04);
  },
  workHit() {
    tone(660, 0.05, 'square', 0.05);
  },
  workMiss() {
    tone(220, 0.08, 'sawtooth', 0.04);
  },
  tension() {
    const ac = ensureCtx();
    if (!ac || muted) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(55, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.04, t0 + 0.8);
    g.gain.linearRampToValueAtTime(0.02, t0 + 2.5);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + 2.6);
  },
  endingGood() {
    [392, 494, 587, 784].forEach((f, i) => tone(f, 0.35, 'sine', 0.09, i * 0.15));
  },
  endingBad() {
    tone(130, 0.6, 'sawtooth', 0.1);
    tone(98, 0.9, 'sawtooth', 0.08, 0.2);
    noise(0.4, 0.05);
  },
  gamble() {
    tone(440, 0.05, 'square', 0.05);
    tone(330, 0.08, 'triangle', 0.04, 0.04);
  },
};

export function play(name) {
  try {
    SFX[name]?.();
  } catch { /* ignore audio errors */ }
}

/** 绑定所有按钮点击音效 */
export function bindButtonSounds() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn, .gamble-btn, .taskbar-app, .file-card');
    if (btn && !btn.disabled) play('click');
  }, true);
}
