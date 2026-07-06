from __future__ import annotations

from pathlib import Path


PROJECT = Path(__file__).resolve().parent
SRT_PATH = PROJECT / "roleplay-narration.srt"
ASS_PATH = PROJECT / "roleplay-narration.ass"

PLAY_RES_X = 1280
PLAY_RES_Y = 800
MAX_CHARS_PER_LINE = 18


def parse_timestamp(value: str) -> str:
    hours, minutes, rest = value.split(":")
    seconds, millis = rest.split(",")
    centis = round(int(millis) / 10)
    if centis == 100:
      centis = 99
    return f"{int(hours)}:{int(minutes):02d}:{int(seconds):02d}.{centis:02d}"


def wrap_text(text: str, limit: int = MAX_CHARS_PER_LINE) -> str:
    compact = " ".join(text.split())
    if len(compact) <= limit:
        return compact

    lines: list[str] = []
    current = ""
    for char in compact:
        candidate = current + char
        if len(candidate) <= limit or not current:
            current = candidate
        else:
            lines.append(current)
            current = char
    if current:
        lines.append(current)

    if len(lines) <= 2:
        return r"\N".join(lines)

    return lines[0] + r"\N" + "".join(lines[1:])


def parse_srt(path: Path) -> list[tuple[str, str, str]]:
    blocks = path.read_text(encoding="utf-8").strip().split("\n\n")
    cues: list[tuple[str, str, str]] = []

    for block in blocks:
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if len(lines) < 3:
            continue
        timing = lines[1]
        if " --> " not in timing:
            continue
        start, end = timing.split(" --> ", 1)
        text = " ".join(lines[2:])
        cues.append((parse_timestamp(start), parse_timestamp(end), wrap_text(text)))

    return cues


def build_ass(cues: list[tuple[str, str, str]]) -> str:
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {PLAY_RES_X}
PlayResY: {PLAY_RES_Y}
ScaledBorderAndShadow: yes
WrapStyle: 2
YCbCr Matrix: TV.601

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Default,Microsoft YaHei,22,&H00F0E8E8,&H00F0E8E8,&H00101820,&H00000000,-1,0,0,0,100,100,0,0,1,2,0,2,120,120,20,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""

    lines = [
        f"Dialogue: 0,{start},{end},Default,,0,0,0,,{text}"
        for start, end, text in cues
    ]
    return header + "\n".join(lines) + "\n"


def main() -> None:
    cues = parse_srt(SRT_PATH)
    ASS_PATH.write_text(build_ass(cues), encoding="utf-8")


if __name__ == "__main__":
    main()
