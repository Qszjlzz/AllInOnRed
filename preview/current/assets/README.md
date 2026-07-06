# 美术资产清单 — 别按那个键

> 占位策略：HTML 内使用 CSS + SVG + emoji；正式图请按 `docs/ART_BRIEF.md` 生成后替换。

## 目录结构

```
assets/
  README.md          ← 本文件
  icons/             ← 任务栏应用图标
  placeholders/      ← SVG 占位图
  wallpaper/         ← 桌面壁纸（可选）
```

## 资产列表

| ID | 文件 | 用途 | 状态 |
|----|------|------|------|
| art_wallpaper_1920x1080 | wallpaper/desktop-night.svg | 桌面背景 | SVG 占位 |
| icon_chat | icons/chat.svg | 聊天应用 | SVG |
| icon_work | icons/work.svg | 工作应用 | SVG |
| icon_gamble | icons/gamble.svg | 赌博网页 | SVG |
| icon_family | icons/family.svg | 家庭群 | SVG |
| icon_memo | icons/memo.svg | 备忘录 | SVG |
| art_daughter_drawing_400x300 | placeholders/daughter-drawing.svg | 女儿画作 | SVG |
| art_gamble_page_bg | — | 赌博页背景 | CSS 渐变 |
| art_button_press | — | 红色圆形按钮 | CSS |
| art_wheel_bg | — | 转盘显示区 | CSS |

## 生成提示词

完整 Midjourney / SD 提示词见 **`docs/ART_BRIEF.md`**。

## 替换方法

1. 将生成图放入对应目录，保持文件名或更新 `css/style.css` / `ui.js` 引用。
2. 女儿画作：替换 `placeholders/daughter-drawing.svg` 或在 `ui.js` 的 `appendChatMessage` 中改 `img src`。
