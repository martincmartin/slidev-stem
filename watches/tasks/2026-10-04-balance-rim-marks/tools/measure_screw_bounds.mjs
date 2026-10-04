import { generate } from "../../../watch/generate.ts";

const results = {};
{
  const watch = generate();
  const view = watch.scene.views[1];
  const tilt = (20 * Math.PI) / 180;
  const targetX = view.pivot[0] * view.scale + view.shift[0];
  const targetY = view.pivot[1] * view.scale + view.shift[1];
  const meshes = watch.scene.meshes.filter((mesh) =>
    mesh.name.startsWith("balance screw "),
  );
  let radius = 0;
  let minimumY = Infinity;
  let maximumY = -Infinity;
  for (const mesh of meshes) {
    for (let index = 0; index < mesh.triangles.length; index += 3) {
      const radial = Math.hypot(
        mesh.triangles[index],
        mesh.triangles[index + 1],
      );
      const z = mesh.triangles[index + 2];
      radius = Math.max(radius, radial);
      const centreY =
        targetY - (z - view.pivot[2]) * Math.sin(tilt) * view.scale;
      minimumY = Math.min(
        minimumY,
        centreY - radial * Math.cos(tilt) * view.scale,
      );
      maximumY = Math.max(
        maximumY,
        centreY + radial * Math.cos(tilt) * view.scale,
      );
    }
  }
  results["screws-4"] = {
    x: [targetX - radius * view.scale, targetX + radius * view.scale],
    y: [minimumY, maximumY],
    strokeMargin: 1.25,
  };
}
process.stdout.write(JSON.stringify(results, null, 2) + "\n");
