import os, sys, time
from pathlib import Path
import print_check as pc
deck=Path(sys.argv[1]); w,h=map(int,sys.argv[2].split("x"))
pc.VIEWPORT={"width":w,"height":h}
if os.environ.get("PAGES"): pc.PRINTED_PAGES=int(os.environ["PAGES"])
if os.environ.get("ARGS") is not None: pc.CHROMIUM_GPU=tuple(os.environ["ARGS"].split())
t=time.perf_counter(); rc=pc.check(deck,"chromium"); print(f"REAL print {w}x{h} args={pc.CHROMIUM_GPU}: rc {rc} {time.perf_counter()-t:.1f}s", flush=True)
