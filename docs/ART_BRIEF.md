# 美术 Agent Brief — 别按那个键

## 风格总纲

- **主题**：深夜办公室，唯一光源来自显示器
- **色调**：#0d1117 ~ #1a2332 背景，accent #4a9eff（链接）、#e74c3c（危险/按）
- **风格**：扁平 + 轻噪点，参考 Windows 10 暗色主题，非写实
- **原则**：Minimal — Demo 可 CSS+emoji，下列资产为替换目标

---

## 资产清单（逐项）

### 1. `art_wallpaper_1920x1080.png`
- **尺寸**：1920×1080（可裁切 1280×720）
- **用途**：桌面背景
- **Prompt**：
  > Dark office at night, empty cubicle desk, single monitor glow illuminating keyboard, city lights through window blurred, cinematic moody blue-black palette, minimal detail, no people, 16:9 wallpaper, flat illustration style with subtle film grain

---

### 2. `art_icon_chat_64x64.png`
- **尺寸**：64×64，透明底
- **用途**：任务栏 — 聊天应用
- **Prompt**：
  > App icon, speech bubble with three dots, dark blue background circle, soft cyan accent, flat minimal UI icon, 64x64, transparent PNG

---

### 3. `art_icon_work_64x64.png`
- **尺寸**：64×64，透明底
- **用途**：任务栏 — 工作软件
- **Prompt**：
  > App icon, briefcase or spreadsheet grid symbol, muted gray-blue, corporate overtime aesthetic, flat minimal, transparent background

---

### 4. `art_icon_gamble_64x64.png`
- **尺寸**：64×64，透明底
- **用途**：任务栏 — 别按那个键.html
- **Prompt**：
  > App icon, big red button silhouette, warning feeling but playful, dark circle background, flat design, transparent PNG, no text

---

### 5. `art_icon_family_64x64.png`
- **尺寸**：64×64，透明底
- **用途**：任务栏 — 家庭群
- **Prompt**：
  > App icon, house with heart or family group silhouette, warm dim orange accent on dark blue, flat minimal chat app icon

---

### 6. `art_icon_memo_64x64.png`
- **尺寸**：64×64，透明底
- **用途**：任务栏 — 备忘录
- **Prompt**：
  > App icon, notepad with pencil, yellow sticky note accent, dark mode style, flat vector icon

---

### 7. `art_window_chrome_9slice.png`
- **尺寸**：约 200×40 标题栏 + 边框（9-slice）
- **用途**：窗口标题栏与边框
- **Prompt**：
  > UI window title bar texture, dark gray #2d333b, subtle gradient, Windows-like close minimize buttons red yellow green small circles, 9-slice friendly horizontal strip

---

### 8. `art_gamble_page_bg_800x600.png`
- **尺寸**：800×600
- **用途**：赌博网页内容区背景
- **Prompt**：
  > Crude amateur webpage background, black center stage, sketchy border, unsettling empty space, single spotlight on center, low-fi web aesthetic, no button included

---

### 9. `art_button_press_200x200.png`
- **尺寸**：200×200
- **用途**：赌博主按钮（正常态）
- **Prompt**：
  > Large round red button, glossy, tempting, text area blank, slight glow, game UI asset, isolated on transparent background, cartoon minimal

---

### 10. `art_button_press_hover_200x200.png`
- **尺寸**：200×200
- **用途**：按钮 hover
- **Prompt**：
  > Same red button brighter glow pulsing feel, hover state game UI, transparent background

---

### 11. `art_wheel_bg_400x400.png`
- **尺寸**：400×400
- **用途**：转盘底图
- **Prompt**：
  > Spinning wheel game UI, 8 segments empty, dark metal rim, casino but cheap digital feel, top-down view, transparent or dark center

---

### 12. `art_daughter_drawing_400x300.png`
- **尺寸**：400×300
- **用途**：家庭群女儿画作
- **Prompt**：
  > Child crayon drawing on paper, stick figure family holding hands, dad figure at office desk separated from group, Chinese kid scrawl style, warm innocent colors on white paper, photo of drawing on phone screen

---

### 13. `art_avatar_friend_48x48.png`
- **尺寸**：48×48
- **用途**：阿凯头像
- **Prompt**：
  > Casual young man avatar pixel or flat, smirk, night chat vibe, circular crop

---

### 14. `art_avatar_wife_48x48.png`
- **尺寸**：48×48
- **用途**：小雅头像
- **Prompt**：
  > Gentle woman avatar flat illustration, tired but kind eyes, circular icon

---

### 15. `art_avatar_daughter_48x48.png`
- **尺寸**：48×48
- **用途**：朵朵头像
- **Prompt**：
  > Cute child avatar, simple pigtails, bright but soft colors

---

### 16. `art_ending_awaken_1280x720.png`
- **尺寸**：1280×720
- **用途**：结局 — 醒悟
- **Prompt**：
  > Dawn light through office window, empty chair, monitor off, hopeful muted colors, minimalist narrative illustration

---

### 17. `art_ending_ruin_1280x720.png`
- **尺寸**：1280×720
- **用途**：结局 — 沉沦
- **Prompt**：
  > Dark office multiple monitors glow red numbers, cluttered desk, oppressive atmosphere, no gore, psychological horror lite, wide cinematic

---

### 18. `art_notification_bill_32x32.png`
- **尺寸**：32×32
- **用途**：账单系统通知图标
- **Prompt**：
  > Small invoice or envelope icon with exclamation, red accent, flat system notification style

---

## 占位对照（程序注释）

| 代码注释 | 替换资产 |
|----------|----------|
| `/* ART: wallpaper */` | art_wallpaper_1920x1080 |
| `/* ART: icon_chat */` | art_icon_chat_64x64 |
| `/* ART: daughter_drawing */` | art_daughter_drawing_400x300 |
| `.gamble-btn` background | art_button_press_200x200 |

---

## 导出规范

- 格式：PNG（图标透明）/ WebP（壁纸可选）
- 命名：严格按上表
- 目录：`assets/`
- 提供 `@2x` 可选，Demo 用 1x 即可

---

## 验收

1. 五图标风格统一（线宽、圆角、色板）
2. 壁纸不抢 UI 可读性
3. 女儿画作一眼可识别「儿童 + 家庭」
4. 按钮在暗色网页背景上对比足够
