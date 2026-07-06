/**
 * 工作 QTE minigame — 修机式点击
 */
import { BALANCE, randRange } from './balance.js';
import { COPY } from './copy.js';
import { play } from './audio.js';
import {
  getState,
  spendAp,
  addCash,
  addMood,
  pushLog,
  getWorkSpeedMultiplier,
  getWorkIncomeMultiplier,
} from './state.js';

/**
 * @param {HTMLElement} container
 * @param {(result: { success: boolean, income: number, message: string, moodsGained?: string[] }) => void} onComplete
 */
export function startWorkQTE(container, onComplete) {
  const state = getState();
  if (!state.flags.work_unlocked) {
    onComplete({ success: false, income: 0, message: COPY.work.locked });
    return;
  }
  if (state.flags.worked_this_cycle) {
    onComplete({ success: false, income: 0, message: COPY.work.alreadyDone });
    return;
  }
  if (!spendAp(1)) {
    onComplete({ success: false, income: 0, message: COPY.work.noAp });
    return;
  }

  const cfg = BALANCE.work;
  const speedMult = getWorkSpeedMultiplier();
  const addiction = state.mood.addiction;
  let hits = 0;
  let round = 0;
  let active = true;

  const penaltyHint = addiction >= 1
    ? `<p class="work-qte-hint work-penalty">${COPY.work.penalty(addiction)}</p>`
    : '';

  container.innerHTML = `
    <div class="work-qte">
      <p class="work-qte-title">${COPY.work.title}</p>
      <p class="work-qte-hint">${COPY.work.progress(0, cfg.totalHits, cfg.hitsRequired)}</p>
      ${penaltyHint}
      <div class="work-bar">
        <div class="work-target" id="work-target"></div>
        <div class="work-cursor" id="work-cursor"></div>
      </div>
      <button type="button" class="btn btn-primary" id="work-hit">${COPY.work.repair}</button>
      <p class="work-feedback" id="work-feedback"></p>
    </div>
  `;

  const target = container.querySelector('#work-target');
  const cursor = container.querySelector('#work-cursor');
  const feedback = container.querySelector('#work-feedback');
  const roundEl = container.querySelector('.work-qte-hint');
  const hitBtn = container.querySelector('#work-hit');

  let animId = 0;
  let pos = 0;
  let dir = 1;
  const baseSpeed = 1.15 + Math.random() * 0.75;
  const speed = baseSpeed * speedMult;

  function layoutTarget() {
    const shrink = addiction >= 2 ? 0.9 : 1;
    const left = 12 + Math.random() * 48;
    const width = (18 + Math.random() * 18) * shrink;
    target.style.left = `${left}%`;
    target.style.width = `${width}%`;
  }

  function animate() {
    if (!active) return;
    pos += dir * speed;
    if (pos >= 100) { pos = 100; dir = -1; }
    if (pos <= 0) { pos = 0; dir = 1; }
    cursor.style.left = `${pos}%`;
    animId = requestAnimationFrame(animate);
  }

  layoutTarget();
  animate();

  hitBtn.addEventListener('click', () => {
    if (!active) return;
    const tLeft = parseFloat(target.style.left);
    const tWidth = parseFloat(target.style.width);
    const hit = pos >= tLeft && pos <= tLeft + tWidth;
    round += 1;
    if (hit) {
      hits += 1;
      feedback.textContent = COPY.work.hit;
      feedback.className = 'work-feedback good';
      play('workHit');
    } else {
      feedback.textContent = COPY.work.miss;
      feedback.className = 'work-feedback bad';
      play('workMiss');
    }
    roundEl.textContent = COPY.work.progress(round, cfg.totalHits, cfg.hitsRequired);

    if (round >= cfg.totalHits) {
      finish();
    } else {
      layoutTarget();
    }
  });

  function finish() {
    active = false;
    cancelAnimationFrame(animId);
    state.flags.worked_this_cycle = true;
    state.stats.workCount += 1;
    const success = hits >= cfg.hitsRequired;
    if (success) state.stats.workSuccess += 1;

    const incomeMult = getWorkIncomeMultiplier();
    let income = success ? randRange(cfg.success) : randRange(cfg.fail);
    income = Math.round(income * incomeMult);

    addCash(income);
    const moodsGained = [];
    if (success) {
      addMood('stable', 1);
      moodsGained.push('stable');
      if (Math.random() < cfg.diligentBonusChance) {
        addMood('diligent', 1);
        moodsGained.push('diligent');
      }
    }
    pushLog(success ? `工作成功 +¥${income}` : `工作勉强 +¥${income}`);

    let message = success ? COPY.work.success(income) : COPY.work.fail(income);
    if (incomeMult < 1) {
      message += COPY.work.addictionNote;
    }
    onComplete({ success, income, message, moodsGained });
  }
}
