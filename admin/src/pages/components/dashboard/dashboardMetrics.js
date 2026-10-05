import { getLocale } from "../../../i18n/runtime.js";

export function startOfMonth(value) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function monthKey(value) {
  return `${value.getFullYear()}-${value.getMonth()}`;
}

export function getMonthBuckets(items, monthCount = 6) {
  const currentMonth = startOfMonth(new Date());
  const buckets = Array.from({ length: monthCount }, (_, index) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() - (monthCount - 1 - index),
      1,
    );
    return {
      date,
      key: monthKey(date),
      label: new Intl.DateTimeFormat(getLocale(), { month: "long" }).format(date),
      value: 0,
    };
  });

  items.forEach((item) => {
    if (!item.createdAt) return;
    const createdAt = new Date(item.createdAt);
    if (!Number.isFinite(createdAt.getTime())) return;
    const bucket = buckets.find((item) => item.key === monthKey(createdAt));
    if (bucket) bucket.value += 1;
  });

  let previousCount = items.filter((item) => {
    const createdAt = new Date(item.createdAt);
    return Number.isFinite(createdAt.getTime()) && createdAt < buckets[0].date;
  }).length;

  return buckets.map((bucket) => {
    previousCount += bucket.value;
    return { ...bucket, value: previousCount };
  });
}

export function getMonthlyGrowth(users) {
  const now = new Date();
  const currentStart = startOfMonth(now);
  const previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const current = users.filter((user) => new Date(user.createdAt) >= currentStart).length;
  const previous = users.filter((user) => {
    const date = new Date(user.createdAt);
    return date >= previousStart && date < currentStart;
  }).length;
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}
