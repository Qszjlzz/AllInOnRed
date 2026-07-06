# 程序 Agent Brief — 别按那个键

## 技术约束

- **纯静态**：HTML + CSS + ES Modules，无构建、无 npm
- **运行**：双击 `index.html` 或本地静态服，`file://` 兼容
- **目标分辨率**：1280×720 及以上
- **语言**：UI 中文；代码注释中文可选

---

## 目录结构

```
金海豚gamejam/
├── index.html          # 入口，桌面 DOM 骨架
├── css/
│   └── style.css       # 桌面主题、窗口、组件
├── js/
│   ├── main.js         # 启动、主循环、日切换
│   ├── state.js        # 状态、AP、持久 flags
│   ├── events.js       # 剧情事件调度
│   ├── gambling.js     # 按键、转盘、存取
│   ├── work.js         # QTE minigame
│   ├── ui.js           # 窗口管理、通知、渲染
│   └── balance.js      # 数值常量（数值策划维护）
├── assets/             # 美术替换（可选）
├── docs/
└── README.md
```

---

## 架构图

```
┌─────────────────────────────────────────┐
│                  main.js                 │
│  init → gameLoop → endDay → checkEnding  │
└─────────┬───────────────────────────────┘
          │
    ┌─────┴─────┬─────────┬──────────┐
    ▼           ▼         ▼          ▼
state       events    gambling    work
    │           │         │          │
    └───────────┴────┬────┴──────────┘
                     ▼
                   ui.js
              (windows/notify/hud)
```

---

## state.js API

```javascript
// 核心结构
state = {
  day: 1,           // 1-3
  ap: 3,
  cash: number,
  virtualBalance: number,
  billTotal: number,
  billPaid: number,
  mood: { addiction: 0, stable: 0, anxiety: 0 },
  flags: {},        // e.g. d1_early_stop, memo_text, saw_drawing
  stats: { gambleCount, workCount },
  phase: 'playing' | 'ending'
}

// 方法
initGame()
spendAp(n) → boolean
addCash(n) / addVirtual(n)
getDebt() → number
endDay()
canAct() → boolean
```

---

## events.js API

```javascript
registerEvents(state)  // day/ap/flag 触发器表
tickEvents(state)      // 每 action 后调用
trigger(eventId)
// 事件 handler 返回 { messages[], forceModal?, setFlags? }
```

**事件 ID** 见 WRITER_BRIEF 表。

---

## gambling.js API

```javascript
spinWheel(state, { betSource: 'cash'|'virtual', multiplier: 1|3|10 })
deposit(amount)
withdraw()  // 消耗 AP
getWheelSegments()  // 来自 balance.js
renderGambleUI(container, callbacks)
```

---

## work.js API

```javascript
startWorkQTE(onComplete: { success: bool })
// QTE：5 次点击 timing bar，命中≥3 成功
```

---

## ui.js API

```javascript
openWindow(id) / closeWindow(id) / minimizeWindow(id)
showNotification(title, body)
showModal(options)
updateHUD(state)
showEnding(endingId)
// 窗口 id: chat, work, gamble, family, memo
```

---

## 窗口与 AP 规则

| 动作 | AP |
|------|-----|
| 打开窗口 | 0 |
| 工作一次 | 1 |
| 赌博一次/三连 | 1 |
| 虚拟取出 | 1 |
| 存入 | 0 |
| 结束今天 | 0 |

---

## 模块间数据流

1. 玩家点任务栏 → `ui.openWindow`  
2. 窗口内操作 → 调用 `gambling`/`work` → 改 `state` → `spendAp`  
3. `events.tickEvents(state)` 检查新剧情  
4. AP=0 或点「结束今天」→ `main.endDay()` → day++，重置 ap=3  
5. day>3 或 ending flag → `checkEnding()`

---

## HTML 结构要点

```html
<div id="desktop">
  <div id="wallpaper"></div>
  <div id="hud">...</div>
  <div id="windows-container">...</div>
  <div id="taskbar">...</div>
  <div id="modal-layer"></div>
  <div id="ending-layer"></div>
</div>
```

每个 window：`.window[data-id]` + `.title-bar` + `.content`

---

## file:// 注意

- 使用 `<script type="module" src="js/main.js">` 相对路径
- 部分浏览器 file:// 限制 module；README 注明可用 `python -m http.server`

---

## 与文案/数值对接

- 字符串：优先 `data/strings.json` fetch，失败用 `js/strings.js` fallback  
- 数值：仅改 `balance.js`  
- 美术：CSS `background-image: url('../assets/...')` 或 `<img data-art="...">`

---

## 测试清单

- [ ] Day1 完整：文件→赌→early choice  
- [ ] Day2 工作+家庭  
- [ ] Day3 memo→final  
- [ ] 4+ 结局各可达  
- [ ] 刷新页面状态（stretch：localStorage）  
- [ ] 1280×720 无布局溢出

---

## 当前 Demo 实现状态

见根目录 README.md「已实现 vs TODO」。
