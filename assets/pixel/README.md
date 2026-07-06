# 像素美术资源目录

将 Codex 生成的 PNG 按**精确文件名**放入此文件夹。代码已引用 `assets/pixel/xxx.png`；文件缺失时 CSS 色块占位。

---

## 快速投放（Drop-in）

1. 打开 **`docs/CODEX_ART_GENERATION.md`**，按清单让 Codex 生成图片  
2. 生成顺序参考 **`GENERATION_ORDER.md`**（先壁纸/边框/按钮锚定风格）  
3. 下载后**重命名为表内文件名**（全小写、连字符，如 `desktop-bg.png`）  
4. 保存到 **`assets/pixel/`**（与本 README 同级）  
5. 浏览器 **`Ctrl+F5`** 强刷缓存  
6. 若改尺寸，同步更新 `css/style.css` 中对应变量  

**不要**改文件名或子目录，除非同步改 `css/style.css` / `js/cycles.js` / `js/ui.js`。

---

## P0 必需（周期 1 Demo · 31 张）

| 文件名 | 尺寸 | 用途 |
|--------|------|------|
| `desktop-bg.png` | 1920×1080 | 桌面壁纸 |
| `window-border.png` | 48×48 9-slice | 窗口边框 |
| `taskbar.png` | 64×40 tile | 任务栏 |
| `icon-cards.png` | 32×32 | 牌桌图标 |
| `icon-chat.png` | 32×32 | 聊天 |
| `icon-work.png` | 32×32 | 工作 |
| `icon-gamble.png` | 32×32 | 赌博 |
| `icon-family.png` | 32×32 | 家庭群 |
| `icon-memo.png` | 32×32 | 备忘录 |
| `card-frame.png` | 130×90 | 卡牌边框 |
| `card-back.png` | 130×90 | 卡牌背面 |
| `card-friend-link.png` | 64×64 | 事件牌：朋友的链接 |
| `card-work-report.png` | 64×64 | 事件牌：工作日报 |
| `card-wife-msg.png` | 64×64 | 事件牌：妻子的消息 |
| `action-slot-empty.png` | 150×100 | 行动格空框 |
| `mood-addiction.png` | 32×32 | 心情：上瘾 |
| `mood-stable.png` | 32×32 | 心情：踏实 |
| `mood-anxiety.png` | 32×32 | 心情：不安 |
| `mood-diligent.png` | 32×32 | 心情：勤勉 |
| `gamble-btn-normal.png` | 80×80 | 赌博红按钮 |
| `gamble-btn-hover.png` | 80×80 | 红按钮 hover |
| `gamble-btn-pressed.png` | 80×80 | 红按钮按下 |
| `gamble-wheel.png` | 280×80 | 转盘/结果显示 |
| `gamble-balance-panel.png` | 200×48 | 余额面板 |
| `gamble-page-bg.png` | 440×360 | 赌博页背景 |
| `chat-window-bg.png` | 360×280 | 聊天窗背景 |
| `chat-bubble-friend.png` | 120×40 9-slice | 阿凯气泡 |
| `chat-bubble-wife.png` | 120×40 9-slice | 小雅气泡 |
| `narrative-frame.png` | 64×64 9-slice | 底部剧情框 |
| `daughter-drawing.png` | 400×300 | 女儿画作（关键道具） |
| `notification-toast.png` | 280×72 9-slice | 系统通知 |

---

## P1 扩展（周期 2–5 + 结局 · 18 张）

`card-gamble-again.png`, `card-wife-breakfast.png`, `card-work-daily.png`, `card-work-hard.png`, `card-gamble-big.png`, `card-family-drawing.png`, `card-bill.png`, `card-memo.png`, `card-anxiety.png`, `card-final.png`, `card-family-wait.png`, `card-one-more.png`, `avatar-friend.png`, `avatar-wife.png`, `avatar-daughter.png`, `ending-awaken.png`, `ending-ruin.png`, `cursor-default.png`

---

## 文档

| 文件 | 内容 |
|------|------|
| **[docs/CODEX_ART_GENERATION.md](../../docs/CODEX_ART_GENERATION.md)** | 完整 prompt 清单（49 项） |
| **[GENERATION_ORDER.md](./GENERATION_ORDER.md)** | 推荐生成顺序 |

---

## 当前状态

`assets/pixel/` 目录暂无 PNG 文件 — 游戏使用 CSS 渐变 + emoji 占位。投放 P0 包后 Demo 视觉立即升级。
