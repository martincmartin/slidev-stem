import sys
from PIL import Image
import numpy as np
import pathlib
O = str(pathlib.Path(__file__).resolve().parents[2] / 'out') + '/'
for variant in sys.argv[1:]:
    lost = gained = 0
    import os
    for n in os.listdir(O + 'clip-0.25'):
        a = np.asarray(Image.open(O + 'clip-0.25/' + n).convert('RGB')).astype(int)
        b = np.asarray(Image.open(O + variant + '/' + n).convert('RGB')).astype(int)
        d = np.abs(a - b).max(2) > 32
        lost += int((d & (b.sum(2) > a.sum(2))).sum()); gained += int((d & (b.sum(2) < a.sum(2))).sum())
    print(f'{variant}: lighter (line px lost) {lost}, darker (line px gained) {gained}')
