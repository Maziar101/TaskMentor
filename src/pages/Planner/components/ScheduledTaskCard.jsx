import {
  PERSIAN_NUMBER,
  formatHour,
  getPriorityColor,
  getTagClass,
  getTagLabel,
} from "../utils";

export default function ScheduledTaskCard({
  block,
  priorities,
  isPastHour,
  isResizing,
  onMoveDragStart,
  onToggleDone,
  onOpenDetails,
  onResizeClick,
  onResizeDragStart,
  onResizeDragEnd,
  checkIcon,
  detailsIcon,
}) {
  const { task, start, end } = block;
  const duration = Math.max(1, end - start);

  return (
    <article
      className={[
        "task",
        "task--scheduled",
        "task--merged",
        isResizing && "task--resizing",
        task.done && "task--done",
        !task.done && isPastHour && "task--stale",
      ]
        .filter(Boolean)
        .join(" ")}
      title={task.title}
      draggable
      onDragStart={(event) => onMoveDragStart(event, task)}
    >
      <div className="task__title task__title--with-dot">
        <span
          className="priority-dot"
          style={{
            backgroundColor: getPriorityColor(task.priorityId, priorities),
          }}
        />
        <span className="task__title-text">{task.title}</span>
      </div>

      <div className="task__duration" aria-live="polite">
        <span>{PERSIAN_NUMBER.format(duration)} ساعت</span>
        <span>
          {formatHour(start)} تا {formatHour(end)}
        </span>
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
            aria-label="علامت انجام شده"
            onClick={onToggleDone}
          >
            {checkIcon}
          </button>
          <button
            className="icon-btn"
            type="button"
            aria-label="مشاهده و ویرایش تسک"
            title="مشاهده و ویرایش"
            onClick={onOpenDetails}
          >
            {detailsIcon}
          </button>
        </div>
      </div>

      {!task.done && (
        <button
          className="task__resize-handle"
          type="button"
          draggable
          aria-label="افزایش یا کاهش مدت تسک"
          title="برای تغییر مدت بکشید؛ برای افزودن یک ساعت کلیک کنید"
          onClick={onResizeClick}
          onDragStart={(event) => {
            event.stopPropagation();
            onResizeDragStart(event, block);
          }}
          onDragEnd={onResizeDragEnd}
        >
          <span aria-hidden>＋</span>
          <span>یک ساعت</span>
        </button>
      )}
    </article>
  );
}
