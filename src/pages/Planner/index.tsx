import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiCheck,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiX,
  FiCopy,
  FiClipboard,
} from "react-icons/fi";
import DeleteModal from "../../components/DeleteModal";
import PriorityDropdown from "../../components/PriorityDropdown/index";
import { loadPriorities, type Priority } from "../../utils/priorities/index";
const PRIORITY_LEVELS = [
  { id: undefined, label: "بدون اولویت", color: "var(--priority-none, #555a65)" },
  { id: "low", label: "پایین", color: "#2ecc71" },
  { id: "medium", label: "متوسط", color: "#f39c12" },
  { id: "high", label: "بالا", color: "#ff5f6d" },
];
type BaseTag = "focus" | "meeting" | "errand";

type Task = {
  id: string;
  title: string;
  tag?: BaseTag | string;
  priorityId?: string;
};

type ScheduledTask = Task & {
  hour: number;
  day: string;
  done?: boolean;
};

type CopiedTask = {
  id: string;
  title: string;
  tag?: Task["tag"];
  priorityId?: string;
  hour?: number;
  day?: string;
  source: "pool" | "scheduled";
};

type DeleteModalState = {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
};

type UndoPayload =
  | { type: "pool"; tasks: Task[] }
  | { type: "scheduled"; tasks: ScheduledTask[]; day: string };

type MergedBlock = {
  task: ScheduledTask;
  start: number;
  end: number;
};

type JalaliDateParts = {
  jy: number;
  jm: number;
  jd: number;
};

type JalaliMonthDays = Array<number | null>;

type GregorianDateParts = {
  gy: number;
  gm: number;
  gd: number;
};

type StorageShape = {
  notes?: Record<string, string>;
  customTags?: string[];
};

const PRIORITY_RANK: Record<string, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

const STORAGE_KEY = "taskmentor-data";
const PERSIAN_NUMBER = new Intl.NumberFormat("fa-IR");
const FALLBACK_HEX = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

function generateId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
      .join("")
      .replace(
        /^(.{8})(.{4})(.{4})(.{4})(.{12}).*/,
        (_m, p1, p2, p3, p4, p5) => `${p1}-${p2}-${p3}-${p4}-${p5}`
      );
  }
  return FALLBACK_HEX.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const tagLabels: Record<BaseTag, string> = {
  focus: "تمرکز",
  meeting: "جلسه",
  errand: "کارهای ریز",
};
const baseTags: BaseTag[] = ["focus", "meeting", "errand"];

const hours = Array.from({ length: 24 }, (_, i) => i);

function formatHour(hour: number) {
  return `${hour.toString().padStart(2, "0")}:00`;
}

function todayKey(reference = new Date()) {
  return dateKeyFromGregorian(
    reference.getUTCFullYear(),
    reference.getUTCMonth() + 1,
    reference.getUTCDate()
  );
}

function readStorage(): StorageShape {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as StorageShape;
    return {
      notes: parsed.notes ?? {},
      customTags: parsed.customTags ?? [],
    };
  } catch (e) {
    console.warn("Failed to parse stored data, resetting.", e);
    return {};
  }
}

function PlannerPage() {
  const [activeDay, setActiveDay] = useState<string>(todayKey());
  const [pool, setPool] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<Record<string, ScheduledTask[]>>({});
  const [notes] = useState<Record<string, string>>(
    () => readStorage().notes ?? {}
  );
  const [customTags, setCustomTags] = useState<string[]>(
    () => readStorage().customTags ?? []
  );
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskTag, setNewTaskTag] = useState<Task["tag"]>();
  const [filterTag, setFilterTag] = useState<string | "all">("all");
  const [search] = useState("");
  const [hoverHour, setHoverHour] = useState<number | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [jalaliMonthView, setJalaliMonthView] = useState(() =>
    toJalaliParts(new Date())
  );
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [tagModalValue, setTagModalValue] = useState("");
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [tagModalError, setTagModalError] = useState("");
  const [formError, setFormError] = useState("");
  const [priorities, setPriorities] = useState<Priority[]>(() => loadPriorities());
  const [newTaskPriority, setNewTaskPriority] = useState<string | undefined>();
  const copyTimeoutRef = useRef<number | null>(null);
  const [undoToast, setUndoToast] = useState<UndoPayload | null>(null);
  const [undoTimer, setUndoTimer] = useState<number | null>(null);
  const [toastKey, setToastKey] = useState(0);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);
  const [deleteModalBusy, setDeleteModalBusy] = useState(false);
  const [poolHover, setPoolHover] = useState(false);
  const [calendarModal, setCalendarModal] = useState<null | "month" | "year">(
    null
  );
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [copiedTask, setCopiedTask] = useState<CopiedTask | null>(null);
  const userId = useMemo(() => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem("taskmentor-user");
    if (!raw) return null;
    try {
      const parsed = (JSON.parse(raw) as { userId: string }).userId;
      return /^[a-f\d]{24}$/i.test(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, []);

  const loadPool = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/pool?userId=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load pool");
      const mapped =
        Array.isArray(data) && data.length > 0
          ? data.map((t: any) => ({
              id: t._id ?? t.id,
              title: t.title,
              tag: t.tag,
              priorityId: t.priority,
            }))
          : [];
      setPool(mapped);
    } catch (err) {
      console.error(err);
      setPool([]);
    }
  }, [userId]);

  const loadSchedule = useCallback(
    async (day: string) => {
      if (!userId) return;
      try {
        const res = await fetch(`/api/schedule/${day}?userId=${userId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to load schedule");
        const mapped =
          Array.isArray(data) && data.length > 0
            ? data.map((item: any) => ({
                id: item._id ?? item.id,
                title: item.title,
                tag: item.tag,
                priorityId: item.priority,
                day: item.day,
                hour: Number(item.hour),
                done: Boolean(item.done),
              }))
            : [];
        setSchedule((prev) => ({ ...prev, [day]: mapped }));
      } catch (err) {
        console.error(err);
      }
    },
    [userId]
  );

  useEffect(() => {
    const payload: StorageShape = { notes, customTags };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [notes, customTags]);

  useEffect(() => {
    function syncPriorities() {
      setPriorities(loadPriorities());
    }
    window.addEventListener("storage", syncPriorities);
    return () => window.removeEventListener("storage", syncPriorities);
  }, []);


  useEffect(() => {
    if (!userId) return;
    loadPool();
  }, [userId, loadPool]);

  useEffect(() => {
    if (!userId) return;
    loadSchedule(activeDay);
  }, [userId, activeDay, loadSchedule]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!undoToast) return;
      const isUndo = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z";
      if (isUndo) {
        e.preventDefault();
        handleUndo();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undoToast, schedule]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const activeDate = useMemo(
    () => new Date(`${activeDay}T00:00:00Z`),
    [activeDay]
  );
  const currentDayKey = useMemo(() => todayKey(now), [now]);
  const dayPosition = useMemo<"past" | "today" | "future">(() => {
    if (activeDay === currentDayKey) return "today";
    return activeDay < currentDayKey ? "past" : "future";
  }, [activeDay, currentDayKey]);

  const daySchedule = useMemo(
    () => sortByHour(schedule[activeDay] ?? []),
    [schedule, activeDay]
  );

  const dayDoneCount = useMemo(
    () => daySchedule.filter((t) => t.done).length,
    [daySchedule]
  );
  const dayPendingCount = useMemo(
    () => Math.max(0, daySchedule.length - dayDoneCount),
    [daySchedule.length, dayDoneCount]
  );

  const dayProgress = useMemo(() => {
    if (dayPosition === "past") return 100;
    if (dayPosition === "future") return 0;
    const minutes = now.getHours() * 60 + now.getMinutes();
    const ratio = minutes / (24 * 60);
    return Math.max(0, Math.min(100, Math.round(ratio * 100)));
  }, [dayPosition, now]);

  const jalaliActiveDate = useMemo(
    () => toJalaliParts(activeDate),
    [activeDate]
  );
  const jalaliToday = useMemo(() => toJalaliParts(now), [now]);
  const jalaliMonthName = useMemo(
    () => formatJalaliMonthName(jalaliMonthView),
    [jalaliMonthView]
  );
  const jalaliMonthDays = useMemo<JalaliMonthDays>(() => {
    return buildJalaliMonthDays(jalaliMonthView.jy, jalaliMonthView.jm);
  }, [jalaliMonthView]);
  const allTags = useMemo(() => {
    const merged = [...baseTags, ...customTags];
    return Array.from(new Set(merged));
  }, [customTags]);

  useEffect(() => {
    setJalaliMonthView(toJalaliParts(activeDate));
  }, [activeDate]);

  const mergedBlocks = useMemo(
    () => mergeConsecutive(daySchedule),
    [daySchedule]
  );

  const blocksByStart = useMemo(() => {
    const map = new Map<number, MergedBlock>();
    mergedBlocks.forEach((b) => map.set(b.start, b));
    return map;
  }, [mergedBlocks]);

  const coveringBlocks = useMemo(() => {
    const map = new Map<number, MergedBlock>();
    mergedBlocks.forEach((b) => {
      for (let h = b.start + 1; h < b.end; h += 1) {
        map.set(h, b);
      }
    });
    return map;
  }, [mergedBlocks]);

  const previousDays = useMemo(() => {
    const keys = Object.keys(schedule);
    return keys
      .filter((k) => k !== activeDay)
      .sort()
      .slice(-4)
      .reverse();
  }, [schedule, activeDay]);

  function showUndoToast(payload: UndoPayload) {
    if (undoTimer) window.clearTimeout(undoTimer);
    setUndoToast(payload);
    setToastKey((k) => k + 1);
    const timer = window.setTimeout(() => setUndoToast(null), 5000);
    setUndoTimer(timer);
  }

  async function handleUndo() {
    if (!undoToast) return;
    if (undoTimer) window.clearTimeout(undoTimer);
    setUndoTimer(null);
    const payload = undoToast;
    setUndoToast(null);
    if (!userId) return;
    try {
      if (payload.type === "pool") {
        await Promise.all(
          payload.tasks.map((t) =>
            fetch("/api/pool", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: t.title,
                tag: t.tag,
                userId,
              }),
            })
          )
        );
        await loadPool();
      } else {
        await Promise.all(
          payload.tasks.map((t) =>
            fetch("/api/schedule", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: t.title,
                tag: t.tag,
                day: t.day,
                hour: t.hour,
                done: t.done,
                userId,
              }),
            })
          )
        );
        await loadSchedule(payload.day);
      }
    } catch (err) {
      console.error("Failed to undo", err);
    }
  }

  async function copyLatestDayIntoActive() {
    if (!userId) return;
    const source = previousDays[0];
    if (!source) return;
    const sourceTasks = schedule[source] ?? [];
    if (sourceTasks.length === 0) return;
    try {
      await Promise.all(
        sourceTasks.map((t) =>
          fetch("/api/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: t.title,
                tag: t.tag,
                priority: t.priorityId,
                day: activeDay,
                hour: t.hour,
                done: false,
                userId,
              }),
          })
        )
      );
      await loadSchedule(activeDay);
    } catch (err) {
      console.error("Failed to copy day", err);
    }
  }

  async function clearActiveDay() {
    if (!userId) return;
    const tasks = schedule[activeDay] ?? [];
    if (tasks.length === 0) return;
    try {
      await Promise.all(
        tasks.map((t) =>
          fetch(`/api/schedule/${t.id}?userId=${userId}`, { method: "DELETE" })
        )
      );
      await Promise.all(
        tasks.map((t) =>
          fetch("/api/pool", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: t.title,
              tag: t.tag,
              userId,
            }),
          })
        )
      );
      await Promise.all([loadSchedule(activeDay), loadPool()]);
    } catch (err) {
      console.error("Failed to clear day", err);
    }
  }

  async function handleAddTask() {
    if (!userId) {
      setFormError("برای افزودن، دوباره وارد حساب شو.");
      return;
    }
    setFormError("");
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    const tagToUse = newTaskTag;
    try {
      const res = await fetch("/api/pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed, tag: tagToUse, priority: newTaskPriority, userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to add task");
      const task: Task = {
        id: data._id ?? data.id ?? generateId(),
        title: data.title ?? trimmed,
        tag: data.tag ?? tagToUse,
        priorityId: data.priority ?? newTaskPriority,
      };
      setPool((prev) => [task, ...prev]);
      if (tagToUse) setFilterTag(tagToUse as string);
      setNewTaskTitle("");
    } catch (err) {
      console.error("Failed to add task", err);
      setFormError("افزودن تسک انجام نشد. اتصال یا ورود را چک کن.");
    }
  }

  async function handleDrop(hour: number, data: string) {
    let parsed: {
      type: "pool" | "scheduled";
      id: string;
      day?: string;
    } | null = null;
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }
    if (!parsed) return;

    if (parsed.type === "pool") {
      const task = pool.find((t) => t.id === parsed?.id);
      if (!task || !userId) return;
      try {
        const res = await fetch("/api/schedule", {
          method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: task.title,
              tag: task.tag,
              priority: task.priorityId,
              day: activeDay,
              hour,
              done: false,
              userId,
            }),
        });
        const created = await res.json();
        if (!res.ok) throw new Error(created?.message || "Failed to schedule task");
        await fetch(`/api/pool/${task.id}?userId=${userId}`, {
          method: "DELETE",
        });
        setPool((prev) => prev.filter((t) => t.id !== task.id));
        await loadPool();
        await loadSchedule(activeDay);
      } catch (err) {
        console.error("Failed to move task into schedule", err);
      }
    }

    if (parsed.type === "scheduled") {
      const fromDay = parsed.day ?? activeDay;
      const existing = schedule[fromDay] ?? [];
      const task = existing.find((t) => t.id === parsed?.id);
      if (!task || !userId) return;

      try {
        const res = await fetch(`/api/schedule/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day: activeDay, hour, userId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Failed to move scheduled task");
        if (fromDay === activeDay) {
          await loadSchedule(activeDay);
        } else {
          await Promise.all([loadSchedule(fromDay), loadSchedule(activeDay)]);
        }
      } catch (err) {
        console.error("Failed to move scheduled task", err);
      }
    }
  }

  async function handleDropToPool(data: string) {
    let parsed: {
      type: "pool" | "scheduled";
      id: string;
      day?: string;
    } | null = null;
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }
    if (!parsed || parsed.type !== "scheduled") return;

    const fromDay = parsed.day ?? activeDay;
    const existing = schedule[fromDay] ?? [];
    const task = existing.find((t) => t.id === parsed.id);
    if (!task || !userId) return;

    try {
      await fetch(`/api/schedule/${task.id}?userId=${userId}`, {
        method: "DELETE",
      });
      await fetch("/api/pool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          tag: task.tag,
          priority: task.priorityId,
          userId,
        }),
      });
      await Promise.all([loadSchedule(fromDay), loadPool()]);
    } catch (err) {
      console.error("Failed to move back to pool", err);
    }
  }

  async function handleDeleteBlock(block: MergedBlock) {
    const fromDay = block.task.day;
    const fromList = schedule[fromDay] ?? [];
    const removed = fromList.filter((t) => {
      const sameTitle =
        t.title.trim().toLowerCase() === block.task.title.trim().toLowerCase();
      const sameTag = t.tag === block.task.tag;
      const inRange = t.hour >= block.start && t.hour < block.end;
      return sameTitle && sameTag && inRange;
    });
    if (removed.length === 0 || !userId) return;
    showUndoToast({ type: "scheduled", tasks: removed, day: fromDay });
    try {
      await Promise.all(
        removed.map((t) =>
          fetch(`/api/schedule/${t.id}?userId=${userId}`, { method: "DELETE" })
        )
      );
      await loadSchedule(fromDay);
    } catch (err) {
      console.error("Failed to delete block", err);
    }
  }

  async function handleDeleteScheduled(taskId: string, day: string) {
    const fromList = schedule[day] ?? [];
    const removed = fromList.find((t) => t.id === taskId);
    if (!removed || !userId) return;
    showUndoToast({ type: "scheduled", tasks: [removed], day });
    try {
      await fetch(`/api/schedule/${taskId}?userId=${userId}`, {
        method: "DELETE",
      });
      await loadSchedule(day);
    } catch (err) {
      console.error("Failed to delete scheduled task", err);
    }
  }

  async function toggleDoneForTask(taskId: string, day: string) {
    const fromList = schedule[day] ?? [];
    const target = fromList.find((t) => t.id === taskId);
    if (!target || !userId) return;
    try {
      await fetch(`/api/schedule/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !target.done, userId }),
      });
      await loadSchedule(day);
    } catch (err) {
      console.error("Failed to toggle task", err);
    }
  }

  async function toggleDoneForBlock(block: MergedBlock) {
    const fromDay = block.task.day;
    const fromList = schedule[fromDay] ?? [];
    const affected = fromList.filter((t) => {
      const sameTitle =
        t.title.trim().toLowerCase() === block.task.title.trim().toLowerCase();
      const sameTag = t.tag === block.task.tag;
      const inRange = t.hour >= block.start && t.hour < block.end;
      return sameTitle && sameTag && inRange;
    });
    if (affected.length === 0 || !userId) return;
    try {
      await Promise.all(
        affected.map((t) =>
          fetch(`/api/schedule/${t.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ done: !block.task.done, userId }),
          })
        )
      );
      await loadSchedule(fromDay);
    } catch (err) {
      console.error("Failed to toggle block", err);
    }
  }

  async function handleDeletePoolTask(taskId: string) {
    if (!userId) return;
    const task = pool.find((t) => t.id === taskId);
    if (!task) return;
    showUndoToast({ type: "pool", tasks: [task] });
    try {
      await fetch(`/api/pool/${taskId}?userId=${userId}`, { method: "DELETE" });
      await loadPool();
    } catch (err) {
      console.error("Failed to delete pool task", err);
    }
  }

  const closeDeleteModal = () => {
    if (deleteModalBusy) return;
    setDeleteModal(null);
  };

  const confirmDeleteModal = async () => {
    if (!deleteModal) return;
    setDeleteModalBusy(true);
    try {
      await deleteModal.onConfirm();
      setDeleteModal(null);
    } finally {
      setDeleteModalBusy(false);
    }
  };

  async function handleCopyTask(task: Task | ScheduledTask) {
    const text = task.title?.trim();
    if (!text) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      const scheduledTask = "hour" in task ? task : null;
      setCopiedTask({
        id: task.id,
        title: text,
        tag: task.tag,
        priorityId: task.priorityId,
        source: scheduledTask ? "scheduled" : "pool",
        hour: scheduledTask?.hour,
        day: scheduledTask?.day,
      });
      setCopiedTaskId(task.id);
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => {
        setCopiedTaskId(null);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy task", err);
    }
  }

  async function handlePasteToHour(hour: number) {
    if (!copiedTask || !userId) return;
    const sameSlot =
      copiedTask.source === "scheduled" &&
      copiedTask.day === activeDay &&
      copiedTask.hour === hour;
    if (sameSlot) return;
    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: copiedTask.title,
          tag: copiedTask.tag,
          priority: copiedTask.priorityId,
          day: activeDay,
          hour,
          done: false,
          userId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to paste task");
      await loadSchedule(activeDay);
    } catch (err) {
      console.error("Failed to paste task", err);
    }
  }

  function handleDayShift(delta: number) {
    const base = new Date(`${activeDay}T00:00:00Z`);
    base.setUTCDate(base.getUTCDate() + delta);
    setActiveDay(base.toISOString().slice(0, 10));
  }

  function handleJalaliMonthShift(delta: number) {
    setJalaliMonthView((prev) => {
      let jy = prev.jy;
      let jm = prev.jm + delta;
      while (jm > 12) {
        jm -= 12;
        jy += 1;
      }
      while (jm < 1) {
        jm += 12;
        jy -= 1;
      }
      return { ...prev, jy, jm };
    });
  }

  function handleSelectJalaliDay(day: number | null) {
    if (!day) return;
    const key = dateKeyFromJalali(jalaliMonthView.jy, jalaliMonthView.jm, day);
    setActiveDay(key);
  }

  function openTagModal(tag?: string) {
    setEditingTag(tag ?? null);
    setTagModalValue(tag ?? "");
    setTagModalError("");
    setTagModalOpen(true);
  }

  function closeTagModal() {
    setTagModalOpen(false);
    setTagModalValue("");
    setEditingTag(null);
    setTagModalError("");
  }

  function handleSaveTagModal() {
    const value = tagModalValue.trim();
    if (!value) {
      setTagModalError("نام برچسب را وارد کنید");
      return;
    }
    const duplicate = allTags.some(
      (t) => t.toLowerCase() === value.toLowerCase() && t !== editingTag
    );
    if (duplicate) {
      setTagModalError("برچسبی با این نام وجود دارد");
      return;
    }

    if (editingTag) {
      setCustomTags((prev) => {
        const next = prev.filter((t) => t !== editingTag);
        if (!baseTags.includes(value as BaseTag)) next.unshift(value);
        return next;
      });
      setPool((prev) =>
        prev.map((t) => (t.tag === editingTag ? { ...t, tag: value } : t))
      );
      setSchedule((prev) => retagSchedule(prev, editingTag, value));
      if (newTaskTag === editingTag) setNewTaskTag(value);
      if (filterTag === editingTag) setFilterTag(value);
    } else {
      setCustomTags((prev) => [value, ...prev.filter((t) => t !== value)]);
    }

    closeTagModal();
  }

  const dayLabel = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    const parts = formatter.formatToParts(activeDate);
    const lookup = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? "";
    const weekday = lookup("weekday");
    const datePart = [lookup("day"), lookup("month"), lookup("year")]
      .filter(Boolean)
      .join(" ");
    return [weekday, datePart].filter(Boolean).join("، ");
  }, [activeDate]);

  const filteredPool = useMemo(() => {
    const term = search.trim().toLowerCase();
    return pool.filter((task) => {
      const matchesTag = filterTag === "all" ? true : task.tag === filterTag;
      const matchesSearch =
        term.length === 0 ? true : task.title.toLowerCase().includes(term);
      return matchesTag && matchesSearch;
    });
  }, [pool, filterTag, search]);

  return (
    <div className="planner" dir="rtl">
      <div className="planner__header">
        <div className="planner__title">
          <h1>{dayLabel}</h1>
          <p className="light">تسک‌ها را بکش و روی ساعت مناسب رها کن</p>
        </div>
        <div className="planner__progress">
          <div className="planner__progress-head">
            <span className="eyebrow">پیشروی امروز</span>
          </div>
          <div className="meter meter--header">
            <span style={{ width: `${dayProgress}%` }} />
          </div>
          <p className="light small">{dayProgress}% از ۲۴ ساعت سپری شده</p>
        </div>
        <div className="topbar__controls">
          <button
            onClick={() => handleDayShift(-1)}
            className="ghost"
            type="button"
          >
            روز قبل
          </button>
          <button
            onClick={() => setActiveDay(todayKey())}
            className="ghost"
            type="button"
          >
            امروز
          </button>
          <button
            onClick={() => handleDayShift(1)}
            className="ghost"
            type="button"
          >
            روز بعد
          </button>
          <button
            onClick={copyLatestDayIntoActive}
            className="ghost"
            type="button"
          >
            کپی از روز قبلی
          </button>
          <button onClick={clearActiveDay} className="ghost" type="button">
            خالی کردن روز
          </button>
        </div>
      </div>

      <div className="planner__body">
        <section
          className="planner__backlog"
          style={{
            display: "flex",
            gap: "20px",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
          }}
        >
          <div className="panel" style={{ gap: "30px" }}>
            <header className="panel__header">
              <div>
                <h3>لیست تسک ها</h3>
              </div>
              <div className="counts">
                <span>در انتظار: {dayPendingCount}</span>
                <span>انجام شده: {dayDoneCount}</span>
                <span>امروز: {daySchedule.length}</span>
              </div>
            </header>
            <div className="add-form">
              <input
                placeholder="می‌خوای چه کاری انجام بدی؟ بنویس…"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTask();
                }}
                style={{ outline: "none" }}
              />
              <div className="tag-choices">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    className={[
                      "tag-chip",
                      newTaskTag === tag && "tag-chip--active",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      setNewTaskTag((prev) => (prev === tag ? undefined : tag))
                    }
                    type="button"
                  >
                    {getTagLabel(tag)}
                  </button>
                ))}
                <button
                  className="tag-chip tag-chip--add"
                  type="button"
                  onClick={() => openTagModal()}
                >
                  + برچسب جدید
                </button>
              </div>
              <div className="priority-picker">
                <p className="light small">اولویت</p>
                <PriorityDropdown
                  value={newTaskPriority}
                  options={PRIORITY_LEVELS}
                  onChange={setNewTaskPriority}
                />
              </div>
              <button className="primary" onClick={handleAddTask}>
                اضافه کن
              </button>
              {formError && <p className="error">{formError}</p>}
            </div>
            <div
              className={["pool", poolHover && "pool--hover"]
                .filter(Boolean)
                .join(" ")}
              aria-label="Backlog"
              onDragOver={(e) => {
                e.preventDefault();
                setPoolHover(true);
              }}
              onDragLeave={() => setPoolHover(false)}
              onDrop={(e) => {
                e.preventDefault();
                const data = e.dataTransfer.getData("application/json");
                handleDropToPool(data);
                setPoolHover(false);
              }}
            >
              {filteredPool.length === 0 && (
                <p className="empty">چیزی پیدا نشد</p>
              )}
              {filteredPool.map((task) => (
                <article
                  key={task.id}
                  className="task"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(
                      "application/json",
                      JSON.stringify({ type: "pool", id: task.id })
                    );
                    e.dataTransfer.effectAllowed = "move";
                  }}
                >
                  <div className="task__title task__title--with-dot">
                    <span
                      className="priority-dot"
                      style={{ backgroundColor: getPriorityColor(task.priorityId, priorities) }}
                    />
                    <span className="task__title-text">{task.title}</span>
                  </div>
                  <div className="task__meta">
                    <div className="task__meta-left">
                      {task.tag && (
                        <span
                          className={["pill", getTagClass(task.tag)]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {getTagLabel(task.tag)}
                        </span>
                      )}
                    </div>
                    <div className="task__meta-actions">
                      <button
                        className={[
                          "icon-btn",
                          copiedTaskId === task.id && "icon-btn--copied",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        type="button"
                        aria-label="کپی کردن"
                        onClick={() => handleCopyTask(task)}
                      >
                        <FiCopy aria-hidden />
                      </button>
                      <button
                        className="icon-btn icon-btn--danger"
                        type="button"
                        aria-label="حذف"
                        onClick={() =>
                          setDeleteModal({
                            title: "حذف تسک",
                            description: task.title
                              ? `حذف تسک "${task.title}"؟`
                              : "حذف این تسک؟",
                            confirmLabel: "حذف",
                            onConfirm: () => handleDeletePoolTask(task.id),
                          })
                        }
                      >
                        <FiTrash2 aria-hidden />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="panel calendar-strip" aria-label="انتخاب زمان">
            <div className="calendar-strip__head">
              <button
                className="calendar-strip__btn"
                type="button"
                aria-label="ماه قبل"
                onClick={() => handleJalaliMonthShift(-1)}
              >
                <FiChevronRight />
              </button>
              <div className="calendar-strip__title">
                <button
                  className="calendar-strip__title-btn"
                  type="button"
                  onClick={() => setCalendarModal("month")}
                >
                  <span>{jalaliMonthName}</span>
                  <span className="calendar-strip__caret">▾</span>
                </button>
                <button
                  className="calendar-strip__year-btn"
                  type="button"
                  onClick={() => setCalendarModal("year")}
                >
                  {jalaliMonthView.jy}
                </button>
                <p className="calendar-strip__sub">
                  {formatGregorianSpanForJalaliMonth(
                    jalaliMonthView.jy,
                    jalaliMonthView.jm
                  )}
                </p>
              </div>
              <button
                className="calendar-strip__btn"
                type="button"
                aria-label="ماه بعد"
                onClick={() => handleJalaliMonthShift(1)}
              >
                <FiChevronLeft />
              </button>
            </div>
            <div className="calendar-strip__weekdays">
              {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((label) => (
                <span key={label} className="calendar-strip__weekday">
                  {label}
                </span>
              ))}
            </div>
            <div className="calendar-strip__days">
              {jalaliMonthDays.map((d, idx) => {
                if (d === null) {
                  return (
                    <span
                      key={`empty-${idx}`}
                      className="calendar-strip__day calendar-strip__day--ghost"
                      aria-hidden
                    />
                  );
                }
                const isSelected =
                  jalaliMonthView.jy === jalaliActiveDate.jy &&
                  jalaliMonthView.jm === jalaliActiveDate.jm &&
                  d === jalaliActiveDate.jd;
                const isToday =
                  jalaliMonthView.jy === jalaliToday.jy &&
                  jalaliMonthView.jm === jalaliToday.jm &&
                  d === jalaliToday.jd;
                return (
                  <button
                    key={d}
                    type="button"
                    className={[
                      "calendar-strip__day",
                      isSelected && "calendar-strip__day--active",
                      isToday && "calendar-strip__day--today",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => handleSelectJalaliDay(d)}
                  >
                    <span>{PERSIAN_NUMBER.format(d)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="planner__board">
          <section className="grid" aria-label="24 hour grid">
            {hours.map((hour) => {
              const blockStart = blocksByStart.get(hour);
              const covered = coveringBlocks.get(hour);
              const isPastHour =
                dayPosition === "past" ||
                (dayPosition === "today" && hour < now.getHours());
              const isCurrentHour =
                dayPosition === "today" && hour === now.getHours();
              const hourTasks = daySchedule.filter((t) => t.hour === hour);
              const hasOverlap = hourTasks.length > 1;
              const hasTasks = hourTasks.length > 0;
              const allDone = hasTasks && hourTasks.every((t) => t.done);
              const canPaste =
                Boolean(copiedTask) &&
                (!copiedTask?.day ||
                  copiedTask.day !== activeDay ||
                  copiedTask.hour !== hour);
              const pasteLabel = copiedTask
                ? `پیست: ${copiedTask.title}`
                : "پیست";
              let chipLabel: string | null = null;
              let chipClassName = "slot__chip";

              if (hasTasks) {
                if (allDone) {
                  chipLabel = "انجام شد";
                  chipClassName += " slot__chip--done";
                } else if (isCurrentHour) {
                  chipLabel = "در حال انجام";
                  chipClassName += " slot__chip--now";
                } else if (isPastHour) {
                  chipLabel = "تمام شده";
                } else {
                  chipLabel = "در حال انتظار";
                  chipClassName += " slot__chip--pending";
                }
              } else if (isCurrentHour) {
                chipLabel = "الان";
                chipClassName += " slot__chip--now";
              } else if (isPastHour) {
                chipLabel = "تمام شده";
              }
              return (
                <div
                  key={hour}
                  className={[
                    "slot",
                    hoverHour === hour && "slot--hover",
                    covered && "slot--covered",
                    isPastHour && "slot--past",
                    isCurrentHour && "slot--current",
                    hasOverlap && "slot--crowded",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setHoverHour(hour);
                  }}
                  onDragLeave={() =>
                    setHoverHour((prev) => (prev === hour ? null : prev))
                  }
                  onDrop={(e) => {
                    e.preventDefault();
                    const data = e.dataTransfer.getData("application/json");
                    handleDrop(hour, data);
                    setHoverHour(null);
                  }}
                >
                  <div className="slot__label-row">
                    <div className="slot__label">{formatHour(hour)}</div>
                    {(chipLabel || canPaste) && (
                      <div className="slot__actions">
                        {chipLabel && (
                          <span className={chipClassName}>{chipLabel}</span>
                        )}
                        {canPaste && (
                          <button
                            className="icon-btn slot__paste"
                            type="button"
                            aria-label={pasteLabel}
                            title={pasteLabel}
                            onClick={() => handlePasteToHour(hour)}
                          >
                            <FiClipboard aria-hidden />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="slot__content">
                    {hasOverlap && (
                      <div className="stacked-tasks">
                        {hourTasks.map((task) => (
                          <div
                            key={task.id}
                            className={[
                              "stacked-task",
                              task.done && "task--done",
                              !task.done && isPastHour && "task--stale",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            title={task.title}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                "application/json",
                                JSON.stringify({
                                  type: "scheduled",
                                  id: task.id,
                                  day: task.day,
                                })
                              );
                              e.dataTransfer.effectAllowed = "move";
                            }}
                          >
                            <span className="stacked-task__title task__title--with-dot">
                              <span
                                className="priority-dot"
                                style={{ backgroundColor: getPriorityColor(task.priorityId, priorities) }}
                              />
                              <span className="task__title-text">{task.title}</span>
                            </span>
                            <div className="task__meta-actions">
                              <button
                                className={[
                                  "icon-btn",
                                  copiedTaskId === task.id && "icon-btn--copied",
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                                type="button"
                                aria-label="کپی کردن"
                                onClick={() => handleCopyTask(task)}
                              >
                                <FiCopy aria-hidden />
                              </button>
                              <button
                                className="icon-btn"
                                type="button"
                                aria-label="علامت انجام شده"
                                onClick={() =>
                                  toggleDoneForTask(task.id, task.day)
                                }
                              >
                                <FiCheck aria-hidden />
                              </button>
                              <button
                                className="icon-btn icon-btn--danger"
                                type="button"
                                aria-label="حذف"
                                onClick={() =>
                                  setDeleteModal({
                                    title: "حذف تسک",
                                    description: task.title
                                      ? `حذف تسک "${task.title}"؟`
                                      : "حذف این تسک؟",
                                    confirmLabel: "حذف",
                                    onConfirm: () =>
                                      handleDeleteScheduled(task.id, task.day),
                                  })
                                }
                              >
                                <FiTrash2 aria-hidden />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {!hasOverlap && !blockStart && !covered && (
                      <span className="hint">درگ کنید</span>
                    )}
                    {!hasOverlap && blockStart && (
                      <article
                        className={[
                          "task",
                          "task--scheduled",
                          "task--merged",
                          blockStart.task.done && "task--done",
                          !blockStart.task.done && isPastHour && "task--stale",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        title={blockStart.task.title}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "application/json",
                            JSON.stringify({
                              type: "scheduled",
                              id: blockStart.task.id,
                              day: blockStart.task.day,
                            })
                          );
                          e.dataTransfer.effectAllowed = "move";
                        }}
                      >
                        <div className="task__title task__title--with-dot">
                          <span
                            className="priority-dot"
                            style={{ backgroundColor: getPriorityColor(blockStart.task.priorityId, priorities) }}
                          />
                          <span className="task__title-text">{blockStart.task.title}</span>
                        </div>
                        <div className="task__meta">
                          <div className="task__meta-left">
                            {blockStart.task.tag && (
                              <span
                                className={[
                                  "pill",
                                  getTagClass(blockStart.task.tag),
                                ]
                                  .filter(Boolean)
                                  .join(" ")}
                              >
                                {getTagLabel(blockStart.task.tag)}
                              </span>
                            )}
                          </div>
                          <div className="task__meta-actions">
                            <button
                              className={[
                                "icon-btn",
                                copiedTaskId === blockStart.task.id &&
                                  "icon-btn--copied",
                              ]
                                .filter(Boolean)
                                .join(" ")}
                              type="button"
                              aria-label="کپی کردن"
                              onClick={() => handleCopyTask(blockStart.task)}
                            >
                              <FiCopy aria-hidden />
                            </button>
                            <button
                              className="icon-btn"
                              type="button"
                              aria-label="علامت انجام شده"
                              onClick={() => toggleDoneForBlock(blockStart)}
                            >
                              <FiCheck aria-hidden />
                            </button>
                            <button
                              className="icon-btn icon-btn--danger"
                              type="button"
                              aria-label="حذف"
                              onClick={() =>
                                setDeleteModal({
                                  title: "حذف تسک",
                                  description: blockStart.task.title
                                    ? `حذف تسک "${blockStart.task.title}"؟`
                                    : "حذف این تسک؟",
                                  confirmLabel: "حذف",
                                  onConfirm: () => handleDeleteBlock(blockStart),
                                })
                              }
                            >
                              <FiTrash2 aria-hidden />
                            </button>
                          </div>
                        </div>
                      </article>
                    )}
                    {!hasOverlap && covered && !blockStart && (
                      <div
                        className={[
                          "continuation",
                          "continuation--card",
                          covered.task.done && "task--done",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        <span className="continuation__text hint">
                          {`ادامه تسک ${covered.task.title}`}
                        </span>
                        <div className="task__meta-actions">
                          <button
                            className={[
                              "icon-btn",
                              copiedTaskId === covered.task.id &&
                                "icon-btn--copied",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            type="button"
                            aria-label="کپی کردن"
                            onClick={() => handleCopyTask(covered.task)}
                          >
                            <FiCopy aria-hidden />
                          </button>
                          <button
                            className="icon-btn"
                            type="button"
                            aria-label="علامت انجام شده"
                            onClick={() => toggleDoneForBlock(covered)}
                          >
                            <FiCheck aria-hidden />
                          </button>
                          <button
                            className="icon-btn icon-btn--danger"
                            type="button"
                            aria-label="حذف"
                            onClick={() =>
                              setDeleteModal({
                                title: "حذف تسک",
                                description: covered.task.title
                                  ? `حذف تسک "${covered.task.title}"؟`
                                  : "حذف این تسک؟",
                                confirmLabel: "حذف",
                                onConfirm: () => handleDeleteBlock(covered),
                              })
                            }
                          >
                            <FiTrash2 aria-hidden />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </section>
      </div>

      {tagModalOpen && (
        <div className="modal">
          <div
            className="modal__backdrop"
            onClick={closeTagModal}
            aria-hidden
          />
          <div className="modal__card" role="dialog" aria-modal="true">
            <h3>{editingTag ? "ویرایش برچسب" : "برچسب جدید"}</h3>
            <p className="light small">یک نام برای برچسب وارد کنید</p>
            <input
              autoFocus
              value={tagModalValue}
              onChange={(e) => {
                setTagModalValue(e.target.value);
                setTagModalError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveTagModal();
              }}
            />
            {tagModalError && <p className="error">{tagModalError}</p>}
            <div className="modal__actions">
              <button className="ghost" type="button" onClick={closeTagModal}>
                انصراف
              </button>
              <button
                className="primary"
                type="button"
                onClick={handleSaveTagModal}
              >
                {editingTag ? "ذخیره" : "اضافه کن"}
              </button>
            </div>
          </div>
        </div>
      )}
      <DeleteModal
        open={Boolean(deleteModal)}
        title={deleteModal?.title ?? ""}
        description={deleteModal?.description}
        confirmLabel={deleteModal?.confirmLabel ?? "حذف"}
        cancelLabel="انصراف"
        busy={deleteModalBusy}
        onConfirm={confirmDeleteModal}
        onCancel={closeDeleteModal}
      />
      {undoToast && (
        <div key={toastKey} className="toast" role="status" aria-live="polite">
          <div className="toast__content">
            <span>
              {undoToast.type === "pool"
                ? "تسک از لیست حذف شد"
                : "تسک برنامه حذف شد"}
              . با Ctrl+Z یا دکمه زیر می‌توانی برگردانی.
            </span>
            <button className="ghost tiny" type="button" onClick={handleUndo}>
              برگردان
            </button>
            <div className="toast__bar">
              <span key={toastKey} />
            </div>
          </div>
        </div>
      )}
      {calendarModal && (
        <div className="modal">
          <div
            className="modal__backdrop"
            onClick={() => setCalendarModal(null)}
            aria-hidden
          />
          <div
            className="modal__card calendar-modal__card"
            role="dialog"
            aria-modal="true"
          >
            <div className="calendar-modal__header">
              <div className="calendar-modal__title">
                <span className="calendar-picker__icon" aria-hidden>
                  <FiCalendar />
                </span>
                <div>
                  <p className="eyebrow">
                    انتخاب {calendarModal === "month" ? "ماه" : "سال"}
                  </p>
                  <p className="light small">
                    {calendarModal === "month"
                      ? "یکی از ماه‌ها را انتخاب کن"
                      : "یک سال از لیست انتخاب کن"}
                  </p>
                </div>
              </div>
              <button
                className="calendar-modal__close"
                type="button"
                aria-label="بستن"
                onClick={() => setCalendarModal(null)}
              >
                <FiX />
              </button>
            </div>
            {calendarModal === "month" ? (
              <div className="calendar-modal__body">
                <div className="calendar-modal__section">
                  <div className="calendar-modal__grid">
                    {JALALI_MONTHS.map((name, idx) => {
                      const month = idx + 1;
                      const active = month === jalaliMonthView.jm;
                      return (
                        <button
                          key={name}
                          className={[
                            "calendar-modal__option",
                            active && "calendar-modal__option--active",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          type="button"
                          onClick={() => {
                            setJalaliMonthView((prev) => ({
                              ...prev,
                              jm: month,
                            }));
                            setCalendarModal(null);
                          }}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="calendar-modal__body">
                <div className="calendar-modal__section">
                  <div className="calendar-modal__grid calendar-modal__grid--years">
                    {buildYearOptions(jalaliMonthView.jy).map((year) => {
                      const active = year === jalaliMonthView.jy;
                      return (
                        <button
                          key={year}
                          className={[
                            "calendar-modal__option",
                            active && "calendar-modal__option--active",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                          type="button"
                          onClick={() => {
                            setJalaliMonthView((prev) => ({
                              ...prev,
                              jy: year,
                            }));
                            setCalendarModal(null);
                          }}
                        >
                          {year}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function priorityRank(id?: string) {
  if (!id) return 3;
  return PRIORITY_RANK[id] ?? 3;
}

function sortByHour(list: ScheduledTask[]) {
  return [...list].sort((a, b) => {
    if (a.hour !== b.hour) return a.hour - b.hour;
    const rankDiff = priorityRank(a.priorityId) - priorityRank(b.priorityId);
    if (rankDiff !== 0) return rankDiff;
    return a.title.localeCompare(b.title);
  });
}

function mergeConsecutive(list: ScheduledTask[]): MergedBlock[] {
  if (list.length === 0) return [];
  const sorted = sortByHour(dedupe(list)).map((t) => ({
    ...t,
    done: Boolean(t.done),
  }));
  const merged: MergedBlock[] = [];
  let current: MergedBlock | null = null;

  for (const item of sorted) {
    if (!current) {
      current = {
        task: { ...item, done: Boolean(item.done) },
        start: item.hour,
        end: item.hour + 1,
      };
      continue;
    }

    const isConsecutive = item.hour === current.end;
    const isSameTask =
      item.title.trim().toLowerCase() ===
        current.task.title.trim().toLowerCase() &&
      item.tag === current.task.tag;

    if (isConsecutive && isSameTask) {
      const mergedDone: boolean = Boolean(current.task.done && item.done);
      current = {
        ...current,
        task: { ...current.task, done: mergedDone },
        end: item.hour + 1,
      };
    } else {
      merged.push(current);
      current = {
        task: { ...item, done: Boolean(item.done) },
        start: item.hour,
        end: item.hour + 1,
      };
    }
  }

  if (current) merged.push(current);
  return merged;
}

function dedupe(list: ScheduledTask[]) {
  const map = new Map<string, ScheduledTask>();
  list.forEach((t) => {
    const key = `${t.title.trim().toLowerCase()}|${t.tag ?? "none"}|${t.priorityId ?? "none"}|${t.hour}|${t.day}`;
    map.set(key, t);
  });
  return Array.from(map.values()).sort((a, b) => {
    if (a.hour !== b.hour) return a.hour - b.hour;
    const rankDiff = priorityRank(a.priorityId) - priorityRank(b.priorityId);
    if (rankDiff !== 0) return rankDiff;
    return a.title.localeCompare(b.title);
  });
}

function retagSchedule(
  schedule: Record<string, ScheduledTask[]>,
  fromTag: string,
  toTag: string | undefined
) {
  const next: Record<string, ScheduledTask[]> = {};
  Object.entries(schedule).forEach(([day, list]) => {
    const updated = list.map((t) =>
      t.tag === fromTag ? { ...t, tag: toTag } : t
    );
    next[day] = dedupe(updated);
  });
  return next;
}

function getTagLabel(tag?: string) {
  if (!tag) return "";
  return tagLabels[tag as BaseTag] ?? tag;
}

function getTagClass(tag?: string) {
  if (!tag) return "";
  return baseTags.includes(tag as BaseTag) ? `pill--${tag}` : "pill--custom";
}

function getPriorityColor(id: string | undefined, priorities: Priority[]) {
  const fallback = "var(--priority-none, #555a65)";
  if (!id) return fallback;
  const builtin = PRIORITY_LEVELS.find((p) => p.id === id);
  if (builtin) return builtin.color;
  const found = priorities.find((p) => p.id === id);
  return found?.color ?? fallback;
}

function dateKeyFromGregorian(gy: number, gm: number, gd: number) {
  return new Date(Date.UTC(gy, gm - 1, gd)).toISOString().slice(0, 10);
}

function dateKeyFromJalali(jy: number, jm: number, jd: number) {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  return dateKeyFromGregorian(gy, gm, gd);
}

function toJalaliParts(date: Date): JalaliDateParts {
  return gregorianToJalali(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate()
  );
}

function formatJalaliMonthName(date: JalaliDateParts) {
  const { gy, gm, gd } = jalaliToGregorian(date.jy, date.jm, 1);
  const anchor = new Date(Date.UTC(gy, gm - 1, gd));
  return anchor.toLocaleDateString("fa-IR-u-ca-persian", { month: "long" });
}

function formatGregorianSpanForJalaliMonth(jy: number, jm: number) {
  const start = jalaliToGregorian(jy, jm, 1);
  const end = jalaliToGregorian(jy, jm, jalaliMonthLength(jy, jm));
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short" });
  const startLabel = fmt.format(new Date(Date.UTC(start.gy, start.gm - 1, start.gd)));
  const endLabel = fmt.format(new Date(Date.UTC(end.gy, end.gm - 1, end.gd)));
  return startLabel === endLabel ? startLabel : `${startLabel}-${endLabel}`;
}

function buildJalaliMonthDays(jy: number, jm: number): JalaliMonthDays {
  const count = jalaliMonthLength(jy, jm);
  const first = jalaliToGregorian(jy, jm, 1);
  const firstDate = new Date(Date.UTC(first.gy, first.gm - 1, first.gd));
  const jsWeekDay = firstDate.getUTCDay(); // 0=Sunday
  const offset = (jsWeekDay + 1) % 7; // shift to Saturday = 0

  const days: JalaliMonthDays = [];
  for (let i = 0; i < offset; i += 1) days.push(null);
  for (let d = 1; d <= count; d += 1) days.push(d);
  const remainder = days.length % 7;
  if (remainder !== 0) {
    const trailing = 7 - remainder;
    for (let i = 0; i < trailing; i += 1) days.push(null);
  }
  return days;
}

function jalaliMonthLength(jy: number, jm: number) {
  const start = jalaliToGregorian(jy, jm, 1);
  const next =
    jm === 12
      ? jalaliToGregorian(jy + 1, 1, 1)
      : jalaliToGregorian(jy, jm + 1, 1);
  const startDate = new Date(
    Date.UTC(start.gy, start.gm - 1, start.gd)
  ).getTime();
  const nextDate = new Date(Date.UTC(next.gy, next.gm - 1, next.gd)).getTime();
  const diff = Math.round((nextDate - startDate) / (24 * 60 * 60 * 1000));
  return diff;
}

function buildYearOptions(current: number) {
  const start = current - 6;
  return Array.from({ length: 13 }, (_, i) => start + i);
}

const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

function gregorianToJalali(
  gy: number,
  gm: number,
  gd: number
): JalaliDateParts {
  const gDayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = gy - 1600;
  let gm2 = gm - 1;
  const gd2 = gd - 1;

  let gDayNo =
    365 * gy2 +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400);

  gDayNo += gDayCount[gm2];
  if (gm2 > 1 && isGregorianLeap(gy)) gDayNo += 1;
  gDayNo += gd2;

  let jDayNo = gDayNo - 79;

  const jNp = Math.floor(jDayNo / 12053);
  jDayNo %= 12053;

  let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
  jDayNo %= 1461;

  if (jDayNo >= 366) {
    jy += Math.floor((jDayNo - 1) / 365);
    jDayNo = (jDayNo - 1) % 365;
  }

  let jm = 0;
  for (; jm < 11 && jDayNo >= jDaysInMonth[jm]; jm += 1) {
    jDayNo -= jDaysInMonth[jm];
  }

  const jd = jDayNo + 1;
  return { jy, jm: jm + 1, jd };
}

function jalaliToGregorian(
  jy: number,
  jm: number,
  jd: number
): GregorianDateParts {
  jy -= 979;
  jm -= 1;
  jd -= 1;

  let jDayNo =
    365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4);
  for (let i = 0; i < jm; i += 1) {
    jDayNo += jDaysInMonth[i];
  }
  jDayNo += jd;

  let gDayNo = jDayNo + 79;

  let gy = 1600 + 400 * Math.floor(gDayNo / 146097);
  gDayNo %= 146097;

  let leap = true;
  if (gDayNo >= 36525) {
    gDayNo -= 1;
    gy += 100 * Math.floor(gDayNo / 36524);
    gDayNo %= 36524;

    if (gDayNo >= 365) {
      gDayNo += 1;
    } else {
      leap = false;
    }
  }

  gy += 4 * Math.floor(gDayNo / 1461);
  gDayNo %= 1461;

  if (gDayNo >= 366) {
    leap = false;
    gDayNo -= 1;
    gy += Math.floor(gDayNo / 365);
    gDayNo %= 365;
  }

  let gm = 0;
  for (; gm < 11; gm += 1) {
    const monthLength = gDaysInMonth[gm] + (gm === 1 && leap ? 1 : 0);
    if (gDayNo < monthLength) break;
    gDayNo -= monthLength;
  }

  const gd = gDayNo + 1;
  return { gy, gm: gm + 1, gd };
}

function isGregorianLeap(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export default PlannerPage;
