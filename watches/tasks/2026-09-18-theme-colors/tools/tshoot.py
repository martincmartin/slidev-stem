"""Shoot the torture deck; one contact sheet per archetype (3 themes side by side)."""
import pathlib as _pl
_HERE = _pl.Path(__file__).resolve().parent
_DECK = _HERE.parent / "deck"
_OUT  = _HERE.parent / "out"
_OUT.mkdir(exist_ok=True)
import http.server, functools, socketserver, threading, pathlib, base64
from playwright.sync_api import sync_playwright
S = pathlib.Path(str(_HERE))
OUT = S / "tshots"; OUT.mkdir(exist_ok=True)
ARCH = ["cards", "code", "chart", "dense", "images"]
THEMES = ["Beacon", "Coffee + Code", "Ledger"]

class SPA(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if not pathlib.Path(self.translate_path(self.path)).exists(): self.path = "/index.html"
        return super().do_GET()
    def log_message(self, *a): pass
socketserver.TCPServer.allow_reuse_address = True
srv = socketserver.TCPServer(("127.0.0.1", 8840), functools.partial(SPA, directory=str(S / "tbuild")))
threading.Thread(target=srv.serve_forever, daemon=True).start()

shots = {}
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 1280, "height": 721})
    n = 1
    for a in ARCH:
        for t in THEMES:
            n += 1
            pg.goto(f"http://127.0.0.1:8840/{n}", wait_until="networkidle"); pg.wait_for_timeout(800)
            f = OUT / f"{a}-{t.replace(' + ','-')}.png"; pg.screenshot(path=str(f))
            shots[(a, t)] = f
        print("archetype done:", a)
    for a in ARCH:
        cells = "".join(
            f'<figure><img src="data:image/png;base64,{base64.b64encode(shots[(a,t)].read_bytes()).decode()}">'
            f'<figcaption>{t}</figcaption></figure>' for t in THEMES)
        html = ('<style>body{margin:0;padding:18px;background:#5c5c5c;font:14px system-ui}'
                'h1{color:#fff;font-size:17px;margin:0 0 12px}figure{margin:0 0 16px}'
                'img{width:100%;display:block;border-radius:3px}'
                'figcaption{color:#fff;padding:5px 0 0;font-weight:600}</style>'
                f'<h1>archetype: {a}</h1>{cells}')
        h = OUT / f"sheet-{a}.html"; h.write_text(html)
        pg.set_viewport_size({"width": 1180, "height": 900})
        pg.goto(f"file://{h}", wait_until="networkidle"); pg.wait_for_timeout(300)
        pg.screenshot(path=str(OUT / f"sheet-{a}.png"), full_page=True)
    b.close()
srv.shutdown()
print("sheets in", OUT)
