// One drawing function for both the main thread and a worker. It takes
// plain data (path strings, colours, numbers) and a 2D context of either
// kind, so the same module can draw on a <canvas> or an OffscreenCanvas.

export function drawScene(context, scene, time) {
  const { width, height } = context.canvas;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#FAF7F0";
  context.fillRect(0, 0, width, height);
  const scale = width / scene.width;
  context.setTransform(scale, 0, 0, scale, 0, 0);
  context.lineJoin = "round";
  context.miterLimit = 4;
  for (const shape of scene.shapes) {
    context.save();
    context.translate(shape.x, shape.y);
    context.rotate(((shape.turnsPerSecond * 360 * time) % 360) * (Math.PI / 180));
    if (shape.clipHole) {
      const hole = new Path2D();
      hole.rect(-200, -200, 400, 400);
      hole.arc(shape.clipHole.x, shape.clipHole.y, shape.clipHole.radius, 0, 2 * Math.PI);
      context.clip(hole, "evenodd");
    }
    const path = new Path2D(shape.d);
    if (shape.fill) {
      context.fillStyle = shape.fill;
      context.fill(path, shape.fillRule ?? "nonzero");
    }
    if (shape.stroke) {
      context.strokeStyle = shape.stroke;
      context.lineWidth = shape.strokeWidth;
      context.stroke(path);
    }
    context.restore();
  }
}

// Busy work on the calling thread, to stand in for a slide change.
export function block(milliseconds) {
  const until = performance.now() + milliseconds;
  while (performance.now() < until);
}
