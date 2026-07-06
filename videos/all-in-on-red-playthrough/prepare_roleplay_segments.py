from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path


PROJECT = Path(__file__).resolve().parent
SEGMENTS_PATH = PROJECT / "roleplay-slow-segments.json"
SEGMENT_DIR = PROJECT / "roleplay-voice-segments"
MANIFEST_PATH = SEGMENT_DIR / "manifest.json"

VOICE = "zh-CN-YunxiNeural"
RATE = "+8%"
PITCH = "+0Hz"
VOLUME = "+35%"


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def probe_duration(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            str(path),
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(result.stdout.strip())


def main() -> None:
    texts: list[str] = json.loads(SEGMENTS_PATH.read_text(encoding="utf-8"))
    shutil.rmtree(SEGMENT_DIR, ignore_errors=True)
    SEGMENT_DIR.mkdir(parents=True, exist_ok=True)

    manifest = []
    for index, text in enumerate(texts):
        segment_path = SEGMENT_DIR / f"segment-{index:02d}.mp3"
        run(
            [
                "edge-tts",
                "--text",
                text,
                "--voice",
                VOICE,
                f"--rate={RATE}",
                f"--volume={VOLUME}",
                f"--pitch={PITCH}",
                "--write-media",
                str(segment_path),
            ]
        )
        manifest.append(
            {
                "index": index,
                "text": text,
                "path": str(segment_path),
                "duration": probe_duration(segment_path),
            }
        )

    MANIFEST_PATH.write_text(
        json.dumps(
            {"voice": VOICE, "rate": RATE, "volume": VOLUME, "pitch": PITCH, "segments": manifest},
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
