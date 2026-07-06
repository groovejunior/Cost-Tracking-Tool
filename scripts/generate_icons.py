#!/usr/bin/env python3
"""Generate PNG app icons for the Spend PWA."""

import os
import subprocess
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets")
os.makedirs(OUT_DIR, exist_ok=True)

BG = "#1B1A16"
FG = "#F6F5F2"
ACCENT = "#1D9E75"


def draw_icon(size, maskable=False):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    if maskable:
        pad = int(size * 0.1)
        draw.rounded_rectangle(
            (pad, pad, size - pad, size - pad),
            radius=int(size * 0.22),
            fill=BG,
        )
    else:
        draw.rounded_rectangle((0, 0, size, size), radius=int(size * 0.22), fill=BG)

    cx = cy = size // 2
    r = int(size * 0.28)
    draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=ACCENT)

    font_size = int(size * 0.34)
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Bold.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    text = "€"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    draw.text((cx - tw / 2, cy - th / 2 - size * 0.02), text, fill=FG, font=font)

    return img


def main():
    for name, size, maskable in [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("icon-maskable.png", 512, True),
    ]:
        path = os.path.join(OUT_DIR, name)
        draw_icon(size, maskable).save(path, "PNG")
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
