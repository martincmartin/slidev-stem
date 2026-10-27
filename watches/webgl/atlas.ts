// Places for several pictures on one canvas (a sheet), so that a shared
// renderer draws them all before any is copied (shared.ts). The pictures go
// in rows, left to right, and the rows top to bottom. A picture that does
// not fit on the sheet starts a new sheet. A picture larger than the limit
// gets a sheet of its own, of its size.

import { check } from "./checked.ts";

/** A picture's place on a sheet: device px from the sheet's top left. */
export interface SheetPlace {
  /** Its index in the sizes given to `pack`. */
  readonly index: number;
  readonly at: readonly [number, number];
}

export interface Sheet {
  /** Device px: just large enough for its pictures. */
  readonly size: readonly [number, number];
  readonly places: readonly SheetPlace[];
}

/** The sheets for pictures of `sizes` (device px, whole numbers), each at
 *  most `limit` px wide and high but for a picture larger than that. Each
 *  picture is on one sheet, in the order given. */
export function pack(
  sizes: readonly (readonly [number, number])[],
  limit: number,
): Sheet[] {
  check(
    Number.isInteger(limit) && limit > 0,
    `a sheet limit of ${String(limit)}`,
  );
  const sheets: Sheet[] = [];
  let places: SheetPlace[] = [];
  let width = 0;
  let height = 0;
  /** The current row: its top, how far it reaches right, and its height. */
  let row = { top: 0, right: 0, height: 0 };
  const close = (): void => {
    if (places.length > 0) sheets.push({ size: [width, height], places });
    places = [];
    width = 0;
    height = 0;
    row = { top: 0, right: 0, height: 0 };
  };
  for (const [index, [pictureWidth, pictureHeight]] of sizes.entries()) {
    check(
      Number.isInteger(pictureWidth) &&
        Number.isInteger(pictureHeight) &&
        pictureWidth > 0 &&
        pictureHeight > 0,
      `a picture of ${String(pictureWidth)} x ${String(pictureHeight)} device px`,
    );
    if (pictureWidth > limit || pictureHeight > limit) {
      sheets.push({
        size: [pictureWidth, pictureHeight],
        places: [{ index, at: [0, 0] }],
      });
      continue;
    }
    if (row.right + pictureWidth > limit) {
      row = { top: row.top + row.height, right: 0, height: 0 };
    }
    if (row.top + pictureHeight > limit) close();
    places.push({ index, at: [row.right, row.top] });
    row.right += pictureWidth;
    row.height = Math.max(row.height, pictureHeight);
    width = Math.max(width, row.right);
    height = Math.max(height, row.top + row.height);
  }
  close();
  return sheets;
}
