import ScheduledItem from "../models/ScheduledItem.js";
import catchAsync from "../utils/catchAsync.js";

const dayKey = (date) => date.toISOString().slice(0, 10);
const addDays = (date, delta) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + delta);
  return next;
};

function sumHours(tasks) {
  return tasks.reduce((total, task) => total + (Number(task.duration) || 1), 0);
}

function activeStreak(days) {
  let count = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i].hours > 0) count += 1;
    else break;
  }
  return count;
}

export const getReports = catchAsync(async (req, res) => {
  const now = new Date();
  const today = dayKey(now);
  const last7Start = dayKey(addDays(now, -6));
  const previousStart = dayKey(addDays(now, -13));
  const previousEnd = dayKey(addDays(now, -7));

  const tasks = await ScheduledItem.find({
    user: req.user._id,
    day: { $gte: previousStart, $lte: today },
  }).lean();

  const last7Days = Array.from({ length: 7 }, (_, index) => {
    const day = dayKey(addDays(now, index - 6));
    const dayTasks = tasks.filter((task) => task.day === day);
    return {
      day,
      hours: sumHours(dayTasks),
      done: dayTasks.filter((task) => task.done).length,
      total: dayTasks.length,
    };
  });

  const todayTasks = tasks.filter((task) => task.day === today);
  const weekTasks = tasks.filter((task) => task.day >= last7Start);
  const previousTasks = tasks.filter(
    (task) => task.day >= previousStart && task.day <= previousEnd,
  );
  const doneCount = weekTasks.filter((task) => task.done).length;
  const previousHours = sumHours(previousTasks);
  const weekHours = sumHours(weekTasks);
  const growth =
    previousHours === 0
      ? weekHours > 0
        ? 100
        : 0
      : Math.round(((weekHours - previousHours) / previousHours) * 100);

  const breakdownMap = new Map();
  weekTasks.forEach((task) => {
    const tag = task.tag || "بدون برچسب";
    breakdownMap.set(tag, (breakdownMap.get(tag) || 0) + (Number(task.duration) || 1));
  });

  return res.status(200).json({
    success: true,
    data: {
      summary: {
        todayHours: sumHours(todayTasks),
        weekHours,
        completionPercent:
          weekTasks.length === 0 ? 0 : Math.round((doneCount / weekTasks.length) * 100),
        remainingTasks: weekTasks.length - doneCount,
      },
      chart: last7Days,
      streak: activeStreak(last7Days),
      growth,
      breakdown: Array.from(breakdownMap, ([tag, hours]) => ({ tag, hours })),
    },
  });
});
