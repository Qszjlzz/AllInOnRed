# 重构变更日志 — 别按那个键

> 总结用户反馈、聊天记录中的问题诊断、修改方案与架构变化。  
> 日期：2026-07-05

---

## 1. 用户反馈的核心问题

| 问题 | 原实现 | 用户期望 |
|------|--------|----------|
| **流程** | 按「天」推进；Day1 赌几次后弹窗选「关掉」→ **直接结局 + 只能重开** | 密教模拟器式：**每周期先刷 3 张事件牌 → 行动格选 1 张 → 触发分支** |
| **早期退出** | `handleEarlyChoice('stop')` → `setEnding('early')` 硬结束 | 分支结局后提供 **「回到之前重新选择」**，不必强制重开 |
| **界面** | 现代 flat 深色面板，窗口浮在黑色渐变上 | **像素风仿真电脑**：壁纸、任务栏、窗口叠层偏移、像真 OS |
| **叙事** | 大量 `showModal` 弹窗 | **底部固定剧情框**（橙光/AI 对话风格），聊天窗只放 IM |
| **赌博解锁** | Day2 / 瘾值解锁三连按 | **按按键次数**：1→单按，5→三连，10→十连 |
| **美术** | 占位 SVG + 渐变 | 用户提供像素素材；清单见 `ART_ASSET_LIST.md` |

---

## 2. 聊天记录中的机制澄清（Word  doc / 用户粘贴）

用户重新解释了策划案：

1. **不是**「每天早上 8 点去工作」的日程制  
2. **是** 每周期（原 60 秒，Demo 改为手动「结束本周期」）刷 **剧情驱动** 的 1–3 张事件牌  
3. 玩家有 **一个行动格**，每周期只能处理 **一张牌**  
4. 周期 1 三张牌：**【朋友的链接】【工作日报】【妻子的消息】**  
5. 选朋友链接 → 资产选择 → 赌博窗 → 完整分支（看规则/退出、试试看、三次按键、同事打断、手机没电等）  
6. 心情牌：上瘾 / 踏实 / 不安 / 勤勉 — 收集展示  

用户粘贴了 **周期 1 完整剧本**（含所有 early ending 与成就文案），要求全部进入 `js/copy.js`。

---

## 3. 修改方案（已实施）

### 玩法

- [x] 5 周期框架（Demo 完整实现周期 1，2–5 有卡牌 + stub 叙事）  
- [x] `js/cycles.js` — 每周期固定 3 张牌 ID  
- [x] `js/cards.js` — 选牌、周期 1 全分支、bookmark 回溯  
- [x] 早期结局统一提供：回到之前 / 返回主菜单 / （手机没电线）进入周期 2  
- [x] 赌博解锁改为 `stats.gambleCount`（按键次数）  
- [x] 心情牌 `moodCards[]` + HUD 托盘展示  

### 界面

- [x] 像素 CSS + Press Start 2P 字体  
- [x] 壁纸 `assets/pixel/desktop-bg.png`（CSS 渐变 fallback）  
- [x] 窗口 draggable + z-index 叠层  
- [x] 独立窗口：牌桌 / 聊天 / 赌博 / 工作 / 家庭  
- [x] 底部 `#narrative-panel` 打字机叙事 + 选项按钮  

### 代码结构

```
js/cycles.js    NEW — 周期与卡牌 ID
js/cards.js     NEW — 卡牌 + 周期 1 剧情引擎
js/copy.js      重写 — 周期 1 全量剧本
js/state.js     周期制 state
js/main.js      简化为 cards 驱动
js/ui.js        像素 UI + 叙事框 + 牌桌渲染
index.html      新布局
css/style.css   像素风
```

---

## 4. 架构对比

### Before（v8.1 桌面 + 3 天）

```
tick → collectPendingEvents() → eventQueue
  → modal / chat / gamble 分散触发
  → endDay() → day++
  → early ending = setEnding → 只能 restart
```

### After（周期卡牌）

```
beginCycle() → 底部叙事开场 → renderCardTable(3 cards)
  → placeCard(id) → runCycle1Branch / stub
  → 选择走 narrative panel（非 modal）
  → early ending → rewind(bookmark) | mainMenu | continue
  → endCycle() → cycle++ → beginCycle()
```

---

## 5. 周期 1 分支一览

| 路径 | 触发 | 结局 ID |
|------|------|---------|
| 朋友链接 → 看规则 → 退出 | 资产选择后 | `rules_quit` |
| 朋友链接 → 第 1 次按后停止 | +¥50 | `stop_after_1` |
| 朋友链接 → 第 2 次按后停止 | +¥130 累计 | `stop_after_2` |
| 朋友链接 → 第 3 次输后回家 | +¥10 累计 | `stop_after_3` |
| 同事打断 →  quit | | `quit_colleague` |
| 同事打断 → 再按 → 手机没电 | | `phone_dead`（可进周期 2） |
| 工作日报 | 牌 | 勤勉 +1 → 结束周期 |
| 妻子消息 | 牌 | 踏实/不安 +1 → 结束周期 |

所有 early ending 均可 **回到 bookmark 重选**。

---

## 6. 未做 / 后续

- 周期 2–5 完整剧本（当前 stub + 卡牌 UI）  
- 健康牌 / 卖血卖肾（欠款 10 万解锁）  
- 上瘾 3 强制十连（框架已有 ten 按钮）  
- 最终【按/不按】五周期版（原 Day3 结局保留在 copy 备用）  
- 用户替换 `assets/pixel/*` 后视觉终稿  

---

## 7. 相关文档

- [ART_ASSET_LIST.md](ART_ASSET_LIST.md) — 美术清单 + prompt  
- [DESIGN_MERGE.md](DESIGN_MERGE.md) — 策划融合（已更新 v2）  
- [README.md](../README.md) — 如何玩新版  
