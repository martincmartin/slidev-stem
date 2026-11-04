// The payments on the Four Clocks slide. The slide's frontmatter holds them, and this
// places them on its years and totals them.

export interface Payment {
  readonly date: string;
  readonly pounds: number;
}

const DAY_MS = 86_400_000;
const POUNDS = new Intl.NumberFormat("en-US");

function payment(value: unknown): Payment {
  if (
    typeof value === "object" &&
    value !== null &&
    "date" in value &&
    "pounds" in value &&
    typeof value.date === "string" &&
    !Number.isNaN(Date.parse(value.date)) &&
    typeof value.pounds === "number" &&
    value.pounds > 0
  )
    return { date: value.date, pounds: value.pounds };
  throw new Error("each payment needs a date (YYYY-MM-DD) and pounds");
}

/** Frontmatter is outside data, so this checks it. */
export function paymentsOf(values: unknown): Payment[] {
  if (!Array.isArray(values) || values.length === 0)
    throw new Error("payments must be a list with at least one payment");
  return values.map(payment);
}

/** A date as a year and its fraction: 1 July 1737 is about 1737.5. */
export function yearOf(date: string): number {
  const year = Number(date.slice(0, 4));
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year + 1, 0, 1);
  const days = (Date.parse(date) - start) / DAY_MS;
  return year + days / ((end - start) / DAY_MS);
}

/** "£23,065" */
export function totalOf(payments: readonly Payment[]): string {
  const total = payments.reduce((sum, paid) => sum + paid.pounds, 0);
  return `£${POUNDS.format(total)}`;
}
