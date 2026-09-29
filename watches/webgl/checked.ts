/** The item at `index`. `noUncheckedIndexedAccess` makes `items[index]` possibly
 *  undefined; this says that it is a bug if it is. */
export function at<Item>(items: ArrayLike<Item>, index: number): Item {
  if (index < 0 || index >= items.length) {
    throw new RangeError(
      `index ${String(index)} is outside 0..${String(items.length)}`,
    );
  }
  return items[index] as Item;
}
