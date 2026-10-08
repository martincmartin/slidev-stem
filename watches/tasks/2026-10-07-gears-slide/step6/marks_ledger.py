import sys, itertools
sys.path.insert(0, "/Users/martin/Develop/slidev/stem2/tools")
from lib import LEDGER, de76, cvd, lch, contrast
P = LEDGER
print({k: v.hex for k, v in P.items()})
names = {"ink": "ink", "muted": "muted", "accent": "accent", "second": "second", "subject": "subject",
         "second-wash": "second-wash", "muted-wash": "muted-wash"}
bg = {"paper": P["background"], "subject": P["subject"], "subject-wash": P["subject-wash"]}
print("\ncandidate      L*    vs subject (dE / CVD)   vs subject-wash (dE / CVD)   vs paper contrast")
for n in names:
    c = P[n]
    L = lch(c)[0]
    print(f"{n:12} {L:5.1f}   {de76(c,P['subject']):5.1f} / {cvd(c,P['subject']):5.1f}        "
          f"{de76(c,P['subject-wash']):5.1f} / {cvd(c,P['subject-wash']):5.1f}           {contrast(c,P['background']):4.1f}")
print("\npair              dE    CVD dE   L* ratio")
for a, b in itertools.combinations(["ink","muted","accent","second","subject","second-wash"], 2):
    la, lb = lch(P[a])[0], lch(P[b])[0]
    print(f"{a:8}/{b:12} {de76(P[a],P[b]):5.1f}  {cvd(P[a],P[b]):5.1f}   {max(la,lb)/min(la,lb):4.2f}")
