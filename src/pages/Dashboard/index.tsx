import { useEffect, useMemo, useState } from "react";
import GoalCard from "../../components/GoalCard/index";
import { statusLabel } from "../../utils/labels/index";

type Goal = {
  id: string;
  title: string;
  desc: string;
  due: string;
  status: "in-progress" | "blocked" | "done";
  impact: "high" | "medium" | "low";
  progress: number;
};

type FocusTask = {
  id: string;
  title: string;
  slot: string;
  status: "in-progress" | "blocked" | "done";
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

const FALLBACK_GOALS: Goal[] = [
  {
    id: "g1",
    title: "بستن گزارش هفتگی تیم",
    desc: "جمع‌بندی تسک‌های مهم و ریسک‌های این هفته",
    due: "تا آخر هفته",
    status: "in-progress",
    impact: "high",
    progress: 65,
  },
  {
    id: "g2",
    title: "تحویل نسخه MVP مشتری",
    desc: "دموی قابل ارائه همراه با چک‌لیست QA سبک",
    due: "۴ روز دیگر",
    status: "blocked",
    impact: "high",
    progress: 35,
  },
  {
    id: "g3",
    title: "مرتب‌سازی بک‌لاگ اسپرینت",
    desc: "گروه‌بندی کارت‌ها و حذف آیتم‌های قدیمی",
    due: "۲ روز دیگر",
    status: "in-progress",
    impact: "medium",
    progress: 50,
  },
];

const FALLBACK_FOCUS: FocusTask[] = [
  { id: "f1", title: "بازبینی PRهای معطل", slot: "۰۹:۳۰ - ۱۰:۰۰", status: "in-progress" },
  { id: "f2", title: "هماهنگی با طراحی برای اسکرین پرداخت", slot: "۱۱:۰۰ - ۱۱:۳۰", status: "blocked" },
  { id: "f3", title: "ارسال آپدیت برای استیک‌هولدرها", slot: "۱۶:۰۰ - ۱۶:۱۵", status: "in-progress" },
];

const FALLBACK_SCHEDULE: ScheduleItem[] = [
  { _id: "s1", title: "استندآپ تیم", day: todayKey(), hour: 9, tag: "meeting" },
  { _id: "s2", title: "Deep Work: تسک پرداخت", day: todayKey(), hour: 10, tag: "focus" },
  { _id: "s3", title: "ناهار و استراحت کوتاه", day: todayKey(), hour: 13, tag: "break" },
  { _id: "s4", title: "Sync با مارکتینگ", day: todayKey(), hour: 15, tag: "meeting" },
];

const FALLBACK_RISKS = [
  "وابستگی به API مالی که هنوز پایدار نیست",
  "تاخیر طراحی صفحه پرداخت",
  "کمبود ظرفیت تیم فرانت برای تسک‌های این هفته",
];

const FALLBACK_NOTIFS = [
  "۳ PR نیاز به بازبینی دارد",
  "تسک «تنظیم لاگ‌ها» ۱ روز تا موعد",
  "جلسه دمو مشتری به پنج‌شنبه منتقل شد",
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

function toImpact(priority?: string): Goal["impact"] {
  if (!priority) return "medium";
  const normalized = priority.toLowerCase();
  if (normalized.includes("high") || normalized === "high") return "high";
  if (normalized.includes("low") || normalized === "low") return "low";
  return "medium";
}

const formatFaNumber = new Intl.NumberFormat("fa-IR");

export default function DashboardPage() {
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [pool, setPool] = useState<PoolTask[]>([]);
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [projectSummary, setProjectSummary] = useState<ProjectsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        const poolData = poolRes.ok ? ((await poolRes.json()) as PoolTask[]) : [];
        const scheduleData = scheduleRes.ok ? ((await scheduleRes.json()) as ScheduleItem[]) : [];
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
    return { total, done, percent: total ? Math.round((done / total) * 100) : 0 };
  }, [schedule]);

  const hasLiveData = useMemo(
    () => Boolean(user) && (pool.length > 0 || schedule.length > 0),
    [user, pool, schedule]
  );

  const goals: Goal[] = useMemo(() => {
    const items: Goal[] = [];
    const combined = [...sortedSchedule, ...pool].slice(0, 3);
    combined.forEach((item, idx) => {
      const isSchedule = (item as ScheduleItem).hour !== undefined;
      const done = (item as ScheduleItem).done;
      items.push({
        id: (item as ScheduleItem)._id ?? `goal-${idx}`,
        title: item.title,
        desc: item.tag ? `برچسب: ${item.tag}` : isSchedule ? "تسک برنامه‌ریزی‌شده" : "از بک‌لاگ",
        due: isSchedule ? "امروز" : "بک‌لاگ",
        status: done ? "done" : "in-progress",
        impact: toImpact(item.priority),
        progress: done ? 100 : Math.min(90, 40 + idx * 15),
      });
    });

    if (projectSummary) {
      const impact =
        projectSummary.highestPriority !== undefined
          ? toImpact(projectSummary.highestPriority)
          : projectSummary.percent >= 75
          ? "high"
          : "medium";
      items.unshift({
        id: "project-progress",
        title: "پیشرفت پروژه‌ها",
        desc: `تکمیل ${formatFaNumber.format(projectSummary.doneTasks)} از ${formatFaNumber.format(
          projectSummary.totalTasks
        )} تسک پروژه‌ای`,
        due: projectSummary.nextDeadline ? `نزدیک‌ترین ددلاین: ${projectSummary.nextDeadline}` : "بدون ددلاین",
        status: projectSummary.percent >= 100 ? "done" : "in-progress",
        impact,
        progress: projectSummary.percent,
      });
    }

    if (items.length === 0) return FALLBACK_GOALS;
    return items.slice(0, 3);
  }, [sortedSchedule, pool, projectSummary]);

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
    if (hasLiveData) return [];
    return FALLBACK_SCHEDULE;
  }, [sortedSchedule, hasLiveData]);

  const riskList = useMemo(() => {
    const nowHour = new Date().getHours();
    const overdue = sortedSchedule
      .filter((item) => !item.done && item.hour < nowHour)
      .map((item) => `تسک «${item.title}» از ${formatHour(item.hour)} عقب افتاده است`);
    const backlogPressure =
      pool.length > 5 ? [`${formatFaNumber.format(pool.length)} تسک در بک‌لاگ منتظر زمان‌بندی است`] : [];
    const projectOverdue =
      projectSummary && projectSummary.overdueTasks
        ? [`${formatFaNumber.format(projectSummary.overdueTasks)} تسک پروژه عقب است`]
        : [];
    const combined = [...overdue, ...backlogPressure, ...projectOverdue];
    return combined.length ? combined : FALLBACK_RISKS;
  }, [sortedSchedule, pool.length, projectSummary]);

  const notifications = useMemo(() => {
    const notes: string[] = [];
    if (todayProgress.total) {
      notes.push(
        `${formatFaNumber.format(todayProgress.total - todayProgress.done)} مورد برای امروز باقی مانده`
      );
    }
    if (pool.length) {
      notes.push(`${formatFaNumber.format(pool.length)} تسک در بک‌لاگ منتظر است`);
    }
    if (todayProgress.done) {
      notes.push(`${formatFaNumber.format(todayProgress.done)} تسک امروز تیک خورد`);
    }
    if (projectSummary) {
      notes.push(
        `پروژه‌ها: ${formatFaNumber.format(projectSummary.doneTasks)}/${formatFaNumber.format(
          projectSummary.totalTasks
        )} (${formatFaNumber.format(projectSummary.percent)}٪)`
      );
      if (projectSummary.nextDeadline) {
        notes.push(`نزدیک‌ترین ددلاین پروژه: ${projectSummary.nextDeadline}`);
      }
    }
    return notes.length ? notes : FALLBACK_NOTIFS;
  }, [todayProgress, pool.length, projectSummary]);

  const streakDays = useMemo(() => {
    if (typeof window === "undefined") return 3;
    const raw = localStorage.getItem("taskmentor-streak");
    if (!raw) return 3;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
  }, []);

  const welcomeTitle = user?.username ? `خوش آمدی، ${user.username} 👋` : "خوش آمدی 👋";

  return (
    <div className="goals" dir="rtl">
      <header className="goals__header">
        <div>
          <p className="eyebrow">چشم‌انداز</p>
          <h1>داشبورد</h1>
          <p className="light">
            خوش‌آمدگویی، وضعیت اهداف کوتاه‌مدت، تمرکز امروز، ریسک‌ها و نوتیف‌ها.
            {loading && " (در حال بارگذاری...)"}
          </p>
          {error && <p className="error">{error}</p>}
        </div>
        <button className="primary">افزودن هدف جدید</button>
      </header>

      <section className="goal-quick">
        <div className="panel compact">
          <p className="eyebrow">{welcomeTitle}</p>
          <p className="light">
            {hasLiveData
              ? `امروز ${formatFaNumber.format(focusTasks.length)} کار مهم داری؛ اولی در ${focusTasks[0]?.slot} است.`
              : "نمونه داده برای شروع؛ با پر کردن برنامه، این بخش زنده می‌شود."}
          </p>
          <div className="counts">
            <span>{formatFaNumber.format(scheduleForToday.length)} تسک امروز</span>
            <span>{formatFaNumber.format(pool.length)} بک‌لاگ</span>
            <span>{formatFaNumber.format(goals.length)} هدف کوتاه</span>
            <span>{formatFaNumber.format(projectSummary?.totalProjects ?? 0)} پروژه</span>
          </div>
        </div>
        <div className="panel compact">
          <p className="eyebrow">KPI سریع</p>
          <p className="light">مرور کوتاه عملکرد امروز و پروژه‌ها.</p>
          <div className="counts">
            <span>
              {formatFaNumber.format(todayProgress.done)}/{formatFaNumber.format(todayProgress.total)} امروز
            </span>
            <span>پیشرفت: {formatFaNumber.format(todayProgress.percent)}٪</span>
            <span>بک‌لاگ: {formatFaNumber.format(pool.length)}</span>
            <span>
              پروژه‌ها: {formatFaNumber.format(projectSummary?.percent ?? 0)}٪
            </span>
          </div>
        </div>
        <div className="panel compact">
          <p className="eyebrow">عادت و استریک</p>
          <p className="light">
            {hasLiveData
              ? `${formatFaNumber.format(streakDays)} روز متوالی برنامه‌ریزی تکمیل شده`
              : "۳ روز متوالی برنامه‌ریزی روزانه تکمیل شده."}
          </p>
          <div className="counts">
            <span>⏱️ {formatFaNumber.format(scheduleForToday.length || 1)} بلوک تمرکز</span>
            <span>✅ {formatFaNumber.format(todayProgress.done)} تکمیل امروز</span>
          </div>
        </div>
      </section>

      <section className="goal-grid">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            title={goal.title}
            desc={goal.desc}
            due={goal.due}
            status={goal.status}
            impact={goal.impact}
            progress={goal.progress}
          />
        ))}
      </section>

      <section className="goal-quick">
        <div className="panel compact">
          <p className="eyebrow">تمرکز امروز</p>
          <p className="light">سه کاری که باید همین امروز جلو برود:</p>
          <div className="stacked-tasks">
            {focusTasks.map((task) => (
              <div key={task.id} className="stacked-task">
                <span className="stacked-task__title">{task.title}</span>
                <span className="pill">{task.slot}</span>
                <span className={`badge badge--${task.status}`}>{statusLabel(task.status)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel compact">
          <p className="eyebrow">برنامه امروز</p>
          <p className="light">هماهنگی جلسات، تمرکز و استراحت.</p>
          <div className="stacked-tasks">
            {scheduleForToday.map((item) => (
              <div key={item._id} className="stacked-task">
                <span className="pill">{formatHour(item.hour)}</span>
                <span className="stacked-task__title">{item.title}</span>
                <span className={`pill pill--${item.tag === "focus" ? "focus" : "meeting"}`}>
                  {scheduleLabel(item.tag)}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="panel compact">
          <p className="eyebrow">ریسک‌های فوری</p>
          <p className="light">مواردی که ممکن است اهداف کوتاه‌مدت را کند کند:</p>
          <ul className="list">
            {riskList.map((risk, idx) => (
              <li key={idx}>{risk}</li>
            ))}
          </ul>
        </div>
        <div className="panel compact">
          <p className="eyebrow">نوتیف و آپدیت</p>
          <p className="light">تغییرات تازه‌ای که باید بدانی:</p>
          <ul className="list">
            {notifications.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
