#!/usr/bin/env python3
"""Generator for Set 14, "Vector display" — the only set that is generated rather
than hand-written, because its contour stacks need real geometry.

    .venv/bin/python3 tasks/2026-09-20-animation-style/tools/mkvector.py

Writes the four SVGs in deck/public/timekeepers/vector/. EDIT THIS FILE, not the SVGs.

The cross-sections inside the hourglass bulbs have to sit ON the glass, so their
half-widths come from bisecting the actual cubic beziers of the bulb silhouette
(x_at_y), not from eyeballed constants. Same reason the bowl strata interpolate
the vessel walls. Everything else in the set is a near-half arc via front(),
because full ellipses read as a see-through wire cage at 122 px -- see README S6.
"""
import math, os, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[3]
# The art these tools read. Until 2026-09-21 this was the project root's
# public/timekeepers/, which held all sixteen sets because the live deck showed all
# sixteen. The live deck now ships one set, so the sets live in this archive's own
# deck/ and the tools read them from there -- which is also what makes the archive
# runnable after the live deck has moved on. See README S14.
ART = pathlib.Path(__file__).resolve().parents[1] / "deck/public/timekeepers"

OUT = str(ART / 'vector')
os.makedirs(OUT, exist_ok=True)
F='#070A0E'; L1='#A8C4D8'; L2='#6E8FA6'; L3='#E2EDF5'; R1='#C8412F'

def front(cx,cy,rx,ry):
    return f'M{cx-rx:.1f} {cy:.1f} A{rx:.1f} {ry:.1f} 0 0 0 {cx+rx:.1f} {cy:.1f}'

def head():
    return ['<svg width="240" height="190" viewBox="0 0 240 190" xmlns="http://www.w3.org/2000/svg">']
def field():
    return [f'<rect width="240" height="190" fill="{F}"/>']

# ---- cubic bezier sampler: x at a given y, for the hourglass bulb silhouettes
def bez(p0,p1,p2,p3,t):
    u=1-t
    return (u*u*u*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t*t*t*p3[0],
            u*u*u*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t*t*t*p3[1])
def x_at_y(p0,p1,p2,p3,y):
    lo,hi=0.0,1.0
    for _ in range(60):
        m=(lo+hi)/2
        if bez(p0,p1,p2,p3,m)[1] < y: lo=m
        else: hi=m
    return bez(p0,p1,p2,p3,(lo+hi)/2)[0]
UP=((86,18),(86,62),(113,80),(115,95))
LO=((115,95),(113,110),(86,128),(86,172))
def bulb_rx(y):
    src = UP if y<=95 else LO
    return max(2.0, 120 - x_at_y(*src, y))

# =================== SUNDIAL ===================
s=head()+field()
s.append(f'<g fill="none" stroke="{L2}" stroke-width="2.2" stroke-linecap="round">')
for k in range(16):                                    # meridians
    a=2*math.pi*k/16
    s.append(f'<line x1="120" y1="138" x2="{120+96*math.cos(a):.1f}" y2="{138+36*math.sin(a):.1f}"/>')
s.append('</g>')
s.append(f'<g fill="none" stroke="{L2}" stroke-width="2.4">')
for rx in (78,60,42,24):                               # concentric rings
    s.append(f'<ellipse cx="120" cy="138" rx="{rx}" ry="{rx*36/96:.1f}"/>')
s.append('</g>')
s.append(f'<g fill="none" stroke="{L1}" stroke-width="2.4" stroke-linecap="round">')
for k in range(36):                                    # scale ring, long every 90 deg
    a=2*math.pi*k/36; f=0.895 if k%9==0 else 0.935
    s.append(f'<line x1="{120+96*math.cos(a):.1f}" y1="{138+36*math.sin(a):.1f}" '
             f'x2="{120+96*f*math.cos(a):.1f}" y2="{138+36*f*math.sin(a):.1f}"/>')
s.append('</g>')
s.append(f'<g fill="none" stroke="{L1}" stroke-width="3.6" stroke-linecap="round">'
         f'<ellipse cx="120" cy="138" rx="96" ry="36"/>'
         f'<path d="M24 138 L24 148"/><path d="M216 138 L216 148"/>'
         f'<path d="M24 148 A96 36 0 0 0 216 148"/></g>')
apex=[(199.8,151.5),(186.2,159.1),(167.3,165.0),(144.7,168.7),(120.0,170.0),
      (95.3,168.7),(72.7,165.0),(53.8,159.1),(40.2,151.5)]
vals=';'.join(f'M120 138 L174 138 L{x} {y} Z' for x,y in apex)
s.append(f'<path d="M120 138 L174 138 L199.8 151.5 Z" fill="{R1}" fill-opacity="0.2" '
         f'stroke="{R1}" stroke-width="3.2" stroke-linejoin="round">'
         f'<animate attributeName="d" values="{vals}" dur="11s" repeatCount="indefinite"/></path>')
s.append(f'<path d="M120 138 L120 56 L174 138 Z" fill="{F}"/>')
s.append(f'<g fill="none" stroke="{L2}" stroke-width="2.2">'
         f'<path d="M120 97 L147 138"/><path d="M120 117.5 L160.5 138"/><path d="M133.5 138 L120 76.5"/></g>')
s.append(f'<path d="M120 138 L120 56 L174 138 Z" fill="none" stroke="{L1}" stroke-width="3.6" stroke-linejoin="round"/>')
s.append(f'<g stroke="{L1}" stroke-width="2.4" stroke-linecap="round">'
         f'<line x1="112" y1="138" x2="128" y2="138"/></g>')
s.append('</svg>')
open(f'{OUT}/sundial.svg','w').write('\n'.join(s)+'\n')
print('sundial', os.path.getsize(f'{OUT}/sundial.svg'))

# =================== WATER CLOCK ===================
def up_rx(y): return 62-22*(y-22)/52
def up_ry(y): return 18-6*(y-22)/52
def lo_rx(y): return 52-8*(y-120)/50
def lo_ry(y): return 17-4*(y-120)/50
s=head()
s.append('<defs>')
s.append('<clipPath id="v-w-up"><path d="M54 0 L186 0 L160 74 A40 12 0 0 1 80 74 Z"/></clipPath>')
s.append('<clipPath id="v-w-lo"><path d="M64 100 L176 100 L164 170 A44 13 0 0 1 76 170 Z"/></clipPath>')
s.append('<clipPath id="v-w-upwet"><rect x="40" y="40" width="160" height="70">'
         '<animate attributeName="y" values="40;70" dur="8s" repeatCount="indefinite"/></rect></clipPath>')
s.append('<clipPath id="v-w-lowet"><rect x="40" y="164" width="160" height="70">'
         '<animate attributeName="y" values="164;128" dur="8s" repeatCount="indefinite"/></rect></clipPath>')
s.append('</defs>')
s+=field()
# upper: stacked water strata, then the moving surface
s.append('<g clip-path="url(#v-w-up)"><g clip-path="url(#v-w-upwet)">')
s.append(f'<rect x="40" y="0" width="160" height="190" fill="{L1}" opacity="0.12"/>')
s.append(f'<g fill="none" stroke="{L1}" stroke-width="2.8">')
for y in (44,50,56,62,68,74,80):
    s.append(f'<path d="{front(120,y,up_rx(y),up_ry(y))}"/>')
s.append('</g></g></g>')
s.append(f'<g clip-path="url(#v-w-up)"><ellipse cx="120" cy="40" rx="54.4" ry="15.8" fill="{L1}" fill-opacity="0.42" stroke="{L3}" stroke-width="3.2">'
         '<animate attributeName="cy" values="40;70" dur="8s" repeatCount="indefinite"/>'
         '<animate attributeName="rx" values="54.4;41.7" dur="8s" repeatCount="indefinite"/>'
         '<animate attributeName="ry" values="15.8;12.1" dur="8s" repeatCount="indefinite"/></ellipse></g>')
s.append(f'<g fill="none" stroke="{L2}" stroke-width="2.2">')
for k in (1,3):
    a=2*math.pi*k/8
    s.append(f'<line x1="{120+62*math.cos(a):.1f}" y1="{22+18*math.sin(a):.1f}" '
             f'x2="{120+40*math.cos(a):.1f}" y2="{74+12*math.sin(a):.1f}"/>')
s.append('</g>')
s.append(f'<g fill="none" stroke="{L1}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">'
         f'<ellipse cx="120" cy="22" rx="62" ry="18"/>'
         f'<path d="M58 22 L80 74 A40 12 0 0 0 160 74 L182 22"/>'
         f'<line x1="134.3" y1="85.2" x2="150" y2="97"/></g>')
s.append(f'<ellipse cx="150" cy="102" rx="3.4" ry="5.2" fill="{L3}">'
         '<animate attributeName="cy" values="102;130" dur="1s" repeatCount="indefinite"/>'
         '<animate attributeName="opacity" values="1;1;0" keyTimes="0;0.8;1" dur="1s" repeatCount="indefinite"/></ellipse>')
# lower
s.append('<g clip-path="url(#v-w-lo)"><g clip-path="url(#v-w-lowet)">')
s.append(f'<rect x="40" y="0" width="160" height="190" fill="{L1}" opacity="0.12"/>')
s.append(f'<g fill="none" stroke="{L1}" stroke-width="2.8">')
for y in (134,140,146,152,158,164,170):
    s.append(f'<path d="{front(120,y,lo_rx(y),lo_ry(y))}"/>')
s.append('</g></g></g>')
s.append(f'<g clip-path="url(#v-w-lo)"><ellipse cx="120" cy="164" rx="45.0" ry="14.7" fill="{L1}" fill-opacity="0.42" stroke="{L3}" stroke-width="3.2">'
         '<animate attributeName="cy" values="164;128" dur="8s" repeatCount="indefinite"/>'
         '<animate attributeName="rx" values="45.0;50.7" dur="8s" repeatCount="indefinite"/>'
         '<animate attributeName="ry" values="14.7;16.6" dur="8s" repeatCount="indefinite"/></ellipse></g>')
s.append(f'<g fill="none" stroke="{L2}" stroke-width="2.2">')
for k in (1,3):
    a=2*math.pi*k/8
    s.append(f'<line x1="{120+52*math.cos(a):.1f}" y1="{120+17*math.sin(a):.1f}" '
             f'x2="{120+44*math.cos(a):.1f}" y2="{170+13*math.sin(a):.1f}"/>')
s.append('</g>')
s.append(f'<g fill="none" stroke="{L1}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">'
         f'<ellipse cx="120" cy="120" rx="52" ry="17"/>'
         f'<path d="M68 120 L76 170 A44 13 0 0 0 164 170 L172 120"/></g>')
s.append(f'<g fill="none" stroke="{R1}" stroke-width="3.2" stroke-linecap="round">'
         '<path d="M109 151.6 A49.5 16.2 0 0 0 131 151.6"/>'
         '<path d="M109 163.6 A47.4 15.5 0 0 0 131 163.6"/></g>')
s.append('</svg>')
open(f'{OUT}/water-clock.svg','w').write('\n'.join(s)+'\n')
print('water-clock', os.path.getsize(f'{OUT}/water-clock.svg'))

# =================== CANDLE ===================
s=head()
s.append('<defs><clipPath id="v-c-burn"><rect x="86" y="52" width="68" height="122">'
         '<animate attributeName="y" values="62;152" dur="12s" repeatCount="indefinite"/>'
         '<animate attributeName="height" values="112;22" dur="12s" repeatCount="indefinite"/>'
         '</rect></clipPath></defs>')
s+=field()
s.append('<g clip-path="url(#v-c-burn)">')
s.append(f'<g fill="none" stroke="{L2}" stroke-width="2.2">')
for y in (64,88,112,136,160):
    s.append(f'<path d="{front(120,y,24,6)}"/>')
s.append('</g>')
s.append(f'<g fill="none" stroke="{R1}" stroke-width="2.8">')
for y in (76,100,124,148):
    s.append(f'<path d="{front(120,y,24,6)}"/>')
s.append('</g>')
s.append(f'<g fill="none" stroke="{L1}" stroke-width="3.6" stroke-linecap="round">'
         f'<line x1="96" y1="52" x2="96" y2="174"/><line x1="144" y1="52" x2="144" y2="174"/>'
         f'<path d="{front(120,174,24,6)}"/></g>')
s.append('</g>')
s.append('<g><animateTransform attributeName="transform" type="translate" values="0 0;0 90" dur="12s" repeatCount="indefinite"/>')
s.append(f'<g stroke="{L2}" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-dasharray="15 13" opacity="0.7">'
         '<path d="M28 42 C48 32 62 50 86 38"><animate attributeName="stroke-dashoffset" values="56;0" dur="1.5s" repeatCount="indefinite"/></path>'
         '<path d="M34 66 C54 56 68 74 92 62"><animate attributeName="stroke-dashoffset" values="56;0" dur="1.9s" repeatCount="indefinite"/></path></g>')
for cx,cy2,dur,ry2 in ((96,84,'3.1s',12),(144,80,'4.3s',10.5)):
    s.append(f'<ellipse cx="{cx}" cy="61" rx="4.4" ry="6" fill="{L1}">'
             f'<animate attributeName="cy" values="61;61;{cy2}" keyTimes="0;0.25;1" dur="{dur}" repeatCount="indefinite"/>'
             f'<animate attributeName="ry" values="6;{ry2};7.5" keyTimes="0;0.45;1" dur="{dur}" repeatCount="indefinite"/>'
             f'<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.2;0.8;1" dur="{dur}" repeatCount="indefinite"/></ellipse>')
s.append(f'<path d="M96 58 C104 52 112 58 120 55 C128 52 136 58 144 58 L144 69 L96 69 Z" fill="{F}" stroke="{L1}" stroke-width="3.2" stroke-linejoin="round"/>')
s.append(f'<path d="{front(120,69,24,6)}" fill="none" stroke="{L2}" stroke-width="2.2"/>')
s.append(f'<line x1="120" y1="57" x2="120" y2="42" stroke="{L1}" stroke-width="3"/>')
s.append(f'<g fill="none" stroke="{R1}" stroke-linejoin="round">'
         f'<path d="M120 4 C136 21 141 35 120 50 C99 35 104 21 120 4 Z" stroke-width="3.4"/>'
         f'<path d="M120 16 C130 27 133 37 120 47 C107 37 110 27 120 16 Z" stroke-width="2.4"/>'
         f'<path d="M120 27 C125 33 126 40 120 45 C114 40 115 33 120 27 Z" stroke-width="2.2"/></g>')
s.append(f'<line x1="120" y1="12" x2="120" y2="46" stroke="{L3}" stroke-width="2.4">'
         '<animate attributeName="y1" values="12;17;10;15" dur="0.6s" calcMode="discrete" repeatCount="indefinite"/></line>')
s.append('</g>')
s.append(f'<g fill="none" stroke="{L1}" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round">'
         f'<path d="M70 174 L170 174 L160 188 L80 188 Z"/></g>')
s.append(f'<path d="M70 174 A50 7 0 0 0 170 174" fill="none" stroke="{L2}" stroke-width="2.2"/>')
s.append('</svg>')
open(f'{OUT}/candle.svg','w').write('\n'.join(s)+'\n')
print('candle', os.path.getsize(f'{OUT}/candle.svg'))

# =================== HOURGLASS ===================
pile=['M88 172 L152 172 L152 170 C140 169 130 168 120 168 C110 168 100 169 88 170 Z',
      'M88 172 L152 172 L152 158 C140 156 130 146 120 146 C110 146 100 156 88 158 Z',
      'M88 172 L152 172 L152 148 C140 145 130 130 120 130 C110 130 100 145 88 148 Z']
crest=['M152 170 C140 169 130 168 120 168 C110 168 100 169 88 170',
       'M152 158 C140 156 130 146 120 146 C110 146 100 156 88 158',
       'M152 148 C140 145 130 130 120 130 C110 130 100 145 88 148']
s=head()
s.append('<defs>')
s.append('<clipPath id="v-h-up"><path d="M90 20 L150 20 C150 62 125 80 122 94 L118 94 C115 80 90 62 90 20 Z"/></clipPath>')
s.append('<clipPath id="v-h-lo"><path d="M118 96 C115 110 90 128 90 170 L150 170 C150 128 125 110 122 96 Z"/></clipPath>')
s.append('<clipPath id="v-h-nostream"><path clip-rule="evenodd" d="M78 8 L164 8 L164 182 L78 182 Z M113 92 L127 92 L127 182 L113 182 Z"/></clipPath>')
s.append('<clipPath id="v-h-bulb"><path d="M86 18 L154 18 C154 62 127 80 125 95 C127 110 154 128 154 172 L86 172 C86 128 113 110 115 95 C113 80 86 62 86 18 Z"/></clipPath>')
s.append('<clipPath id="v-h-drain"><rect x="80" y="20" width="80" height="76">'
         '<animate attributeName="y" values="20;94" dur="9s" repeatCount="indefinite"/></rect></clipPath>')
s.append(f'<clipPath id="v-h-pile"><path d="{pile[0]}"><animate attributeName="d" values="{";".join(pile)}" dur="9s" repeatCount="indefinite"/></path></clipPath>')
s.append('</defs>')
s+=field()
s.append(f'<g fill="none" stroke="{L1}" stroke-width="3.4" stroke-linejoin="round">'
         f'<rect x="56" y="4" width="128" height="16" rx="4"/><rect x="56" y="170" width="128" height="16" rx="4"/>'
         f'<rect x="64" y="17" width="13" height="156"/><rect x="163" y="17" width="13" height="156"/></g>')
s.append(f'<g clip-path="url(#v-h-bulb)" fill="none" stroke="{L2}" stroke-width="2.2" opacity="0.22">')
for y in range(30,171,20):
    if abs(y-95)<7: continue
    s.append(f'<path d="{front(120,y,bulb_rx(y),max(2.2,bulb_rx(y)*0.22))}"/>')
s.append('</g>')
s.append(f'<g clip-path="url(#v-h-up)"><g clip-path="url(#v-h-drain)">')
s.append(f'<rect x="80" y="0" width="80" height="190" fill="{L1}" opacity="0.12"/>')
s.append(f'<g fill="none" stroke="{L1}" stroke-width="2.8">')
for y in range(26,95,8):
    s.append(f'<path d="{front(120,y,bulb_rx(y),max(2.2,bulb_rx(y)*0.22))}"/>')
s.append('</g></g></g>')
s.append(f'<g clip-path="url(#v-h-up)"><line x1="86" y1="20" x2="154" y2="20" stroke="{L3}" stroke-width="3">'
         '<animate attributeName="y1" values="20;94" dur="9s" repeatCount="indefinite"/>'
         '<animate attributeName="y2" values="20;94" dur="9s" repeatCount="indefinite"/></line></g>')
s.append(f'<g stroke="{L1}" stroke-width="2.4"><line x1="117" y1="96" x2="117" y2="172"/>'
         f'<line x1="123" y1="96" x2="123" y2="172"/></g>')
s.append(f'<g clip-path="url(#v-h-lo)"><g clip-path="url(#v-h-pile)">')
s.append(f'<rect x="80" y="0" width="80" height="190" fill="{L1}" opacity="0.12"/>')
s.append(f'<g fill="none" stroke="{L1}" stroke-width="2.8">')
for y in range(130,172,8):
    s.append(f'<path d="{front(120,y,bulb_rx(y),max(2.2,bulb_rx(y)*0.22))}"/>')
s.append('</g></g></g>')
s.append(f'<g clip-path="url(#v-h-lo)"><g clip-path="url(#v-h-nostream)">'
         f'<path d="{crest[0]}" fill="none" stroke="{L3}" stroke-width="3">'
         f'<animate attributeName="d" values="{";".join(crest)}" dur="9s" repeatCount="indefinite"/></path></g></g>')
s.append(f'<g fill="none" stroke="{L1}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">'
         f'<path d="M86 18 C86 62 113 80 115 95 C113 110 86 128 86 172"/>'
         f'<path d="M154 18 C154 62 127 80 125 95 C127 110 154 128 154 172"/></g>')
s.append(f'<rect x="106" y="88" width="28" height="14" rx="4" fill="{F}" stroke="{L1}" stroke-width="3.4" stroke-linejoin="round"/>')
s.append('</svg>')
open(f'{OUT}/hourglass.svg','w').write('\n'.join(s)+'\n')
print('hourglass', os.path.getsize(f'{OUT}/hourglass.svg'))
