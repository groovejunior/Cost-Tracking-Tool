#!/usr/bin/env python3
"""Contact sheet for bugfix regression screenshots."""
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
    ("bugfix-01-install-ios-safari-steps.png", "Install tutorial · iOS Safari (390×844)"),
    ("bugfix-02-auth-signin-fresh-visitor.png", "Auth · Sign in after Continue in browser"),
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
    label_h = 40
    rows = (len(imgs) + cols - 1) // cols
    cw = cols * w + (cols + 1) * pad
    ch = rows * (h + label_h) + (rows + 1) * pad
    canvas = Image.new("RGB", (cw, ch), "#111111")
    draw = ImageDraw.Draw(canvas)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
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


if __name__ == "__main__":
    sheet(SHOTS, "bugfix-contact-sheet.png", cols=2)
