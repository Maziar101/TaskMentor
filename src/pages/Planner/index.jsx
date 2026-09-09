import { useCallback, useEffect, useMemo, useReducer } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiX,
  FiEye,
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
} from "./utils";
import { useFetch } from "../../hooks/useFetch";
import { HandleReduce } from "../../utils/HandleReducer";
import { HotToast } from "../../utils/HotToast";
import AutoGrowTextarea from "./components/AutoGrowTextarea";
import HourSlot from "./components/HourSlot";
import TaskDetailsModal from "./components/TaskDetailsModal";
import useDurationResize from "./hooks/useDurationResize";

function PlannerPage() {
  const [state, dispatch] = useReducer(
    plannerReducer,
    undefined,
    createPlannerInitialState,
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
    taskDetails,
    taskDetailsBusy,
  } = state;
  const { fetchData } = useFetch();
  const handleReducer = HandleReduce(dispatch);

  const setField = useCallback((key, value) => {
    dispatch({
      type: "update",
      updater: (prev) => {
        const nextValue = typeof value === "function" ? value(prev[key]) : value;
        if (Object.is(nextValue, prev[key])) return prev;
        return { ...prev, [key]: nextValue };
      },
    });
  }, []);

  const loadPool = useCallback(async () => {
    try {
      const { res, status } = await fetchData(`/api/tasks?unscheduled=true`);
      if (status !== 200) {
        return HotToast("error", res?.message);
      }
      const mapped =
        Array.isArray(res?.data) && res?.data.length > 0
          ? res?.data.map((t) => ({
              id: t._id ?? t.id,
              title: t.title,
              tag: t.tag,
              priorityId: t.priority,
              duration: t.duration ?? 1,
            }))
          : [];
      setField("pool", mapped);
    } catch (err) {
      setField("pool", []);
    }
  }, [setField]);

  const loadSchedule = useCallback(
    async (day) => {
      const { res, status } = await fetchData(`/api/schedule?day=${day}`);
      if (status !== 200) {
        return HotToast("error", res?.message);
      }
      const mapped =
        Array.isArray(res?.data) && res?.data?.length > 0
          ? res?.data?.map((item) => ({
              id: item?._id || item?.id,
              title: item?.title,
              tag: item?.tag,
              priorityId: item?.priority ?? item?.priorityId,
              day: item?.day,
              hour: +item?.hour,
              duration: item?.duration ?? 1,
              done: Boolean(item?.done),
            }))
          : [];
      setField("schedule", (prev) => ({ ...prev, [day]: mapped }));
    },
    [setField],
  );

  useEffect(() => {
    const payload = { notes, customTags };
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
    loadPool();
  }, [loadPool]);

  useEffect(() => {
    loadSchedule(activeDay);
  }, [activeDay, loadSchedule]);

  useEffect(() => {
    const id = setInterval(() => setField("now", new Date()), 60000);
    return () => clearInterval(id);
  }, [setField]);

  useEffect(() => {
    function onKeyDown(e) {
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

  const activeDate = useMemo(
    () => new Date(`${activeDay}T00:00:00Z`),
    [activeDay],
  );
  const currentDayKey = useMemo(() => todayKey(now), [now]);
  const dayPosition = useMemo(() => {
    if (activeDay === currentDayKey) return "today";
    return activeDay < currentDayKey ? "past" : "future";
  }, [activeDay, currentDayKey]);

  const daySchedule = useMemo(
    () => sortByHour(schedule[activeDay] ?? []),
    [schedule, activeDay],
  );

  const {
    durationResize,
    beginDurationResize,
    previewDurationResize,
    finishDurationResize,
    extendDurationByOne,
    extendIndividualDurationByOne,
    shortenIndividualDurationByOne,
    shortenBlockDuration,
    cancelDurationResize,
  } = useDurationResize({ daySchedule, fetchData, loadSchedule });

  const dayDoneCount = useMemo(
    () => daySchedule.filter((t) => t.done).length,
    [daySchedule],
  );
  const dayPendingCount = useMemo(
    () => Math.max(0, daySchedule.length - dayDoneCount),
    [daySchedule.length, dayDoneCount],
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
    [activeDate],
  );
  const jalaliToday = useMemo(() => toJalaliParts(now), [now]);
  const jalaliMonthName = useMemo(
    () => formatJalaliMonthName(jalaliMonthView),
    [jalaliMonthView],
  );
  const jalaliMonthDays = useMemo(() => {
    return buildJalaliMonthDays(jalaliMonthView.jy, jalaliMonthView.jm);
  }, [jalaliMonthView]);
  const allTags = useMemo(() => {
    const merged = [...baseTags, ...customTags];
    return Array.from(new Set(merged));
  }, [customTags]);

  useEffect(() => {
    setField("jalaliMonthView", toJalaliParts(activeDate));
  }, [activeDate, setField]);

  const previewSchedule = useMemo(() => {
    if (!durationResize || durationResize.day !== activeDay) return daySchedule;
    const affectedIds = new Set(durationResize.affectedIds);
    return daySchedule.flatMap((task) => {
      if (task.id === durationResize.anchorId) {
        return {
          ...task,
          duration: durationResize.valid
            ? durationResize.duration
            : durationResize.originalDuration,
        };
      }
      return affectedIds.has(task.id) ? [] : task;
    });
  }, [activeDay, daySchedule, durationResize]);

  const mergedBlocks = useMemo(
    () => mergeConsecutive(previewSchedule),
    [previewSchedule],
  );

  const blocksByStart = useMemo(() => {
    const map = new Map();
    mergedBlocks.forEach((b) => map.set(b.start, b));
    return map;
  }, [mergedBlocks]);

  const coveringBlocks = useMemo(() => {
    const map = new Map();
    mergedBlocks.forEach((b) => {
      for (let h = b.start + 1; h < b.end; h += 1) {
        map.set(h, b);
      }
    });
    return map;
  }, [mergedBlocks]);

  function showUndoToast(payload) {
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
    try {
      if (payload.type === "pool") {
        await Promise.all(
          payload.tasks.map((t) =>
            fetchData("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: t?.title,
                tag: t?.tag,
                priority: t?.priorityId,
                duration: t?.duration ?? 1,
              }),
            }),
          ),
        );
        await loadPool();
      } else {
        await Promise.all(
          payload.tasks.map((t) =>
            fetchData("/api/schedule", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: t.title,
                tag: t.tag,
                day: t.day,
                hour: t.hour,
                duration: t.duration ?? 1,
                done: t.done,
              }),
            }),
          ),
        );
        await loadSchedule(payload.day);
      }
    } catch (err) {
      console.error("Failed to undo", err);
    }
  }

  async function handleAddTask() {
    setField("formError", "");
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    const tagToUse = newTaskTag;
    try {
      const res = await fetchData("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trimmed,
          tag: tagToUse,
          priority: newTaskPriority,
          duration: 1,
        }),
      });
      if (!res.ok) throw new Error(res?.res?.message || "Failed to add task");
      const data = res?.res?.data;
      const task = {
        id: data?._id ?? data?.id ?? generateId(),
        title: data?.title ?? trimmed,
        tag: data?.tag ?? tagToUse,
        priorityId: data?.priority ?? newTaskPriority,
        duration: data?.duration ?? 1,
      };
      setField("pool", (prev) => [task, ...prev]);
      if (tagToUse) setField("filterTag", tagToUse);
      setField("newTaskTitle", "");
    } catch (err) {
      console.error("Failed to add task", err);
      setField("formError", "افزودن تسک انجام نشد. اتصال یا ورود را چک کن.");
    }
  }

  async function handleDrop(hour, data, targetDuration = 1) {
    let parsed = {
      type: "pool" | "scheduled",
      id: "",
      day: "",
    };
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }
    if (!parsed) return;
    const droppedDuration = Math.max(
      1,
      Math.min(24 - hour, Number(targetDuration) || 1),
    );

    if (parsed.type === "pool") {
      const task = pool.find((t) => t.id === parsed?.id);
      if (!task) return;
      try {
        const { res, status } = await fetchData("/api/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: task.title,
            tag: task.tag,
            priority: task.priorityId,
            day: activeDay,
            hour,
            duration: droppedDuration,
            done: false,
          }),
        });
        if (status !== 201) {
          return HotToast("error", res?.message);
        }
        const { res: res2, status: status2 } = await fetchData(
          `/api/tasks/${task.id}`,
          {
            method: "DELETE",
          },
        );
        if (status2 !== 200) {
          return HotToast("error", res2.message);
        }
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
      if (!task) return;

      try {
        const { res, status } = await fetchData(`/api/schedule?id=${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            day: activeDay,
            hour,
            duration: droppedDuration,
          }),
        });
        if (status !== 200) {
          return HotToast("error", res?.message);
        }
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

  async function handleDropToPool(data) {
    let parsed = {
      type: "pool" | "scheduled",
      id: "",
      day: "",
    };
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }
    if (!parsed || parsed.type !== "scheduled") return;

    const fromDay = parsed.day ?? activeDay;
    const existing = schedule[fromDay] ?? [];
    const task = existing.find((t) => t.id === parsed.id);
    if (!task) return;

    try {
      await fetchData(`/api/schedule?id=${task.id}`, {
        method: "DELETE",
      });
      await fetchData("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: task.title,
          tag: task.tag,
          priority: task.priorityId,
          duration: task.duration ?? 1,
        }),
      });
      await Promise.all([loadSchedule(fromDay), loadPool()]);
    } catch (err) {
      console.error("Failed to move back to Tasks", err);
    }
  }

  async function handleDeleteBlock(block) {
    const fromDay = block.task.day;
    const fromList = schedule[fromDay] ?? [];
    const removed = fromList.filter((t) => {
      const sameTitle =
        t.title.trim().toLowerCase() === block.task.title.trim().toLowerCase();
      const sameTag = t.tag === block.task.tag;
      const inRange = t.hour >= block.start && t.hour < block.end;
      return sameTitle && sameTag && inRange;
    });
    if (removed.length === 0) return;
    showUndoToast({ type: "scheduled", tasks: removed, day: fromDay });
    try {
      await Promise.all(
        removed.map((t) =>
          fetchData(`/api/schedule?id=${t.id}`, {
            method: "DELETE",
          }),
        ),
      );
      await loadSchedule(fromDay);
    } catch (err) {
      console.error("Failed to delete block", err);
    }
  }

  async function handleDeleteScheduled(taskId, day) {
    const fromList = schedule[day] ?? [];
    const removed = fromList.find((t) => t.id === taskId);
    if (!removed) return;
    showUndoToast({ type: "scheduled", tasks: [removed], day });
    try {
      await fetchData(`/api/schedule?id=${taskId}`, {
        method: "DELETE",
      });
      await loadSchedule(day);
    } catch (err) {
      console.error("Failed to delete scheduled task", err);
    }
  }

  async function toggleDoneForTask(taskId, day) {
    const fromList = schedule[day] ?? [];
    const target = fromList.find((t) => t.id === taskId);
    if (!target) return;
    try {
      await fetchData(`/api/schedule?id=${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !target.done }),
      });
      await loadSchedule(day);
    } catch (err) {
      console.error("Failed to toggle task", err);
    }
  }

  async function toggleDoneForBlock(block) {
    const fromDay = block.task.day;
    const fromList = schedule[fromDay] ?? [];
    const affected = fromList.filter((t) => {
      const sameTitle =
        t.title.trim().toLowerCase() === block.task.title.trim().toLowerCase();
      const sameTag = t.tag === block.task.tag;
      const inRange = t.hour >= block.start && t.hour < block.end;
      return sameTitle && sameTag && inRange;
    });
    if (affected.length === 0) return;
    try {
      await Promise.all(
        affected.map((t) =>
          fetchData(`/api/schedule?id=${t.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ done: !block.task.done }),
          }),
        ),
      );
      await loadSchedule(fromDay);
    } catch (err) {
      console.error("Failed to toggle block", err);
    }
  }

  async function handleDeletePoolTask(taskId) {
    const task = pool.find((t) => t.id === taskId);
    if (!task) return;
    showUndoToast({ type: "pool", tasks: [task] });
    try {
      await fetchData(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
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

  function openTaskDetails(task, source, block = null) {
    setField("taskDetails", { task, source, block });
  }

  async function handleSaveTaskDetails(values) {
    if (!taskDetails) return;
    setField("taskDetailsBusy", true);
    const payload = {
      title: values.title,
      tag: values.tag,
      priority: values.priorityId,
    };

    try {
      if (taskDetails.source === "pool") {
        const { res, status } = await fetchData(
          `/api/tasks/${taskDetails.task.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, duration: values.duration }),
          },
        );
        if (status !== 200) throw new Error(res?.message);
        await loadPool();
      } else {
        const sourceDay = taskDetails.task.day;
        const block = taskDetails.block;
        const sourceTasks = schedule[sourceDay] ?? [];
        const affected = block?.individual
          ? [taskDetails.task]
          : block
          ? sourceTasks.filter((task) => {
              const sameTitle =
                task.title.trim().toLowerCase() ===
                block.task.title.trim().toLowerCase();
              const sameTag = task.tag === block.task.tag;
              return sameTitle && sameTag && task.hour >= block.start && task.hour < block.end;
            })
          : [taskDetails.task];

        const responses = await Promise.all(
          affected.map((task) =>
            fetchData(`/api/schedule?id=${task.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                block?.individual
                  ? { ...payload, duration: values.duration }
                  : payload,
              ),
            }),
          ),
        );
        const failed = responses.find(({ status }) => status !== 200);
        if (failed) throw new Error(failed.res?.message);
        const currentDuration = block
          ? Math.max(1, block.end - block.start)
          : 1;
        if (block?.individual) {
          await loadSchedule(sourceDay);
        } else if (block && values.duration < currentDuration) {
          await shortenBlockDuration(block, values.duration);
        } else {
          await loadSchedule(sourceDay);
        }
      }
    } catch (error) {
      throw new Error(error?.message || "ذخیره تغییرات انجام نشد");
    } finally {
      setField("taskDetailsBusy", false);
    }
  }

  function requestTaskDelete() {
    if (!taskDetails) return;
    const { task, source, block } = taskDetails;
    setField("taskDetails", null);
    setField("deleteModal", {
      title: "حذف تسک",
      description: task.title
        ? `حذف تسک "${task.title}"؟`
        : "حذف این تسک؟",
      confirmLabel: "حذف",
      onConfirm: () =>
        source === "pool"
          ? handleDeletePoolTask(task.id)
          : block
            ? handleDeleteBlock(block)
            : handleDeleteScheduled(task.id, task.day),
    });
  }

  function handleJalaliMonthShift(delta) {
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

  function handleSelectJalaliDay(day) {
    if (!day) return;
    const key = dateKeyFromJalali(jalaliMonthView.jy, jalaliMonthView.jm, day);
    setField("activeDay", key);
  }

  function openTagModal(tag) {
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
      (t) => t.toLowerCase() === value.toLowerCase() && t !== editingTag,
    );
    if (duplicate) {
      setField("tagModalError", "برچسبی با این نام وجود دارد");
      return;
    }

    if (editingTag) {
      setField("customTags", (prev) => {
        const next = prev.filter((t) => t !== editingTag);
        if (!baseTags.includes(value)) next.unshift(value);
        return next;
      });
      setField("pool", (prev) =>
        prev.map((t) => (t.tag === editingTag ? { ...t, tag: value } : t)),
      );
      setField("schedule", (prev) => retagSchedule(prev, editingTag, value));
      if (newTaskTag === editingTag) setField("newTaskTag", value);
      if (filterTag === editingTag) setField("filterTag", value);
    } else {
      setField("customTags", (prev) => [
        value,
        ...prev.filter((t) => t !== value),
      ]);
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
    const lookup = (type) => parts.find((p) => p.type === type)?.value ?? "";
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
              <AutoGrowTextarea
                placeholder="می‌خوای چه کاری انجام بدی؟ بنویس…"
                value={newTaskTitle}
                onChange={(e) => setField("newTaskTitle", e.target.value)}
                onSubmit={handleAddTask}
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
                      setField("newTaskTag", (prev) =>
                        prev === tag ? undefined : tag,
                      )
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
                      JSON.stringify({ type: "pool", id: task.id }),
                    );
                    e.dataTransfer.effectAllowed = "move";
                  }}
                >
                  <div className="task__title task__title--with-dot">
                    <span
                      className="priority-dot"
                      style={{
                        backgroundColor: getPriorityColor(
                          task.priorityId,
                          priorities,
                        ),
                      }}
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
                        className="icon-btn"
                        type="button"
                        aria-label="مشاهده و ویرایش تسک"
                        title="مشاهده و ویرایش"
                        onClick={() => openTaskDetails(task, "pool")}
                      >
                        <FiEye aria-hidden />
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
                    jalaliMonthView.jm,
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
              return (
                <HourSlot
                  key={hour}
                  hour={hour}
                  blocksByStart={blocksByStart}
                  coveringBlocks={coveringBlocks}
                  dayPosition={dayPosition}
                  now={now}
                  daySchedule={daySchedule}
                  durationResize={durationResize}
                  hoverHour={hoverHour}
                  priorities={priorities}
                  setField={setField}
                  previewDurationResize={previewDurationResize}
                  finishDurationResize={finishDurationResize}
                  handleDrop={handleDrop}
                  toggleDoneForTask={toggleDoneForTask}
                  openTaskDetails={openTaskDetails}
                  toggleDoneForBlock={toggleDoneForBlock}
                  extendDurationByOne={extendDurationByOne}
                  extendIndividualDurationByOne={
                    extendIndividualDurationByOne
                  }
                  shortenIndividualDurationByOne={
                    shortenIndividualDurationByOne
                  }
                  beginDurationResize={beginDurationResize}
                  cancelDurationResize={cancelDurationResize}
                />
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
      {taskDetails && (
        <TaskDetailsModal
          details={taskDetails}
          tags={allTags}
          priorities={priorities}
          busy={taskDetailsBusy}
          onClose={() => setField("taskDetails", null)}
          onSave={handleSaveTaskDetails}
          onRequestDelete={requestTaskDelete}
        />
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
