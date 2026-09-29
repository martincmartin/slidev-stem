// A slide's frontmatter, at a number of clicks, as a state for the watch's
// stage (../tools/webgl/stage.js):
//   watch: a view (cover, hairspring, crown); none hides the watch
//   watchTilt: degrees (default 0)
//   watchOnly: a subject ("hairspring and stud"): the rest of the watch fades
//   watchSettle: the click at which the balance settles at rest
export interface WatchState {
  view: string
  tilt: number
  only?: string
  settled: boolean
}

export function watchState(frontmatter: Record<string, any>, clicks: number): WatchState | undefined {
  if (!frontmatter.watch) return undefined
  const settleAt = frontmatter.watchSettle
  return {
    view: frontmatter.watch,
    tilt: Number(frontmatter.watchTilt ?? 0),
    only: frontmatter.watchOnly,
    settled: settleAt !== undefined && clicks >= Number(settleAt),
  }
}
