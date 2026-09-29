async ({ svgText, playerText }) => {
  const check = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const nextFrame = () =>
    new Promise((resolve) => requestAnimationFrame(resolve));
  document.body.innerHTML = svgText;
  const svg = document.querySelector("svg");
  svg.pauseAnimations();
  const morph = svg.querySelector('animate[attributeName="d"]');
  const spring = morph.parentElement;
  const frames = morph.getAttribute("values").split(";");
  const rotation = [...svg.querySelectorAll("animateTransform")].find(
    (element) => element.getAttribute("values").split(";").length === 25,
  );
  const nativeSamples = [];
  for (const time of [0, 0.5, 1, 2, 61]) {
    svg.setCurrentTime(time);
    await nextFrame();
    const matrix = rotation.parentElement.transform.animVal.getItem(0).matrix;
    const angle = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
    const point = spring.getPointAtLength(0);
    nativeSamples.push({
      time: svg.getCurrentTime(),
      angle,
      x: point.x,
      y: point.y,
    });
    const expected = time % 2 === 0 ? 150 : time % 2 === 1 ? -150 : 0;
    check(Math.abs(angle - expected) < 0.01, `SVG phase mismatch at ${time}`);
  }
  svg.setCurrentTime(1);
  await nextFrame();
  const tightPoint = spring.getPointAtLength(0);
  spring.setAttribute("d", frames[12]);
  morph.remove();
  await nextFrame();
  const handedPoint = spring.getPointAtLength(0);
  const handoffError = Math.hypot(
    tightPoint.x - handedPoint.x,
    tightPoint.y - handedPoint.y,
  );
  check(handoffError < 0.001, "Path changed at animation handoff");
  spring.setAttribute("d", frames[6]);
  await nextFrame();
  const restPoint = spring.getPointAtLength(0);
  check(
    Math.hypot(restPoint.x - handedPoint.x, restPoint.y - handedPoint.y) > 1,
    "Manual d update failed",
  );

  const moduleUrl = URL.createObjectURL(
    new Blob([playerText], { type: "text/javascript" }),
  );
  const { readDrawing } = await import(moduleUrl);
  URL.revokeObjectURL(moduleUrl);
  const fixture = (content) =>
    `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 10 10">${content}</svg>`;
  const invalidFixtures = [
    {
      name: "uninterpreted_css",
      content: '<style>path {fill:#ff0000}</style><path d="M0 0H5V5Z"/>',
    },
    {
      name: "ignored_group_animation",
      content:
        '<g><animate attributeName="opacity" values="0;1" dur="1s"/><path d="M0 0H5V5Z"/></g>',
    },
    {
      name: "transform_trailing_garbage",
      content:
        '<g transform="translate(1 2) INVALID"><path d="M0 0H5V5Z"/></g>',
    },
    {
      name: "non_monotonic_key_times",
      content:
        '<g><animateTransform attributeName="transform" type="rotate" values="0;1;2;3" keyTimes="0;0.8;0.2;1" dur="2s" repeatCount="indefinite"/></g>',
    },
  ];
  const readerResults = invalidFixtures.map(({ name, content }) => {
    try {
      readDrawing(fixture(content));
      return { name, accepted: true };
    } catch (error) {
      return { name, accepted: false, error: String(error) };
    }
  });
  let cloneError = null;
  try {
    structuredClone(new Path2D("M0 0H6V6H0Z"));
  } catch (error) {
    cloneError = error.name;
  }
  check(cloneError === "DataCloneError", "Unexpected Path2D clone result");

  const perShape = new OffscreenCanvas(10, 10);
  const perShapeContext = perShape.getContext("2d");
  perShapeContext.globalAlpha = 0.5;
  perShapeContext.fillRect(0, 0, 8, 8);
  perShapeContext.fillRect(2, 2, 8, 8);
  const perShapeAlpha = perShapeContext.getImageData(4, 4, 1, 1).data[3];
  const group = new OffscreenCanvas(10, 10);
  const groupContext = group.getContext("2d");
  groupContext.fillRect(0, 0, 8, 8);
  groupContext.fillRect(2, 2, 8, 8);
  const destination = new OffscreenCanvas(10, 10);
  const destinationContext = destination.getContext("2d");
  destinationContext.globalAlpha = 0.5;
  destinationContext.drawImage(group, 0, 0);
  const groupAlpha = destinationContext.getImageData(4, 4, 1, 1).data[3];
  check(
    perShapeAlpha === 192 && groupAlpha === 128,
    "Unexpected compositing result",
  );

  const workerText = `
    self.onmessage = ({ data: canvas }) => {
      const context = canvas.getContext("2d");
      context.fillStyle = "#ff0000";
      context.fill(new Path2D("M0 0H6V6H0Z"));
      requestAnimationFrame(() => self.postMessage({
        path2D: typeof Path2D,
        domParser: typeof DOMParser,
        requestAnimationFrame: typeof requestAnimationFrame,
        rgba: [...context.getImageData(2, 2, 1, 1).data],
      }));
    };
  `;
  const workerUrl = URL.createObjectURL(
    new Blob([workerText], { type: "text/javascript" }),
  );
  const worker = new Worker(workerUrl);
  const placeholder = document.createElement("canvas");
  placeholder.width = 10;
  placeholder.height = 10;
  document.body.append(placeholder);
  const offscreen = placeholder.transferControlToOffscreen();
  const workerResult = await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("Worker did not reply")),
      5000,
    );
    worker.onmessage = ({ data }) => {
      clearTimeout(timer);
      resolve(data);
    };
    worker.onerror = (error) => {
      clearTimeout(timer);
      reject(new Error(error.message));
    };
    worker.postMessage(offscreen, [offscreen]);
  });
  worker.terminate();
  URL.revokeObjectURL(workerUrl);
  check(
    workerResult.rgba.join(",") === "255,0,0,255",
    "Worker path draw failed",
  );

  const usedCanvas = document.createElement("canvas");
  usedCanvas.getContext("2d");
  let transferError = null;
  try {
    usedCanvas.transferControlToOffscreen();
  } catch (error) {
    transferError = error.name;
  }
  check(
    transferError === "InvalidStateError",
    "Unexpected canvas transfer result",
  );
  return {
    nativeSvgSamples: nativeSamples,
    springHandoffErrorUnits: handoffError,
    manualRestPoint: { x: restPoint.x, y: restPoint.y },
    readerResults,
    path2DCloneError: cloneError,
    groupOpacity: { perShapeAlpha, groupAlpha },
    worker: workerResult,
    transferAfterContextError: transferError,
  };
};
