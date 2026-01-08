import { CSSProperties, useEffect, useMemo, useState } from "react";

type FocusTask = {
  id: string;
  title: string;
  slot: string;
  status: "in-progress" | "blocked" | "done";
};

type RecentTask = {
  id: string;
  title: string;
  meta: string;
  status: "pending" | "done";
  durationMinutes?: number;
  remainingMinutes?: number;
};

type ScheduleItem = {
  _id: string;
  title: string;
  day: string;
  hour: number;
  tag?: string;
  priority?: string;
  done?: boolean;
};

type PoolTask = {
  _id: string;
  title: string;
  tag?: string;
  priority?: string;
};

type DashboardUser = { userId: string; username?: string };

type ProjectsSummary = {
  totalProjects: number;
  totalTasks: number;
  doneTasks: number;
  percent: number;
  nextDeadline?: string;
  overdueTasks: number;
  highestPriority?: "high" | "medium" | "low";
};

const PROJECTS_SUMMARY_KEY = "taskmentor-projects-summary";

const FALLBACK_FOCUS: FocusTask[] = [
  {
    id: "f1",
    title: "بازبینی PRهای معطل",
    slot: "۰۹:۳۰ - ۱۰:۰۰",
    status: "in-progress",
  },
  {
    id: "f2",
    title: "هماهنگی با طراحی برای اسکرین پرداخت",
    slot: "۱۱:۰۰ - ۱۱:۳۰",
    status: "blocked",
  },
  {
    id: "f3",
    title: "ارسال آپدیت برای استیک‌هولدرها",
    slot: "۱۶:۰۰ - ۱۶:۱۵",
    status: "in-progress",
  },
];

const FALLBACK_SCHEDULE: ScheduleItem[] = [
  { _id: "s1", title: "استندآپ تیم", day: todayKey(), hour: 9, tag: "meeting" },
  {
    _id: "s2",
    title: "Deep Work: تسک پرداخت",
    day: todayKey(),
    hour: 10,
    tag: "focus",
  },
  {
    _id: "s3",
    title: "ناهار و استراحت کوتاه",
    day: todayKey(),
    hour: 13,
    tag: "break",
  },
  {
    _id: "s4",
    title: "Sync با مارکتینگ",
    day: todayKey(),
    hour: 15,
    tag: "meeting",
  },
];

const FALLBACK_NOTIFS = [
  "۳ PR نیاز به بازبینی دارد",
  "تسک «تنظیم لاگ‌ها» ۱ روز تا موعد",
  "جلسه دمو مشتری به پنج‌شنبه منتقل شد",
];

const TASK_TIME_OVERRIDES: Record<
  string,
  { durationMinutes: number; remainingMinutes?: number }
> = {
  sdvsdv: { durationMinutes: 420, remainingMinutes: 420 },
};

const PENDING_DEFAULTS = [
  { durationMinutes: 60, remainingMinutes: 20 },
  { durationMinutes: 90, remainingMinutes: 30 },
];

function todayKey(reference = new Date()) {
  const y = reference.getUTCFullYear();
  const m = reference.getUTCMonth();
  const d = reference.getUTCDate();
  return new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
}

function formatHour(hour: number) {
  return `${hour.toString().padStart(2, "0")}:00`;
}

function scheduleLabel(type: ScheduleItem["tag"] | undefined) {
  const map: Record<string, string> = {
    focus: "تمرکز",
    meeting: "جلسه",
    break: "استراحت",
  };
  return map[type ?? ""] ?? "تسک";
}

const formatFaNumber = new Intl.NumberFormat("fa-IR");

function resolveTaskTiming(title: string, fallbackIndex: number) {
  const key = title.trim().toLowerCase();
  const overrideEntry = Object.entries(TASK_TIME_OVERRIDES).find(([needle]) =>
    key.includes(needle)
  );
  if (overrideEntry) {
    const override = overrideEntry[1];
    return {
      durationMinutes: override.durationMinutes,
      remainingMinutes: override.remainingMinutes ?? override.durationMinutes,
    };
  }
  const fallback = PENDING_DEFAULTS[fallbackIndex] ?? PENDING_DEFAULTS[0];
  return {
    durationMinutes: fallback.durationMinutes,
    remainingMinutes: fallback.remainingMinutes ?? fallback.durationMinutes,
  };
}

export default function DashboardPage() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [pool, setPool] = useState<PoolTask[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [projectSummary, setProjectSummary] = useState<ProjectsSummary | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [taskTimers, setTaskTimers] = useState<Record<string, number>>({});
  const [readNotifs, setReadNotifs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem("taskmentor-user");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as DashboardUser;
      setUser(parsed);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function loadProjectSummary() {
      try {
        const raw = localStorage.getItem(PROJECTS_SUMMARY_KEY);
        if (!raw) {
          setProjectSummary(null);
          return;
        }
        const parsed = JSON.parse(raw) as ProjectsSummary;
        setProjectSummary(parsed);
      } catch {
        setProjectSummary(null);
      }
    }
    loadProjectSummary();
    const listener = () => loadProjectSummary();
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);

  useEffect(() => {
    if (!user) return;
    const { userId } = user;
    let active = true;
    setLoading(true);
    setError("");
    const day = todayKey();

    async function load() {
      try {
        const [poolRes, scheduleRes] = await Promise.all([
          fetch(`/api/pool?userId=${userId}`),
          fetch(`/api/schedule/${day}?userId=${userId}`),
        ]);
        const poolData = poolRes.ok
          ? ((await poolRes.json()) as PoolTask[])
          : [];
        const scheduleData = scheduleRes.ok
          ? ((await scheduleRes.json()) as ScheduleItem[])
          : [];
        if (!active) return;
        setPool(poolData);
        setSchedule(scheduleData);
        if (!poolRes.ok || !scheduleRes.ok) {
          setError("خطا در دریافت داده‌های داشبورد");
        }
      } catch {
        if (!active) return;
        setError("خطا در برقراری ارتباط با سرور");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user]);

  const sortedSchedule = useMemo(
    () => [...schedule].sort((a, b) => a.hour - b.hour),
    [schedule]
  );

  const todayProgress = useMemo(() => {
    const total = schedule.length;
    const done = schedule.filter((item) => item.done).length;
    return {
      total,
      done,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  }, [schedule]);

  const hasLiveData = useMemo(
    () => Boolean(user) && (pool.length > 0 || schedule.length > 0),
    [user, pool, schedule]
  );

  const focusTasks: FocusTask[] = useMemo(() => {
    if (sortedSchedule.length) {
      return sortedSchedule.slice(0, 3).map((item) => ({
        id: item._id,
        title: item.title,
        slot: `${formatHour(item.hour)} - ${formatHour(item.hour + 1)}`,
        status: item.done ? "done" : "in-progress",
      }));
    }
    if (hasLiveData && pool.length) {
      return pool.slice(0, 3).map((task, idx) => ({
        id: task._id ?? `pool-${idx}`,
        title: task.title,
        slot: "در انتظار زمان‌بندی",
        status: "in-progress",
      }));
    }
    return FALLBACK_FOCUS;
  }, [sortedSchedule, hasLiveData, pool]);

  const scheduleForToday = useMemo(() => {
    if (sortedSchedule.length) return sortedSchedule;
    if (!user) return FALLBACK_SCHEDULE;
    return [];
  }, [sortedSchedule, user]);

  const recentPendingTasks = useMemo<RecentTask[]>(() => {
    const pendingSchedule = scheduleForToday.filter((item) => !item.done);
    const pendingFromSchedule = pendingSchedule.slice(-2).reverse();
    const pending: RecentTask[] = pendingFromSchedule.map((item, index) => {
      const timing = resolveTaskTiming(item.title, index);
      return {
        id: item._id,
        title: item.title,
        meta: formatHour(item.hour),
        status: "pending",
        durationMinutes: timing.durationMinutes,
        remainingMinutes: timing.remainingMinutes,
      };
    });
    if (pending.length < 2 && pool.length) {
      const needed = 2 - pending.length;
      const extras = pool.slice(0, needed).map((task, idx) => {
        const index = pending.length + idx;
        const timing = resolveTaskTiming(task.title, index);
        return {
          id: task._id ?? `pool-${idx}`,
          title: task.title,
          meta: task.tag ? `برچسب: ${task.tag}` : "بک‌لاگ",
          status: "pending" as const,
          durationMinutes: timing.durationMinutes,
          remainingMinutes: timing.remainingMinutes,
        };
      });
      pending.push(...extras);
    }
    return pending;
  }, [scheduleForToday, pool]);

  const latestDoneTask = useMemo<RecentTask | null>(() => {
    const doneTasks = scheduleForToday.filter((item) => item.done);
    const latest = doneTasks[doneTasks.length - 1];
    if (!latest) return null;
    return {
      id: latest._id,
      title: latest.title,
      meta: formatHour(latest.hour),
      status: "done",
    };
  }, [scheduleForToday]);

  const riskList = useMemo(() => {
    const nowHour = new Date().getHours();
    const overdue = sortedSchedule
      .filter((item) => !item.done && item.hour < nowHour)
      .map(
        (item) =>
          `تسک «${item.title}» از ${formatHour(item.hour)} عقب افتاده است`
      );
    const backlogPressure =
      pool.length > 5
        ? [
            `${formatFaNumber.format(
              pool.length
            )} تسک در بک‌لاگ منتظر زمان‌بندی است`,
          ]
        : [];
    const projectOverdue =
      projectSummary && projectSummary.overdueTasks
        ? [
            `${formatFaNumber.format(
              projectSummary.overdueTasks
            )} تسک پروژه عقب است`,
          ]
        : [];
    const combined = [...overdue, ...backlogPressure, ...projectOverdue];
  }, [sortedSchedule, pool.length, projectSummary]);

  const notifications = useMemo(() => {
    const notes: string[] = [];
    if (todayProgress.total) {
      notes.push(
        `${formatFaNumber.format(
          todayProgress.total - todayProgress.done
        )} مورد برای امروز باقی مانده`
      );
    }
    if (pool.length) {
      notes.push(
        `${formatFaNumber.format(pool.length)} تسک در بک‌لاگ منتظر است`
      );
    }
    if (todayProgress.done) {
      notes.push(
        `${formatFaNumber.format(todayProgress.done)} تسک امروز تیک خورد`
      );
    }
    if (projectSummary) {
      notes.push(
        `پروژه‌ها: ${formatFaNumber.format(
          projectSummary.doneTasks
        )}/${formatFaNumber.format(
          projectSummary.totalTasks
        )} (${formatFaNumber.format(projectSummary.percent)}٪)`
      );
      if (projectSummary.nextDeadline) {
        notes.push(`نزدیک‌ترین ددلاین پروژه: ${projectSummary.nextDeadline}`);
      }
    }
    return notes.length ? notes : FALLBACK_NOTIFS;
  }, [todayProgress, pool.length, projectSummary]);

  useEffect(() => {
    setTaskTimers(() => {
      const next: Record<string, number> = {};
      recentPendingTasks.forEach((task) => {
        const remainingMinutes = task.remainingMinutes ?? 0;
        next[task.id] = Math.max(0, Math.round(remainingMinutes * 60));
      });
      return next;
    });
  }, [recentPendingTasks]);

  useEffect(() => {
    if (!recentPendingTasks.length) return;
    const timer = window.setInterval(() => {
      setTaskTimers((prev) => {
        const next: Record<string, number> = {};
        Object.entries(prev).forEach(([key, value]) => {
          next[key] = Math.max(0, value - 1);
        });
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recentPendingTasks.length]);

  const unreadNotifications = useMemo(
    () => notifications.filter((note) => !readNotifs[note]),
    [notifications, readNotifs]
  );

  function formatTimer(seconds: number) {
    const clamped = Math.max(0, seconds);
    const hrs = Math.floor(clamped / 3600);
    const mins = Math.floor((clamped % 3600) / 60);
    const secs = clamped % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  const streakDays = useMemo(() => {
    if (typeof window === "undefined") return 3;
    const raw = localStorage.getItem("taskmentor-streak");
    if (!raw) return 3;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
  }, []);

  const welcomeTitle = user?.username
    ? `خوش آمدی، ${user.username} 👋`
    : "خوش آمدی 👋";

  return (
    <div className="goals" dir="rtl">
      <header className="goals__header">
        <div>
          <h1>داشبورد</h1>
          {error && <p className="error">{error}</p>}
        </div>
      </header>

      <section className="goal-quick goal-quick--two-col">
        <div className="panel compact panel--centered">
          <p className="eyebrow">{welcomeTitle}</p>
          <p className="light">
            <span className="typing-text">
              حقیقتی که در ذهن شما شکل میگیرد ، روزی تبدیل به واقعیت خواهد شد
              ...
            </span>
          </p>
          <div className="counts">
            <span>
              {formatFaNumber.format(scheduleForToday.length)} تسک امروز
            </span>
            <span>
              {formatFaNumber.format(projectSummary?.totalProjects ?? 0)} پروژه
            </span>
          </div>
        </div>
      </section>

      <section className="goal-quick goal-quick--two-col">
        <div className="panel compact">
          <p className="eyebrow">برنامه امروز</p>
          <p className="light">هماهنگی جلسات، تمرکز و استراحت.</p>
          <div className="stacked-tasks">
            {scheduleForToday.map((item) => (
              <div key={item._id} className="stacked-task">
                <span className="pill">{formatHour(item.hour)}</span>
                <span className="stacked-task__title">{item.title}</span>
                <span
                  className={`pill pill--${
                    item.tag === "focus" ? "focus" : "meeting"
                  }`}
                >
                  {scheduleLabel(item.tag)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel compact">
          <p className="eyebrow">تسک های اخیر</p>
          <p className="small">انجام نشده</p>
          <div className="stacked-tasks">
            {recentPendingTasks.length ? (
              recentPendingTasks.map((task, index) => {
                const durationMinutes = task.durationMinutes ?? 60;
                const totalSeconds = Math.max(1, durationMinutes * 60);
                const remainingSeconds =
                  taskTimers[task.id] ??
                  Math.round(
                    (task.remainingMinutes ?? durationMinutes) * 60
                  );
                const progress = Math.min(
                  1,
                  Math.max(0, 1 - remainingSeconds / totalSeconds)
                );
                return (
                  <div
                    key={task.id}
                    className="stacked-task stacked-task--pending"
                    style={{ "--progress": progress } as CSSProperties}
                  >
                    {index < 2 && <span className="pending-dot" />}
                    <div className="pending-body">
                      <span className="stacked-task__title">{task.title}</span>
                      <span className="pending-meta">{task.meta}</span>
                    </div>
                    <span className="pending-timer" dir="ltr">
                      {formatTimer(remainingSeconds)}
                    </span>
                    <span className="badge badge--in-progress">انجام نشده</span>
                  </div>
                );
              })
            ) : (
              <p className="empty">تسک معوقی ندارید.</p>
            )}
          </div>
          <p className="small">آخرین انجام شده</p>
          <div className="stacked-tasks">
            {latestDoneTask ? (
              <div className="stacked-task">
                <span className="stacked-task__title">
                  {latestDoneTask.title}
                </span>
                <span className="pill">{latestDoneTask.meta}</span>
                <span className="badge badge--done">انجام شد</span>
              </div>
            ) : (
              <p className="empty">تسک انجام شده‌ای ثبت نشده.</p>
            )}
          </div>
        </div>
      </section>

      <section className="goal-quick">
        <div className="panel compact">
          <div className="notifications__header">
            <div>
              <p className="eyebrow">اعلان‌های خوانده نشده</p>
              <p className="small">
                {unreadNotifications.length
                  ? `${formatFaNumber.format(
                      unreadNotifications.length
                    )} اعلان جدید`
                  : "همه اعلان ها خونده شدن رفیق !"}
              </p>
            </div>
            <button
              className="icon-button"
              type="button"
              onClick={() =>
                setReadNotifs((prev) => {
                  const next = { ...prev };
                  notifications.forEach((note) => {
                    next[note] = true;
                  });
                  return next;
                })
              }
              disabled={!unreadNotifications.length}
              aria-label="علامت‌زدن همه اعلان‌ها به عنوان خوانده شده"
              title="تیک همه"
            >
              ✓✓
            </button>
          </div>
          <div className="stacked-tasks">
            {unreadNotifications.length ? (
              unreadNotifications.map((note) => (
                <div key={note} className="stacked-task stacked-task--note">
                  <span className="stacked-task__title">{note}</span>
                  <button
                    className="icon-button icon-button--tiny"
                    type="button"
                    onClick={() =>
                      setReadNotifs((prev) => ({ ...prev, [note]: true }))
                    }
                    aria-label="خوانده شد"
                    title="خوانده شد"
                  >
                    ✓
                  </button>
                </div>
              ))
            ) : (
              <p className="empty">همه اعلان ها خونده شدن رفیق !</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
