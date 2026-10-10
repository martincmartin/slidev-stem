import asyncio, sys, time
from pathlib import Path
import smokecheck
deck=Path(sys.argv[1]); w,h=map(int,sys.argv[2].split("x"))
smokecheck.OFFLINE_SIZE=(w,h)
import os, browsers
if os.environ.get("ARGS") is not None: browsers.CHROMIUM_GPU=tuple(os.environ["ARGS"].split())
t=time.perf_counter(); rc=asyncio.run(smokecheck.check(deck,"chromium",no_canvas_readback=True))
print(f"smoke chromium {w}x{h}: rc {rc} {time.perf_counter()-t:.1f}s", flush=True)
