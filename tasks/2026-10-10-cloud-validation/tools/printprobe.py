import os, sys, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import print_check as pc
def busy():
    f=[int(x) for x in open('/proc/stat').readline().split()[1:]]
    return (sum(f)-f[3]-f[4])/os.sysconf('SC_CLK_TCK')
deck = Path(sys.argv[1]); mode = sys.argv[2]
if mode == "nogpu":
    pc.CHROMIUM_GPU = ()
for n in map(int, sys.argv[3].split(",")):
    b=busy(); t=time.perf_counter()
    live, gl, f = pc.walk_live(deck, "chromium")
    tw=time.perf_counter()-t; bw=busy()-b
    pos=[v.position for v in live]
    shares=[pos[i::n] for i in range(n)]
    b=busy(); t=time.perf_counter()
    with ThreadPoolExecutor(n) as pool: res=list(pool.map(lambda s: pc.load_printed(deck,"chromium",s), shares))
    tp=time.perf_counter()-t; bp=busy()-b
    probs=sum(len(r[1].problems) for r in res)+len(f.problems)
    print(f"{mode} pages={n} positions={len(pos)} live {tw:6.1f}s cpu {bw:6.1f} | printed {tp:6.1f}s cpu {bp:6.1f} | problems {probs} | {gl[:40]}", flush=True)
