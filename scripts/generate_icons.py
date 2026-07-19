#!/usr/bin/env python3
"""Generate PNG app icons for the Spend PWA."""

import os
import subprocess
import sys

try:
    from PIL import Image, ImageDraw
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets")
os.makedirs(OUT_DIR, exist_ok=True)

BG = "#1B1A16"
FG = "#F6F5F2"
ACCENT = "#1D9E75"


def draw_euro(draw, cx, cy, radius, color, stroke):
    """Draw a geometric € symbol; tuned so its bbox centers on (cx, cy)."""
    r = radius
    curve = [cx - r * 0.48, cy - r, cx + r * 0.78, cy + r]
    draw.arc(curve, start=55, end=305, fill=color, width=stroke)

    bar_right = cx + r * 0.02
    bar_left = cx - r * 0.68
    bar_gap = r * 0.34
    for y in (cy - bar_gap, cy + bar_gap):
        draw.rounded_rectangle(
            [bar_left, y - stroke // 2, bar_right, y + stroke // 2],
            radius=stroke // 2,
            fill=color,
        )


def paste_bbox_centered(base, layer, cx, cy):
    bbox = layer.getbbox()
    if not bbox:
        return base
    bcx = (bbox[0] + bbox[2]) / 2
    bcy = (bbox[1] + bbox[3]) / 2
    shift = (int(round(cx - bcx)), int(round(cy - bcy)))
    placed = Image.new("RGBA", base.size, (0, 0, 0, 0))
    placed.paste(layer, shift, layer)
    return Image.alpha_composite(base, placed)


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
    circle_r = int(size * 0.28)
    draw.ellipse((cx - circle_r, cy - circle_r, cx + circle_r, cy + circle_r), fill=ACCENT)

    euro_r = circle_r * 0.62
    stroke = max(2, int(size * 0.042))
    symbol = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw_euro(ImageDraw.Draw(symbol), cx, cy, euro_r, FG, stroke)
    img = paste_bbox_centered(img, symbol, cx, cy)

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
