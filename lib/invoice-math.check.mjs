// Run: node lib/invoice-math.check.mjs  (Node 22.18+ loads the .ts import directly)
import assert from "node:assert/strict";
import { totals } from "./invoice-math.ts";

// Lines round to paise before summing, so printed lines add up to the printed subtotal.
assert.deepEqual(totals([{ description: "a", qty: 3, rate: 33.333 }, { description: "b", qty: 1, rate: 0.005 }], 18), { subtotal: 100.01, tax: 18, total: 118.01 });
assert.deepEqual(totals([{ description: "Brand film", qty: 1, rate: 150000 }], 0), { subtotal: 150000, tax: 0, total: 150000 });
assert.deepEqual(totals([], 18), { subtotal: 0, tax: 0, total: 0 });
console.log("invoice-math ok");
