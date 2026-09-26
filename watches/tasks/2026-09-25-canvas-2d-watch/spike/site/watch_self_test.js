// For browsers that Playwright cannot drive (real_browsers.py): the deck
// changes slides by itself and reports its frames. It runs only when the
// deck's URL has ?auto=N&label=…&report=<url>; the report has the shape of
// zoom.html's (`automatic` there), so one script reads both.

// Frames for `milliseconds`: [time since start, gap before, camera scale].
function record(stage, milliseconds) {
  return new Promise(done => {
    const frames = [];
    let last = performance.now();
    const start = last;
    function frame(now) {
      frames.push([now - start, now - last, stage.cameraAt(now).scale]);
      last = now;
      if (now - start < milliseconds) requestAnimationFrame(frame); else done(frames);
    }
    requestAnimationFrame(frame);
  });
}

export async function selfTest(stage, next, previous, params) {
  const pause = milliseconds => new Promise(done => setTimeout(done, milliseconds));
  await pause(2000);
  const idle = await record(stage, 2000);
  const zooms = [];
  for (let index = 0; index < Number(params.get("auto")); index++) {
    await pause(1000);
    next();
    const zoomIn = await record(stage, 3000);
    await pause(500);
    previous();
    const zoomOut = await record(stage, 3000);
    zooms.push({ zoomIn, zoomOut });
  }
  const report = {
    label: params.get("label") ?? "", query: location.search, userAgent: navigator.userAgent,
    window: [innerWidth, innerHeight, devicePixelRatio], idle, zooms, drawTimes: [],
  };
  // A simple cross-origin POST (text/plain): no preflight, no reply needed.
  await fetch(params.get("report"), { method: "POST", mode: "no-cors", body: JSON.stringify(report) });
}
