**Format:** 1280×720  
**Audio:** 中文解说配音 + 硬字幕，无背景音乐  
**VO direction:** 年轻中文女声，语速平稳，像在给朋友讲一个“越玩越不对劲”的 demo，句尾留一点停顿  
**Style basis:** `DESIGN.md` 中定义的像素桌面、深紫黑底、冷青 HUD、危险红键、暖黄台灯

**Global guardrails**

- 以真实游玩录像为主体，不做脱离游戏内容的假宣传镜头
- 每一拍都保留桌面系统感，HUD、剧情条、窗口关系必须能看见
- 字幕必须足够大，录屏压缩后仍能一眼读清
- 红键相关的提示、资金变化、第二周承接，是整条视频最重要的三个信息点
- 动效用来强调节奏，不掩盖录像本身

## Asset Audit

| Asset | Type | Assign to Beat | Role |
| --- | --- | --- | --- |
| `raw/b4575195e0351916234e482ce383bc2f.webm` | Gameplay video | Beat 1-4 | 真实游玩主素材 |
| `capture/screenshots/scroll-000.png` | Screenshot | Beat 1, Beat 4 | 封面衬底与收尾定格 |
| `capture/assets/fonts/e3t4euO8T-267oIAQAu6jDQyK0nS.ttf` | Font | Global | 像素标题字体来源 |

## Per-Beat Direction

### BEAT 1 — 雨夜办公室开场（0.10-9.98s）

**VO cue:** “你以为这只是个别按下去的小游戏。真正危险的，是它会让你一边加班，一边开始替那颗红键找理由。”

**Concept:** 一上来不是 flashy 宣传，而是让观众先掉进这个夜晚。雨夜办公室、旧屏幕冷光、像素 HUD 和简介封面同时成立，像是在说：你只是点开一个小游戏，但气氛已经不对了。

**Visual description:** 录像从开始界面起步，底下垫一层轻微放大的 `scroll-000.png` 做环境延展。标题用青色像素字压在左上，主题句“别按那个键”用危险红打出来。字幕出现在底部剧情条上方，像系统自带旁白。

**Mood direction:** 像素黑色电影，压抑但不夸张；像深夜桌面突然开始说话。

**Assets:**  
Background fallback: `capture/screenshots/scroll-000.png`  
Primary motion plate: `raw/b4575195e0351916234e482ce383bc2f.webm`

**Animation choreography:**  
- 截图背景缓慢 Ken Burns 放大  
- 标题使用 per-word kinetic typography，从左轻推入场  
- 录像主体从 96% scale 轻微放大到 100%，像镜头贴近桌面  

**Transition:** Blur through，0.35s，轻微向前推进进入下一拍

**Depth layers:** BG 为雨夜办公室截图；MG 为真实录像画面；FG 为标题和首句字幕

**SFX cues:** 无独立音效，保持配音独占注意力

### BEAT 2 — 抽牌、存钱、准备按下（9.68-17.75s）

**VO cue:** “开局在深夜办公室，我先抽到朋友发来的链接。存进三百，第一下就赢了五十。”

**Concept:** 这一拍要把“它不是点按钮那么简单”说清楚。先抽到朋友的链接，再打开赌博窗口，再把钱存进去，观众必须一眼看懂这是一条被剧情牵着走的上瘾路线。

**Visual description:** 录像来到第一周抽牌，卡牌被放进 action slot；窗口展开，筹码存入机器，红键提示第一次亮起。画面用细框和小箭头标出“朋友链接”“存入机器”“红键提示”三个注意点。

**Mood direction:** 冷静演示，但已经带一点“你看，麻烦来了”的味道。

**Assets:**  
Primary motion plate: `raw/b4575195e0351916234e482ce383bc2f.webm`

**Animation choreography:**  
- 细描边 callout 从 HUD 和窗口边缘画出  
- “¥300” 用数字 slam 动效强调一次  
- 字幕以 phrase block 方式逐句上屏，不做花哨逐字抖动  

**Transition:** Velocity-matched upward，录像轻微上推，字幕切到下一句

**Depth layers:** BG 为录像桌面；MG 为窗口与红键区域；FG 为 callout 与字幕

**SFX cues:** 无

### BEAT 3 — 红键反馈真的很具体（17.45-28.25s）

**VO cue:** “它不会只告诉你输赢。现金、机器余额、待还账单，会立刻跳出来，让上头这件事一下变得特别具体。”

**Concept:** 这是整条视频的核心卖点拍。观众要看到真正的“按一次之后发生了什么”，而不是听旁白空讲。画面要盯住红键结果、金额变化条、按键次数和剧情提示。

**Visual description:** 第一按之后，轮盘结果、资金变化条、上瘾心情提示依次出现。镜头不是裁掉界面，而是用局部放大框突出“机器 +50”“待还 -25”“按键 1 次”。

**Mood direction:** 节制，但必须清晰；像产品功能演示，又像一次危险信号。

**Assets:**  
Primary motion plate: `raw/b4575195e0351916234e482ce383bc2f.webm`

**Animation choreography:**  
- 用 3D-ish 浮层框把资金变化区轻轻抬起来  
- 关键数字做一次 counter pulse  
- 字幕块进场使用 blur-clear，保持读感稳定

**Transition:** Hard cut into next beat after stop choice出现

**Depth layers:** BG 为录像；MG 为金额变化条与按钮；FG 为字幕与聚焦框

**SFX cues:** 无

### BEAT 4 — 停手也会被带进第二周（27.95-43.04s）

**VO cue:** “更狠的是，停手也不算结束。你可以把这次侥幸，直接带进第二周，看着自己一步步沉进去。 这就是《红键梭哈》。别按那个键，可你大概还是会想，再按一次。”

**Concept:** 结尾不做大而空的 CTA，而是把“停手也会继续影响后面”这个设计亮出来。视频最后停在第二周再次出现的红键提示上，让主题自己落下来。

**Visual description:** 停手后出现四个分支按钮，选“继续进入第二周”；第二周卡牌翻出，新的红点闪烁被选中，红键再次亮起。最终冻结在第二周红键提示和游戏标题共存的状态上，像一句还没说完的诱惑。

**Mood direction:** 不是收束，是余味。像你以为演示结束了，结果按钮还在等你。

**Assets:**  
Primary motion plate: `raw/b4575195e0351916234e482ce383bc2f.webm`  
Ending freeze base: `capture/screenshots/scroll-000.png`

**Animation choreography:**  
- 继续第二周的按钮用 warning 色轻点一下  
- 结尾标题从左下淡入，红色主题句从右下接住  
- 最后一秒定格，字幕不再滚动，只留标题与主题句

**Transition:** Final fade to still frame，0.45s

**Depth layers:** BG 为录像末尾定格；MG 为第二周窗口；FG 为收尾标题和最后一句字幕

**SFX cues:** 无

## Production Architecture

```text
all-in-on-red-playthrough/
├── index.html
├── DESIGN.md
├── SCRIPT.md
├── STORYBOARD.md
├── narration.txt
├── narration.mp3
├── narration.vtt
├── transcript.json
├── raw/
│   └── b4575195e0351916234e482ce383bc2f.webm
├── capture/
│   ├── screenshots/
│   ├── assets/
│   └── extracted/
└── compositions/
    ├── beat-1-hook.html
    ├── beat-2-setup.html
    ├── beat-3-feedback.html
    └── beat-4-cycle-two.html
```
