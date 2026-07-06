# 红键梭哈 / All In on Red

> 完整可玩版 · 反沉迷叙事 · **像素桌面 + 五周期事件卡牌**

> 主题句：**别按那个键**

深夜加班的上班族。每周期牌桌上刷出 **3 张事件牌**，行动格只能选 **1 张**——朋友的链接、工作日报、家人的消息、账单、备忘录……选哪张，走向哪条分支。

---

## 如何运行

### 直接打开（推荐）

1. 双击 [`index.html`](index.html)  
2. 无需 Node / 服务器（使用 `js/game.bundle.js`，支持 `file://`）

修改源码后打包：

```bash
npm run build
```

### 本地服务器（可选）

```bash
npm run serve
```

**推荐浏览器**：Chrome / Edge，宽度 ≥ 1024px。

---

## 怎么玩

1. **开始** → 阅读底部 **剧情框**（橙边 narrative panel）  
2. **事件牌桌**窗口：每周期固定出现 3 张牌  
3. **点击或拖入**一张到行动格 → 触发该分支（其余 2 张本周期作废）  
4. 可自由打开 **聊天 / 工作 / 赌博 / 家庭群** 窗口，在周期内继续做额外操作  
5. 分支结束后点 HUD **「结束本周期 →」** 进入下一周  
6. 到第 5 周会进入 **最终抉择**，并根据债务、赌博次数和重玩记忆触发不同结局

### 五周期主题

| 周期 | 主题 | 代表事件 |
|------|------|----------|
| 1 | 好奇 | 朋友的链接、第一次按下去 |
| 2 | 余温 | 再玩一次、早餐消息、继续加班 |
| 3 | 深陷 | 赌一把大的、朵朵的画、工作硬撑 |
| 4 | 对账 | 账单提醒、备忘录、未读消息 |
| 5 | 最后一夜 | 家人等待、再按一次、最终决定 |

### 其它窗口

| 任务栏 | 窗口 | 用途 |
|--------|------|------|
| 🃏 | 事件牌桌 | 每周期选牌 |
| 💬 | 阿凯聊天 | IM 消息 |
| 🔴 | 别按那个键.html | 赌博（单按 / 5 次三连 / 10 次十连） |
| 💼 | 加班维护 | 工作 QTE |
| 👨‍👩‍👧 | 家庭群 | 家人消息 |

- **剧情** → 底部框  
- **聊天** → 聊天窗  
- 窗口可 **拖拽**，新打开会 **叠层偏移**

---

## 美术素材

当前版本已经内置了一批生成好的像素 PNG，并继续保留缺图时的 CSS 回退。更多替换位详见：

- **[docs/ART_ASSET_LIST.md](docs/ART_ASSET_LIST.md)** — 完整清单 + AI 生图 prompt  
- **[assets/pixel/README.md](assets/pixel/README.md)** — 文件名对照  

缺失文件时游戏使用 CSS 色块占位；替换后 `Ctrl+F5` 刷新。

---

## 项目结构

```
index.html
css/style.css           像素风样式
js/game.bundle.js       打包产物
js/main.js              入口
js/cards.js             卡牌 + 五周期剧情引擎  ★
js/cycles.js            周期定义              ★
js/copy.js              全量文案（五周期 + 结局）
js/state.js / ui.js / gambling.js / work.js / audio.js
assets/pixel/           ← 你放素材 here
docs/
  ART_ASSET_LIST.md
  REDESIGN_CHANGELOG.md
  DESIGN_MERGE.md
```

---

## 测试

```bash
node js/playtest-runner.js
node scripts/ui-playtest-dom.mjs
```

---

## 设计文档

| 文档 | 内容 |
|------|------|
| [REDESIGN_CHANGELOG.md](docs/REDESIGN_CHANGELOG.md) | **本次重构：问题、方案、架构对比** |
| [ART_ASSET_LIST.md](docs/ART_ASSET_LIST.md) | 美术清单 + prompt |
| [DESIGN_MERGE.md](docs/DESIGN_MERGE.md) | 两份策划案融合 |
| [COPY_BRANCH_MAP.md](docs/COPY_BRANCH_MAP.md) | 分支映射 |

---

## 存档

- `localStorage` 键 `biean_save`  
- 结局界面「重新开始」清除存档  

---

**别按那个键** — 用卡牌选择、桌面窗口和最终抉择，呈现一种慢慢把生活输给按钮的过程。
