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
  beginDurationResize,
  cancelDurationResize,
}) {
  const blockStart = blocksByStart.get(hour);
  const covered = coveringBlocks.get(hour);
  const hourTasks = daySchedule.filter((t) => t.hour === hour);
  const {
    hidden,
    displayBlock,
    duration: blockDuration,
    isMultiHourBlock,
  } = getPlannerBlockSegment({
    hour,
    blockStart,
    covered,
    hourTasks,
  });
  if (hidden) return null;
  const { isPastHour, isCurrentHour } = getSlotTimeState({
    dayPosition,
    now,
    start: displayBlock?.start ?? hour,
    end: displayBlock?.end ?? hour + 1,
  });
  const hasOverlap = hourTasks.length > 1;
  const hasTasks = hourTasks.length > 0 || Boolean(displayBlock);
  const allDone = displayBlock
    ? Boolean(displayBlock.task.done)
    : hasTasks && hourTasks.every((t) => t.done);
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
        isMultiHourBlock && "slot--multi-hour",
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
          handleDrop(hour, data);
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
                  <span className="task__title-text">
                    {task.title}
                  </span>
                </span>
                <div className="task__meta-actions">
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
                    className="icon-btn"
                    type="button"
                    aria-label="مشاهده و ویرایش تسک"
                    title="مشاهده و ویرایش"
                    onClick={() =>
                      openTaskDetails(task, "scheduled")
                    }
                  >
                    <FiEye aria-hidden />
                  </button>
                </div>
              </div>
            ))}
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
