// A figure's own time (ms), made from the page's (`performance.now`). It runs
// with the page's while the figure plays, and stands while the figure is
// paused. So a paused figure's picture is its state at that time, and a step
// starts from the picture that shows. A step in a paused figure runs the
// clock to the end of the step's change (`runTo`), where it stands again
// (docs/article.md, "A step in a figure moves as the talk does").
//
// Each method takes the page's time, so a test can give made-up times.

export class FigureClock {
  /** ms: the page's time less the figure's, while the clock runs. */
  private lag = 0;
  /** ms: the figure's time where the clock stops; infinite while it plays. */
  private end = Number.POSITIVE_INFINITY;

  /** The figure's time at the page's time `page`. */
  time(page: number): number {
    return Math.min(page - this.lag, this.end);
  }

  /** ms: how long the clock runs on after `page`: 0 if it stands, infinite
   *  if it plays. */
  remaining(page: number): number {
    return this.end - this.time(page);
  }

  /** Run from the time that it shows at `page`, with no end. */
  play(page: number): void {
    this.resume(page, Number.POSITIVE_INFINITY);
  }

  /** Stand at the time that it shows at `page`. */
  pause(page: number): void {
    this.end = this.time(page);
  }

  /** If the clock is paused, run on from `page` until the figure's time is
   *  `time`, and stand there. A time already passed changes nothing. */
  runTo(page: number, time: number): void {
    if (this.end === Number.POSITIVE_INFINITY) return;
    this.resume(page, Math.max(this.time(page), time));
  }

  private resume(page: number, end: number): void {
    this.lag = page - this.time(page);
    this.end = end;
  }
}
