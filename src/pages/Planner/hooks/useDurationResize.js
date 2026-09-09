import { useState } from "react";
import { HotToast } from "../../../utils/HotToast";
import { createDurationResize, planDurationResize } from "../durationResize";

export default function useDurationResize({
  daySchedule,
  fetchData,
  loadSchedule,
}) {
  const [durationResize, setDurationResize] = useState(null);

  function beginDurationResize(event, block) {
    const resize = createDurationResize(block, daySchedule);
    event.dataTransfer.setData(
      "application/json",
      JSON.stringify({ type: "duration-resize", anchorId: resize.anchorId }),
    );
    event.dataTransfer.effectAllowed = "move";
    setDurationResize(resize);
  }

  function previewDurationResize(hour) {
    setDurationResize((current) => {
      if (!current) return current;
      const next = planDurationResize(current, hour, daySchedule);
      if (
        next.duration === current.duration &&
        next.valid === current.valid &&
        next.conflictHour === current.conflictHour
      ) {
        return current;
      }
      return next;
    });
  }

  async function saveDurationResize(resize) {
    if (!resize.valid) {
      HotToast("error", "این بازه با تسک دیگری تداخل دارد");
      return;
    }
    if (resize.duration === resize.originalDuration) return;

    const { res, status } = await fetchData(
      `/api/schedule?id=${resize.anchorId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duration: resize.duration }),
      },
    );
    if (status !== 200) throw new Error(res?.message);

    const redundantIds = resize.affectedIds.filter(
      (taskId) => taskId !== resize.anchorId,
    );
    const deleteResponses = await Promise.all(
      redundantIds.map((taskId) =>
        fetchData(`/api/schedule?id=${taskId}`, { method: "DELETE" }),
      ),
    );
    const failedDelete = deleteResponses.find(
      ({ status: deleteStatus }) => deleteStatus !== 200,
    );
    if (failedDelete) throw new Error(failedDelete.res?.message);

    await loadSchedule(resize.day);
  }

  async function finishDurationResize(hour) {
    if (!durationResize) return;
    const resize = planDurationResize(durationResize, hour, daySchedule);
    setDurationResize(null);
    try {
      await saveDurationResize(resize);
    } catch (error) {
      HotToast("error", error?.message || "تغییر مدت تسک انجام نشد");
      await loadSchedule(resize.day);
    }
  }

  async function extendDurationByOne(block) {
    const resize = createDurationResize(block, daySchedule);
    if (block.end >= 24) {
      HotToast("error", "بعد از ساعت ۲۴ زمانی برای افزایش وجود ندارد");
      return;
    }
    const proposal = planDurationResize(resize, block.end, daySchedule);
    try {
      await saveDurationResize(proposal);
    } catch (error) {
      HotToast("error", error?.message || "تغییر مدت تسک انجام نشد");
      await loadSchedule(proposal.day);
    }
  }

  async function extendIndividualDurationByOne(task) {
    const currentDuration = Math.max(1, Number(task.duration) || 1);
    if (task.hour + currentDuration >= 24) {
      HotToast("error", "بعد از ساعت ۲۴ زمانی برای افزایش وجود ندارد");
      return;
    }

    try {
      const { res, status } = await fetchData(
        `/api/schedule?id=${task.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration: currentDuration + 1 }),
        },
      );
      if (status !== 200) throw new Error(res?.message);
      await loadSchedule(task.day);
    } catch (error) {
      HotToast("error", error?.message || "افزایش مدت تسک انجام نشد");
      await loadSchedule(task.day);
    }
  }

  async function shortenIndividualDurationByOne(task) {
    const currentDuration = Math.max(1, Number(task.duration) || 1);
    if (currentDuration <= 1) return;

    try {
      const { res, status } = await fetchData(
        `/api/schedule?id=${task.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ duration: currentDuration - 1 }),
        },
      );
      if (status !== 200) throw new Error(res?.message);
      await loadSchedule(task.day);
    } catch (error) {
      HotToast("error", error?.message || "کاهش مدت تسک انجام نشد");
      await loadSchedule(task.day);
    }
  }

  async function shortenBlockDuration(block, duration) {
    const resize = createDurationResize(block, daySchedule);
    const nextDuration = Math.max(
      1,
      Math.min(resize.originalDuration, Number(duration) || 1),
    );
    const proposal = planDurationResize(
      resize,
      resize.start + nextDuration - 1,
      daySchedule,
    );
    await saveDurationResize(proposal);
  }

  return {
    durationResize,
    beginDurationResize,
    previewDurationResize,
    finishDurationResize,
    extendDurationByOne,
    extendIndividualDurationByOne,
    shortenIndividualDurationByOne,
    shortenBlockDuration,
    cancelDurationResize: () => setDurationResize(null),
  };
}
