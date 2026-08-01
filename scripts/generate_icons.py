#!/usr/bin/env python3
"""Generate PNG app icons from assets/brand-mark.png (Cool Stone mark)."""

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
MARK_PATH = os.path.join(OUT_DIR, "brand-mark.png")
BG = "#14171C"


def draw_icon(size, mark, maskable=False):
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

    target_h = int(size * 0.58)
    target_w = max(1, int(target_h * mark.size[0] / mark.size[1]))
    mark2 = mark.resize((target_w, target_h), Image.Resampling.LANCZOS)
    img.paste(mark2, ((size - target_w) // 2, (size - target_h) // 2), mark2)
    return img


def main():
    mark = Image.open(MARK_PATH).convert("RGBA")
    for name, size, maskable in [
        ("icon-192.png", 192, False),
        ("icon-512.png", 512, False),
        ("icon-maskable.png", 512, True),
    ]:
        path = os.path.join(OUT_DIR, name)
        draw_icon(size, mark, maskable).save(path, "PNG")
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
