import pathlib as _pl
_HERE = _pl.Path(__file__).resolve().parent
_DECK = _HERE.parent / "deck"
_OUT  = _HERE.parent / "out"
_OUT.mkdir(exist_ok=True)
import http.server, functools, socketserver, threading, pathlib, sys, base64
sys.path.insert(0, str(_HERE))
from lib import load_themes
from playwright.sync_api import sync_playwright
S = pathlib.Path(str(_HERE))
OUT = S / "shots"; OUT.mkdir(exist_ok=True)
class SPA(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if not pathlib.Path(self.translate_path(self.path)).exists(): self.path = "/index.html"
        return super().do_GET()
    def log_message(self, *a): pass
socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(("127.0.0.1", 8830), functools.partial(SPA, directory=str(S / "build")))
threading.Thread(target=srv.serve_forever, daemon=True).start()
want = {"Beacon", "Conservatory", "Blueprint"}
shots = []
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1280, "height": 721})
    for t in load_themes():
        if t["name"] not in want: continue
        pg.goto(f"http://127.0.0.1:8830/{t['slide']}", wait_until="networkidle"); pg.wait_for_timeout(600)
        f = OUT / f"{t['slide']:02d}-{t['name']}.png"; pg.screenshot(path=str(f))
        shots.append((t["slide"], t["name"], t["blurb"], f)); print("shot", t["slide"], t["name"])
    cells = "".join(f'<figure><img src="data:image/png;base64,{base64.b64encode(f.read_bytes()).decode()}">'
                    f'<figcaption><b>{i} &middot; {nm}</b><br>{bl}</figcaption></figure>'
                    for i, nm, bl, f in shots)
    html = ('<style>body{margin:0;padding:20px;background:#5c5c5c;font:13px system-ui}'
            '.g{display:grid;grid-template-columns:1fr 1fr;gap:20px}figure{margin:0}'
            'img{width:100%;display:block;border-radius:4px}'
            'figcaption{color:#fff;padding-top:6px;line-height:1.35}</style>'
            f'<div class="g">{cells}</div>')
    sheet = OUT / "sheet.html"; sheet.write_text(html)
    pg.set_viewport_size({"width": 1700, "height": 1000})
    pg.goto(f"file://{sheet}", wait_until="networkidle"); pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT / "contact-sheet.png"), full_page=True)
    b.close()
srv.shutdown()
