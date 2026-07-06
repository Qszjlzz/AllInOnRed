import { createServer } from 'node:http';
import {
  copyFileSync,
  existsSync,
  readFileSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

const PROJECT = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(PROJECT, '..', '..');
const RAW_DIR = resolve(PROJECT, 'raw');
const TEMP_VIDEO_DIR = resolve(RAW_DIR, '.roleplay-video');
const VIDEO_OUT = resolve(RAW_DIR, 'roleplay-playthrough.webm');
const AUDIO_OUT = resolve(RAW_DIR, 'roleplay-game-audio.webm');
const EVENTS_OUT = resolve(RAW_DIR, 'roleplay-events.json');
const SEGMENT_MANIFEST = resolve(PROJECT, 'roleplay-voice-segments', 'manifest.json');

const VIEWPORT = { width: 1280, height: 720 };

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ttf': 'font/ttf',
};

const RNG_SEED = 123456789;
const SEGMENTS = JSON.parse(readFileSync(SEGMENT_MANIFEST, 'utf8')).segments;

mkdirSync(RAW_DIR, { recursive: true });
rmSync(TEMP_VIDEO_DIR, { recursive: true, force: true });
mkdirSync(TEMP_VIDEO_DIR, { recursive: true });

function startServer() {
  return new Promise((resolvePromise) => {
    const server = createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const relativePath = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
      const absolutePath = resolve(join(ROOT, relativePath));

      if (!absolutePath.startsWith(ROOT) || !existsSync(absolutePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': MIME[extname(absolutePath)] || 'application/octet-stream',
      });
      res.end(readFileSync(absolutePath));
    });

    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolvePromise({
        server,
        url: `http://127.0.0.1:${port}/index.html`,
      });
    });
  });
}

function roundTime(ms) {
  return Math.round((ms / 1000) * 1000) / 1000;
}

const { server, url } = await startServer();
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: VIEWPORT,
  recordVideo: {
    dir: TEMP_VIDEO_DIR,
    size: VIEWPORT,
  },
});

await context.addInitScript((seed) => {
  const OriginalAudioContext = window.AudioContext || window.webkitAudioContext;
  const captureMap = new WeakMap();
  const captureConnected = new WeakMap();
  let latestStream = null;

  function ensureCapture(ctx) {
    if (!ctx || !OriginalAudioContext) return null;
    if (!captureMap.has(ctx)) {
      const dest = ctx.createMediaStreamDestination();
      captureMap.set(ctx, dest);
      latestStream = dest.stream;
    }
    return captureMap.get(ctx);
  }

  if (OriginalAudioContext) {
    function WrappedAudioContext(...args) {
      const ctx = new OriginalAudioContext(...args);
      ensureCapture(ctx);
      return ctx;
    }

    WrappedAudioContext.prototype = OriginalAudioContext.prototype;
    window.AudioContext = WrappedAudioContext;
    window.webkitAudioContext = WrappedAudioContext;

    const originalConnect = AudioNode.prototype.connect;
    AudioNode.prototype.connect = function patchedConnect(...args) {
      const result = originalConnect.apply(this, args);
      try {
        const ctx = this.context;
        const target = args[0];
        const recordDestination = ensureCapture(ctx);

        if (target === ctx.destination && recordDestination) {
          let connectedSet = captureConnected.get(this);
          if (!connectedSet) {
            connectedSet = new WeakSet();
            captureConnected.set(this, connectedSet);
          }
          if (!connectedSet.has(recordDestination)) {
            originalConnect.call(this, recordDestination);
            connectedSet.add(recordDestination);
          }
        }
      } catch {
        // Ignore capture tap failures and keep normal audio routing intact.
      }
      return result;
    };
  }

  window.__startAudioCapture = () => {
    if (!latestStream) return false;
    const recorder = new MediaRecorder(latestStream, {
      mimeType: 'audio/webm;codecs=opus',
    });
    const chunks = [];
    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size) chunks.push(event.data);
    };
    recorder.start(250);
    window.__audioCapture = { recorder, chunks };
    return true;
  };

  window.__stopAudioCapture = async () => {
    const capture = window.__audioCapture;
    if (!capture) return null;

    await new Promise((resolveStop) => {
      capture.recorder.onstop = resolveStop;
      capture.recorder.stop();
    });

    const blob = new Blob(capture.chunks, { type: 'audio/webm' });
    const buffer = await blob.arrayBuffer();
    return Array.from(new Uint8Array(buffer));
  };

  const rand = (function mulberry32(a) {
    return function next() {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  })(seed);

  Object.defineProperty(Math, 'random', {
    value: () => rand(),
  });
}, RNG_SEED);

const page = await context.newPage();
const videoHandle = page.video();
const startedAt = Date.now();
const events = [];

function mark(event, extra = {}) {
  events.push({
    t: roundTime(Date.now() - startedAt),
    event,
    ...extra,
  });
}

async function playSegment(index, options = {}) {
  const segment = SEGMENTS[index];
  if (!segment) {
    throw new Error(`Missing segment ${index}`);
  }

  const actions = options.actions ?? [];
  const tailMs = options.tailMs ?? 350;
  const segmentStart = Date.now();

  mark('segment_start', {
    segmentIndex: index,
    text: segment.text,
    duration: segment.duration,
  });

  for (const action of actions) {
    const elapsedBefore = Date.now() - segmentStart;
    const waitMs = Math.max(0, action.atMs - elapsedBefore);
    if (waitMs > 0) {
      await page.waitForTimeout(waitMs);
    }
    await action.run();
  }

  const segmentBudget = Math.ceil(segment.duration * 1000) + tailMs;
  const elapsedAfter = Date.now() - segmentStart;
  if (elapsedAfter < segmentBudget) {
    await page.waitForTimeout(segmentBudget - elapsedAfter);
  }
}

async function click(selector, label, options = {}) {
  const locator = page.locator(selector).first();
  await locator.waitFor({ state: 'visible', timeout: options.timeout ?? 30000 });
  if (options.enabled) {
    await page.waitForFunction((sel) => {
      const el = document.querySelector(sel);
      return Boolean(el) && !el.disabled;
    }, selector, { timeout: options.timeout ?? 30000 });
  }
  await locator.click();
  mark('click', { label, selector });
  await page.waitForTimeout(options.after ?? 500);
}

async function clickChoice(index, label, options = {}) {
  const locator = page.locator('#narrative-choices .choice-btn').nth(index);
  await locator.waitFor({ state: 'visible', timeout: options.timeout ?? 30000 });
  await locator.click();
  mark('choice', { label, index });
  await page.waitForTimeout(options.after ?? 500);
}

async function clickPromptAction(index, label, options = {}) {
  const locator = page.locator('#gamble-story-prompt [data-choice-id]').nth(index);
  await locator.waitFor({ state: 'visible', timeout: options.timeout ?? 30000 });
  await locator.click();
  mark('prompt', { label, index });
  await page.waitForTimeout(options.after ?? 500);
}

async function clickArmed(selector, label, options = {}) {
  await page.waitForFunction((sel) => {
    const el = document.querySelector(sel);
    const panel = document.querySelector('#gamble-story-prompt');
    return Boolean(panel) && !panel.classList.contains('hidden') && Boolean(el) && !el.disabled;
  }, selector, { timeout: options.timeout ?? 40000 });

  await page.locator(selector).click();
  mark('armed', { label, selector });
  await page.waitForTimeout(options.after ?? 700);
}

try {
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1200);
  mark('cover_visible');

  await page.mouse.click(8, 8);
  mark('unlock_click');
  await page.waitForTimeout(200);

  const audioStarted = await page.evaluate(() => window.__startAudioCapture());
  mark('audio_capture_started', { ok: Boolean(audioStarted) });

  await playSegment(0, {
    tailMs: 280,
    actions: [
      {
        atMs: 4200,
        run: () => click('#btn-start', 'start', { after: 900 }),
      },
    ],
  });

  await playSegment(1, {
    tailMs: 260,
    actions: [
      {
        atMs: 3000,
        run: () => click('.event-card[data-card-id="friend_link"]', 'cycle1_friend_link', { after: 700 }),
      },
    ],
  });

  await playSegment(2, {
    tailMs: 260,
    actions: [
      {
        atMs: 4000,
        run: () => clickChoice(1, 'asset_300', { timeout: 40000, after: 850 }),
      },
    ],
  });

  await playSegment(3, {
    tailMs: 220,
    actions: [
      {
        atMs: 1400,
        run: () => clickArmed('#btn-gamble-once', 'cycle1_story_click_1', { timeout: 40000, after: 850 }),
      },
      {
        atMs: 5200,
        run: () => clickArmed('#btn-gamble-once', 'cycle1_story_click_2', { timeout: 40000, after: 900 }),
      },
    ],
  });

  await playSegment(4, {
    tailMs: 260,
    actions: [
      {
        atMs: 1600,
        run: () => clickArmed('#btn-gamble-once', 'cycle1_story_click_3', { timeout: 40000, after: 900 }),
      },
    ],
  });

  await playSegment(5, {
    tailMs: 320,
    actions: [
      {
        atMs: 1900,
        run: () => clickArmed('#btn-gamble-once', 'cycle1_story_click_4', { timeout: 40000, after: 1000 }),
      },
    ],
  });

  await playSegment(6, {
    tailMs: 320,
    actions: [
      {
        atMs: 1300,
        run: () => clickArmed('#btn-gamble-once', 'cycle1_story_click_5', { timeout: 40000, after: 900 }),
      },
      {
        atMs: 5800,
        run: () => clickChoice(0, 'continue_to_cycle2', { timeout: 40000, after: 1300 }),
      },
    ],
  });

  await playSegment(7, {
    tailMs: 260,
    actions: [
      {
        atMs: 1500,
        run: () => click('.event-card[data-card-id="gamble_again"]', 'cycle2_gamble_again', {
          timeout: 40000,
          after: 900,
        }),
      },
      {
        atMs: 6400,
        run: () => clickArmed('#btn-gamble-once', 'cycle2_press', { timeout: 40000, after: 1200 }),
      },
    ],
  });

  await playSegment(8, {
    tailMs: 260,
    actions: [
      {
        atMs: 1100,
        run: () => click('#btn-gamble-once', 'manual_extra_press', {
          timeout: 40000,
          enabled: true,
          after: 1200,
        }),
      },
      {
        atMs: 6900,
        run: () => click('#btn-end-cycle', 'end_cycle2', {
          timeout: 40000,
          enabled: true,
          after: 1200,
        }),
      },
    ],
  });

  await playSegment(9, {
    tailMs: 300,
    actions: [
      {
        atMs: 1300,
        run: () => click('.event-card[data-card-id="gamble_big"]', 'cycle3_gamble_big', {
          timeout: 40000,
          after: 900,
        }),
      },
      {
        atMs: 3200,
        run: () => clickChoice(0, 'stake_300', { timeout: 40000, after: 900 }),
      },
      {
        atMs: 6700,
        run: () => clickArmed('#btn-triple', 'cycle3_triple_press', {
          timeout: 40000,
          after: 1600,
        }),
      },
    ],
  });

  await playSegment(10, {
    tailMs: 320,
    actions: [
      {
        atMs: 1200,
        run: () => click('#btn-end-cycle', 'end_cycle3', {
          timeout: 40000,
          enabled: true,
          after: 1200,
        }),
      },
      {
        atMs: 3000,
        run: () => click('.event-card[data-card-id="bill_reminder"]', 'cycle4_bill_reminder', {
          timeout: 40000,
          after: 1000,
        }),
      },
      {
        atMs: 6400,
        run: () => clickChoice(1, 'pay_all', { timeout: 40000, after: 1200 }),
      },
    ],
  });

  await playSegment(11, {
    tailMs: 1200,
    actions: [
      {
        atMs: 1200,
        run: () => click('#btn-end-cycle', 'end_cycle4', {
          timeout: 40000,
          enabled: true,
          after: 1400,
        }),
      },
      {
        atMs: 2800,
        run: () => click('.event-card[data-card-id="one_more_gamble"]', 'cycle5_one_more_gamble', {
          timeout: 40000,
          after: 1000,
        }),
      },
      {
        atMs: 5400,
        run: () => clickPromptAction(0, 'stop_before_last_gamble', { timeout: 40000, after: 1400 }),
      },
      {
        atMs: 7900,
        run: () => click('#btn-final-not', 'final_not_press', {
          timeout: 40000,
          after: 1500,
        }),
      },
    ],
  });

  await page.locator('#ending-layer:not(.hidden) .ending-screen').waitFor({
    state: 'visible',
    timeout: 40000,
  });

  const endingTitle = await page.locator('#ending-layer h1').innerText();
  mark('ending_visible', { endingTitle });
  await page.waitForTimeout(2600);

  const audioBytes = await page.evaluate(() => window.__stopAudioCapture());
  if (audioBytes?.length) {
    writeFileSync(AUDIO_OUT, Buffer.from(audioBytes));
    mark('audio_written', { bytes: audioBytes.length, file: AUDIO_OUT });
  } else {
    mark('audio_missing');
  }

  writeFileSync(EVENTS_OUT, `${JSON.stringify(events, null, 2)}\n`, 'utf8');

  await context.close();
  const recordedPath = await videoHandle.path();
  copyFileSync(recordedPath, VIDEO_OUT);
  rmSync(TEMP_VIDEO_DIR, { recursive: true, force: true });
} finally {
  await browser.close();
  server.close();
}
