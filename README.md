# 红键梭哈 / All In on Red

> 像素桌面叙事游戏。主题：**别按那个键**。

## 游戏简介
《红键梭哈 / All In on Red》是一款围绕诱惑、债务和上瘾感展开的像素桌面叙事游戏。深夜加班时，你点开一个名为“别按那个键.html”的页面，屏幕中央只剩下一颗不断诱惑你的红色按钮。

接下来的五个周期里，你要在工作、家庭、账单和赌博冲动之间来回拉扯。你可以赚钱、还债、回消息，也可以一次次按下那个按钮，赌自己这次能翻盘。每一次选择都会把故事推向不同的方向。

## 当前版本内容
- 五个完整周期的主线流程
- 每周期三张事件牌的分支推进
- 聊天、家庭、工作、赌博四类桌面窗口交互
- 工作 QTE、小额/三连/十连赌博解锁
- 周期一短结局回溯，后续周期主线与最终抉择
- 12 个可解锁结局与开场结局图鉴
- 开场封面、继续游戏、存档恢复
- 已生成的像素美术素材与结局专属插图
- 一条带字幕和解说的试玩成片

## 运行方式

### 直接打开
1. 直接打开 `index.html`
2. 不依赖额外后端，页面使用 `js/game.bundle.js`

源代码有改动后重新打包：

```bash
npm run build
```

### 本地预览

```bash
npm run serve
```

推荐使用 Chrome 或 Edge。

## 游玩说明
1. 从封面进入新游戏，或继续已有存档。
2. 每个周期会出现 3 张事件牌，你只能处理其中 1 张。
3. 分支会把你带去聊天、家庭、工作或赌博窗口。
4. 赌博相关的即时反馈会直接显示本次得失和状态变化。
5. 周期结束后点击“结束本周期”，进入下一轮。
6. 第五周期会进入最终抉择，并根据债务、按键次数和重玩记忆落入不同结局。
7. 部分早期结局可以回到前一个关键节点重选，也可以直接收进图鉴。

## 测试

```bash
npm run build
node js/playtest-runner.js
node scripts/ui-playtest-dom.mjs
```

## 视频
- 成片：`videos/all-in-on-red-playthrough/renders/all-in-on-red-playthrough.mp4`
- 视频工程：`videos/all-in-on-red-playthrough/`

## 关键文档
- `docs/CURRENT_STATUS.md`：当前交付状态与完成项
- `docs/QA_TEST_REPORT_LATEST.md`：最新构建与验收结果
- `docs/ART_ASSET_LIST.md`：美术资产清单
- `docs/CODEX_ART_GENERATION.md`：生成素材记录

## 过程文档说明
仓库里保留了一批更早阶段的策划、分工和 Demo 计划文档，例如 `docs/DEMO_PLAN.md`、`docs/DESIGN_MERGE.md`、`docs/WRITER_BRIEF.md`。这些文件主要用于记录开发过程，里面可能还会保留早期 “Demo” 表述，不代表当前交付版本只有 Demo 范围。

## 存档
- 进行中存档：`localStorage["biean_save"]`
- 结局记忆：`localStorage["biean_last_ending"]`
- 已解锁结局：`localStorage["biean_unlocked_endings"]`

《红键梭哈》现在的目标不是演示一个机制，而是让玩家完整经历一段逐步沉迷、不断自辩、最后做出抉择的夜晚。
