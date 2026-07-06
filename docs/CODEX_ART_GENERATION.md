# Codex 像素美术生成清单 — 别按那个键

> 将本文档交给 Codex 批量生成 `assets/pixel/` 下全部 PNG。代码已引用这些路径；缺失时 CSS 色块占位。

---

## 给 Codex 的一句话指令

Generate the following pixel art assets for a Chinese anti-g gambling game desktop simulator ("别按那个键"). Style: realistic simulated retro PC interface — Windows 98/XP era desktop rendered in pixel art (NOT modern flat UI). Night office mood, monitor glow as key light. Consistent palette across all assets. PNG with transparency where noted. Save each file to the exact path under `assets/pixel/` listed below. Prepend the **Master Style Prompt** to every individual prompt below.

---

## Master Style Prompt（每条 prompt 前必须粘贴）

```
Pixel art game UI asset, retro Windows 98/XP desktop simulator aesthetic, NOT modern flat Material design. Chunky 1px-2px pixel borders, beveled gray chrome, dithered shadows, limited palette. Night office mood: deep purple-black #1a1423, panel #2d2640, window #3d3555, title bar #4a4068, accent cyan #6ec6ff, danger red #ff4466, success green #5dff8f, warn amber #ffcc44, narrative orange #c87830. Single monitor glow as warm-cool light source. Crisp pixel edges, image-rendering pixelated, no anti-aliased gradients, no photorealism. Chinese indie narrative game "别按那个键" (Don't Press That Button). Transparent PNG background where specified.
```

---

## 色板参考

| 用途 | 色值 |
|------|------|
| 桌面/壁纸暗部 | `#0f0a18` → `#1a1428` |
| HUD / 面板 | `#2d2640` |
| 窗口内容区 | `#3d3555` |
| 标题栏 | `#4a4068` |
| 边框 | `#6a5a8a` |
| 强调/链接 | `#6ec6ff` |
| 危险/赌博 | `#ff4466` |
| 踏实/成功 | `#5dff8f` |
| 不安/警告 | `#ffcc44` |
| 剧情框边 | `#c87830` |

---

## P0 — Demo 必需（31 项）

### 1. 桌面壁纸

| 字段 | 值 |
|------|-----|
| **filename** | `assets/pixel/desktop-bg.png` |
| **dimensions** | 1920×1080（可额外导出 1280×720 裁切版同名覆盖前备份） |
| **where used** | `#wallpaper` 全屏背景（`css/style.css`） |
| **priority** | P0 |

**Codex prompt:**
```
[Master Style Prompt]
1920x1080 pixel art wallpaper. Night office cubicle viewed from behind desk chair. Empty desk with keyboard, mouse, coffee mug. Single CRT/LCD monitor glow illuminating the scene (cyan-blue light on face of desk). Rain streaks on window, blurred city lights bokeh outside. No people visible. Moody, lonely overtime atmosphere. Slight CRT scanline overlay optional. Full bleed, no transparency.
```

---

### 2. 窗口边框 / 标题栏（9-slice）

| 字段 | 值 |
|------|-----|
| **filename** | `assets/pixel/window-border.png` |
| **dimensions** | 48×48 源图（9-slice：角 8px，边可平铺） |
| **where used** | `.pixel-window` 窗口 chrome（待 CSS 接入；当前 CSS 变量占位） |
| **priority** | P0 |

**Codex prompt:**
```
[Master Style Prompt]
48x48 pixel art 9-slice window frame texture. Gray beveled title bar top strip with three small pixel circles (red yellow green) top-right like retro Mac/Win chrome. Purple-gray body border 3px, inset highlight top-left, shadow bottom-right. Transparent center. Designed for CSS border-image slice 8.
```

---

### 3. 任务栏

| 字段 | 值 |
|------|-----|
| **filename** | `assets/pixel/taskbar.png` |
| **dimensions** | 64×40 横向平铺条 |
| **where used** | `#taskbar` 底栏背景（`css/style.css`） |
| **priority** | P0 |

**Codex prompt:**
```
[Master Style Prompt]
64x40 pixel art horizontal taskbar strip, tileable left-right. Dark purple gradient #3d3555 to #2a2240, 3px top border #6a5a8a, subtle dither. Empty center area for app icons. Retro Win98-style start button zone hint on far left (blank gray button shape, no text). Seamless horizontal repeat.
```

---

### 4–8. 任务栏应用图标（32×32）

| # | filename | 用途 | priority |
|---|----------|------|----------|
| 4 | `assets/pixel/icon-cards.png` | 牌桌 🃏 | P0 |
| 5 | `assets/pixel/icon-chat.png` | 聊天 阿凯 | P0 |
| 6 | `assets/pixel/icon-work.png` | 工作 加班 | P0 |
| 7 | `assets/pixel/icon-gamble.png` | 赌博 别按那个键 | P0 |
| 8 | `assets/pixel/icon-family.png` | 家庭群 | P0 |

**Codex prompt — icon-cards.png:**
```
[Master Style Prompt]
32x32 pixel art app icon, transparent PNG. Playing cards fan or single event card with star. Cyan accent #6ec6ff on dark purple circle background. Chunky pixels, readable at 32px.
```

**Codex prompt — icon-chat.png:**
```
[Master Style Prompt]
32x32 pixel art app icon, transparent PNG. Speech bubble with three dots message indicator. Cyan #6ec6ff accent, dark purple bg. Chat app metaphor.
```

**Codex prompt — icon-work.png:**
```
[Master Style Prompt]
32x32 pixel art app icon, transparent PNG. Briefcase or wrench/gear maintenance symbol. Muted gray-blue corporate overtime vibe.
```

**Codex prompt — icon-gamble.png:**
```
[Master Style Prompt]
32x32 pixel art app icon, transparent PNG. Big red circular button silhouette #ff4466, warning glow. Dark purple background. No text. Tempting but ominous.
```

**Codex prompt — icon-family.png:**
```
[Master Style Prompt]
32x32 pixel art app icon, transparent PNG. Simple house with heart or three stick figures (family). Warm amber accent #ffcc44 on dark purple. WeChat group chat metaphor.
```

---

### 9. 备忘录图标（周期 4 卡牌）

| 字段 | 值 |
|------|-----|
| **filename** | `assets/pixel/icon-memo.png` |
| **dimensions** | 32×32 |
| **where used** | 周期 4 `memo_prompt` 卡牌 / 未来任务栏扩展 |
| **priority** | P0 |

**Codex prompt:**
```
[Master Style Prompt]
32x32 pixel art app icon, transparent PNG. Notepad with pencil, yellow sticky note accent #ffcc44, dark purple background. Memo/reminder app.
```

---

### 10–11. 卡牌框架

| # | filename | dimensions | where used | priority |
|---|----------|------------|------------|----------|
| 10 | `assets/pixel/card-frame.png` | 130×90 | `.event-card` 边框装饰层 | P0 |
| 11 | `assets/pixel/card-back.png` | 130×90 | 卡牌背面 / 未翻开状态 | P0 |

**Codex prompt — card-frame.png:**
```
[Master Style Prompt]
130x90 pixel art card frame template. Empty center area for artwork inset. Cyan border #4a8fbf, dark purple fill #2d2640, beveled pixel edge. Transparent center 110x64 px safe zone for illustration.
```

**Codex prompt — card-back.png:**
```
[Master Style Prompt]
130x90 pixel art playing card back. Geometric pixel pattern, diagonal stripes, small red button silhouette watermark center. Mysterious, slightly unsettling. No readable text.
```

---

### 12–14. 周期 1 事件牌插图

| # | filename | 卡牌 | priority |
|---|----------|------|----------|
| 12 | `assets/pixel/card-friend-link.png` | 朋友的链接 | P0 |
| 13 | `assets/pixel/card-work-report.png` | 工作日报 | P0 |
| 14 | `assets/pixel/card-wife-msg.png` | 妻子的消息 | P0 |

**Codex prompt — card-friend-link.png:**
```
[Master Style Prompt]
64x64 pixel art card illustration, transparent PNG. Chain link + browser window with red dot button peeking. Friend sending shady URL vibe. Cyan link color #6ec6ff.
```

**Codex prompt — card-work-report.png:**
```
[Master Style Prompt]
64x64 pixel art card illustration, transparent PNG. Spreadsheet/document with red deadline clock. Corporate stress, coffee stain optional. Gray-blue tones.
```

**Codex prompt — card-wife-msg.png:**
```
[Master Style Prompt]
64x64 pixel art card illustration, transparent PNG. Phone screen with heart emoji message bubble, warm amber #ffcc44. Wife waiting at home, gentle but worried.
```

---

### 15. 行动格空框

| 字段 | 值 |
|------|-----|
| **filename** | `assets/pixel/action-slot-empty.png` |
| **dimensions** | 150×100 |
| **where used** | `#action-slot` 空槽位（`.action-slot` dashed 区） |
| **priority** | P0 |

**Codex prompt:**
```
[Master Style Prompt]
150x100 pixel art empty action slot frame. Dashed pixel border #6a5a8a, dark inset shadow, subtle "drop card here" affordance with downward arrow pixels. Semi-transparent dark center. UI frame only, no text.
```

---

### 16–19. 心情图标

| # | filename | 中文 | HUD 颜色 | priority |
|---|----------|------|----------|----------|
| 16 | `assets/pixel/mood-addiction.png` | 上瘾 | `#ff4466` | P0 |
| 17 | `assets/pixel/mood-stable.png` | 踏实 | `#5dff8f` | P0 |
| 18 | `assets/pixel/mood-anxiety.png` | 不安 | `#ffcc44` | P0 |
| 19 | `assets/pixel/mood-diligent.png` | 勤勉 | `#6ec6ff` | P0 |

**Codex prompt — mood-addiction.png:**
```
[Master Style Prompt]
32x32 pixel art mood icon, transparent PNG. Red spiral/swirl or slot machine reel fragment #ff4466. Represents gambling addiction. Readable at 14px HUD size.
```

**Codex prompt — mood-stable.png:**
```
[Master Style Prompt]
32x32 pixel art mood icon, transparent PNG. Green shield or steady heartbeat line #5dff8f. Calm, grounded feeling.
```

**Codex prompt — mood-anxiety.png:**
```
[Master Style Prompt]
32x32 pixel art mood icon, transparent PNG. Amber jagged lightning or shaking phone #ffcc44. Unease, unread messages.
```

**Codex prompt — mood-diligent.png:**
```
[Master Style Prompt]
32x32 pixel art mood icon, transparent PNG. Cyan wrench/checkmark combo #6ec6ff. Hard work, maintenance done.
```

---

### 20–22. 赌博红按钮三态

| # | filename | dimensions | where used | priority |
|---|----------|------------|------------|----------|
| 20 | `assets/pixel/gamble-btn-normal.png` | 80×80 | `.gamble-btn` 默认 | P0 |
| 21 | `assets/pixel/gamble-btn-hover.png` | 80×80 | `.gamble-btn:hover`（CSS 待接） | P0 |
| 22 | `assets/pixel/gamble-btn-pressed.png` | 80×80 | `.gamble-btn:active` | P0 |

**Codex prompt — gamble-btn-normal.png:**
```
[Master Style Prompt]
80x80 pixel art round red button #ff4466, beveled chrome rim, subtle breathing glow pixels. Center blank for overlay text "按". Transparent outside circle. Tempting casino-big-red-button metaphor.
```

**Codex prompt — gamble-btn-hover.png:**
```
[Master Style Prompt]
80x80 pixel art round red button hover state. Brighter #ff6688, expanded glow halo pixels, same shape as normal. Transparent PNG.
```

**Codex prompt — gamble-btn-pressed.png:**
```
[Master Style Prompt]
80x80 pixel art round red button pressed state. Darker #aa1122, inset shadow, shifted down 2px visual. Transparent PNG.
```

---

### 23–24. 赌博 UI 面板

| # | filename | dimensions | where used | priority |
|---|----------|------------|------------|----------|
| 23 | `assets/pixel/gamble-wheel.png` | 280×80 | `#wheel-display` 转盘/结果显示区 | P0 |
| 24 | `assets/pixel/gamble-balance-panel.png` | 200×48 | 赌博窗口余额条背景 | P0 |

**Codex prompt — gamble-wheel.png:**
```
[Master Style Prompt]
280x80 pixel art slot/wheel display panel. Dark inset frame, empty center for dynamic text overlay. Cheap digital casino LED strip pixels top/bottom. Purple-gray chrome border.
```

**Codex prompt — gamble-balance-panel.png:**
```
[Master Style Prompt]
200x48 pixel art balance readout panel. LCD-style green/cyan seven-segment placeholder area for "¥0000". Dark metal bezel, amateur gambling site aesthetic.
```

---

### 25–27. 聊天 UI

| # | filename | dimensions | where used | priority |
|---|----------|------------|------------|----------|
| 25 | `assets/pixel/chat-window-bg.png` | 360×280 | `.chat-content` 平铺/拉伸背景 | P0 |
| 26 | `assets/pixel/chat-bubble-friend.png` | 120×40 9-slice | 阿凯消息气泡 | P0 |
| 27 | `assets/pixel/chat-bubble-wife.png` | 120×40 9-slice | 小雅/家庭群气泡 | P0 |

**Codex prompt — chat-window-bg.png:**
```
[Master Style Prompt]
360x280 pixel art chat window interior background. Subtle grid or notebook paper pixel texture, dark purple #3d3555 base. Tileable or stretch-safe corners.
```

**Codex prompt — chat-bubble-friend.png:**
```
[Master Style Prompt]
120x40 pixel art speech bubble, 9-slice friendly. Cyan-tinted #4a8fbf fill, tail pointing left-bottom. Friend (阿凯) casual chat style. Transparent outside bubble.
```

**Codex prompt — chat-bubble-wife.png:**
```
[Master Style Prompt]
120x40 pixel art speech bubble, 9-slice friendly. Warm amber-tinted #c87830 fill, soft tail. Wife (小雅) family chat style. Transparent outside bubble.
```

---

### 28. 底部剧情框（VN 风格）

| 字段 | 值 |
|------|-----|
| **filename** | `assets/pixel/narrative-frame.png` |
| **dimensions** | 64×64 9-slice 源图 |
| **where used** | `#narrative-panel` 橙光/视觉小说式边框 |
| **priority** | P0 |

**Codex prompt:**
```
[Master Style Prompt]
64x64 pixel art visual-novel text box border, 9-slice. Orange-gold ornate pixel frame #c87830, dark purple interior #1e1830. Decorative corner pixels, retro Chinese AVG style. Transparent center.
```

---

### 29. 女儿画作（关键剧情道具）

| 字段 | 值 |
|------|-----|
| **filename** | `assets/pixel/daughter-drawing.png` |
| **dimensions** | 400×300 |
| **where used** | 家庭群 `family_drawing` 分支 / 替换 `assets/placeholders/daughter-drawing.svg` |
| **priority** | P0 |

**Codex prompt:**
```
[Master Style Prompt]
400x300 pixel art child crayon drawing on white paper texture. Stick figure family holding hands: mom, child with pigtails, dad stick figure alone at office desk separated from group. Innocent warm colors (red yellow blue green crayon pixels). Chinese kid scrawl style. Slightly crooked, heartfelt. Paper edge visible, photo-of-drawing on phone screen optional vignette.
```

---

### 30. 通知 Toast 框

| 字段 | 值 |
|------|-----|
| **filename** | `assets/pixel/notification-toast.png` |
| **dimensions** | 280×72 9-slice |
| **where used** | `#notifications .notification` |
| **priority** | P0 |

**Codex prompt:**
```
[Master Style Prompt]
280x72 pixel art system notification toast frame, 9-slice. Dark purple panel #2d2640, cyan accent stripe left #6ec6ff, pixel drop shadow offset 3px. Empty center for title/body text. Retro OS notification style.
```

---

### 31. 赌博页内容区背景

| 字段 | 值 |
|------|-----|
| **filename** | `assets/pixel/gamble-page-bg.png` |
| **dimensions** | 440×360 |
| **where used** | `.gamble-content` 窗口内容区 |
| **priority** | P0 |

**Codex prompt:**
```
[Master Style Prompt]
440x360 pixel art amateur dark webpage background. Black center stage spotlight circle, sketchy pixel border, unsettling empty void. Low-fi shady gambling site. No button included — just background.
```

---

## P1 — 完整五周期（18 项）

### 32–43. 周期 2–5 事件牌插图

| # | filename | 卡牌 ID | 描述 | priority |
|---|----------|---------|------|----------|
| 32 | `assets/pixel/card-gamble-again.png` | gamble_again | 闪烁的红按钮图标 | P1 |
| 33 | `assets/pixel/card-wife-breakfast.png` | wife_breakfast | 早餐/粥碗 | P1 |
| 34 | `assets/pixel/card-work-daily.png` | work_daily | 日常维护清单 | P1 |
| 35 | `assets/pixel/card-work-hard.png` | work_hard | 加班/进度条满 | P1 |
| 36 | `assets/pixel/card-gamble-big.png` | gamble_big | 大筹码/ALL IN | P1 |
| 37 | `assets/pixel/card-family-drawing.png` | family_drawing | 蜡笔画缩略图 | P1 |
| 38 | `assets/pixel/card-bill.png` | bill_reminder | 账单/信封感叹号 | P1 |
| 39 | `assets/pixel/card-memo.png` | memo_prompt | 便签本 | P1 |
| 40 | `assets/pixel/card-anxiety.png` | anxiety_ping | 未读红点消息 | P1 |
| 41 | `assets/pixel/card-final.png` | final_prep | 深夜窗外/最后一夜 | P1 |
| 42 | `assets/pixel/card-family-wait.png` | family_wait | 热汤/等待的家人 | P1 |
| 43 | `assets/pixel/card-one-more.png` | one_more_gamble | 手指悬在按钮上 | P1 |

**Codex prompt template（替换 `{DESC}`）：**
```
[Master Style Prompt]
64x64 pixel art card illustration, transparent PNG. {DESC}. Match cycle 1 card icon style, readable at 64px height in 130px card frame.
```

各牌 `{DESC}`：`red button pulsing in taskbar glow` / `bowl of congee steam pixels` / `clipboard checklist wrench` / `progress bar nearly full sweat drop` / `large poker chip stack` / `mini crayon family drawing` / `invoice envelope red exclamation` / `sticky note pencil` / `phone vibration unread dot` / `quiet night window city lights` / `bowl of soup warm light` / `finger hovering over red button`.

---

### 44–46. 聊天头像

| # | filename | dimensions | 角色 | priority |
|---|----------|------------|------|----------|
| 44 | `assets/pixel/avatar-friend.png` | 48×48 | 阿凯 | P1 |
| 45 | `assets/pixel/avatar-wife.png` | 48×48 | 小雅 | P1 |
| 46 | `assets/pixel/avatar-daughter.png` | 48×48 | 朵朵 | P1 |

**Codex prompt — avatar-friend.png:**
```
[Master Style Prompt]
48x48 pixel art avatar portrait, transparent PNG. Young man casual smirk, night chat vibe, circular crop implied. Cyan accent highlights.
```

**Codex prompt — avatar-wife.png:**
```
[Master Style Prompt]
48x48 pixel art avatar portrait, transparent PNG. Gentle tired woman, kind eyes, circular crop. Warm amber tones.
```

**Codex prompt — avatar-daughter.png:**
```
[Master Style Prompt]
48x48 pixel art avatar portrait, transparent PNG. Cute child pigtails, bright soft colors, circular crop.
```

---

### 47–48. 结局插画

| # | filename | dimensions | 结局 | priority |
|---|----------|------------|------|----------|
| 47 | `assets/pixel/ending-awaken.png` | 1280×720 | 醒悟 | P1 |
| 48 | `assets/pixel/ending-ruin.png` | 1280×720 | 沉沦 | P1 |

**Codex prompt — ending-awaken.png:**
```
[Master Style Prompt]
1280x720 pixel art cinematic illustration. Dawn light through office window, empty chair, monitor off, hopeful muted colors. Minimal detail, emotional relief after night overtime.
```

**Codex prompt — ending-ruin.png:**
```
[Master Style Prompt]
1280x720 pixel art cinematic illustration. Dark office multiple monitors showing red loss numbers, cluttered desk, oppressive atmosphere. Psychological dread, no gore. Wide shot.
```

---

### 49. 鼠标指针（可选）

| 字段 | 值 |
|------|-----|
| **filename** | `assets/pixel/cursor-default.png` |
| **dimensions** | 16×16（热点 0,0） |
| **where used** | `#desktop { cursor }` 可选 |
| **priority** | P1 |

**Codex prompt:**
```
[Master Style Prompt]
16x16 pixel art white arrow cursor with black outline, classic Windows 98 pointer. Transparent PNG, hotspot top-left pixel.
```

---

## 资产统计

| 优先级 | 数量 |
|--------|------|
| **P0** | 31 |
| **P1** | 18 |
| **合计** | **49** |

---

## 导出规范

- 格式：**PNG**（图标/边框透明底；壁纸/结局可 opaque）
- 命名：严格按下表，全小写，连字符
- 目录：`assets/pixel/`
- 像素风：禁用抗锯齿；可用 `image-rendering: pixelated`
- 完成后：`Ctrl+F5` 强刷浏览器验证

---

## 代码引用索引

| 资产 | 引用位置 |
|------|----------|
| desktop-bg, taskbar, gamble-btn | `css/style.css` |
| mood-* | `js/ui.js` MOOD_ART |
| card-* | `js/cycles.js` CARD_META |
| daughter-drawing | 家庭群分支 / `assets/placeholders/` 替换 |
| 其余 UI 帧 | 待 CSS 第二轮接入（已预留路径） |

---

## 验收清单

1. [ ] 五枚任务栏图标风格统一（线宽、调色板）
2. [ ] 壁纸不抢 HUD/窗口可读性
3. [ ] 女儿画作一眼识别「儿童 + 家庭分离」
4. [ ] 红按钮在暗色赌博背景上对比足够
5. [ ] 周期 1 三张事件牌可区分
6. [ ] 9-slice 资源角像素对齐，无模糊缩放
