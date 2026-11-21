// What makes an article page fail on a phone, from the boxes that the page
// measured: no Playwright and no DOM here, so the tests can use it
// (phone-check.ts measures; ../docs/article.md, "On a phone").

/** A box in CSS px, as `getBoundingClientRect` gives it. */
export interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** Something on the page, with a name for a message. */
export interface Placed {
  readonly name: string;
  readonly box: Box;
}

/** A control that a reader taps. `equivalent`: another control on the page,
 *  big enough, does the same (a figure's step dots: its ‹ › buttons). */
export interface Target extends Placed {
  readonly equivalent: boolean;
}

/** What phone-check.ts measures on a page, at one scroll position. */
export interface PhonePage {
  /** The window's width, CSS px. */
  readonly width: number;
  /** The page's width: more than `width` scrolls sideways. */
  readonly scrollWidth: number;
  /** Each element of the article, apart from a figure's contents: a figure
   *  crops its slide, and the slide runs past the screen by design. */
  readonly placed: readonly Placed[];
  readonly targets: readonly Target[];
}

/** WCAG 2.2's minimum target size, CSS px (2.5.8, "Target Size (Minimum)"). */
export const TARGET_PX = 24;

/** Rounding in a box's edges, CSS px. */
const SLACK_PX = 0.5;

function centre(box: Box): { readonly x: number; readonly y: number } {
  return { x: (box.left + box.right) / 2, y: (box.top + box.bottom) / 2 };
}

/** The distance from a point to a box: 0 inside it. */
function distanceToBox(x: number, y: number, box: Box): number {
  const dx = Math.max(box.left - x, 0, x - box.right);
  const dy = Math.max(box.top - y, 0, y - box.bottom);
  return Math.hypot(dx, dy);
}

function isUndersized(target: Target): boolean {
  const { box } = target;
  return (
    box.right - box.left < TARGET_PX - SLACK_PX ||
    box.bottom - box.top < TARGET_PX - SLACK_PX
  );
}

/** The targets that fail WCAG 2.5.8: smaller than 24 px, and a 24 px circle
 *  on their centre meets another target, or another small target's circle.
 *  A target with an equivalent passes. */
export function smallTargets(targets: readonly Target[]): Target[] {
  const radius = TARGET_PX / 2;
  const undersized = new Set(targets.filter(isUndersized));
  return [...undersized].filter((target) => {
    if (target.equivalent) return false;
    const { x, y } = centre(target.box);
    return targets.some((other) => {
      if (other === target) return false;
      if (distanceToBox(x, y, other.box) < radius - SLACK_PX) return true;
      if (!undersized.has(other)) return false;
      const there = centre(other.box);
      return Math.hypot(there.x - x, there.y - y) < TARGET_PX - SLACK_PX;
    });
  });
}

/** What is wrong with `page` on a phone, as messages. */
export function phoneProblems(page: PhonePage): string[] {
  const problems: string[] = [];
  if (page.scrollWidth > page.width + SLACK_PX) {
    problems.push(
      `the page scrolls sideways: ${String(page.scrollWidth)} px wide in a ${String(page.width)} px window`,
    );
  }
  for (const each of page.placed) {
    const { left, right } = each.box;
    if (right - left <= 0) continue;
    if (left < -SLACK_PX || right > page.width + SLACK_PX) {
      problems.push(
        `${each.name} runs past the screen: ${left.toFixed(0)}..${right.toFixed(0)} px of ${String(page.width)}`,
      );
    }
  }
  for (const each of smallTargets(page.targets)) {
    const { box } = each;
    problems.push(
      `${each.name} is a small target: ${(box.right - box.left).toFixed(0)}×${(box.bottom - box.top).toFixed(0)} px, too close to another (WCAG 2.5.8)`,
    );
  }
  return problems;
}
