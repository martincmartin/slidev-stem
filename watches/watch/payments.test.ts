import assert from "node:assert/strict";
import { test } from "node:test";
import { paymentsOf, totalOf, yearOf } from "./payments.ts";

test("a date is its year and the fraction of the year gone", () => {
  assert.equal(yearOf("1760-01-01"), 1760);
  assert.ok(Math.abs(yearOf("1737-06-30") - 1737.49) < 0.01);
});

test("the total has the pound sign and a comma", () => {
  assert.equal(
    totalOf([
      { date: "1773-06-19", pounds: 8750 },
      { date: "1765-10-28", pounds: 7500 },
    ]),
    "£16,250",
  );
});

test("a payment with no date is an error", () => {
  assert.throws(() => paymentsOf([{ pounds: 250 }]), /needs a date/);
});

test("there must be a payment", () => {
  assert.throws(() => paymentsOf([]), /at least one payment/);
});
