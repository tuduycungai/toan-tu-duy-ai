from pathlib import Path
import fitz
from PIL import Image, ImageDraw

source = Path('research/worksheet-checks/tikz')
out = Path('research/worksheet-checks/contact-sheets')
out.mkdir(parents=True, exist_ok=True)
paths = sorted(source.glob('*.pdf'))
for start in range(0, len(paths), 12):
    sheet = Image.new('RGB', (1400, 1640), '#f2f6ef')
    draw = ImageDraw.Draw(sheet)
    for idx, path in enumerate(paths[start:start+12]):
        doc = fitz.open(path)
        pix = doc[0].get_pixmap(matrix=fitz.Matrix(1.7, 1.7), alpha=False)
        img = Image.frombytes('RGB', (pix.width, pix.height), pix.samples)
        img.thumbnail((440, 365))
        x, y = (idx % 3)*466, (idx//3)*410
        draw.text((x+16, y+10), path.stem, fill='#12382d', font_size=21)
        sheet.paste(img, (x+(466-img.width)//2, y+40+(365-img.height)//2))
        doc.close()
    sheet.save(out / f'sheet-{1+start//12:02}.png')
print(f'{len(paths)} compiled figures rendered to {(len(paths)+11)//12} contact sheets')
