import sys
from PIL import Image
O = 'tasks/2026-10-11-paper-discs/out/'
frame, left, top, right, bottom, out = sys.argv[1], *map(int, sys.argv[2:6]), sys.argv[6]
variants = sys.argv[7:]
panels = [Image.open(O + v + '/' + frame.replace(' ', '_') + '.png').convert('RGB').crop((left, top, right, bottom)).resize(((right - left) * 3, (bottom - top) * 3), Image.NEAREST) for v in variants]
sheet = Image.new('RGB', (sum(p.size[0] + 10 for p in panels), panels[0].size[1]), 'white')
x = 0
for p in panels:
    sheet.paste(p, (x, 0)); x += p.size[0] + 10
sheet.save(out)
