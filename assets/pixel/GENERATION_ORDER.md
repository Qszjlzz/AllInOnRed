# Codex 批量生成顺序 — assets/pixel/

按此顺序生成可最大化风格一致性：先生成「风格锚点」，再生成同 palette 的衍生资产。

---

## Phase 0 — 读入风格（不生成文件）

1. 阅读 `docs/CODEX_ART_GENERATION.md` 顶部 **Master Style Prompt**
2. 确认色板：`#1a1423` / `#6ec6ff` / `#ff4466` / `#c87830`

---

## Phase 1 — 风格锚点（3 张，先生成并目视确认）

| 顺序 | 文件 | 原因 |
|------|------|------|
| 1 | `desktop-bg.png` | 确立夜景办公室氛围与主光源 |
| 2 | `window-border.png` | 确立 gray pixel chrome 语言 |
| 3 | `gamble-btn-normal.png` | 确立危险红与按钮体积感 |

**Gate：** 三张并排放置，palette 一致后再继续。

---

## Phase 2 — 桌面壳层（4 张）

| 顺序 | 文件 |
|------|------|
| 4 | `taskbar.png` |
| 5 | `narrative-frame.png` |
| 6 | `notification-toast.png` |
| 7 | `gamble-page-bg.png` |

---

## Phase 3 — 任务栏图标（6 张，同一 batch prompt）

| 顺序 | 文件 |
|------|------|
| 8 | `icon-cards.png` |
| 9 | `icon-chat.png` |
| 10 | `icon-work.png` |
| 11 | `icon-gamble.png` |
| 12 | `icon-family.png` |
| 13 | `icon-memo.png` |

**提示：** 同一 Codex 会话内连生成，强调 "same icon set, matching 2px outline weight".

---

## Phase 4 — 卡牌系统（6 张）

| 顺序 | 文件 |
|------|------|
| 14 | `card-frame.png` |
| 15 | `card-back.png` |
| 16 | `action-slot-empty.png` |
| 17 | `card-friend-link.png` |
| 18 | `card-work-report.png` |
| 19 | `card-wife-msg.png` |

---

## Phase 5 — 心情 + 赌博交互（10 张）

| 顺序 | 文件 |
|------|------|
| 20 | `mood-addiction.png` |
| 21 | `mood-stable.png` |
| 22 | `mood-anxiety.png` |
| 23 | `mood-diligent.png` |
| 24 | `gamble-btn-hover.png` |
| 25 | `gamble-btn-pressed.png` |
| 26 | `gamble-wheel.png` |
| 27 | `gamble-balance-panel.png` |

---

## Phase 6 — 聊天 + 剧情道具（5 张）

| 顺序 | 文件 |
|------|------|
| 28 | `chat-window-bg.png` |
| 29 | `chat-bubble-friend.png` |
| 30 | `chat-bubble-wife.png` |
| 31 | `daughter-drawing.png` |

**Gate：** 女儿画作完成后对照 cycle 3 `family_drawing` 分支验收。

---

## Phase 7 — P1 周期 2–5 卡牌（12 张，可第二批）

按周期顺序生成，每周期 3 张：

**Cycle 2:** `card-gamble-again` → `card-wife-breakfast` → `card-work-daily`

**Cycle 3:** `card-work-hard` → `card-gamble-big` → `card-family-drawing`

**Cycle 4:** `card-bill` → `card-memo` → `card-anxiety`

**Cycle 5:** `card-final` → `card-family-wait` → `card-one-more`

---

## Phase 8 — P1 收尾（6 张）

| 顺序 | 文件 |
|------|------|
| 44 | `avatar-friend.png` |
| 45 | `avatar-wife.png` |
| 46 | `avatar-daughter.png` |
| 47 | `ending-awaken.png` |
| 48 | `ending-ruin.png` |
| 49 | `cursor-default.png`（可选） |

---

## 批次建议

| Batch | 内容 | 预计张数 |
|-------|------|----------|
| **Batch A** | Phase 1–2 | 7 |
| **Batch B** | Phase 3–4 | 13 |
| **Batch C** | Phase 5–6 | 11 |
| **Batch D** | Phase 7–8 | 18 |

Demo 最低交付 = **Batch A + B + C**（31 张 P0）。

---

## 生成后检查

```bash
# 确认 P0 文件齐全（PowerShell）
Get-ChildItem assets/pixel/*.png | Measure-Object
# 期望 Demo: 31+
```

刷新游戏：`npm run serve` → `Ctrl+F5`
