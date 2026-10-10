// The heights of the dial, from a copy of watch/ and webgl/ (git archive)
// with node_modules linked:  node tools/heights.ts DIR
const dir = process.argv[2];
const { generate } = await import(`${dir}/watch/generate.ts`);
const watch = generate();
const top = (name: string) => Math.max(...[...watch.scene.pieces.find((p: {name: string}) => p.name === name).meshes].flatMap((m: {triangles: Float32Array}) => [...m.triangles].filter((_, i) => i % 3 === 2)));
console.log(dir.split("/").pop(), { ring: watch.ringTop.toFixed(1), hour: top("hour hand").toFixed(1), minute: top("minute hand").toFixed(1), caseBand: top("case band").toFixed(1) });
