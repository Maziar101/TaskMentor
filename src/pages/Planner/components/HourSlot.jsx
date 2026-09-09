import { FiCheck, FiEye } from "react-icons/fi";
import { formatHour, getPriorityColor } from "../utils";
import { getPlannerBlockSegment } from "../durationResize";
import { getSlotTimeState } from "../slotTime";
import ScheduledTaskCard from "./ScheduledTaskCard";

export default function HourSlot({
  hour,
  blocksByStart,
  coveringBlocks,
  dayPosition,
  now,
  daySchedule,
  durationResize,
  hoverHour,
  priorities,
  setField,
  previewDurationResize,
  finishDurationResize,
  handleDrop,
  toggleDoneForTask,
  openTaskDetails,
  toggleDoneForBlock,
  extendDurationByOne,
  extendIndividualDurationByOne,
  shortenIndividualDurationByOne,
  beginDurationResize,
  cancelDurationResize,
}) {
  const blockStart = blocksByStart.get(hour);
  const covered = coveringBlocks.get(hour);
  const hourTasks = daySchedule.filter((t) => t.hour === hour);
  const {
    hidden,
    displayBlock,
    duration: displayDuration,
  } = getPlannerBlockSegment({
    hour,
    blockStart,
    covered,
    hourTasks,
  });
  if (hidden) return null;
  const continuingTasks =
    hour % 4 === 0
      ? daySchedule.filter((task) => {
          const taskDuration = Math.max(1, Number(task.duration) || 1);
          return task.hour < hour && task.hour + taskDuration > hour;
        })
      : [];
  const stackedTasks =
    hourTasks.length > 1
      ? hourTasks
      : continuingTasks.length > 1
        ? continuingTasks
        : [];
  const hasOverlap = stackedTasks.length > 1;
  const blockDuration = hasOverlap
    ? Math.max(
        ...stackedTasks.map((task) =>
          Math.min(
            4 - (hour % 4),
            24 - hour,
            task.hour + Math.max(1, Number(task.duration) || 1) - hour,
          ),
        ),
      )
    : displayDuration;
  const { isPastHour, isCurrentHour } = getSlotTimeState({
    dayPosition,
    now,
    start: displayBlock?.start ?? hour,
    end: hasOverlap ? hour + blockDuration : displayBlock?.end ?? hour + 1,
  });
  const hasTasks = hourTasks.length > 0 || Boolean(displayBlock);
  const allDone = hasOverlap
    ? stackedTasks.every((task) => task.done)
    : displayBlock
      ? Boolean(displayBlock.task.done)
      : hasTasks && hourTasks.every((task) => task.done);
  const isResizePreview = Boolean(
    durationResize?.valid &&
      hour >= durationResize.start &&
      hour < durationResize.start + durationResize.duration,
  );
  const isResizeBlocked = Boolean(
    durationResize &&
      !durationResize.valid &&
      hour === durationResize.conflictHour,
  );
  let chipLabel = null;
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
      data-planner-hour={hour}
      style={
        blockDuration > 1
          ? { "--slot-span": blockDuration }
          : undefined
      }
      className={[
        "slot",
        hoverHour === hour && "slot--hover",
        covered && "slot--covered",
        blockDuration > 1 && "slot--multi-hour",
        isResizePreview && "slot--resize-preview",
        isResizeBlocked && "slot--resize-blocked",
        isPastHour && "slot--past",
        isCurrentHour && "slot--current",
        hasOverlap && "slot--crowded",
      ]
        .filter(Boolean)
        .join(" ")}
      onDragOver={(e) => {
        e.preventDefault();
        if (durationResize) {
          e.dataTransfer.dropEffect = "move";
          previewDurationResize(hour);
        } else {
          setField("hoverHour", hour);
        }
      }}
      onDragLeave={() => {
        if (!durationResize) {
          setField("hoverHour", (prev) =>
            prev === hour ? null : prev,
          );
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (durationResize) {
          finishDurationResize(hour);
        } else {
          const data = e.dataTransfer.getData("application/json");
          handleDrop(hour, data, blockDuration);
        }
        setField("hoverHour", null);
      }}
    >
      <div className="slot__label-row">
        <div className="slot__label">
          {blockDuration > 1
            ? `${formatHour(hour)} تا ${formatHour(hour + blockDuration)}`
            : formatHour(hour)}
        </div>
        {chipLabel && (
          <div className="slot__actions">
            <span className={chipClassName}>{chipLabel}</span>
          </div>
        )}
      </div>
      <div className="slot__content">
        {hasOverlap && (
          <div className="stacked-tasks">
            {stackedTasks.map((task) => {
              const totalTaskDuration = Math.max(
                1,
                Number(task.duration) || 1,
              );
              const taskDuration = Math.min(
                blockDuration,
                task.hour + totalTaskDuration - hour,
              );
              const widthRatio = taskDuration / blockDuration;
              return (
                <div
                  key={task.id}
                  className="stacked-task-group"
                  style={{
                    width: `calc(${widthRatio * 100}% - ${(1 - widthRatio) * 10}px)`,
                  }}
                >
                  <div
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
                        }),
                      );
                      e.dataTransfer.effectAllowed = "move";
                    }}
                  >
                    <span className="stacked-task__title task__title--with-dot">
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
                    </span>
                    <div className="task__meta-actions">
                      <button
                        className="icon-btn"
                        type="button"
                        aria-label="علامت انجام شده"
                        onClick={() => toggleDoneForTask(task.id, task.day)}
                      >
                        <FiCheck aria-hidden />
                      </button>
                      <button
                        className="icon-btn"
                        type="button"
                        aria-label="مشاهده و ویرایش تسک"
                        title="مشاهده و ویرایش"
                        onClick={() =>
                          openTaskDetails(task, "scheduled", {
                            task,
                            start: task.hour,
                            end: Math.min(
                              24,
                              task.hour +
                                Math.max(1, Number(task.duration) || 1),
                            ),
                            individual: true,
                          })
                        }
                      >
                        <FiEye aria-hidden />
                      </button>
                    </div>
                  </div>
                  {!task.done && (
                    <div className="stacked-task__duration-actions">
                      <button
                        className="task__resize-handle stacked-task__resize-handle"
                        type="button"
                        aria-label={`افزودن یک ساعت به ${task.title}`}
                        title="افزودن یک ساعت"
                        onClick={() => extendIndividualDurationByOne(task)}
                      >
                        <span aria-hidden>＋</span>
                        <span>یک ساعت</span>
                      </button>
                      <button
                        className="task__resize-handle stacked-task__resize-handle"
                        type="button"
                        disabled={totalTaskDuration <= 1}
                        aria-label={`کم کردن یک ساعت از ${task.title}`}
                        title="کم کردن یک ساعت"
                        onClick={() => shortenIndividualDurationByOne(task)}
                      >
                        <span aria-hidden>−</span>
                        <span>یک ساعت</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {!hasOverlap && !blockStart && !covered && (
          <span className="hint">درگ کنید</span>
        )}
        {!hasOverlap && displayBlock && (
          <ScheduledTaskCard
            block={displayBlock}
            priorities={priorities}
            isPastHour={isPastHour}
            isResizing={
              durationResize?.anchorId === displayBlock.task.id
            }
            onMoveDragStart={(event, task) => {
              event.dataTransfer.setData(
                "application/json",
                JSON.stringify({
                  type: "scheduled",
                  id: task.id,
                  day: task.day,
                }),
              );
              event.dataTransfer.effectAllowed = "move";
            }}
            onToggleDone={() => toggleDoneForBlock(displayBlock)}
            onOpenDetails={() =>
              openTaskDetails(
                displayBlock.task,
                "scheduled",
                displayBlock,
              )
            }
            onResizeClick={() => extendDurationByOne(displayBlock)}
            onResizeDragStart={beginDurationResize}
            onResizeDragEnd={cancelDurationResize}
            checkIcon={<FiCheck aria-hidden />}
            detailsIcon={<FiEye aria-hidden />}
          />
        )}
      </div>
    </div>
  );
}
