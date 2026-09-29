/** The item at `index`. `noUncheckedIndexedAccess` makes `items[index]` possibly
 *  undefined; this says that it is a bug if it is. */
export function at<Item>(items: ArrayLike<Item>, index: number): Item {
  if (!Number.isInteger(index) || index < 0 || index >= items.length) {
    throw new RangeError(
      `index ${String(index)} is outside 0..${String(items.length)}`,
    );
  }
  if (!Object.hasOwn(items, index)) {
    throw new RangeError(`index ${String(index)} is an empty slot`);
  }
  return items[index] as Item;
}

/** Throw if `condition` is false: a broken contract, not a user error. */
export function check(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

/** Throw unless every number is finite. */
export function checkFinite(values: Iterable<number>, what: string): void {
  for (const value of values) {
    check(Number.isFinite(value), `${what} has ${String(value)}`);
  }
}
