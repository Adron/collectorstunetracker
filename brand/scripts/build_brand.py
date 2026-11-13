#!/usr/bin/env python3
"""
Builds the CTT brand kit: vector logos, logo icons, app icons, sample files and palettes.

    python3 brand/scripts/build_brand.py

Needs Python 3.10+, fontTools (`pip install fonttools`) and rsvg-convert (`brew install librsvg`).
Fonts (all OFL / Apache, from github.com/google/fonts) are downloaded into brand/.cache/fonts on first run.

Every letter in every SVG is converted to outlines, so the files render the same everywhere without webfonts.
Layouts use a seeded random generator, so the output is the same on every run. Change a seed to re-cut a mark.

Outputs:
  apps/web/public/brand/…           the kit, served by the app at /brand/… (Help → Branding links to it)
  packages/ui/src/palette.ts        theme colors for the Branding page, generated from themes.css
"""
from __future__ import annotations

import io
import json
import math
import random
import re
import shutil
import struct
import subprocess
import urllib.parse
import urllib.request
import zipfile
from dataclasses import dataclass, field
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "apps/web/public/brand"
CACHE = ROOT / "brand/.cache/fonts"
THEMES_CSS = ROOT / "packages/ui/src/themes.css"
PALETTE_TS = ROOT / "packages/ui/src/palette.ts"
FONT_BASE = "https://raw.githubusercontent.com/google/fonts/main/"

# --------------------------------------------------------------------------- palette

CHARCOAL, INK, SMOKE, CREAM = "#1C191A", "#000000", "#2F2C2D", "#F6E7D8"
CLIPPING = "#FFFCF5"  # newsprint-white clipping used on light paper
ACCENTS = {  # name: (bright, deep). Bright goes on dark surfaces, deep on light ones (spec §3.4).
    "teal": ("#07A5C3", "#05667A"),
    "signal": ("#F14902", "#B23600"),
    "mustard": ("#F4B324", "#7A5500"),
}

# --------------------------------------------------------------------------- fonts

FONT_SRC = {
    "anton": ("ofl/anton/Anton-Regular.ttf", None),
    "elite": ("apache/specialelite/SpecialElite-Regular.ttf", None),
    "rubik": ("ofl/rubikmonoone/RubikMonoOne-Regular.ttf", None),
    "playfair": ("ofl/playfairdisplay/PlayfairDisplay[wght].ttf", {"wght": 900}),
    "courier": ("ofl/courierprime/CourierPrime-Bold.ttf", None),
    "script": ("apache/yellowtail/Yellowtail-Regular.ttf", None),
    "grotesk": ("ofl/spacegrotesk/SpaceGrotesk[wght].ttf", {"wght": 700}),
}
TILE_FONTS = ["anton", "elite", "rubik", "playfair", "courier"]  # same set as <RansomTitle>


def fmt(v: float) -> str:
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s in ("", "-0") else s


class Font:
    def __init__(self, tt: TTFont):
        self.gs = tt.getGlyphSet()
        self.cmap = tt.getBestCmap()
        self.upm = tt["head"].unitsPerEm
        self.hmtx = tt["hmtx"]

    def glyph(self, ch: str) -> str | None:
        return self.cmap.get(ord(ch)) or self.cmap.get(ord(ch.upper()))

    def advance(self, ch: str, size: float) -> float:
        g = self.glyph(ch)
        return self.hmtx[g][0] * size / self.upm if g else size * 0.3

    def glyph_d(self, ch: str, size: float, x: float, y: float) -> str:
        g = self.glyph(ch)
        if not g:
            return ""
        pen = SVGPathPen(self.gs, ntos=fmt)
        s = size / self.upm
        self.gs[g].draw(TransformPen(pen, (s, 0, 0, -s, x, y)))
        return pen.getCommands()

    def bounds(self, ch: str, size: float) -> tuple[float, float, float, float]:
        """Ink box in SVG coordinates (y down) for a glyph drawn with its baseline at 0."""
        bp = BoundsPen(self.gs)
        self.gs[self.glyph(ch)].draw(bp)
        x0, y0, x1, y1 = bp.bounds
        s = size / self.upm
        return x0 * s, -y1 * s, x1 * s, -y0 * s

    def width(self, text: str, size: float, tracking: float = 0) -> float:
        return sum(self.advance(c, size) for c in text) + tracking * (len(text) - 1)

    def text_d(self, text: str, size: float, x: float, y: float, tracking: float = 0) -> str:
        parts, cx = [], x
        for ch in text:
            parts.append(self.glyph_d(ch, size, cx, y))
            cx += self.advance(ch, size) + tracking
        return " ".join(p for p in parts if p)


def load_fonts() -> dict[str, Font]:
    CACHE.mkdir(parents=True, exist_ok=True)
    fonts = {}
    for key, (rel, axes) in FONT_SRC.items():
        path = CACHE / rel.split("/")[-1]
        if not path.exists():
            print(f"  downloading {rel}")
            urllib.request.urlretrieve(FONT_BASE + urllib.parse.quote(rel), path)
        tt = TTFont(path)
        if axes:
            tt = instancer.instantiateVariableFont(tt, axes)
        fonts[key] = Font(tt)
    return fonts


F: dict[str, Font] = {}

# --------------------------------------------------------------------------- marks as composable pieces


@dataclass
class Mark:
    body: str
    box: tuple[float, float, float, float]  # x0, y0, x1, y1
    defs: str = ""

    @property
    def w(self) -> float:
        return self.box[2] - self.box[0]

    @property
    def h(self) -> float:
        return self.box[3] - self.box[1]

    def place(self, x: float, y: float, w: float | None = None, h: float | None = None, rotate: float = 0) -> str:
        """Group that draws this mark with its box's top-left at (x, y), scaled to width w (or height h)."""
        s = w / self.w if w else (h / self.h if h else 1)
        rot = f" rotate({fmt(rotate)} {fmt(self.w * s / 2)} {fmt(self.h * s / 2)})" if rotate else ""
        return (f'<g transform="translate({fmt(x)} {fmt(y)}){rot} scale({fmt(s) if s < 1 else f"{s:.4f}"})'
                f' translate({fmt(-self.box[0])} {fmt(-self.box[1])})">{self.body}</g>')


def svg_doc(w: float, h: float, body: str, defs: str = "", title: str = "") -> str:
    t = f"<title>{title}</title>" if title else ""
    d = f"<defs>{defs}</defs>" if defs else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {fmt(w)} {fmt(h)}" width="{fmt(w)}" height="{fmt(h)}">'
            f"{t}{d}{body}</svg>\n")


def mark_doc(m: Mark, pad: float, title: str, bg: str | None = None) -> str:
    w, h = m.w + pad * 2, m.h + pad * 2
    back = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ""
    return svg_doc(w, h, back + m.place(pad, pad), m.defs, title)


# --------------------------------------------------------------------------- color schemes


@dataclass
class Scheme:
    look: str  # "dark" or "light"
    accent: str  # name
    tiles: list[tuple[str, str, str | None]] = field(default_factory=list)  # (fill, ink, stroke) per tile style
    shadow: str = INK
    shadow_op: float = 0.5
    paper: str = CHARCOAL  # background this mark is designed for
    text: str = CREAM
    tape: str = CREAM
    tape_op: float = 0.3
    label: str = CREAM  # Dymo-ish label strip
    label_ink: str = CHARCOAL

    @property
    def a(self) -> str:  # accent that reads on this paper
        return ACCENTS[self.accent][0 if self.look == "dark" else 1]

    @property
    def bright(self) -> str:
        return ACCENTS[self.accent][0]


def scheme(look: str, accent: str) -> Scheme:
    bright, deep = ACCENTS[accent]
    if look == "dark":
        return Scheme("dark", accent, tiles=[(CREAM, CHARCOAL, None), (bright, CHARCOAL, None), (CHARCOAL, CREAM, CREAM)])
    return Scheme("light", accent, tiles=[(CHARCOAL, CREAM, None), (CLIPPING, CHARCOAL, CHARCOAL), (deep, CREAM, None)],
                  shadow=CHARCOAL, shadow_op=0.3, paper=CREAM, text=CHARCOAL, tape="#FFFFFF", tape_op=0.6,
                  label=CHARCOAL, label_ink=CREAM)


# --------------------------------------------------------------------------- zine primitives


def torn_poly(w: float, h: float, rng: random.Random, amp: float) -> str:
    """A paper tile with hand-torn edges, centered on the origin. One edge is torn rougher than the rest."""
    x0, y0, x1, y1 = -w / 2, -h / 2, w / 2, h / 2
    rough = rng.randrange(4)
    pts: list[tuple[float, float]] = []
    for i, (ax, ay, bx, by, nx, ny) in enumerate([(x0, y0, x1, y0, 0, -1), (x1, y0, x1, y1, 1, 0),
                                                    (x1, y1, x0, y1, 0, 1), (x0, y1, x0, y0, -1, 0)]):
        a = amp * (2.6 if i == rough else 1)
        n = max(2, int(math.hypot(bx - ax, by - ay) / max(amp * 3.2, 1)))
        for k in range(n):
            t, o = k / n, rng.uniform(-a, a * 0.6)
            pts.append((ax + (bx - ax) * t + nx * o, ay + (by - ay) * t + ny * o))
    return "M" + " L".join(f"{fmt(x)} {fmt(y)}" for x, y in pts) + "Z"


def wobbly_circle(r: float, rng: random.Random, amp: float, n: int = 40) -> str:
    pts = []
    for k in range(n):
        t = 2 * math.pi * k / n
        rr = r + rng.uniform(-amp, amp)
        pts.append((rr * math.cos(t), rr * math.sin(t)))
    return "M" + " L".join(f"{fmt(x)} {fmt(y)}" for x, y in pts) + "Z"


def drip(x: float, y: float, w: float, length: float, color: str) -> str:
    return (f'<rect x="{fmt(x - w / 2)}" y="{fmt(y - w)}" width="{fmt(w)}" height="{fmt(length + w)}" rx="{fmt(w / 2)}" fill="{color}"/>'
            f'<circle cx="{fmt(x)}" cy="{fmt(y + length)}" r="{fmt(w * 0.62)}" fill="{color}"/>')


def speckle(w: float, h: float, n: int, color: str, op: float, rng: random.Random) -> str:
    """Photocopy toner speckle. Vector dots keep the PNGs small (a noise filter would not compress)."""
    dots = "".join(f'<circle cx="{fmt(rng.uniform(0, w))}" cy="{fmt(rng.uniform(0, h))}" r="{fmt(rng.uniform(0.4, 1.6))}"/>'
                   for _ in range(n))
    return f'<g fill="{color}" fill-opacity="{op}">{dots}</g>'


def tape(cx: float, cy: float, w: float, h: float, rot: float, color: str, op: float, rng: random.Random) -> str:
    d = torn_poly(w, h, rng, h * 0.06)
    return f'<path d="{d}" transform="translate({fmt(cx)} {fmt(cy)}) rotate({fmt(rot)})" fill="{color}" fill-opacity="{op}"/>'


def vinyl(r: float, disc: str, label: str, hole: str, grooves: str = INK, xx_ink: str | None = None) -> str:
    """A record centered on the origin. With xx_ink, the label wears the XX eyes."""
    rings = "".join(f'<circle r="{fmt(r * f)}" fill="none" stroke="{grooves}" stroke-opacity=".28" stroke-width="{fmt(r * 0.022)}"/>'
                    for f in (0.9, 0.8, 0.71, 0.62, 0.53))
    shine = (f'<path d="M{fmt(-r * 0.62)} {fmt(-r * 0.52)} A{fmt(r * 0.81)} {fmt(r * 0.81)} 0 0 1 {fmt(r * 0.1)} {fmt(-r * 0.8)}"'
             f' fill="none" stroke="#FFF" stroke-opacity=".3" stroke-width="{fmt(r * 0.05)}" stroke-linecap="round"/>')
    eyes = ""
    if xx_ink:
        s, sw = r * 0.07, r * 0.045
        for ex in (-r * 0.13, r * 0.13):
            ey = -r * 0.12
            eyes += (f'<path d="M{fmt(ex - s)} {fmt(ey - s)}L{fmt(ex + s)} {fmt(ey + s)}M{fmt(ex + s)} {fmt(ey - s)}L{fmt(ex - s)} {fmt(ey + s)}"'
                     f' stroke="{xx_ink}" stroke-width="{fmt(sw)}" stroke-linecap="round"/>')
        eyes += (f'<path d="M{fmt(-r * 0.15)} {fmt(r * 0.13)}Q0 {fmt(r * 0.25)} {fmt(r * 0.15)} {fmt(r * 0.13)}" fill="none"'
                 f' stroke="{xx_ink}" stroke-width="{fmt(sw * 0.8)}" stroke-linecap="round"/>')
    return (f'<circle r="{fmt(r)}" fill="{disc}"/>{rings}{shine}<circle r="{fmt(r * 0.34)}" fill="{label}"/>{eyes}'
            f'<circle r="{fmt(r * 0.045)}" fill="{hole}"/>')


# --------------------------------------------------------------------------- ransom-note lettering


@dataclass
class Tile:
    ch: str
    font: str
    size: float
    ink_box: tuple[float, float, float, float]
    tw: float
    th: float
    poly: str
    rot: float
    dy: float
    style: int
    x: float = 0
    vinyl: bool = False


def ransom(text: str, H: float, seed: str, vinyl_at: int | None = None, styles: list[int] | None = None) -> tuple[list[Tile], float]:
    """Cut one tile per letter. Geometry depends only on text + seed, so dark and light versions match exactly."""
    rng = random.Random(seed)
    tiles: list[Tile] = []
    x = 0.0
    for i, ch in enumerate(text):
        if ch == " ":
            x += H * 0.3
            continue
        fk = rng.choice(TILE_FONTS)
        f = F[fk]
        small = ch in "'.,"
        target = H * (0.34 if small else rng.uniform(0.66, 0.8))
        b0 = f.bounds(ch, 100)
        size = 100 * target / max(b0[3] - b0[1], 1)
        b = f.bounds(ch, size)
        iw, ih = b[2] - b[0], b[3] - b[1]
        px, py = H * rng.uniform(0.09, 0.15), H * rng.uniform(0.08, 0.13)
        tw = max(iw + 2 * px, H * (0.32 if small else 0.52))
        th = ih + 2 * py
        style = styles[i] if styles else rng.choices([0, 1, 2], [0.62, 0.2, 0.18])[0]
        dy = -H * 0.32 if ch == "'" else (H * 0.3 if ch in ".," else rng.uniform(-H * 0.05, H * 0.05))
        t = Tile(ch, fk, size, b, tw, th, torn_poly(tw, th, rng, H * 0.016), rng.uniform(-5.5, 5.5), dy, style,
                 vinyl=(i == vinyl_at))
        if t.vinyl:
            t.tw = t.th = H * 0.98
            t.poly = torn_poly(t.tw, t.th, rng, H * 0.016)
            t.style = 0
        t.x = x + t.tw / 2
        tiles.append(t)
        x += t.tw + H * rng.uniform(-0.02, 0.07)
    width = x
    for t in tiles:
        t.x -= width / 2
    return tiles, width


def render_tiles(tiles: list[Tile], cx: float, cy: float, sc: Scheme) -> str:
    out = []
    for t in tiles:
        fill, ink, stroke = sc.tiles[t.style]
        sw = f' stroke="{stroke}" stroke-width="{fmt(max(t.th * 0.025, 1.2))}" stroke-linejoin="round"' if stroke else ""
        off = max(t.th * 0.04, 1.5)
        g = [f'<g transform="translate({fmt(cx + t.x)} {fmt(cy + t.dy)}) rotate({fmt(t.rot)})">',
             f'<path d="{t.poly}" transform="translate({fmt(off)} {fmt(off * 1.4)})" fill="{sc.shadow}" fill-opacity="{sc.shadow_op}"/>',
             f'<path d="{t.poly}" fill="{fill}"{sw}/>']
        if t.vinyl:
            disc = CHARCOAL
            g.append(vinyl(t.tw * 0.42, disc, sc.bright, fill, grooves=CREAM))
        else:
            b = t.ink_box
            g.append(f'<path d="{F[t.font].glyph_d(t.ch, t.size, -(b[0] + b[2]) / 2, -(b[1] + b[3]) / 2)}" fill="{ink}"/>')
        g.append("</g>")
        out.append("".join(g))
    return "".join(out)


def tiles_box(tiles: list[Tile], cx: float, cy: float) -> tuple[float, float, float, float]:
    xs0, ys0, xs1, ys1 = [], [], [], []
    for t in tiles:
        r = math.hypot(t.tw, t.th) / 2
        rx = t.tw / 2 + (r - t.tw / 2) * abs(math.sin(math.radians(t.rot))) * 2
        ry = t.th / 2 + (r - t.th / 2) * abs(math.sin(math.radians(t.rot))) * 2
        xs0.append(cx + t.x - rx); xs1.append(cx + t.x + rx + t.th * 0.06)
        ys0.append(cy + t.dy - ry); ys1.append(cy + t.dy + ry + t.th * 0.06)
    return min(xs0), min(ys0), max(xs1), max(ys1)


def union(*boxes):
    return min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes)


# --------------------------------------------------------------------------- the marks


def xx_face(color: str, seed: str = "xx", r: float = 40) -> Mark:
    """The grinning-dead XX face, spray-painted: wobbly ring, X eyes, stitched grin, drips and overspray."""
    rng = random.Random(seed)
    sw = r * 0.2
    body = [f'<path d="{wobbly_circle(r, rng, r * 0.025)}" fill="none" stroke="{color}" stroke-width="{fmt(sw)}" stroke-linejoin="round"/>']
    s = r * 0.19
    for ex in (-r * 0.37, r * 0.37):
        ey = -r * 0.17 + rng.uniform(-1, 1) * r * 0.02
        body.append(f'<path d="M{fmt(ex - s)} {fmt(ey - s)}L{fmt(ex + s)} {fmt(ey + s)}M{fmt(ex + s)} {fmt(ey - s)}L{fmt(ex - s)} {fmt(ey + s)}"'
                    f' stroke="{color}" stroke-width="{fmt(sw * 0.82)}" stroke-linecap="round"/>')
    body.append(f'<path d="M{fmt(-r * 0.52)} {fmt(r * 0.24)}Q{fmt(-r * 0.05)} {fmt(r * 0.66)} {fmt(r * 0.5)} {fmt(r * 0.2)}" fill="none"'
                f' stroke="{color}" stroke-width="{fmt(sw * 0.75)}" stroke-linecap="round"/>')
    for t in (0.2, 0.42, 0.64, 0.84):  # stitches across the grin
        x = -r * 0.52 + t * r * 1.02
        y = r * 0.24 + math.sin(t * math.pi) * r * 0.22
        body.append(f'<path d="M{fmt(x)} {fmt(y - r * 0.1)}L{fmt(x + r * 0.02)} {fmt(y + r * 0.1)}" stroke="{color}"'
                    f' stroke-width="{fmt(sw * 0.4)}" stroke-linecap="round"/>')
    depth = 0
    for x, ln in ((-r * 0.5, rng.uniform(0.35, 0.5)), (r * 0.08, rng.uniform(0.75, 0.95)), (r * 0.55, rng.uniform(0.25, 0.4))):
        y = math.sqrt(r * r - x * x)
        body.append(drip(x, y, sw * 0.62, r * ln, color))
        depth = max(depth, y + r * ln + sw * 0.4)
    spray = "".join(f'<circle cx="{fmt(math.cos(a) * d)}" cy="{fmt(math.sin(a) * d)}" r="{fmt(rng.uniform(0.25, 1) * sw * 0.22)}"'
                    f' fill-opacity="{fmt(rng.uniform(0.35, 0.85))}"/>'
                    for a, d in ((rng.uniform(0, 2 * math.pi), r * rng.uniform(1.18, 1.42)) for _ in range(36)))
    body.append(f'<g fill="{color}">{spray}</g>')
    e = r * 1.45
    return Mark("".join(body), (-e, -e, e, max(e, depth)))


def label_strip(text: str, sc: Scheme, size: float, rng: random.Random) -> Mark:
    """A Dymo-style label: embossed typewriter caps on a strip with cut ends."""
    f = F["elite"]
    w = f.width(text, size, size * 0.12) + size * 1.2
    h = size * 1.45
    notch = h * 0.18
    d = (f"M0 0H{fmt(w)}L{fmt(w - notch)} {fmt(h / 2)}L{fmt(w)} {fmt(h)}H0L{fmt(notch)} {fmt(h / 2)}Z")
    txt = f.text_d(text, size, size * 0.6, h / 2 + size * 0.36, size * 0.12)
    rot = rng.uniform(-5, -2)
    body = (f'<g transform="rotate({fmt(rot)} {fmt(w / 2)} {fmt(h / 2)})"><path d="{d}" fill="{sc.label}"/>'
            f'<path d="{txt}" fill="{sc.label_ink}"/></g>')
    return Mark(body, (-4, -10, w + 4, h + 10))


def wordmark(sc: Scheme) -> Mark:
    """The loud one: ransom-note COLLECTORS' / TUNE TRACKER, a vinyl O, a Dymo EST. 2024 and the XX face."""
    rng = random.Random("wordmark-extras")
    big, bw = ransom("COLLECTORS'", 92, "collectors-v2", vinyl_at=1)
    top, tw = ransom("TUNE TRACKER", 44, "tune-tracker-v2")
    by = 0.0
    ty = -92 * 0.5 - 44 * 0.5 - 12
    tx = -bw / 2 + tw / 2 + bw * 0.05
    hl_w, hl_h = tw + 26, 44 * 0.72
    hl = (f'<path d="{torn_poly(hl_w, hl_h, rng, 2.2)}" transform="translate({fmt(tx + 6)} {fmt(ty + 7)}) rotate(-1.6) skewX(-12)"'
          f' fill="{sc.bright}" fill-opacity=".92"/>')
    face = xx_face(sc.a, "wordmark-face", 36)
    fx, fy = bw / 2 - 46, 92 / 2 + 52
    est = label_strip("EST. 2024", sc, 23, rng)
    ex, ey = fx - face.w / 2 - est.w - 2, fy - est.h / 2 + 2
    body = (hl + render_tiles(top, tx, ty, sc) + render_tiles(big, 0, by, sc)
            + est.place(ex, ey) + f'<g transform="translate({fmt(fx)} {fmt(fy)})">{face.body}</g>')
    box = union(tiles_box(big, 0, by), tiles_box(top, tx, ty),
                (fx + face.box[0], fy + face.box[1], fx + face.box[2], fy + face.box[3]), (ex, ey, ex + est.w, ey + est.h))
    return Mark(body, box)


def badge(sc: Scheme) -> Mark:
    """The logo icon: a record sliding out of a hand-cut sleeve, XX eyes on the label, ransom CTT on the front."""
    rng = random.Random("badge")
    dark = sc.look == "dark"
    disc = sc.bright if dark else CHARCOAL
    label = CREAM if dark else sc.bright
    sleeve_fill = CHARCOAL if dark else CLIPPING
    sleeve_ink = CREAM if dark else CHARCOAL
    rec = f'<g transform="translate(150 78) rotate(-14)">{vinyl(68, disc, label, sleeve_fill, INK, CHARCOAL)}</g>'
    x0, y0, x1, y1 = 44, 80, 212, 242
    sleeve = (f'<rect x="{x0 + 4}" y="{y0 + 6}" width="{x1 - x0}" height="{y1 - y0}" rx="5" fill="{sc.shadow}" fill-opacity="{sc.shadow_op}"/>'
              f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" rx="5" fill="{sleeve_fill}" stroke="{sleeve_ink}" stroke-width="5"/>')
    ctt, _ = ransom("CTT", 54, "badge-ctt", styles=[0, 1, 0])
    tiles = render_tiles(ctt, 128, 142, sc)
    f = F["grotesk"]
    tt = "TUNE TRACKER"
    size, tr = 10.5, 3.3
    tx = 128 - f.width(tt, size, tr) / 2
    words = f'<path d="{f.text_d(tt, size, tx, 198, tr)}" fill="{sleeve_ink}"/>'
    rule = f'<rect x="58" y="210" width="140" height="3.5" fill="{sc.a}"/>'
    drips = drip(150, 212, 3.4, 13, sc.a) + drip(171, 212, 3, 7, sc.a)
    tp = tape(56, 86, 62, 18, -36, sc.tape, sc.tape_op + 0.1, rng)
    body = f'{rec}<g transform="rotate(-3 128 160)">{sleeve}{tiles}{words}{rule}{drips}</g>{tp}'
    return Mark(body, (0, 0, 256, 256))


def favicon_glyph(sc: Scheme) -> Mark:
    """The badge boiled down for 16–48px: sleeve, record, one hot rule. No lettering."""
    dark = sc.look == "dark"
    disc = sc.bright if dark else CHARCOAL
    label = CREAM if dark else sc.bright
    sleeve = CHARCOAL if dark else CLIPPING
    ink = CREAM if dark else CHARCOAL
    body = (f'<g transform="translate(19 11)"><circle r="10" fill="{disc}"/><circle r="6.6" fill="none" stroke="{INK}" stroke-opacity=".3" stroke-width=".9"/>'
            f'<circle r="3.3" fill="{label}"/></g>'
            f'<g transform="rotate(-4 16 20)"><rect x="4.5" y="12" width="21" height="18" rx="1.6" fill="{sleeve}" stroke="{ink}" stroke-width="2.2"/>'
            f'<rect x="8" y="24.2" width="14" height="2.2" fill="{sc.a}"/></g>')
    return Mark(body, (0, 0, 32, 32))


def lockup(sc: Scheme) -> Mark:
    """Badge + script name, for headers and email."""
    b = badge(sc)
    s = F["script"]
    g = F["grotesk"]
    name = "Collectors'"
    nx, ny, nsz = 176, 104, 80
    tt, tsz, ttr = "TUNE TRACKER", 21, 7.2
    tx, tyy = nx + 10, 150
    nw = s.width(name, nsz)
    tw_ = g.width(tt, tsz, ttr)
    body = (b.place(0, 8, h=160) + f'<path d="{s.text_d(name, nsz, nx, ny)}" fill="{sc.text}" transform="rotate(-4 {nx} {ny})"/>'
            + f'<rect x="{fmt(tx)}" y="{tyy - 34}" width="{fmt(tw_)}" height="3.5" fill="{sc.a}"/>'
            + f'<path d="{g.text_d(tt, tsz, tx, tyy, ttr)}" fill="{sc.text}"/>')
    return Mark(body, (0, 0, max(nx + nw + 14, tx + tw_) + 6, 176))


def stamp(color: str, uid: str, seed: str = "stamp") -> Mark:
    """The utilitarian one: a rubber-stamped CTT block with the vertical name tab. Distressed with a speckle mask."""
    rng = random.Random(seed)
    a, g = F["anton"], F["grotesk"]
    W, H = 360, 200
    ctt_size = 168
    cw = a.width("CTT", ctt_size, -4)
    b = a.bounds("C", ctt_size)
    cap = b[3] - b[1]
    cx = 82 + (300 - 82 - cw) / 2 + 8
    cy = H / 2 + cap / 2
    name = "COLLECTORS' TUNE TRACKER"
    nsz = 10 * 126 / g.width(name, 10, 1.2)  # fit the name to the tab
    ntr = nsz * 0.12
    nw = g.width(name, nsz, ntr)
    holes = "".join(f'<circle cx="{fmt(rng.uniform(0, W))}" cy="{fmt(rng.uniform(0, H))}" r="{fmt(rng.uniform(0.4, 2.3))}"/>'
                    for _ in range(320))
    scratches = "".join(f'<path d="M{fmt(x)} {fmt(y)}l{fmt(rng.uniform(8, 40))} {fmt(rng.uniform(-3, 3))}" stroke="#000" stroke-width="{fmt(rng.uniform(0.6, 1.4))}"/>'
                        for x, y in ((rng.uniform(0, W), rng.uniform(0, H)) for _ in range(14)))
    knock = (f'<path d="{g.text_d(name, nsz, -nw / 2, nsz * 0.36, ntr)}" fill="#000" '
             f'transform="translate(46 {H / 2}) rotate(-90)"/>')
    defs = (f'<mask id="{uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}">'
            f'<rect width="{W}" height="{H}" fill="#fff"/>{knock}<g fill="#000">{holes}</g>{scratches}</mask>')
    body = (f'<g transform="rotate(-4 {W / 2} {H / 2})" fill="{color}"><g mask="url(#{uid})">'
            f'<rect x="12" y="12" width="{W - 24}" height="{H - 24}" rx="5" fill="none" stroke="{color}" stroke-width="8"/>'
            f'<rect x="23" y="23" width="{W - 46}" height="{H - 46}" rx="2" fill="none" stroke="{color}" stroke-width="2.4"/>'
            f'<rect x="34" y="32" width="24" height="{H - 64}"/>'
            f'<path d="{a.text_d("CTT", ctt_size, cx, cy, -4)}"/></g></g>')
    return Mark(body, (0, -10, W, H + 10), defs)


# --------------------------------------------------------------------------- sample files


def drips_edge(w: float, color: str, rng: random.Random, y: float = 0, h: float = 14) -> str:
    out = [f'<rect x="0" y="{fmt(y)}" width="{fmt(w)}" height="{fmt(h)}" fill="{color}"/>']
    x = rng.uniform(10, 40)
    while x < w - 10:
        out.append(drip(x, y + h, rng.uniform(5, 11), rng.uniform(6, 46), color))
        x += rng.uniform(40, 120)
    return "".join(out)


def og_card(look: str, accent: str = "signal") -> str:
    sc = scheme(look, accent)
    rng = random.Random(f"og-{look}")
    W, H = 1200, 630
    wm = wordmark(sc)
    g = F["grotesk"]
    url = "COLLECTORSTUNETRACKER.COM"
    body = [f'<rect width="{W}" height="{H}" fill="{sc.paper}"/>', speckle(W, H, 900, sc.text, 0.09, rng),
            drips_edge(W, sc.a, rng, 0, 16), wm.place(110, 120, w=760, rotate=-2)]
    tag = label_strip("EVERY PRESSING. EVERY SCUFF. EVERY STORY.", sc, 22, rng)
    body.append(tag.place(120, 470))
    body.append(f'<path d="{g.text_d(url, 16, 124, 580, 5.2)}" fill="{sc.text}" fill-opacity=".75"/>')
    st = stamp(sc.a, f"og-stamp-{look}")
    body.append(st.place(880, 410, w=250, rotate=8))
    body.append(tape(1080, 64, 150, 34, 32, sc.tape, sc.tape_op, rng))
    return svg_doc(W, H, "".join(body), st.defs, "Collectors' Tune Tracker social card")


def email_header(look: str, accent: str = "teal") -> str:
    sc = scheme(look, accent)
    rng = random.Random(f"email-{look}")
    W, H = 1200, 300
    lk = lockup(sc)
    g = F["grotesk"]
    eyebrow = "NEWS FROM THE BACK ROOM"
    ew = g.width(eyebrow, 15, 4.6)
    body = [f'<rect width="{W}" height="{H}" fill="{sc.paper}"/>', speckle(W, H, 380, sc.text, 0.08, rng),
            lk.place(60, 52, h=180), f'<path d="{g.text_d(eyebrow, 15, W - 70 - ew, 150, 4.6)}" fill="{sc.text}" fill-opacity=".72"/>',
            f'<rect y="{H - 12}" width="{W}" height="12" fill="{sc.a}"/>']
    face = xx_face(sc.a, "email-face", 26)
    body.append(f'<g transform="translate({fmt(W - 70 - ew - 62)} 138)">{face.body}</g>')
    return svg_doc(W, H, "".join(body), "", "Collectors' Tune Tracker email header")


def avatar(look: str, accent: str = "teal") -> str:
    sc = scheme(look, accent)
    rng = random.Random(f"avatar-{look}")
    b = badge(sc)
    return svg_doc(800, 800, f'<rect width="800" height="800" fill="{sc.paper}"/>' + speckle(800, 800, 500, sc.text, 0.08, rng)
                   + b.place(130, 120, w=540), "", "Collectors' Tune Tracker avatar")


def sticker(content: str, shape: str, w: float, h: float, rot: float, x: float, y: float, fill: str) -> str:
    """Die-cut sticker: white kiss-cut border, a soft shadow, the art inside."""
    cx, cy = x + w / 2, y + h / 2
    if shape == "circle":
        r = w / 2
        outline = f'<circle cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r + 9)}"'
        inner = f'<circle cx="{fmt(cx)}" cy="{fmt(cy)}" r="{fmt(r)}" fill="{fill}"/>'
    else:
        outline = f'<rect x="{fmt(x - 9)}" y="{fmt(y - 9)}" width="{fmt(w + 18)}" height="{fmt(h + 18)}" rx="18"'
        inner = f'<rect x="{fmt(x)}" y="{fmt(y)}" width="{fmt(w)}" height="{fmt(h)}" rx="10" fill="{fill}"/>'
    shadow = outline.replace(f'cx="{fmt(cx)}"', f'cx="{fmt(cx + 5)}"').replace(f'cy="{fmt(cy)}"', f'cy="{fmt(cy + 7)}"') \
        .replace(f'x="{fmt(x - 9)}"', f'x="{fmt(x - 4)}"').replace(f'y="{fmt(y - 9)}"', f'y="{fmt(y - 2)}"')
    return (f'<g transform="rotate({fmt(rot)} {fmt(cx)} {fmt(cy)})">{shadow} fill="#000" fill-opacity=".18"/>'
            f'{outline} fill="#FFFFFF"/>{inner}{content}</g>')


def sticker_sheet() -> str:
    W, H = 1400, 1000
    rng = random.Random("stickers")
    dark_t, dark_s, light_m = scheme("dark", "teal"), scheme("dark", "signal"), scheme("light", "mustard")
    out = [f'<rect width="{W}" height="{H}" fill="#E9E4DC"/>', speckle(W, H, 500, CHARCOAL, 0.06, rng)]
    defs = []
    # 1. Wordmark slab
    wm = wordmark(dark_s)
    out.append(sticker(wm.place(90, 60 + (330 - wm.h * 560 / wm.w) / 2, w=560), "rect", 600, 330, -3, 70, 60, CHARCOAL))
    # 2. XX face rounds in each accent
    for i, (acc, cx) in enumerate((("signal", 820), ("teal", 1010), ("mustard", 1200))):
        f = xx_face(ACCENTS[acc][0], f"sticker-face-{i}", 40)
        out.append(sticker(f.place(cx - 62, 118, w=124), "circle", 170, 170, rng.uniform(-10, 10), cx - 85, 100, CHARCOAL))
    # 3. Badge icon, dark and light
    out.append(sticker(badge(dark_t).place(735, 360, w=250), "rect", 270, 270, 5, 725, 350, CHARCOAL))
    out.append(sticker(badge(scheme("light", "signal")).place(1055, 360, w=250), "rect", 270, 270, -4, 1045, 350, CREAM))
    # 4. Stamp on cream
    st = stamp(ACCENTS["signal"][1], "sheet-stamp")
    defs.append(st.defs)
    out.append(sticker(st.place(95, 460, w=400), "rect", 440, 250, 4, 75, 440, CREAM))
    # 5. DIG DEEPER on mustard
    dig, dw = ransom("DIG DEEPER.", 56, "dig-deeper")
    out.append(sticker(render_tiles(dig, 60 + (dw + 70) / 2, 830, light_m), "rect", dw + 70, 160, -2, 60, 750, ACCENTS["mustard"][0]))
    # 6. Lockup strip and EST label
    lk = lockup(scheme("dark", "mustard"))
    out.append(sticker(lk.place(700, 745, h=150), "rect", 590, 175, 2, 680, 730, CHARCOAL))
    est = label_strip("EST. 2024", dark_t, 30, rng)
    out.append(est.place(520, 650, rotate=-8))
    return svg_doc(W, H, "".join(out), "".join(defs), "Collectors' Tune Tracker sticker sheet")


def gig_flyer() -> str:
    """Letter-size flyer (8.5×11 at 150dpi) in the Gig Flyer colorway, tear-off tabs and all."""
    W, H = 1275, 1650
    rng = random.Random("flyer")
    sc = scheme("light", "signal")
    sc.tiles = [(CHARCOAL, ACCENTS["mustard"][0], None), (CREAM, CHARCOAL, CHARCOAL), (CHARCOAL, CREAM, None)]
    out = [f'<rect width="{W}" height="{H}" fill="{ACCENTS["mustard"][0]}"/>', speckle(W, H, 1600, CHARCOAL, 0.1, rng)]
    for i, (word, hh, y) in enumerate((("CATALOG", 150, 230), ("YOUR", 120, 410), ("CRATE.", 170, 600))):
        tl, _ = ransom(word, hh, f"flyer-{word}")
        out.append(render_tiles(tl, W / 2 + (-30, 60, -10)[i], y, sc))
    face = xx_face(CHARCOAL, "flyer-face", 120)
    out.append(f'<g transform="translate(400 930)">{face.body}</g>')
    st = stamp(ACCENTS["signal"][1], "flyer-stamp")
    out.append(st.place(690, 820, w=460, rotate=6))
    g, e = F["grotesk"], F["elite"]
    lines = ["records · CDs · tapes · minidiscs · merch", "grade it. photograph it. lend it. find it."]
    for i, ln in enumerate(lines):
        lw = e.width(ln, 34, 1)
        out.append(f'<path d="{e.text_d(ln, 34, (W - lw) / 2, 1220 + i * 52, 1)}" fill="{CHARCOAL}"/>')
    # tear-off tabs
    n, ty = 9, 1340
    tw_ = W / n
    out.append(f'<rect x="0" y="{ty}" width="{W}" height="{H - ty}" fill="{CREAM}"/>')
    out.append(f'<path d="M0 {ty}H{W}" stroke="{CHARCOAL}" stroke-width="4"/>')
    url = "collectorstunetracker.com"
    uw = g.width(url, 22, 0.5)
    for i in range(n):
        x = i * tw_
        if i:
            out.append(f'<path d="M{fmt(x)} {ty}V{H}" stroke="{CHARCOAL}" stroke-width="2.5" stroke-dasharray="10 8"/>')
        out.append(f'<path d="{g.text_d(url, 22, -uw / 2, 8, 0.5)}" fill="{CHARCOAL}" transform="translate({fmt(x + tw_ / 2)} {ty + (H - ty) / 2}) rotate(-90)"/>')
    out.append(tape(110, 60, 220, 52, -24, "#FFFFFF", 0.55, rng) + tape(W - 110, 60, 220, 52, 24, "#FFFFFF", 0.55, rng))
    return svg_doc(W, H, "".join(out), st.defs, "Collectors' Tune Tracker gig flyer")


# --------------------------------------------------------------------------- palette files


def parse_themes() -> list[dict]:
    css = THEMES_CSS.read_text()
    prims = dict(re.findall(r"--(ctt-[\w-]+):\s*(#[0-9A-Fa-f]{6})", css.split("[data-theme")[0]))
    themes = []
    for m in re.finditer(r"/\*\s*(D\d|L\d)\s*—\s*([A-Z ]+?)\.(.*?)\*/\s*\[data-theme=\"([\w-]+)\"\]\s*\{([^}]*)\}", css, re.S):
        code, name, _, tid, block = m.groups()
        tokens = dict(re.findall(r"--([\w-]+):\s*(#[0-9A-Fa-f]{6})\s*;", block))
        themes.append({"id": tid, "code": code, "name": name.title(), "look": "dark" if code[0] == "D" else "light",
                       "tokens": {k: v.upper() for k, v in tokens.items()}})
    return [{"primitives": {k: v.upper() for k, v in prims.items()}}, *themes]


def ase(colors: list[tuple[str, str]]) -> bytes:
    """Adobe Swatch Exchange (works in Illustrator, Photoshop, InDesign, Affinity)."""
    blocks = b""
    for name, hx in colors:
        nm = (name + "\0").encode("utf-16-be")
        r, g, b = (int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5))
        body = struct.pack(">H", len(name) + 1) + nm + b"RGB " + struct.pack(">fffH", r, g, b, 2)
        blocks += struct.pack(">HI", 0x0001, len(body)) + body
    return b"ASEF" + struct.pack(">HHI", 1, 0, len(colors)) + blocks


SWATCH_TOKENS = ["bg", "surface", "sunken", "text", "muted", "accent", "on-accent", "hot", "warm", "tile", "tile-fg", "tile2", "focus"]


def write_palettes(dest: Path) -> None:
    prims_entry, *themes = parse_themes()
    prims = prims_entry["primitives"]
    dest.mkdir(parents=True, exist_ok=True)
    data = {"name": "Collectors' Tune Tracker", "source": "packages/ui/src/themes.css", "primitives": prims,
            "themes": themes}
    (dest / "ctt-palette.json").write_text(json.dumps(data, indent=2) + "\n")
    css = ["/* Collectors' Tune Tracker brand colors. Full themes: packages/ui/src/themes.css */", ":root {"]
    css += [f"  --{k}: {v};" for k, v in prims.items()] + ["}", ""]
    for t in themes:
        css.append(f'/* {t["code"]} {t["name"]} ({t["look"]}) */')
        css.append(f'[data-theme="{t["id"]}"] {{')
        css += [f"  --{k}: {v};" for k, v in t["tokens"].items()] + ["}", ""]
    (dest / "ctt-palette.css").write_text("\n".join(css))
    swatches = [(k.replace("ctt-", "CTT ").replace("-", " ").title(), v) for k, v in prims.items()]
    gpl = ["GIMP Palette", "Name: Collectors' Tune Tracker", "Columns: 7", "#"]
    gpl += [f"{int(v[1:3], 16):3d} {int(v[3:5], 16):3d} {int(v[5:7], 16):3d}\t{n}" for n, v in swatches]
    (dest / "ctt-palette.gpl").write_text("\n".join(gpl) + "\n")
    (dest / "ctt-palette.ase").write_bytes(ase(swatches))

    lines = ["// Generated by brand/scripts/build_brand.py from themes.css. Do not edit; re-run the script.",
             "// palette.test.ts fails if this file drifts from themes.css.", 'import type { ThemeId } from "./theme";', "",
             "export const BRAND_PRIMITIVES = {"]
    lines += [f'  "{k}": "{v}",' for k, v in prims.items()] + ["} as const;", "",
              f"export const SWATCH_TOKENS = {json.dumps(SWATCH_TOKENS)} as const;",
              "export type SwatchToken = (typeof SWATCH_TOKENS)[number];", "",
              "export const THEME_SWATCHES: Record<ThemeId, Record<SwatchToken, string>> = {"]
    for t in themes:
        lines.append(f'  "{t["id"]}": {{ ' + ", ".join(f'"{k}": "{t["tokens"][k]}"' for k in SWATCH_TOKENS) + " },")
    lines += ["};", ""]
    PALETTE_TS.write_text("\n".join(lines))


# --------------------------------------------------------------------------- build


def write(rel: str, svg: str, png_widths: tuple[int, ...] = ()) -> None:
    path = OUT / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(svg)
    for w in png_widths:
        name = path.with_suffix(".png") if len(png_widths) == 1 else path.with_name(f"{path.stem}-{w}.png")
        subprocess.run(["rsvg-convert", "-w", str(w), "-o", str(name), str(path)], check=True)


def png(src: Path, dest: Path, w: int) -> None:
    subprocess.run(["rsvg-convert", "-w", str(w), "-h", str(w), "-o", str(dest), str(src)], check=True)


def main() -> None:
    F.update(load_fonts())
    if OUT.exists():
        shutil.rmtree(OUT)

    # Logos
    for look in ("dark", "light"):
        for acc in ACCENTS:
            sc = scheme(look, acc)
            write(f"logos/wordmark-{look}-{acc}.svg", mark_doc(wordmark(sc), 24, "Collectors' Tune Tracker"), (1600,))
            write(f"logos/icon-{look}-{acc}.svg", mark_doc(badge(sc), 0, "Collectors' Tune Tracker icon"), (1024,))
            write(f"logos/lockup-{look}-{acc}.svg", mark_doc(lockup(sc), 16, "Collectors' Tune Tracker"), (1400,))
    stamp_colors = {"cream": CREAM, "charcoal": CHARCOAL, **{k: v[0] for k, v in ACCENTS.items()}}
    for name, color in stamp_colors.items():
        write(f"logos/stamp-{name}.svg", mark_doc(stamp(color, f"stamp-{name}"), 8, "CTT"), (1200,))
        write(f"logos/xx-face-{name}.svg", mark_doc(xx_face(color, "xx"), 6, "XX face"), (600,))

    # App icons & favicons (teal is the default colorway)
    icons = OUT / "icons"
    icons.mkdir(parents=True, exist_ok=True)
    for look in ("dark", "light"):
        sc = scheme(look, "teal")
        rng = random.Random(f"app-{look}")
        app = svg_doc(1024, 1024, f'<rect width="1024" height="1024" fill="{sc.paper}"/>' + speckle(1024, 1024, 700, sc.text, 0.08, rng)
                      + badge(sc).place(512 - 333, 512 - 333 + 12, w=666), "", "Collectors' Tune Tracker")
        src = icons / f"app-icon-{look}.svg"
        src.write_text(app)
        for size in (1024, 512, 192, 180):
            png(src, icons / f"app-icon-{look}-{size}.png", size)
        fav = svg_doc(32, 32, favicon_glyph(sc).body, "", "CTT")
        fsrc = icons / f"favicon-{look}.svg"
        fsrc.write_text(fav)
        for size in (16, 32, 48):
            png(fsrc, icons / f"favicon-{look}-{size}.png", size)
    # Adaptive favicon: dark-tab and light-tab browsers each get the right colorway.
    d, l = favicon_glyph(scheme("dark", "teal")), favicon_glyph(scheme("light", "teal"))
    (icons / "favicon.svg").write_text(svg_doc(32, 32, f'<style>.l{{display:none}}@media (prefers-color-scheme: light){{.d{{display:none}}.l{{display:inline}}}}</style>'
                                               f'<g class="d">{d.body}</g><g class="l">{l.body}</g>', "", "CTT"))
    subprocess.run(["magick", *(str(icons / f"favicon-dark-{s}.png") for s in (16, 32, 48)), str(icons / "favicon.ico")], check=True)

    # Sample files
    for look in ("dark", "light"):
        write(f"samples/social-card-{look}.svg", og_card(look), (1200,))
        write(f"samples/email-header-{look}.svg", email_header(look), (1200,))
        write(f"samples/avatar-{look}.svg", avatar(look), (800,))
    write("samples/sticker-sheet.svg", sticker_sheet(), (1400,))
    write("samples/gig-flyer.svg", gig_flyer(), (1275,))

    # Palettes
    write_palettes(OUT / "palette")

    # Shrink PNGs (palette quantization keeps edges crisp; these are flat-color marks).
    for p in OUT.rglob("*.png"):
        subprocess.run(["magick", str(p), "-strip", "-define", "png:compression-level=9", str(p)], check=True)

    # Everything in one zip
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for p in sorted(OUT.rglob("*")):
            if p.is_file():
                z.write(p, Path("ctt-brand-kit") / p.relative_to(OUT))
    (OUT / "ctt-brand-kit.zip").write_bytes(buf.getvalue())

    files = [p for p in OUT.rglob("*") if p.is_file()]
    print(f"Wrote {len(files)} files ({sum(p.stat().st_size for p in files) / 1e6:.1f} MB) to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
