# 设计文档融合说明 — 别按那个键

> 本文档说明两份策划源文件如何被提取、对照、合并为最终 Demo 设计。  
> 项目 README 中有摘要；此处保留完整映射与决策记录。

---

## 1. 源文档

| 代号 | 文件 | 版本/性质 | 核心贡献 |
|------|------|-----------|----------|
| **Doc A** | `《别按那个键》交互策划案.pdf` | v8.1 叙事互动 Fiction | 五幕结构、角色关系、IM/邮件/备忘录叙事节拍、最终【按/不按】与备忘录回放 |
| **Doc B** | `别按那个键策划案改.docx` | 队友修订 · 卡牌/赌博机制 | 行动点、转盘/按键赌博、虚拟余额「机器」、工作 vs 赌博资源博弈、心情数值 |

本地路径（开发机）：

- `c:\Users\z1260\Desktop\《别按那个键》交互策划案.pdf`
- `c:\Users\z1260\Desktop\别按那个键策划案改.docx`

---

## 2. 提取方法

### 2.1 PDF（Doc A — v8.1 叙事案）

**方法**：全文 OCR/文本提取（PDF 阅读器导出或 Python `pypdf` / `pdfplumber`）。

**提取要点**：

1. **故事结构**：Day1 好奇 → Day2 习惯与家庭对比 → Day3 账单/女儿/自我对话 → 最终抉择  
2. **交互载体**：聊天 IM、邮件/账单、备忘录、赌博网页  
3. **关键节拍**：朋友发文件、同事打断、家人消息、女儿画作、备忘录强制输入、结局分支  
4. **主题约束**：不说教、桌面隐喻、成瘾的「温水煮青蛙」感  

**落地文件**：

- `docs/WRITER_BRIEF.md` — 事件表与文案规范  
- `js/copy.js` — 全部玩家可见文本（按事件 key 组织）  
- `js/events.js` — 事件 ID 与触发条件  
- `docs/COPY_BRANCH_MAP.md` — 分支与 copy key 对照  

### 2.2 DOCX（Doc B — 卡牌/赌博修订）

**方法**：`.docx` 本质是 ZIP；解压后读取 `word/document.xml`，用 Python 去 XML 标签提取纯文本。

```python
import zipfile, re, xml.etree.ElementTree as ET

path = r"c:\Users\z1260\Desktop\别按那个键策划案改.docx"
with zipfile.ZipFile(path) as z:
    xml = z.read("word/document.xml")
root = ET.fromstring(xml)
ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
texts = [t.text for t in root.findall(".//w:t", ns) if t.text]
body = "".join(texts)
print(body)
```

**提取要点**：

1. **行动点（AP）**：每日有限操作，迫使「工作 vs 赌博」二选一  
2. **赌博循环**：按键 → 转盘 → 现金/虚拟余额变化 → 上瘾概率  
3. **机器隐喻**：现金存入屏幕数字，取出消耗 AP（摩擦感）  
4. **工作 minigame**：稳定收入、对抗赌博快钱  
5. **简化心情**：上瘾 / 踏实 / 不安 / 勤勉  

**落地文件**：

- `js/balance.js` — 数值与转盘权重  
- `js/gambling.js` — 按键、转盘、存取  
- `js/work.js` — QTE 工作  
- `js/state.js` — AP、现金、虚拟余额、心情  
- `docs/BALANCE.md` — 平衡表  

---

## 3. 融合策略

两份文档原本形态不同：**Doc A** 是线性叙事 IF，**Doc B** 是密教模拟器式卡牌循环。Demo 采用 **「桌面壳 + 行动点卡牌 lite + 压缩三日线性节拍」**：

```
Doc A 叙事节拍          Doc B 机制              Demo 实现
─────────────────────────────────────────────────────────
IM 朋友发文件      →    打开「应用」耗 AP    →  任务栏 + 聊天窗 + 可点击文件卡
赌博网页           →    按键/转盘/虚拟余额   →  gamble 窗 + btn-gamble + wheel
加班赚钱           →    工作卡牌             →  work QTE（修机条）
家庭群消息         →    （叙事事件）         →  family 窗 + 回复按钮
备忘录自我对话     →    （Climax 道具）      →  memo textarea → 最终回放
最终按/不按        →    结局判定             →  ending-layer + handleFinalChoice
```

**时间压缩**（见 `docs/DEMO_PLAN.md`）：

| 原设计 | Demo |
|--------|------|
| 多周期/长局 | **3 天** |
| 每周期 1 行动 | **每天 3 AP** |
| 完整 Cultist 卡牌桌 | **任务栏应用 = 简化的「抽一张应用卡」** |

---

## 4. 元素来源对照表

| 游戏元素 | 主要来自 | 说明 |
|----------|----------|------|
| 桌面 UI、窗口拖拽、任务栏 | Doc A + 实现方向 | PDF 强调「电脑桌面」沉浸 |
| 3 天结构与 Day1/2/3 事件 | Doc A v8.1 | 五幕压缩为三幕 |
| 阿凯、小王、小雅、朵朵 | Doc A | 角色与对白在 `copy.js` |
| 早期收手 / 同事回家 / 手机没电 | Doc A | 分支结局 |
| 女儿画作 + 看看/等一下 | Doc A | Day3 情感高潮 |
| 备忘录回放 + 【按】【不按】 | Doc A | `showFinalOverlay` |
| 行动点 AP | Doc B | 每日 3 点 |
| 转盘七格（小赢/大亏/翻倍/清空） | Doc B | `balance.js` wheelBase |
| 虚拟余额存入/取出 | Doc B | deposit/withdraw |
| 三连按 | Doc B + Demo 扩展 | 上瘾或赌次解锁 |
| 心情四维 | Doc B 简化 | addiction/stable/anxiety/diligent |
| 工作 QTE | Doc B | 非 PDF 原文，替代「加班卡牌」 |
| 重玩 memory/delusion | Demo 扩展 | `localStorage` 上次结局 |

---

## 5. 有意未纳入或简化的项

| 原案内容 | 处理 |
|----------|------|
| 完整 Cultist 式卡牌桌 | 改为任务栏 + 窗口（Jam  scope） |
| 十连按 | Stretch TODO |
| 独立账单邮件窗口 | 合并为 HUD 进度条 + Day3 modal |
| 手动还款 UI | 债务由资产自动计算 |
| 外部 BGM 资源 | Web Audio 程序化音效 `audio.js` |

---

## 6. 团队文档索引

| 文档 | 用途 |
|------|------|
| [DEMO_PLAN.md](DEMO_PLAN.md) | Demo 范围与成功标准 |
| [WRITER_BRIEF.md](WRITER_BRIEF.md) | 文案与事件（Doc A 下游） |
| [BALANCE.md](BALANCE.md) | 数值表（Doc B 下游） |
| [COPY_BRANCH_MAP.md](COPY_BRANCH_MAP.md) | 分支 ↔ copy key |
| [PROGRAMMER_BRIEF.md](PROGRAMMER_BRIEF.md) | 代码架构 |
| [TEAM_ROLES.md](TEAM_ROLES.md) | 分工 |

---

## 7. 维护建议

1. **改叙事**：先改 Doc A 对应段落 → 更新 `copy.js` → 同步 `COPY_BRANCH_MAP.md`  
2. **改数值**：先改 Doc B 意图 → 更新 `balance.js` → 跑 `node js/playtest-runner.js`  
3. **新机制**：标注来源（A/B/新），避免两套文档再次分叉  

---

## 8. v2 重构（2026-07-05）

用户反馈：无事件牌桌、早期结局硬重开、UI 非像素仿真桌面。现改为 **5 周期 + 每周期 3 事件牌 + 行动格 1 选 + 底部剧情框 + bookmark 回溯**。模块：`js/cycles.js`、`js/cards.js`。详见 [REDESIGN_CHANGELOG.md](REDESIGN_CHANGELOG.md)。
