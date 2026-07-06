from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont
from moviepy import (
    AudioFileClip,
    CompositeVideoClip,
    ImageClip,
    VideoFileClip,
    concatenate_videoclips,
)


PROJECT = Path(__file__).resolve().parent
WIDTH = 1280
HEIGHT = 720
FPS = 30

RAW_VIDEO = PROJECT / "raw" / "b4575195e0351916234e482ce383bc2f.webm"
STILL_IMAGE = PROJECT / "stills" / "cycle2-red-prompt.png"
AUDIO_PATH = PROJECT / "narration.mp3"
TRANSCRIPT_PATH = PROJECT / "transcript.json"
OUTPUT_PATH = PROJECT / "renders" / "all-in-on-red-playthrough.mp4"
OVERLAY_DIR = PROJECT / "render_overlays"
OVERLAY_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

PIXEL_FONT = PROJECT / "capture" / "assets" / "fonts" / "e3t4euO8T-267oIAQAu6jDQyK0nS.ttf"
UI_FONT = Path("C:/Windows/Fonts/msyh.ttc")

TEXT = {
    "bg": (18, 14, 28, 212),
    "border": (200, 120, 48, 236),
    "text": (255, 255, 255, 255),
    "accent": (110, 198, 255, 255),
    "danger": (255, 68, 102, 255),
    "warn": (255, 204, 68, 255),
    "panel": (30, 24, 48, 228),
    "panel_2": (45, 38, 64, 222),
}


def load_font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


PIXEL_42 = load_font(PIXEL_FONT, 42)
PIXEL_28 = load_font(PIXEL_FONT, 28)
UI_24 = load_font(UI_FONT, 24)
UI_28 = load_font(UI_FONT, 28)
UI_32 = load_font(UI_FONT, 32)
UI_36 = load_font(UI_FONT, 36)
UI_40 = load_font(UI_FONT, 40)


def wrap_text(text: str, font: ImageFont.FreeTypeFont, max_width: int) -> list[str]:
    dummy = Image.new("RGBA", (8, 8), (0, 0, 0, 0))
    draw = ImageDraw.Draw(dummy)
    lines: list[str] = []
    current = ""
    for char in text:
        candidate = current + char
        left, top, right, bottom = draw.textbbox((0, 0), candidate, font=font)
        if right - left <= max_width or not current:
            current = candidate
        else:
            lines.append(current)
            current = char
    if current:
        lines.append(current)
    return lines


def save_image(name: str, image: Image.Image) -> Path:
    path = OVERLAY_DIR / name
    image.save(path)
    return path


def draw_rect(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], fill, outline, width: int = 2) -> None:
    draw.rectangle(box, fill=fill, outline=outline, width=width)


def make_title_overlay() -> Path:
    image = Image.new("RGBA", (560, 280), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw_rect(draw, (0, 0, 540, 258), (20, 16, 32, 160), (106, 90, 138, 220), 2)
    draw.text((18, 16), "试玩录像 / PLAYTHROUGH", font=UI_24, fill=TEXT["warn"])
    draw.text((18, 58), "红键梭哈", font=PIXEL_42, fill=TEXT["accent"])
    draw.text((18, 120), "All In on Red", font=UI_32, fill=TEXT["text"])
    draw_rect(draw, (18, 162, 150, 208), (36, 12, 22, 214), (255, 68, 102, 232), 2)
    draw.text((32, 173), "别按那个键", font=UI_24, fill=TEXT["danger"])
    note_lines = wrap_text("深夜办公室、像素桌面、一个会把人越拉越近的红按钮。", UI_24, 232)
    draw_rect(draw, (286, 18, 538, 148), (30, 24, 48, 216), (106, 90, 138, 220), 2)
    y = 32
    for line in note_lines:
      draw.text((302, y), line, font=UI_24, fill=TEXT["text"])
      y += 32
    return save_image("title_overlay.png", image)


def make_step_overlay() -> Path:
    image = Image.new("RGBA", (340, 220), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw_rect(draw, (0, 0, 334, 214), (30, 24, 48, 220), (110, 198, 255, 228), 2)
    rows = [
        ("01", "抽到朋友的链接", TEXT["accent"]),
        ("02", "先压进三百", TEXT["warn"]),
        ("03", "红键开始发亮", TEXT["danger"]),
    ]
    top = 18
    for idx, label, color in rows:
        draw_rect(draw, (16, top, 320, top + 52), (45, 38, 64, 220), color, 2)
        draw.text((34, top + 10), idx, font=UI_28, fill=TEXT["accent"])
        draw.text((82, top + 10), label, font=UI_28, fill=TEXT["text"])
        top += 62
    return save_image("step_overlay.png", image)


def make_feedback_overlay() -> Path:
    image = Image.new("RGBA", (360, 270), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw_rect(draw, (0, 0, 354, 264), (30, 24, 48, 224), (110, 198, 255, 228), 2)
    draw.text((20, 18), "即时反馈", font=UI_28, fill=TEXT["accent"])
    rows = [
        ("机器 +¥50", (93, 255, 143, 255)),
        ("待还 -¥25", (93, 255, 143, 255)),
        ("心情 上瘾 +1", (255, 68, 102, 255)),
    ]
    top = 58
    for label, color in rows:
        draw_rect(draw, (16, top, 338, top + 54), (45, 38, 64, 222), color, 2)
        draw.text((32, top + 10), label, font=UI_28, fill=TEXT["text"])
        top += 66
    return save_image("feedback_overlay.png", image)


def make_continue_overlay() -> Path:
    image = Image.new("RGBA", (470, 200), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw_rect(draw, (0, 0, 224, 50), (18, 14, 28, 214), (255, 204, 68, 232), 2)
    draw.text((18, 10), "停手也会留下惯性", font=UI_28, fill=TEXT["warn"])
    draw_rect(draw, (0, 66, 452, 194), (30, 24, 48, 224), (106, 90, 138, 220), 2)
    lines = wrap_text("你不是退出了按钮，你只是把它带进了第二周。", UI_32, 408)
    y = 84
    for line in lines:
        draw.text((18, y), line, font=UI_32, fill=TEXT["text"])
        y += 42
    return save_image("continue_overlay.png", image)


def make_end_overlay() -> Path:
    image = Image.new("RGBA", (420, 260), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw_rect(draw, (0, 0, 404, 244), (26, 20, 35, 230), (110, 198, 255, 234), 2)
    draw_rect(draw, (20, 18, 154, 62), (36, 12, 22, 214), (255, 68, 102, 230), 2)
    draw.text((34, 28), "别按那个键", font=UI_24, fill=TEXT["danger"])
    draw.text((20, 92), "红键梭哈", font=PIXEL_42, fill=TEXT["accent"])
    draw.text((20, 164), "All In on Red", font=UI_32, fill=TEXT["text"])
    return save_image("end_overlay.png", image)


def make_subtitle_overlay(name: str, text: str) -> Path:
    image = Image.new("RGBA", (1160, 122), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw_rect(draw, (0, 0, 1158, 120), TEXT["bg"], TEXT["border"], 2)
    lines = wrap_text(text, UI_36, 1080)
    total_height = len(lines) * 44
    y = (122 - total_height) // 2 - 4
    for line in lines:
        left, top, right, bottom = draw.textbbox((0, 0), line, font=UI_36)
        line_width = right - left
        x = (1160 - line_width) // 2
        draw.text((x, y), line, font=UI_36, fill=TEXT["text"])
        y += 44
    return save_image(name, image)


def clip_from_image(path: Path, start: float, end: float, position: tuple[int, int]) -> ImageClip:
    return ImageClip(str(path)).with_start(start).with_duration(end - start).with_position(position)


def build_video() -> None:
    with RAW_VIDEO.open("rb"):
        pass

    title_overlay = make_title_overlay()
    step_overlay = make_step_overlay()
    feedback_overlay = make_feedback_overlay()
    continue_overlay = make_continue_overlay()
    end_overlay = make_end_overlay()

    transcript = json.loads(TRANSCRIPT_PATH.read_text(encoding="utf-8"))
    subtitle_paths = [
        make_subtitle_overlay(f"subtitle-{index:02d}.png", entry["text"])
        for index, entry in enumerate(transcript)
    ]

    raw_clip = VideoFileClip(str(RAW_VIDEO)).resized((WIDTH, HEIGHT))
    audio_clip = AudioFileClip(str(AUDIO_PATH))
    freeze_duration = max(0.0, audio_clip.duration - raw_clip.duration)
    still_clip = ImageClip(str(STILL_IMAGE)).with_duration(freeze_duration).resized((WIDTH, HEIGHT))
    base_clip = concatenate_videoclips([raw_clip, still_clip], method="compose").with_duration(audio_clip.duration)

    overlays = [
        clip_from_image(title_overlay, 0.4, 7.0, (36, 34)),
        clip_from_image(step_overlay, 10.1, 17.2, (900, 40)),
        clip_from_image(feedback_overlay, 18.0, 28.0, (890, 38)),
        clip_from_image(continue_overlay, 28.7, 36.0, (42, 42)),
        clip_from_image(end_overlay, 36.2, audio_clip.duration, (826, 390)),
    ]

    for entry, path in zip(transcript, subtitle_paths):
        overlays.append(clip_from_image(path, float(entry["start"]), float(entry["end"]), (60, 576)))

    final = CompositeVideoClip([base_clip, *overlays], size=(WIDTH, HEIGHT)).with_audio(audio_clip)
    final.write_videofile(
        str(OUTPUT_PATH),
        fps=FPS,
        codec="libx264",
        audio_codec="aac",
        preset="medium",
        threads=4,
    )

    final.close()
    base_clip.close()
    raw_clip.close()
    still_clip.close()
    audio_clip.close()


if __name__ == "__main__":
    build_video()
