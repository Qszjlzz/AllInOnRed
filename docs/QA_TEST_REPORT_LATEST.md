# QA Test Report — 红键梭哈 / All In on Red (Latest)

**Date:** 2026-07-06  
**Tester:** Codex autonomous playtest + local verification  
**Verdict:** ✅ **Release Candidate Pass** — 当前版本可完整游玩，自动化与浏览器验证通过

---

## Executive Summary

| Check | Result |
|------|--------|
| `npm run build` | ✅ PASS |
| `node js/playtest-runner.js` | ✅ 24/24 PASS |
| `node scripts/ui-playtest-dom.mjs` | ✅ 31/31 PASS |
| Chrome 实机试玩 | ✅ PASS |
| 试玩视频成片 | ✅ 已生成 |
| P0 阻塞问题 | 0 |

---

## Scope Verified

本轮确认的内容包括：

- 五个周期主线流程可进入并推进
- 开场封面支持新游戏与继续游戏
- 周期一短结局支持回溯或继续推进
- 最终抉择、重玩记忆、结局图鉴正常工作
- 12 个结局卡槽与缩略图展示正常
- 结局画面已接入专属结局插图
- 赌博即时反馈、工作 QTE、窗口交互可用
- 试玩视频成片与素材工程已落盘

---

## Automated Results

### Logic

`node js/playtest-runner.js`

- 5 个周期定义存在
- 周期一早期结局数据齐全
- 周期 2–5 分支数据完整
- 赌博不再消耗行动点
- 故事连续性检查通过
- 结局图鉴与进度跟踪通过
- 最终结局判定与债务比率计算通过

结果：**24/24 PASS**

### DOM / UI

`node scripts/ui-playtest-dom.mjs`

- 开场封面正常渲染
- 结局图鉴与缩略图正常渲染
- 开始游戏、继续游戏、读档预览正常
- 牌桌、聊天、赌博、家庭、工作窗口可打开
- 周期一事件牌渲染正常
- 赌博按钮、存入、工作 QTE 可触发
- 结束周期、关闭窗口、继续存档流程正常

结果：**31/31 PASS**

---

## Browser Smoke Pass

在 Chrome 中完成了以下实际检查：

1. 打开 `http://127.0.0.1:4174/`
2. 确认封面、游戏名、结局图鉴布局正常
3. 点击“开始游戏”进入桌面界面
4. 检查周期一牌桌、聊天窗口、赌博窗口正常出现
5. 进入“朋友的链接”分支，确认红色按钮与即时反馈区可见

结果：**PASS**

---

## Art and Ending Verification

- 新增 12 张结局专属插图已接入 `assets/pixel/ending-*.png`
- 开场图鉴缩略图已显示对应结局缩略图容器
- 结局页会根据结局 ID 读取对应插图，而不是复用一张通图

---

## Video Deliverable

- 成片路径：`videos/all-in-on-red-playthrough/renders/all-in-on-red-playthrough.mp4`
- 旁白、字幕、覆盖层与视频工程文件均已存在

---

## Open Issues

没有发现阻止交付的 P0 / P1 问题。

非阻塞说明：

- 仓库中仍保留部分早期策划 / Demo 过程文档，用于归档开发过程。
- 当前交付状态以 `README.md`、`docs/CURRENT_STATUS.md` 和本报告为准。

---

## Recommendation

可以按当前版本继续展示、试玩、录屏和提交仓库。后续如果还要继续增强，优先级建议放在新增剧情变体、额外结局演出和更多动态音画细节，而不是补基础可玩性。
