#!/usr/bin/env python3
"""Whether each Playwright engine's WebGL2 offers EXT_color_buffer_float, and
can render to an RG32F texture: what the exact line test needs. Chromium
runs in both of its software renderers (and on the Mac's GPU); on Linux in a
cloud session, Firefox and WebKit draw with Mesa (they need DISPLAY).

    uv run tasks/2026-10-11-paper-discs/tools/float-target.py    # in watches/
"""

import sys

from playwright.sync_api import sync_playwright

PROBE = """() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  if (!gl) return 'no WebGL2';
  const extension = gl.getExtension('EXT_color_buffer_float') !== null;
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RG32F, 4, 4);
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const complete = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  return `extension ${extension}, RG32F target complete ${complete}`;
}"""


RENDERER = """() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  const debug = gl && gl.getExtension('WEBGL_debug_renderer_info');
  return debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'unknown';
}"""


def main() -> None:
    with sync_playwright() as playwright:
        runs = [
            (playwright.chromium, "default (software, SwiftShader)", []),
            (playwright.chromium, "ANGLE SwiftShader (cloud)", ["--use-angle=swiftshader"]),
            (playwright.firefox, "default", []),
            (playwright.webkit, "default", []),
        ]
        if sys.platform == "darwin":
            runs.insert(2, (playwright.chromium, "GPU", ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]))
        for engine, label, arguments in runs:
            browser = engine.launch(args=arguments)
            page = browser.new_page()
            page.set_content("<!doctype html><title>probe</title>")
            print(f"{engine.name:9} {label:32} {page.evaluate(PROBE)}; {page.evaluate(RENDERER)}")
            browser.close()


if __name__ == "__main__":
    main()
