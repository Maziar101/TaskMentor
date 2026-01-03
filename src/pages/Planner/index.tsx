import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
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
import { loadPriorities } from "../../utils/priorities/index";
import {
  JALALI_MONTHS,
  PERSIAN_NUMBER,
  PRIORITY_LEVELS,
  STORAGE_KEY,
  baseTags,
  buildJalaliMonthDays,
  buildYearOptions,
  createPlannerInitialState,
  dateKeyFromJalali,
  formatGregorianSpanForJalaliMonth,
  formatHour,
  formatJalaliMonthName,
  generateId,
  getPriorityColor,
  getTagClass,
  getTagLabel,
  hours,
  mergeConsecutive,
  plannerReducer,
  retagSchedule,
  sortByHour,
  todayKey,
  toJalaliParts,
  type BaseTag,
  type JalaliMonthDays,
  type MergedBlock,
  type PlannerState,
  type ScheduledTask,
  type StorageShape,
  type Task,
  type UndoPayload,
} from "./utils";

function PlannerPage() {
  const [state, dispatch] = useReducer(
    plannerReducer,
    undefined,
    createPlannerInitialState
  );
  const {
    activeDay,
    pool,
    schedule,
    notes,
    customTags,
    newTaskTitle,
    newTaskTag,
    filterTag,
    search,
    hoverHour,
    now,
    jalaliMonthView,
    tagModalOpen,
    tagModalValue,
    editingTag,
    tagModalError,
    formError,
    priorities,
    newTaskPriority,
    undoToast,
    undoTimer,
    toastKey,
    deleteModal,
    deleteModalBusy,
    poolHover,
    calendarModal,
    copiedTaskId,
    copiedTask,
  } = state;

  const setField = useCallback(
    <K extends keyof PlannerState>(
      key: K,
      value: PlannerState[K] | ((prev: PlannerState[K]) => PlannerState[K])
    ) => {
      dispatch({
        type: "update",
        updater: (prev) => {
          const nextValue =
            typeof value === "function"
              ? (value as (prev: PlannerState[K]) => PlannerState[K])(prev[key])
              : value;
          if (Object.is(nextValue, prev[key])) return prev;
          return { ...prev, [key]: nextValue } as PlannerState;
        },
      });
    },
    [dispatch]
  );

  const copyTimeoutRef = useRef<number | null>(null);
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
      setField("pool", mapped);
    } catch (err) {
      console.error(err);
      setField("pool", []);
    }
  }, [userId, setField]);

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
        setField("schedule", (prev) => ({ ...prev, [day]: mapped }));
      } catch (err) {
        console.error(err);
      }
    },
    [userId, setField]
  );

  useEffect(() => {
    const payload: StorageShape = { notes, customTags };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [notes, customTags]);

  useEffect(() => {
    function syncPriorities() {
      setField("priorities", loadPriorities());
    }
    window.addEventListener("storage", syncPriorities);
    return () => window.removeEventListener("storage", syncPriorities);
  }, [setField]);


  useEffect(() => {
    if (!userId) return;
    loadPool();
  }, [userId, loadPool]);

  useEffect(() => {
    if (!userId) return;
    loadSchedule(activeDay);
  }, [userId, activeDay, loadSchedule]);

  useEffect(() => {
    const id = setInterval(() => setField("now", new Date()), 60000);
    return () => clearInterval(id);
  }, [setField]);

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
    setField("jalaliMonthView", toJalaliParts(activeDate));
  }, [activeDate, setField]);

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
    setField("undoToast", payload);
    setField("toastKey", (k) => k + 1);
    const timer = window.setTimeout(() => setField("undoToast", null), 5000);
    setField("undoTimer", timer);
  }

  async function handleUndo() {
    if (!undoToast) return;
    if (undoTimer) window.clearTimeout(undoTimer);
    setField("undoTimer", null);
    const payload = undoToast;
    setField("undoToast", null);
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
      setField("formError", "برای افزودن، دوباره وارد حساب شو.");
      return;
    }
    setField("formError", "");
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
      setField("pool", (prev) => [task, ...prev]);
      if (tagToUse) setField("filterTag", tagToUse as string);
      setField("newTaskTitle", "");
    } catch (err) {
      console.error("Failed to add task", err);
      setField("formError", "افزودن تسک انجام نشد. اتصال یا ورود را چک کن.");
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
        setField("pool", (prev) => prev.filter((t) => t.id !== task.id));
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
    setField("deleteModal", null);
  };

  const confirmDeleteModal = async () => {
    if (!deleteModal) return;
    setField("deleteModalBusy", true);
    try {
      await deleteModal.onConfirm();
      setField("deleteModal", null);
    } finally {
      setField("deleteModalBusy", false);
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
      setField("copiedTask", {
        id: task.id,
        title: text,
        tag: task.tag,
        priorityId: task.priorityId,
        source: scheduledTask ? "scheduled" : "pool",
        hour: scheduledTask?.hour,
        day: scheduledTask?.day,
      });
      setField("copiedTaskId", task.id);
      if (copyTimeoutRef.current) window.clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => {
        setField("copiedTaskId", null);
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
    setField("activeDay", base.toISOString().slice(0, 10));
  }

  function handleJalaliMonthShift(delta: number) {
    setField("jalaliMonthView", (prev) => {
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
    setField("activeDay", key);
  }

  function openTagModal(tag?: string) {
    setField("editingTag", tag ?? null);
    setField("tagModalValue", tag ?? "");
    setField("tagModalError", "");
    setField("tagModalOpen", true);
  }

  function closeTagModal() {
    setField("tagModalOpen", false);
    setField("tagModalValue", "");
    setField("editingTag", null);
    setField("tagModalError", "");
  }

  function handleSaveTagModal() {
    const value = tagModalValue.trim();
    if (!value) {
      setField("tagModalError", "نام برچسب را وارد کنید");
      return;
    }
    const duplicate = allTags.some(
      (t) => t.toLowerCase() === value.toLowerCase() && t !== editingTag
    );
    if (duplicate) {
      setField("tagModalError", "برچسبی با این نام وجود دارد");
      return;
    }

    if (editingTag) {
      setField("customTags", (prev) => {
        const next = prev.filter((t) => t !== editingTag);
        if (!baseTags.includes(value as BaseTag)) next.unshift(value);
        return next;
      });
      setField("pool", (prev) =>
        prev.map((t) => (t.tag === editingTag ? { ...t, tag: value } : t))
      );
      setField("schedule", (prev) => retagSchedule(prev, editingTag, value));
      if (newTaskTag === editingTag) setField("newTaskTag", value);
      if (filterTag === editingTag) setField("filterTag", value);
    } else {
      setField("customTags", (prev) => [value, ...prev.filter((t) => t !== value)]);
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
            onClick={() => setField("activeDay", todayKey())}
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
            gap: "10px",
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
                onChange={(e) => setField("newTaskTitle", e.target.value)}
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
                      setField("newTaskTag", (prev) => (prev === tag ? undefined : tag))
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
                  onChange={(value) => setField("newTaskPriority", value)}
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
                setField("poolHover", true);
              }}
              onDragLeave={() => setField("poolHover", false)}
              onDrop={(e) => {
                e.preventDefault();
                const data = e.dataTransfer.getData("application/json");
                handleDropToPool(data);
                setField("poolHover", false);
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
                          setField("deleteModal", {
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
                  onClick={() => setField("calendarModal", "month")}
                >
                  <span>{jalaliMonthName}</span>
                  <span className="calendar-strip__caret">▾</span>
                </button>
                <button
                  className="calendar-strip__year-btn"
                  type="button"
                  onClick={() => setField("calendarModal", "year")}
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
                    setField("hoverHour", hour);
                  }}
                  onDragLeave={() =>
                    setField("hoverHour", (prev) => (prev === hour ? null : prev))
                  }
                  onDrop={(e) => {
                    e.preventDefault();
                    const data = e.dataTransfer.getData("application/json");
                    handleDrop(hour, data);
                    setField("hoverHour", null);
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
                                  setField("deleteModal", {
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
                                setField("deleteModal", {
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
                              setField("deleteModal", {
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
                setField("tagModalValue", e.target.value);
                setField("tagModalError", "");
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
            onClick={() => setField("calendarModal", null)}
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
                onClick={() => setField("calendarModal", null)}
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
                            setField("jalaliMonthView", (prev) => ({
                              ...prev,
                              jm: month,
                            }));
                            setField("calendarModal", null);
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
                            setField("jalaliMonthView", (prev) => ({
                              ...prev,
                              jy: year,
                            }));
                            setField("calendarModal", null);
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

export default PlannerPage;
