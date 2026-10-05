import test from "node:test";
import assert from "node:assert/strict";
import { getMonthBuckets } from "./dashboardMetrics.js";

test("builds cumulative growth buckets for the requested period", () => {
  const now = new Date();
  const beforeRange = new Date(now.getFullYear(), now.getMonth() - 7, 10);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 10);
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 10);

  const buckets = getMonthBuckets([
    { createdAt: beforeRange },
    { createdAt: previousMonth },
    { createdAt: currentMonth },
    { createdAt: "invalid" },
  ], 6);

  assert.equal(buckets.length, 6);
  assert.equal(buckets[0].value, 1);
  assert.equal(buckets.at(-2).value, 2);
  assert.equal(buckets.at(-1).value, 3);
});
