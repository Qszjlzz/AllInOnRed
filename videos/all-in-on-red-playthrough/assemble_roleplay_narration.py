from __future__ import annotations

import json
import subprocess
from pathlib import Path


PROJECT = Path(__file__).resolve().parent
MANIFEST_PATH = PROJECT / "roleplay-voice-segments" / "manifest.json"
EVENTS_PATH = PROJECT / "raw" / "roleplay-events.json"
OUTPUT_MP3 = PROJECT / "roleplay-narration.mp3"
OUTPUT_SRT = PROJECT / "roleplay-narration.srt"
OUTPUT_VTT = PROJECT / "roleplay-narration.vtt"
OUTPUT_ASS = PROJECT / "roleplay-narration.ass"

PLAY_RES_X = 1280
PLAY_RES_Y = 800
MAX_CHARS_PER_LINE = 18
SAFE_GAP = 0.08


def sec_to_srt(value: float) -> str:
    ms = max(0, int(round(value * 1000)))
    hours, rem = divmod(ms, 3_600_000)
    minutes, rem = divmod(rem, 60_000)
    seconds, millis = divmod(rem, 1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d},{millis:03d}"


def sec_to_ass(value: float) -> str:
    centis = max(0, int(round(value * 100)))
    hours, rem = divmod(centis, 360_000)
    minutes, rem = divmod(rem, 6_000)
    seconds, cs = divmod(rem, 100)
    return f"{hours}:{minutes:02d}:{seconds:02d}.{cs:02d}"


def sec_to_vtt(value: float) -> str:
    ms = max(0, int(round(value * 1000)))
    hours, rem = divmod(ms, 3_600_000)
    minutes, rem = divmod(rem, 60_000)
    seconds, millis = divmod(rem, 1000)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}.{millis:03d}"


def wrap_text(text: str, limit: int = MAX_CHARS_PER_LINE) -> list[str]:
    compact = " ".join(text.split())
    if len(compact) <= limit:
        return [compact]

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
        return lines

    return [lines[0], "".join(lines[1:])]


def build_srt(cues: list[dict[str, object]]) -> str:
    blocks = []
    for index, cue in enumerate(cues, start=1):
        text = "\n".join(wrap_text(str(cue["text"])))
        blocks.append(
            f"{index}\n{sec_to_srt(float(cue['start']))} --> {sec_to_srt(float(cue['end']))}\n{text}\n"
        )
    return "\n".join(blocks)


def build_vtt(cues: list[dict[str, object]]) -> str:
    blocks = ["WEBVTT\n"]
    for cue in cues:
        text = "\n".join(wrap_text(str(cue["text"])))
        blocks.append(
            f"{sec_to_vtt(float(cue['start']))} --> {sec_to_vtt(float(cue['end']))}\n{text}\n"
        )
    return "\n".join(blocks)


def build_ass(cues: list[dict[str, object]]) -> str:
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {PLAY_RES_X}
PlayResY: {PLAY_RES_Y}
ScaledBorderAndShadow: yes
WrapStyle: 2
YCbCr Matrix: TV.601

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Default,Microsoft YaHei,20,&H00F0E8E8,&H00F0E8E8,&H00101820,&H00000000,-1,0,0,0,100,100,0,0,1,2,0,2,120,120,18,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""
    rows = []
    for cue in cues:
        text = r"\N".join(wrap_text(str(cue["text"])))
        rows.append(
            f"Dialogue: 0,{sec_to_ass(float(cue['start']))},{sec_to_ass(float(cue['end']))},Default,,0,0,0,,{text}"
        )
    return header + "\n".join(rows) + "\n"


def main() -> None:
    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    events = json.loads(EVENTS_PATH.read_text(encoding="utf-8"))

    segment_starts = [event for event in events if event.get("event") == "segment_start"]
    segments = manifest["segments"]

    if len(segment_starts) != len(segments):
        raise RuntimeError(f"segment count mismatch: starts={len(segment_starts)} segments={len(segments)}")

    cues: list[dict[str, object]] = []
    ffmpeg_inputs: list[str] = []
    filter_parts: list[str] = []
    mix_labels: list[str] = []

    for index, (segment, start_event) in enumerate(zip(segments, segment_starts)):
        start = float(start_event["t"])
        duration = float(segment["duration"])
        next_start = (
            float(segment_starts[index + 1]["t"])
            if index + 1 < len(segment_starts)
            else start + duration + 0.4
        )
        end = min(start + duration, next_start - SAFE_GAP)
        if end <= start:
            end = start + min(duration, 0.6)

        cues.append({"start": start, "end": end, "text": segment["text"]})
        ffmpeg_inputs.extend(["-i", str(segment["path"])])
        delay = int(round(start * 1000))
        label = f"a{index}"
        filter_parts.append(f"[{index}:a]adelay={delay}|{delay}[{label}]")
        mix_labels.append(f"[{label}]")

    filter_parts.append(
        f"{''.join(mix_labels)}amix=inputs={len(mix_labels)}:duration=longest:dropout_transition=0,volume=1.05[narr]"
    )

    subprocess.run(
        [
            "ffmpeg",
            "-y",
            *ffmpeg_inputs,
            "-filter_complex",
            ";".join(filter_parts),
            "-map",
            "[narr]",
            "-c:a",
            "libmp3lame",
            "-q:a",
            "2",
            str(OUTPUT_MP3),
        ],
        check=True,
    )

    OUTPUT_SRT.write_text(build_srt(cues), encoding="utf-8")
    OUTPUT_VTT.write_text(build_vtt(cues), encoding="utf-8")
    OUTPUT_ASS.write_text(build_ass(cues), encoding="utf-8")


if __name__ == "__main__":
    main()
