"""Prepare the existing ImageGen frames for fast loading. Requires Pillow."""
from pathlib import Path
import json
import statistics
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
BASE_HEIGHT = 208
frames = []
groups = {}
source_bytes = 0
for name in ('idle', 'walk', 'run', 'actions'):
    source = ROOT / 'assets' / f'chetas-{name}.png'
    source_bytes += source.stat().st_size
    sheet = Image.open(source).convert('RGBA')
    pixels = list(sheet.getdata())
    sheet.putdata([(r,g,b,0 if r>155 and b>140 and g<135 and r+b>g*3+120 else a) for r,g,b,a in pixels])
    rows = 4 if name == 'actions' else 2
    cells = []
    for index in range(rows*4):
        x, y = index%4, index//4
        cell = sheet.crop((round(x*sheet.width/4),round(y*sheet.height/rows),round((x+1)*sheet.width/4),round((y+1)*sheet.height/rows)))
        cell = cell.crop(cell.getbbox())
        alpha = cell.getchannel('A')
        points = [(x,y) for y in range(round(cell.height*.15),round(cell.height*.35)) for x in range(cell.width) if alpha.getpixel((x,y))>128]
        anchor = sum(p[0] for p in points)/len(points) if points else cell.width/2
        cells.append((cell,anchor))
    median = statistics.median(sorted(cell.height for cell,_ in cells)[len(cells)//2:len(cells)//2+1])
    groups[name] = []
    for cell, anchor in cells:
        scale = BASE_HEIGHT/median
        size = (round(cell.width*scale),round(cell.height*scale))
        frame = cell.resize(size,Image.Resampling.LANCZOS)
        groups[name].append(len(frames))
        frames.append((frame,anchor*scale))

cell_width=max(f.width for f,_ in frames)+8
cell_height=max(f.height for f,_ in frames)+8
atlas=Image.new('RGBA',(cell_width*8,cell_height*5))
metadata=[]
for index,(frame,anchor) in enumerate(frames):
    x,y=(index%8)*cell_width+4,(index//8)*cell_height+4
    atlas.alpha_composite(frame,(x,y))
    metadata.append(dict(x=x,y=y,w=frame.width,h=frame.height,anchor=round(anchor,2)))
output=ROOT/'assets/chetas-atlas.webp'
atlas.save(output,'WEBP',quality=84,method=6,exact=True)
data=dict(baseHeight=BASE_HEIGHT,groups=groups,frames=metadata)
(ROOT/'game/atlas.mjs').write_text('export const AVATAR = '+json.dumps(data,separators=(',',':'))+';\n')
print(f'{len(frames)} frames: {source_bytes:,} → {output.stat().st_size:,} bytes ({(1-output.stat().st_size/source_bytes)*100:.1f}% smaller)')
print(f'Atlas: {atlas.width} × {atlas.height}, transparent WebP')
