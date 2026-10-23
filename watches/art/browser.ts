// What the art scripts give the browsers that they drive: files from a
// directory, with no server and no port, and no request to any other host.

import { stat } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import type { BrowserContext } from "playwright-chromium";

/** The host that `serveFrom` answers for. No real host ends in `.test`. Its
 *  origin is https, a secure context, as a published deck's is. */
const HOST = "files.test";

async function isFile(path: string): Promise<boolean> {
  return (await stat(path).catch(() => undefined))?.isFile() ?? false;
}

/** Answer the requests of `context` from `directory`: a file at its path, and
 *  index.html for a path that is not a file (a deck's routes: Slidev uses
 *  history routing). A request to any other host is aborted and recorded in
 *  `outside`, which the caller checks: the art must work offline. Returns
 *  the origin to load pages from. */
export async function serveFrom(
  context: BrowserContext,
  directory: string,
): Promise<{ origin: string; outside: string[] }> {
  const root = resolve(directory);
  const outside: string[] = [];
  await context.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    // the page's own; WebKit routes them too
    if (url.protocol === "blob:" || url.protocol === "data:") {
      await route.continue();
      return;
    }
    if (url.host !== HOST) {
      outside.push(url.href);
      await route.abort();
      return;
    }
    const file = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    const served =
      file.startsWith(root + sep) && (await isFile(file))
        ? file
        : join(root, "index.html");
    // Playwright gives the content type from the file's extension.
    await route.fulfill({ path: served });
  });
  return { origin: `https://${HOST}`, outside };
}
