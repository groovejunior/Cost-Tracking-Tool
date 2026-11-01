#!/usr/bin/env python3
"""Combine install-tutorial phone screenshots into contact sheets."""
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    import subprocess

    subprocess.check_call([sys.executable, "-m", "pip", "install", "pillow", "-q"])
    from PIL import Image, ImageDraw, ImageFont

ART = Path("/opt/cursor/artifacts/screenshots")
OUT = ART

SHOTS = [
    ("install-01-ios-safari-steps.png", "iPhone · Safari steps"),
    ("install-02-ios-open-safari.png", "iOS · open in Safari"),
    ("install-03-android-install-btn.png", "Android · Install button"),
    ("install-04-auth-reopen-link.png", "Sign-in · How to install link"),
]


def load(name):
    p = ART / name
    if not p.exists():
        raise SystemExit(f"missing {p}")
    return Image.open(p).convert("RGB")


def sheet(pairs, out_name, cols=2):
    imgs = [load(n) for n, _ in pairs]
    labels = [l for _, l in pairs]
    w = max(i.width for i in imgs)
    h = max(i.height for i in imgs)
    pad = 24
    label_h = 36
    rows = (len(imgs) + cols - 1) // cols
    cw = cols * w + (cols + 1) * pad
    ch = rows * (h + label_h) + (rows + 1) * pad
    canvas = Image.new("RGB", (cw, ch), "#111111")
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except OSError:
        font = ImageFont.load_default()
    for idx, (im, label) in enumerate(zip(imgs, labels)):
        r, c = divmod(idx, cols)
        x = pad + c * (w + pad)
        y = pad + r * (h + label_h + pad)
        draw.text((x, y), label, fill="#E8E8E8", font=font)
        ox = x + (w - im.width) // 2
        canvas.paste(im, (ox, y + label_h))
    out = OUT / out_name
    canvas.save(out, quality=92)
    print("Wrote", out)


def main():
    sheet(SHOTS[:2], "install-tutorial-contact-sheet-1.png", cols=2)
    sheet(SHOTS[2:], "install-tutorial-contact-sheet-2.png", cols=2)


if __name__ == "__main__":
    main()
