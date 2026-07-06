from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageEnhance, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "pixel"
SIZE = (1280, 720)


BASES = {
    "walk": ASSETS / "ending-base-walk-home.png",
    "memory": ASSETS / "ending-base-memory-desk.png",
    "awaken": ASSETS / "ending-awaken.png",
    "ruin": ASSETS / "ending-ruin.png",
}


SPECS = {
    "rules_quit": {
        "source": "walk",
        "output": "ending-rules-quit.png",
        "focus": (0.74, 0.5),
        "brightness": 1.03,
        "contrast": 1.06,
        "tint": (255, 204, 96, 18),
        "frame": (255, 210, 106, 255),
        "icon": "file-icon-html.png",
        "icon_bg": (50, 32, 24, 212),
        "pips": 0,
        "scan": 0,
    },
    "stop_after_1": {
        "source": "walk",
        "output": "ending-stop-after-1.png",
        "focus": (0.67, 0.52),
        "brightness": 1.02,
        "contrast": 1.05,
        "tint": (86, 255, 155, 12),
        "frame": (104, 255, 166, 255),
        "icon": "game-icon-red-button.png",
        "icon_bg": (24, 42, 34, 214),
        "pips": 1,
        "scan": 0,
    },
    "stop_after_2": {
        "source": "walk",
        "output": "ending-stop-after-2.png",
        "focus": (0.63, 0.5),
        "brightness": 1.04,
        "contrast": 1.08,
        "tint": (106, 255, 194, 14),
        "frame": (106, 198, 255, 255),
        "icon": "game-icon-red-button.png",
        "icon_bg": (22, 32, 46, 214),
        "pips": 2,
        "scan": 0,
    },
    "stop_after_3": {
        "source": "walk",
        "output": "ending-stop-after-3.png",
        "focus": (0.58, 0.48),
        "brightness": 0.99,
        "contrast": 1.08,
        "tint": (255, 178, 82, 12),
        "frame": (255, 188, 92, 255),
        "icon": "game-icon-red-button.png",
        "icon_bg": (46, 28, 20, 214),
        "pips": 3,
        "scan": 6,
    },
    "quit_colleague": {
        "source": "walk",
        "output": "ending-quit-colleague.png",
        "focus": (0.82, 0.48),
        "brightness": 1.0,
        "contrast": 1.05,
        "tint": (110, 198, 255, 14),
        "frame": (110, 198, 255, 255),
        "icon": "icon-chat.png",
        "icon_bg": (20, 28, 46, 214),
        "pips": 0,
        "scan": 0,
    },
    "phone_dead": {
        "source": "ruin",
        "output": "ending-phone-dead.png",
        "focus": (0.48, 0.55),
        "brightness": 0.82,
        "contrast": 1.12,
        "tint": (78, 110, 188, 14),
        "frame": (126, 152, 224, 255),
        "icon": "icon-chat.png",
        "icon_bg": (18, 20, 28, 214),
        "pips": 0,
        "scan": 18,
        "black_bar": True,
    },
    "perfect": {
        "source": "awaken",
        "output": "ending-perfect-home.png",
        "focus": (0.52, 0.48),
        "brightness": 1.08,
        "contrast": 1.06,
        "tint": (255, 214, 118, 18),
        "frame": (93, 255, 143, 255),
        "icon": "icon-family.png",
        "icon_bg": (26, 40, 28, 214),
        "pips": 0,
        "scan": 0,
    },
    "awaken": {
        "source": "awaken",
        "output": "ending-awaken-realize.png",
        "focus": (0.6, 0.44),
        "brightness": 1.04,
        "contrast": 1.08,
        "tint": (110, 198, 255, 14),
        "frame": (110, 198, 255, 255),
        "icon": "icon-memo.png",
        "icon_bg": (24, 30, 46, 214),
        "pips": 0,
        "scan": 0,
    },
    "stop_loss": {
        "source": "awaken",
        "output": "ending-stop-loss.png",
        "focus": (0.46, 0.55),
        "brightness": 0.96,
        "contrast": 1.1,
        "tint": (255, 166, 92, 12),
        "frame": (255, 188, 92, 255),
        "icon": "card-bill.png",
        "icon_bg": (44, 28, 22, 214),
        "icon_crop": (20, 18, 76, 72),
        "pips": 0,
        "scan": 6,
    },
    "ruin": {
        "source": "ruin",
        "output": "ending-ruin-fall.png",
        "focus": (0.57, 0.5),
        "brightness": 0.9,
        "contrast": 1.16,
        "tint": (255, 64, 92, 18),
        "frame": (255, 76, 110, 255),
        "icon": "game-icon-v2-256.png",
        "icon_bg": (50, 18, 28, 220),
        "pips": 0,
        "scan": 10,
    },
    "memory": {
        "source": "memory",
        "output": "ending-memory-loop.png",
        "focus": (0.5, 0.48),
        "brightness": 1.0,
        "contrast": 1.08,
        "tint": (108, 194, 255, 14),
        "frame": (140, 208, 255, 255),
        "icon": "icon-memo.png",
        "icon_bg": (20, 30, 46, 214),
        "pips": 0,
        "scan": 8,
        "ghost_orbits": True,
    },
    "delusion": {
        "source": "memory",
        "output": "ending-delusion-loop.png",
        "focus": (0.56, 0.48),
        "brightness": 0.92,
        "contrast": 1.14,
        "tint": (255, 66, 98, 18),
        "frame": (255, 76, 116, 255),
        "icon": "game-icon-red-button.png",
        "icon_bg": (50, 18, 28, 220),
        "pips": 0,
        "scan": 16,
        "ghost_orbits": True,
    },
}


def load_rgba(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def cover_crop(image: Image.Image, size: tuple[int, int], focus: tuple[float, float]) -> Image.Image:
    target_w, target_h = size
    src_w, src_h = image.size
    target_ratio = target_w / target_h
    src_ratio = src_w / src_h

    if src_ratio > target_ratio:
        crop_h = src_h
        crop_w = int(round(crop_h * target_ratio))
    else:
        crop_w = src_w
        crop_h = int(round(crop_w / target_ratio))

    fx, fy = focus
    left = int(round((src_w - crop_w) * fx))
    top = int(round((src_h - crop_h) * fy))
    left = max(0, min(left, src_w - crop_w))
    top = max(0, min(top, src_h - crop_h))
    box = (left, top, left + crop_w, top + crop_h)
    return image.crop(box).resize(size, Image.Resampling.LANCZOS)


def apply_tint(image: Image.Image, rgba: tuple[int, int, int, int]) -> Image.Image:
    overlay = Image.new("RGBA", image.size, rgba)
    return Image.alpha_composite(image, overlay)


def add_bottom_gradient(image: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    w, h = image.size
    for i in range(240):
        alpha = int(150 * (i / 239))
        y = h - 240 + i
        draw.line((0, y, w, y), fill=(10, 8, 16, alpha))
    return Image.alpha_composite(image, overlay)


def add_scanlines(image: Image.Image, strength: int) -> Image.Image:
    if strength <= 0:
        return image
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    w, h = image.size
    for y in range(0, h, 4):
        draw.rectangle((0, y, w, y + 1), fill=(8, 10, 18, strength))
    return Image.alpha_composite(image, overlay)


def add_frame(image: Image.Image, color: tuple[int, int, int, int]) -> Image.Image:
    draw = ImageDraw.Draw(image)
    w, h = image.size
    draw.rectangle((16, 16, w - 17, h - 17), outline=color, width=4)
    draw.rectangle((28, 28, w - 29, h - 29), outline=(255, 255, 255, 48), width=1)
    return image


def add_icon_plate(image: Image.Image, icon_path: Path, bg: tuple[int, int, int, int], icon_crop=None) -> Image.Image:
    plate = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(plate)
    box = (42, 42, 122, 122)
    draw.rounded_rectangle(box, radius=6, fill=bg, outline=(255, 255, 255, 44), width=2)

    icon = load_rgba(icon_path)
    if icon_crop:
        icon = icon.crop(icon_crop)
    icon = ImageOps.contain(icon, (56, 56), Image.Resampling.LANCZOS)
    x = box[0] + ((box[2] - box[0]) - icon.width) // 2
    y = box[1] + ((box[3] - box[1]) - icon.height) // 2
    plate.alpha_composite(icon, (x, y))
    return Image.alpha_composite(image, plate)


def add_pips(image: Image.Image, count: int, color: tuple[int, int, int, int]) -> Image.Image:
    if count <= 0:
        return image
    draw = ImageDraw.Draw(image)
    start_x = 138
    y = 72
    for index in range(count):
        x = start_x + index * 24
        draw.rounded_rectangle((x, y, x + 16, y + 16), radius=4, fill=color, outline=(14, 12, 20, 200), width=2)
    return image


def add_ghost_orbits(image: Image.Image, strength: int) -> Image.Image:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    center = (image.width - 180, 120)
    for radius in (36, 58, 84):
        draw.arc(
            (center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius),
            start=20,
            end=300,
            fill=(255, 74, 108, strength),
            width=2,
        )
    return Image.alpha_composite(image, overlay)


def add_black_bar(image: Image.Image) -> Image.Image:
    overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    bar = (image.width - 270, image.height - 80, image.width - 48, image.height - 48)
    draw.rounded_rectangle(bar, radius=4, fill=(8, 10, 16, 220), outline=(110, 198, 255, 80), width=2)
    draw.rectangle((bar[0] + 16, bar[1] + 12, bar[0] + 164, bar[1] + 22), fill=(72, 84, 110, 180))
    draw.rectangle((bar[0] + 16, bar[1] + 32, bar[0] + 86, bar[1] + 42), fill=(42, 48, 62, 160))
    return Image.alpha_composite(image, overlay)


def build_variant(name: str, spec: dict) -> Path:
    image = load_rgba(BASES[spec["source"]])
    image = cover_crop(image, SIZE, spec["focus"])
    image = ImageEnhance.Brightness(image).enhance(spec.get("brightness", 1.0))
    image = ImageEnhance.Contrast(image).enhance(spec.get("contrast", 1.0))
    image = apply_tint(image, spec["tint"])
    image = add_bottom_gradient(image)
    image = add_scanlines(image, spec.get("scan", 0))

    if spec.get("ghost_orbits"):
        image = add_ghost_orbits(image, 90 if name == "memory" else 130)

    if spec.get("black_bar"):
        image = add_black_bar(image)

    icon_name = spec.get("icon")
    if icon_name:
        image = add_icon_plate(
            image,
            ASSETS / icon_name,
            spec["icon_bg"],
            icon_crop=spec.get("icon_crop"),
        )

    image = add_pips(image, spec.get("pips", 0), spec["frame"])
    image = add_frame(image, spec["frame"])

    output_path = ASSETS / spec["output"]
    image.save(output_path, optimize=True)
    return output_path


def main() -> None:
    outputs = [build_variant(name, spec) for name, spec in SPECS.items()]
    print(f"generated {len(outputs)} ending art variants")
    for path in outputs:
        print(path)


if __name__ == "__main__":
    main()
