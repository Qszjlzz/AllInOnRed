# QA Test Report — 别按那个键 (Latest)

**Date:** 2026-07-05  
**Build:** cycle-card desktop redesign + pixel art path hooks  
**Tester:** QA/Playtest Agent (autonomous)  
**Verdict:** ✅ **P0 PASS** — Demo playable; automated 25/25 tests green after fixes

---

## Executive Summary

| Suite | Result |
|-------|--------|
| `node js/playtest-runner.js` | **7/7 PASS** |
| `node scripts/ui-playtest-dom.mjs` | **18/18 PASS** |
| `npm run build` | ✅ bundle 76.4kb |
| Manual Cycle 1 logic trace | ✅ branches coherent |
| P0 bugs found | 2 fixed (see below) |
| P0 open | 0 |

---

## P0 Fixes Applied This Session

| ID | Severity | Issue | Fix |
|----|----------|-------|-----|
| BUG-001 | **P0** | `js/copy.js` syntax error — `press3` branch had `],` instead of `},` crashing all ESM imports | Fixed object closing brace; rebuilt bundle |
| BUG-002 | **P0** | Mute button double-fired in headless/jsdom → toggled on then immediately off (`localStorage` stayed `0`) | Added `muteBusy` guard + microtask reset in `js/audio.js` |

---

## Automated Test Log

### Logic (`js/playtest-runner.js`)

```
PASS — cycles: 5 cycle defs
PASS — cycle1 cards match script
PASS — copy: cycle1 early endings exist
PASS — mood cards accumulate
PASS — endCycle advances
PASS — gamble unlock by press count
PASS — copy: narrative rewind label
```

### DOM UI (`scripts/ui-playtest-dom.mjs`)

```
PASS — Bundle loads without throw
PASS — Intro start button exists
PASS — Mute toggle
PASS — Start dismisses modal
PASS — Taskbar cards/chat/gamble/family opens window
PASS — Work window opens
PASS — Cycle 1 cards rendered (3)
PASS — Gamble click handled
PASS — Deposit click handled
PASS — Work QTE button appears
PASS — Card pick triggers narrative
PASS — End cycle button exists
PASS — Window close hides chat
PASS — game.bundle.js on disk
PASS — index uses bundle not module
```

---

## Interactive Element Matrix

| Element | ID / Selector | Expected Behavior | Result | Notes |
|---------|---------------|-------------------|--------|-------|
| Intro start | `#btn-start` | Dismiss modal, open cards window, begin cycle 1 opening narrative | ✅ PASS | Typewriter text in `#narrative-text` |
| Mute | `#btn-mute` | Toggle 🔊/🔇, persist `biean_mute` in localStorage | ✅ PASS | Fixed double-toggle bug |
| End cycle | `#btn-end-cycle` | Blocked until card picked; advances cycle counter | ✅ PASS | Shows notify if unresolved |
| Taskbar — 牌桌 | `[data-app=cards]` | Show cards window, highlight active | ✅ PASS | |
| Taskbar — 聊天 | `[data-app=chat]` | Show chat window | ✅ PASS | |
| Taskbar — 工作 | `[data-app=work]` | Show work window (unlocked cycle 1) | ✅ PASS | Was day-gated in old build |
| Taskbar — 赌博 | `[data-app=gamble]` | Show gamble window | ✅ PASS | |
| Taskbar — 家庭 | `[data-app=family]` | Show family window | ✅ PASS | |
| Window close | `.btn-close` | Hide window | ✅ PASS | |
| Window minimize | `.btn-minimize` | Minimize window | ⚠️ Manual | Not in DOM test; code present |
| Window drag | `.title-bar` | Reposition window | ⚠️ Manual | `makeDraggable()` in ui.js |
| Event card click | `.event-card` | Pick card → forfeit others → branch | ✅ PASS | |
| Event card drag | `#action-slot` drop | Same as click pick | ⚠️ Manual | drop handler wired |
| Gamble once | `#btn-gamble-once` | Spin wheel, log result, first free | ✅ PASS | Blocked during `storyBusy` |
| Triple / Ten | `#btn-triple`, `#btn-ten` | Hidden until 5/10 presses | ✅ PASS | Logic test confirms unlock |
| Deposit | `#btn-deposit-all` | Cash → virtual balance | ✅ PASS | |
| Withdraw | `#btn-withdraw` | Virtual → cash, -1 AP | ⚠️ Manual | AP-gated |
| Work start | `#btn-work-start` | Launch QTE, `#work-hit` appears | ✅ PASS | Blocked during story |
| Work hit | `#work-hit` | Timing minigame | ⚠️ Manual | click loop in work.js |
| Narrative choices | `.choice-btn` | Branch story (friend_link path) | ⚠️ Manual | Async Promise in ui.js |
| Chat file card | `.file-card` | Opens gamble window | ⚠️ Manual | friend_link branch |
| Clock | `#clock` | Live HH:MM | ⚠️ Manual | setInterval 1s |
| HUD stats | `#hud-*` | Cycle/AP/cash/virtual/mood counts | ✅ PASS | CSS fallback without PNGs |

---

## Cycle 1 Card Flow Trace (Manual Code Review)

**Pool:** `friend_link` | `work_report` | `wife_msg` (`js/cycles.js`)

### Path A — `friend_link` (full demo spine)

1. `placeCard('friend_link')` → `runFriendLinkBranch`
2. Open chat → append 阿凯 messages + file card
3. Open gamble → asset choice (¥100/300/500/1000) → `addVirtual`
4. Choice: 试试看 | 看规则
   - **Rules → quit:** early ending `rules_quit` + rewind offer
   - **Rules → continue:** → press sequence
5. Press sequence: +50 → +80 → -120 (scripted, no AP)
6. After each win/loss: continue/stop choices → early endings `stop_after_1/2/3`
7. Colleague interrupt → oneMore/quit → `phone_dead` ending (can continue to cycle 2)
8. Rewind bookmarks restore via `rewindToBookmark`

**Verdict:** ✅ Logic complete; copy keys match `COPY.cycles[1].branches.friend_link`

### Path B — `work_report`

1. Open work window → narrative → `addMood('diligent')` → `finishCycle`

**Verdict:** ✅ Shorter branch OK

### Path C — `wife_msg`

1. Open family → chat → choice good/late → stable or anxiety mood → `finishCycle`

**Verdict:** ✅ Family reply branch OK

### Cycle advance

- `advanceCycleManually()` requires `cycleResolved === true`
- Cycle 2+ uses `runStubCycleBranch` (stub narrative + window hints)

**Verdict:** ✅ Demo scope matches DESIGN_MERGE

---

## Visual / Asset State

| Area | Current | Expected After Codex |
|------|---------|----------------------|
| Wallpaper | CSS gradient fallback | `desktop-bg.png` |
| Taskbar | CSS + emoji icons | `taskbar.png` + `icon-*.png` |
| Cards | Purple placeholder `.card-art` | `card-*.png` per event |
| Gamble button | CSS radial + PNG fallback | `gamble-btn-*.png` |
| Mood chips | PNG with onerror hide | `mood-*.png` |
| Daughter drawing | `assets/placeholders/daughter-drawing.svg` | `daughter-drawing.png` |

Missing PNGs **do not block gameplay** — CSS fallbacks active.

---

## Bugs — Open / Deferred

| ID | Sev | Description | Status |
|----|-----|-------------|--------|
| BUG-003 | P1 | Taskbar still shows emoji not `icon-*.png` | Deferred — needs CSS hook after art drop |
| BUG-004 | P1 | `window-border.png`, `narrative-frame.png` paths documented but not wired in CSS | Deferred — art-first |
| BUG-005 | P1 | `scripts/ui-playtest.mjs` (Playwright) still references old day/memo UI | Update when Playwright CI needed |
| BUG-006 | P2 | `setInterval(saveGame, 5000)` keeps Node process alive after tests | Harmless; exit 0 still works |
| BUG-007 | P2 | Triple unlock needs ≥5 gambles but only 3 AP/cycle — requires multi-cycle | By design |

---

## Smoke Test Script (Human)

1. `npm run serve` → open index.html  
2. Start → read cycle 1 opening in narrative panel  
3. Click **朋友的链接** → follow chat → gamble choices  
4. Press through scripted sequence OR pick stop early → verify ending + rewind  
5. Restart → pick **妻子的消息** → reply good → see 踏实 mood chip  
6. End cycle → verify cycle 2 stub message  
7. Toggle mute, drag windows, deposit cash  

**Expected duration:** 10–15 min full friend_link path

---

## Sign-off

| Check | Status |
|-------|--------|
| All P0 interactive paths functional | ✅ |
| Automated tests green | ✅ 25/25 |
| Bundle builds | ✅ |
| Art drop-in docs ready | ✅ `docs/CODEX_ART_GENERATION.md` |
| Known P1 documented | ✅ |

**Recommendation:** Ship Demo for playtesting; parallelize Codex Batch A–C (31 P0 PNGs).
