#!/usr/bin/env python3
"""Generate PWA icons for Chinese2Viet.

Renders at 4x and downsamples with LANCZOS for crisp edges.
Outputs: public/icon-180.png, icon-192.png, icon-512.png, icon-maskable-512.png
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

SS = 4  # supersample factor
OUT = Path(__file__).resolve().parent.parent / "public"
CJK_FONT = "/System/Library/Fonts/Hiragino Sans GB.ttc"
CJK_INDEX = 2  # W6 (bold)
LATIN_FONT = "/System/Library/Fonts/HelveticaNeue.ttc"
LATIN_INDEX = 1  # Bold (Hiragino Sans GB has no Vietnamese Ệ — would render tofu)
GLYPH = "中"
CAPTION = "VIỆT"
TOP = (0x4F, 0x46, 0xE5)  # indigo-600
BOTTOM = (0xF4, 0x3F, 0x5E)  # rose-500


def gradient(w: int, h: int) -> Image.Image:
    col = Image.new("RGB", (1, h))
    px = col.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        px[0, y] = tuple(round(TOP[i] + (BOTTOM[i] - TOP[i]) * t) for i in range(3))
    return col.resize((w, h), Image.BILINEAR)


def text_mask(
    text: str,
    target_h: int,
    max_w: int,
    font_path: str = CJK_FONT,
    font_index: int = CJK_INDEX,
    tracking: float = 0.0,
) -> Image.Image:
    """Ink-tight white mask scaled so cap height == target_h."""
    font = ImageFont.truetype(font_path, target_h * 2, index=font_index)
    probe = Image.new("L", (target_h * len(text) * 4, target_h * 4), 0)
    draw = ImageDraw.Draw(probe)
    x = target_h
    for ch in text:
        draw.text((x, target_h), ch, font=font, fill=255)
        x += draw.textlength(ch, font=font) + target_h * tracking
    box = probe.getbbox()
    if box is None:
        raise SystemExit(f"font has no ink for {text!r}")
    ink = probe.crop(box)
    scale = target_h / ink.height
    w, h = max(1, round(ink.width * scale)), target_h
    if w > max_w:
        scale = max_w / ink.width
        w, h = max_w, max(1, round(ink.height * scale))
    return ink.resize((w, h), Image.LANCZOS)


def build(size: int, rounded: bool, with_caption: bool) -> Image.Image:
    s = size * SS
    canvas = gradient(s, s).convert("RGBA")

    if rounded:
        mask = Image.new("L", (s, s), 0)
        ImageDraw.Draw(mask).rounded_rectangle(
            (0, 0, s - 1, s - 1), radius=round(s * 0.22), fill=255
        )
        canvas.putalpha(mask)

    # Maskable icons must survive a circular crop: keep art inside the
    # central 80% safe circle, i.e. glyph side <= 0.8/sqrt(2) of the canvas.
    glyph_h = round(s * (0.46 if with_caption else 0.50))
    glyph = text_mask(GLYPH, glyph_h, round(s * 0.70))
    gx = (s - glyph.width) // 2
    gy = round(s * (0.42 if with_caption else 0.50) - glyph.height / 2)
    white = Image.new("RGBA", glyph.size, (255, 255, 255, 255))
    canvas.paste(white, (gx, gy), glyph)

    if with_caption:
        cap = text_mask(
            CAPTION,
            round(s * 0.115),
            round(s * 0.58),
            font_path=LATIN_FONT,
            font_index=LATIN_INDEX,
            tracking=0.18,
        )
        cx = (s - cap.width) // 2
        cy = round(s * 0.76 - cap.height / 2)
        canvas.paste(Image.new("RGBA", cap.size, (255, 255, 255, 255)), (cx, cy), cap)

    return canvas.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    jobs = [
        ("icon-180.png", 180, True, True),
        ("icon-192.png", 192, True, True),
        ("icon-512.png", 512, True, True),
        ("icon-maskable-512.png", 512, False, False),
    ]
    for name, size, rounded, caption in jobs:
        img = build(size, rounded, caption)
        img.save(OUT / name, "PNG", optimize=True)
        alpha = img.getchannel("A")
        print(
            f"{name}: {img.width}x{img.height} mode={img.mode} "
            f"corner_alpha={alpha.getpixel((0, 0))}"
        )


if __name__ == "__main__":
    main()
