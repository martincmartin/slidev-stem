import sys
from pathlib import Path
import print_check as pc
from playwright.sync_api import sync_playwright
deck=Path(sys.argv[1])
FPS = """async () => { let n=0; const t0=performance.now(); await new Promise(r=>{const f=()=>{n++; performance.now()-t0<3000?requestAnimationFrame(f):r()}; requestAnimationFrame(f)}); return n/((performance.now()-t0)/1000) }"""
variants={"angle=gl":["--use-angle=gl"],"angle=gl-egl":["--use-angle=gl-egl"],"use-gl=egl":["--use-gl=egl"],"angle=vulkan":["--use-angle=vulkan"],"default":[], "gpu flags (current)":list(pc.CHROMIUM_GPU), "angle=swiftshader":["--use-angle=swiftshader"],
 "angle=swiftshader-webgl":["--use-angle=swiftshader-webgl"], "use-gl=angle + swiftshader + unsafe":["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"],
 }
with sync_playwright() as p:
  for name,args in variants.items():
    for vp in [(1960,1104)]:
      try:
        b=p.chromium.launch(args=args); f=pc.Findings()
        pg=b.new_page(viewport={"width":vp[0],"height":vp[1]}); pg.set_default_timeout(60000); pc.serve_from(deck,pg,f.outside)
        pg.goto(f"http://{pc.HOST}/1"); pc.live_ready(pg)
        print(f"{name:38} {vp[0]}x{vp[1]} fps {pg.evaluate(FPS):5.1f}  {pc.renderer(pg)[:50]}",flush=True)
        b.close()
      except Exception as e: print(name, vp, "ERROR", str(e)[:100]); 
