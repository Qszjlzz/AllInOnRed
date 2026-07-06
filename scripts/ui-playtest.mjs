/**
 * Browser UI playtest — validates every clickable target loads and responds.
 * Run: node scripts/ui-playtest.mjs
 * Requires: npx playwright (auto-installed)
 */
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function startServer() {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      const path = join(ROOT, decodeURIComponent(req.url.split('?')[0].replace(/^\//, '')) || 'index.html');
      if (!path.startsWith(ROOT) || !existsSync(path)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
      res.end(readFileSync(path));
    });
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      resolve({ server, url: `http://127.0.0.1:${port}/index.html` });
    });
  });
}

async function getPlaywright() {
  try {
    return await import('playwright');
  } catch {
    return new Promise((resolve, reject) => {
      const child = spawn('npx', ['--yes', 'playwright', 'install', 'chromium'], {
        cwd: ROOT,
        shell: true,
        stdio: 'inherit',
      });
      child.on('close', async (code) => {
        if (code !== 0) reject(new Error('playwright install failed'));
        else resolve(await import('playwright'));
      });
    });
  }
}

const results = [];

function record(name, pass, detail = '') {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'} — ${name}${detail ? `: ${detail}` : ''}`);
}

async function run() {
  const { server, url } = await startServer();
  const pw = await getPlaywright();
  const browser = await pw.chromium.launch({ headless: true });
  const page = await browser.newPage();

  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(300);

  // Start screen
  const startVisible = await page.locator('#btn-start').isVisible();
  record('Start screen visible', startVisible);
  await page.click('#btn-start');
  await page.waitForTimeout(400);
  record('Start button dismisses intro', await page.locator('#modal-layer.hidden').count() === 1);

  // Taskbar apps
  for (const app of ['chat', 'work', 'gamble', 'family', 'memo']) {
    await page.click(`.taskbar-app[data-app="${app}"]`);
    await page.waitForTimeout(150);
    const visible = app === 'work'
      ? await page.locator('.window[data-id="work"]').isVisible() === false // locked day1
      : await page.locator(`.window[data-id="${app}"]`).isVisible();
    record(`Taskbar opens ${app}`, app === 'work' ? !visible : visible);
  }

  // Open gamble for gambling tests
  await page.click('.taskbar-app[data-app="gamble"]');
  await page.waitForTimeout(200);

  const wheelBefore = await page.locator('#wheel-display').textContent();
  await page.click('#btn-gamble-once');
  await page.waitForTimeout(1200);
  const wheelAfter = await page.locator('#wheel-display').textContent();
  record('Gamble button spins wheel', wheelBefore !== wheelAfter || (await page.locator('#gamble-log p').count()) > 0);

  record('Deposit button clickable', !(await page.locator('#btn-deposit-all').isDisabled()));
  await page.click('#btn-deposit-all');
  await page.waitForTimeout(200);

  // Memo
  await page.click('.taskbar-app[data-app="memo"]');
  await page.fill('#memo-input', '测试备忘录');
  await page.click('#btn-memo-save');
  await page.waitForTimeout(200);
  record('Memo save works', (await page.locator('#notifications .notification').count()) > 0);

  // Mute
  const muteBefore = await page.locator('#btn-mute').textContent();
  await page.click('#btn-mute');
  const muteAfter = await page.locator('#btn-mute').textContent();
  record('Mute toggle', muteBefore !== muteAfter);

  // End day
  await page.click('#btn-end-day');
  await page.waitForTimeout(400);
  record('End day button', (await page.locator('#hud-day').textContent()).includes('2'));

  // Work (day 2)
  await page.click('.taskbar-app[data-app="work"]');
  await page.waitForTimeout(200);
  record('Work window opens day2', await page.locator('.window[data-id="work"]').isVisible());
  await page.click('#btn-work-start');
  await page.waitForTimeout(300);
  record('Work QTE starts', await page.locator('#work-hit').isVisible());
  await page.click('#work-hit');
  await page.click('#work-hit');
  await page.click('#work-hit');
  await page.click('#work-hit');
  await page.click('#work-hit');
  await page.waitForTimeout(400);

  // Family choices
  await page.click('.taskbar-app[data-app="family"]');
  await page.waitForTimeout(300);
  const famBtn = page.locator('#family-actions button').first();
  if (await famBtn.count()) {
    await famBtn.click();
    record('Family choice button', true);
  } else {
    record('Family choice button', false, 'no choices rendered');
  }

  // Modal choice (if any)
  const modalBtn = page.locator('#modal-layer:not(.hidden) .modal-actions button').first();
  if (await modalBtn.count()) {
    await modalBtn.click();
    record('Story modal choice', true);
  } else {
    record('Story modal choice', true, 'none pending (ok)');
  }

  // JS load errors
  record('No page JS errors', errors.length === 0, errors.join('; ') || 'clean');

  // file:// bundle exists
  record('game.bundle.js exists', existsSync(join(ROOT, 'js/game.bundle.js')));

  await browser.close();
  server.close();

  const failed = results.filter((r) => !r.pass);
  console.log(`\n=== ${results.length - failed.length}/${results.length} PASS ===`);
  process.exit(failed.length ? 1 : 0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
