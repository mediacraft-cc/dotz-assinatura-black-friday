"""Junta os quadros de .frames/ em img/black-friday.gif (paleta única, cantos transparentes)."""
import json
import shutil
from pathlib import Path

from PIL import Image

here = Path(__file__).resolve().parent
frames_dir = here / ".frames"
frames = json.loads((frames_dir / "frames.json").read_text())

rgba = [Image.open(f["file"]).convert("RGBA") for f in frames]
w, h = rgba[0].size

# Semitransparente → compõe sobre branco; quase transparente → índice transparente.
def flatten(im):
    bg = Image.new("RGBA", im.size, (255, 255, 255, 255))
    return Image.alpha_composite(bg, im).convert("RGB")

flat = [flatten(im) for im in rgba]

# Paleta única (255 cores) a partir de todos os quadros, para não haver cintilação.
sheet = Image.new("RGB", (w, h * len(flat)))
for i, im in enumerate(flat):
    sheet.paste(im, (0, i * h))
palette_img = sheet.quantize(colors=255, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)

# A média do median cut desbota as cores da marca; encaixa as entradas próximas na cor exata.
KEY = [(255, 255, 255), (0, 0, 0), (255, 79, 14)]
pal = palette_img.getpalette()[: 255 * 3]
for i in range(0, len(pal), 3):
    for k in KEY:
        if sum(abs(pal[i + j] - k[j]) for j in range(3)) <= 24:
            pal[i : i + 3] = k
palette_img.putpalette(pal)

TRANSPARENT = 255
out = []
for im, src in zip(flat, rgba):
    q = im.quantize(palette=palette_img, dither=Image.Dither.NONE)
    mask = src.getchannel("A").point(lambda a: 255 if a < 128 else 0)
    q.paste(TRANSPARENT, mask=mask)
    out.append(q)

target = here / "img" / "black-friday.gif"
out[0].save(
    target,
    save_all=True,
    append_images=out[1:],
    duration=[f["ms"] for f in frames],
    loop=0,
    transparency=TRANSPARENT,
    disposal=1,
    optimize=False,
)
shutil.rmtree(frames_dir)
print(f"{target.name}: {len(out)} quadros, {target.stat().st_size / 1024:.0f} KB")
