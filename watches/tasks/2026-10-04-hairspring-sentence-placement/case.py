import asyncio, pathlib, sys, json
sys.path.insert(0, "/Users/martin/Develop/slidev/stem/tools")
from offline_check import serve_build, HOST
from playwright.async_api import async_playwright
S = pathlib.Path(sys.argv[1])
CASES = {"caps": ["BEND IT AWAY", "FROM STRAIGHT,", "IT PUSHES BACK"],
         "title": ["Bend It Away", "From Straight,", "It Pushes Back"],
         "sentence": ["Bend it away", "from straight,", "it pushes back"]}
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(); page = await b.new_page()
        await serve_build(page, S / "deck", [])
        await page.goto(f"http://{HOST}/2?clicks=1"); await page.wait_for_selector(".slidev-layout")
        await page.evaluate("document.fonts.ready")
        print(json.dumps(await page.evaluate("""(cases) => {
          const c = document.createElement('canvas').getContext('2d');
          c.font = '600 100px "IBM Plex Sans"';
          const out = {xHeight: c.measureText('x').actualBoundingBoxAscent, capHeight: c.measureText('H').actualBoundingBoxAscent};
          c.font = '600 29px "IBM Plex Sans"';
          for (const [k, lines] of Object.entries(cases)) out[k] = Math.round(Math.max(...lines.map(l => c.measureText(l).width)));
          return out; }""", CASES)))
        await b.close()
asyncio.run(main())
