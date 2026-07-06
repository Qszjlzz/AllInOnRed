const STORAGE_KEY = 'biean_mute';
const SAMPLE_RATE = 22050;
const FALLBACK_VOLUME = 0.9;

let ctx = null;
let muted = false;
let muteBusy = false;

const fallbackUrls = new Map();
const fallbackPlayers = new Set();

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
  if (muted) {
    fallbackPlayers.forEach((player) => {
      try {
        player.pause();
        player.currentTime = 0;
      } catch { /* ignore */ }
    });
    fallbackPlayers.clear();
  }
}

export function toggleMute() {
  setMuted(!muted);
  if (!muted) play('click');
}

export function initAudio() {
  try {
    muted = localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    muted = false;
  }
  updateMuteButton();

  document.addEventListener('click', (event) => {
    if (!event.target.closest('#btn-mute')) return;
    if (muteBusy) return;
    muteBusy = true;
    ensureCtx();
    toggleMute();
    queueMicrotask(() => {
      muteBusy = false;
    });
  });

  const unlock = () => {
    ensureCtx();
    warmFallbackCache();
  };

  document.addEventListener('click', unlock, { once: true, capture: true });
  document.addEventListener('keydown', unlock, { once: true, capture: true });
  document.addEventListener('touchstart', unlock, { once: true, capture: true });
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
  const bufferSize = Math.max(1, Math.floor(ac.sampleRate * duration));
  const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
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

const FALLBACK_SFX = {
  click: [
    { kind: 'tone', freq: 880, duration: 0.06, type: 'square', gain: 0.22 },
    { kind: 'tone', freq: 1200, duration: 0.04, type: 'sine', gain: 0.14, delay: 0.02 },
  ],
  win: [
    { kind: 'tone', freq: 523, duration: 0.18, type: 'sine', gain: 0.22, delay: 0 },
    { kind: 'tone', freq: 659, duration: 0.18, type: 'sine', gain: 0.2, delay: 0.1 },
    { kind: 'tone', freq: 784, duration: 0.18, type: 'sine', gain: 0.18, delay: 0.2 },
    { kind: 'tone', freq: 1047, duration: 0.18, type: 'sine', gain: 0.16, delay: 0.3 },
  ],
  loss: [
    { kind: 'tone', freq: 220, duration: 0.25, type: 'sawtooth', gain: 0.2 },
    { kind: 'tone', freq: 180, duration: 0.35, type: 'sawtooth', gain: 0.16, delay: 0.08 },
    { kind: 'noise', duration: 0.15, gain: 0.08, delay: 0.04 },
  ],
  notify: [
    { kind: 'tone', freq: 660, duration: 0.08, type: 'sine', gain: 0.2 },
    { kind: 'tone', freq: 880, duration: 0.12, type: 'sine', gain: 0.16, delay: 0.08 },
  ],
  dayEnd: [
    { kind: 'tone', freq: 392, duration: 0.3, type: 'triangle', gain: 0.18 },
    { kind: 'tone', freq: 294, duration: 0.5, type: 'triangle', gain: 0.15, delay: 0.25 },
  ],
  start: [
    { kind: 'tone', freq: 262, duration: 0.16, type: 'triangle', gain: 0.18, delay: 0 },
    { kind: 'tone', freq: 392, duration: 0.16, type: 'triangle', gain: 0.16, delay: 0.08 },
    { kind: 'tone', freq: 523, duration: 0.16, type: 'triangle', gain: 0.14, delay: 0.16 },
    { kind: 'tone', freq: 659, duration: 0.16, type: 'triangle', gain: 0.12, delay: 0.24 },
  ],
  cardPick: [
    { kind: 'tone', freq: 740, duration: 0.06, type: 'square', gain: 0.16 },
    { kind: 'tone', freq: 980, duration: 0.08, type: 'triangle', gain: 0.14, delay: 0.04 },
  ],
  windowOpen: [
    { kind: 'tone', freq: 520, duration: 0.08, type: 'square', gain: 0.14 },
    { kind: 'tone', freq: 700, duration: 0.1, type: 'triangle', gain: 0.12, delay: 0.03 },
  ],
  windowClose: [
    { kind: 'tone', freq: 320, duration: 0.09, type: 'triangle', gain: 0.14 },
  ],
  windowMinimize: [
    { kind: 'tone', freq: 410, duration: 0.06, type: 'triangle', gain: 0.12 },
    { kind: 'tone', freq: 280, duration: 0.08, type: 'triangle', gain: 0.1, delay: 0.04 },
  ],
  workHit: [
    { kind: 'tone', freq: 660, duration: 0.05, type: 'square', gain: 0.14 },
  ],
  workMiss: [
    { kind: 'tone', freq: 220, duration: 0.08, type: 'sawtooth', gain: 0.12 },
  ],
  tension: [
    { kind: 'tone', freq: 55, duration: 2.6, type: 'sine', gain: 0.08, attack: 0.8, release: 0.8 },
  ],
  endingGood: [
    { kind: 'tone', freq: 392, duration: 0.35, type: 'sine', gain: 0.18, delay: 0 },
    { kind: 'tone', freq: 494, duration: 0.35, type: 'sine', gain: 0.16, delay: 0.15 },
    { kind: 'tone', freq: 587, duration: 0.35, type: 'sine', gain: 0.14, delay: 0.3 },
    { kind: 'tone', freq: 784, duration: 0.35, type: 'sine', gain: 0.12, delay: 0.45 },
  ],
  endingBad: [
    { kind: 'tone', freq: 130, duration: 0.6, type: 'sawtooth', gain: 0.22 },
    { kind: 'tone', freq: 98, duration: 0.9, type: 'sawtooth', gain: 0.18, delay: 0.2 },
    { kind: 'noise', duration: 0.4, gain: 0.08, delay: 0.12 },
  ],
  gamble: [
    { kind: 'tone', freq: 440, duration: 0.05, type: 'square', gain: 0.18 },
    { kind: 'tone', freq: 330, duration: 0.08, type: 'triangle', gain: 0.14, delay: 0.04 },
  ],
};

export function play(name) {
  try {
    const audioCtx = ensureCtx();
    if (audioCtx?.state === 'running') {
      SFX[name]?.();
      return;
    }
    playFallback(name);
  } catch {
    playFallback(name);
  }
}

export function bindButtonSounds() {
  document.addEventListener('click', (event) => {
    const btn = event.target.closest('.btn, .gamble-btn, .taskbar-app, .file-card');
    if (btn && !btn.disabled) play('click');
  }, true);
}

function warmFallbackCache() {
  ['click', 'notify', 'gamble'].forEach((name) => {
    if (!fallbackUrls.has(name)) {
      fallbackUrls.set(name, renderFallbackUrl(FALLBACK_SFX[name]));
    }
  });
}

function playFallback(name) {
  if (muted || typeof Audio !== 'function') return;
  const clip = FALLBACK_SFX[name];
  if (!clip) return;

  let url = fallbackUrls.get(name);
  if (!url) {
    url = renderFallbackUrl(clip);
    fallbackUrls.set(name, url);
  }

  try {
    const player = new Audio(url);
    player.volume = FALLBACK_VOLUME;
    player.preload = 'auto';
    const cleanup = () => {
      fallbackPlayers.delete(player);
    };
    player.addEventListener('ended', cleanup, { once: true });
    player.addEventListener('pause', cleanup, { once: true });
    fallbackPlayers.add(player);
    const pending = player.play();
    if (pending?.catch) {
      pending.catch(cleanup);
    }
  } catch { /* ignore audio errors */ }
}

function renderFallbackUrl(events) {
  const totalSeconds = events.reduce(
    (max, event) => Math.max(max, (event.delay || 0) + event.duration),
    0,
  ) + 0.06;
  const sampleCount = Math.max(1, Math.ceil(totalSeconds * SAMPLE_RATE));
  const mix = new Float32Array(sampleCount);

  events.forEach((event) => {
    if (event.kind === 'noise') {
      mixNoise(mix, event);
    } else {
      mixTone(mix, event);
    }
  });

  const wav = encodeWav(mix, SAMPLE_RATE);
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && typeof Blob !== 'undefined') {
    return URL.createObjectURL(new Blob([wav], { type: 'audio/wav' }));
  }
  return bufferToDataUrl(wav);
}

function mixTone(buffer, event) {
  const start = Math.floor((event.delay || 0) * SAMPLE_RATE);
  const durationSamples = Math.max(1, Math.floor(event.duration * SAMPLE_RATE));
  const attack = Math.min(event.attack || 0.012, event.duration / 2);
  const release = Math.min(event.release || 0.05, event.duration / 2);

  for (let i = 0; i < durationSamples && start + i < buffer.length; i += 1) {
    const t = i / SAMPLE_RATE;
    const progress = i / durationSamples;
    const freq = event.slideTo
      ? event.freq + (event.slideTo - event.freq) * progress
      : event.freq;
    const env = envelope(t, event.duration, attack, release);
    const sample = waveform(event.type || 'sine', t * freq);
    buffer[start + i] += sample * (event.gain || 0.12) * env;
  }
}

function mixNoise(buffer, event) {
  const start = Math.floor((event.delay || 0) * SAMPLE_RATE);
  const durationSamples = Math.max(1, Math.floor(event.duration * SAMPLE_RATE));
  const release = Math.min(event.release || 0.05, event.duration / 2);

  for (let i = 0; i < durationSamples && start + i < buffer.length; i += 1) {
    const t = i / SAMPLE_RATE;
    const env = envelope(t, event.duration, 0.005, release);
    buffer[start + i] += (Math.random() * 2 - 1) * (event.gain || 0.08) * env;
  }
}

function envelope(t, duration, attack, release) {
  const fadeIn = attack > 0 ? Math.min(1, t / attack) : 1;
  const fadeOut = release > 0 ? Math.min(1, (duration - t) / release) : 1;
  return Math.max(0, Math.min(fadeIn, fadeOut));
}

function waveform(type, phase) {
  const turn = phase - Math.floor(phase);
  const sine = Math.sin(2 * Math.PI * turn);
  switch (type) {
    case 'square':
      return sine >= 0 ? 1 : -1;
    case 'triangle':
      return 2 * Math.abs(2 * turn - 1) - 1;
    case 'sawtooth':
      return 2 * turn - 1;
    default:
      return sine;
  }
}

function encodeWav(floatData, sampleRate) {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataLength = floatData.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  writeAscii(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataLength, true);
  writeAscii(view, 8, 'WAVE');
  writeAscii(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < floatData.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, floatData[i]));
    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
    offset += 2;
  }

  return buffer;
}

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i += 1) {
    view.setUint8(offset + i, text.charCodeAt(i));
  }
}

function bufferToDataUrl(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:audio/wav;base64,${btoa(binary)}`;
}
