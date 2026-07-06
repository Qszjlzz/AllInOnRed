# QA Report v1 — 别按那个键 Demo

**日期**：2026-07-05  
**版本**：v0.9 → v1.0 迭代前  
**结论**：❌ **FAIL**（12/14 通过）

---

## Checklist

| # | 项 | 结果 | 备注 |
|---|-----|------|------|
| 1 | index.html 无错运行 | ⚠️ | 缺 `css/style.css`，页面无样式 |
| 2 | 完整故事 arc 10–20min | ✅ | 3 天事件链已实现 |
| 3 | 桌面 UI 全套窗口 | ✅ | 任务栏、时钟、5 窗口 |
| 4 | AP 系统 3×3 | ✅ | spendAp + HUD |
| 5 | 工作 minigame | ✅ | QTE 5 轮 3 命中 |
| 6 | 赌博按键+反馈+虚拟数 | ✅ | 转盘、存入/取出 |
| 7 | ≥3 个 v8.1 事件 | ⚠️ | 缺同事 IM、地铁通知 |
| 8 | 早期 + 2 主结局 | ✅ | early + 按/不按分支 |
| 9 | 全中文 UI | ✅ | |
| 10 | 心情影响玩法 | ⚠️ | 上瘾未明显影响工作 |
| 11 | 代码组织 | ✅ | 模块化 JS |
| 12 | docs 四角色+balance | ⚠️ | 缺 BALANCE.md、README、assets |
| 13 | README 运行说明 | ❌ | 不存在 |
| 14 | QA 报告 | ✅ | 本文件 |

---

## 严重问题

1. **CSS 缺失** — 游戏不可读、不可用  
2. **README 缺失** — 无法交付  
3. **叙事缺口** — 同事打断、地铁通知未接入 v8.1  

## 中等问题

4. 上瘾未降低工作效率（仅 mood 计数）  
5. 转盘权重固定，未实现 Day1 偏赢 / Day3 偏亏  
6. `gameState.js` 与规范文件名 `state.js` 不一致  
7. 结局无统计面板  
8. 无开场说明  

## 轻微问题

9. 女儿画作为 emoji 占位，缺 SVG  
10. AP 用尽时按钮仍可点（缺 disabled）  
11. 无 localStorage 存档  

---

## 修复计划（v1.0）

- [x] 添加 `css/style.css` 完整桌面皮肤  
- [x] 添加 README、BALANCE.md、assets/  
- [x] 重命名/迁移 `state.js`  
- [x] 事件：地铁、小王 IM、账单/画作/备忘录  
- [x] `getDynamicWheel()` 天数偏置  
- [x] 工作 QTE 上瘾惩罚  
- [x] 开场 intro、结局 stats、按钮 disabled  
- [x] localStorage 自动存档  

---

**下一步**：完成修复后执行 QA v2。
