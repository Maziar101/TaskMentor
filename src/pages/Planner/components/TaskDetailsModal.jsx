import { useCallback, useEffect, useRef, useState } from "react";
import { FiTrash2, FiX } from "react-icons/fi";
import PriorityDropdown from "../../../components/PriorityDropdown";
import TaskTagDropdown from "./TaskTagDropdown";

function buildForm(details) {
  const task = details?.task;
  const blockDuration = details?.block
    ? Math.max(1, details.block.end - details.block.start)
    : null;
  return {
    title: task?.title ?? "",
    tag: task?.tag ?? "",
    priorityId: task?.priorityId ?? "",
    duration: task?.duration ?? blockDuration ?? 1,
  };
}

export default function TaskDetailsModal({
  details,
  tags,
  priorities,
  busy,
  onClose,
  onSave,
  onRequestDelete,
}) {
  const [form, setForm] = useState(() => buildForm(details));
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef(null);

  const requestClose = useCallback(
    (afterClose = onClose) => {
      if (busy || isClosing) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        afterClose();
        return;
      }
      setIsClosing(true);
      closeTimerRef.current = window.setTimeout(afterClose, 220);
    },
    [busy, isClosing, onClose],
  );

  useEffect(
    () => () => {
      if (closeTimerRef.current) window.clearTimeout(closeTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!details) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [details, requestClose]);

  const isScheduled = details.source === "scheduled";
  const scheduledDuration = details.block
    ? Math.max(1, details.block.end - details.block.start)
    : 1;
  const canShortenScheduledTask = isScheduled && scheduledDuration > 1;
  const durationValue = Math.max(
    1,
    Math.min(scheduledDuration, Number(form.duration) || 1),
  );
  const durationProgress = canShortenScheduledTask
    ? ((durationValue - 1) / (scheduledDuration - 1)) * 100
    : 0;
  const updateField = (key, value) => {
    setForm((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setError("عنوان تسک را وارد کنید");
      return;
    }

    try {
      const duration = Math.max(1, Math.min(24, Number(form.duration) || 1));
      await onSave({
        ...form,
        title,
        tag: form.tag || "",
        priorityId: form.priorityId || "",
        duration: isScheduled
          ? Math.min(scheduledDuration, duration)
          : duration,
      });
      requestClose();
    } catch (saveError) {
      setError(saveError?.message || "ذخیره تغییرات انجام نشد");
    }
  };

  return (
    <div
      className={`modal task-details-modal${
        isClosing ? " task-details-modal--closing" : ""
      }`}
    >
      <div
        className="modal__backdrop"
        onClick={busy ? undefined : () => requestClose()}
        aria-hidden
      />
      <form
        className="modal__card task-details-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-details-title"
        onSubmit={handleSubmit}
      >
        <div className="task-details-modal__header">
          <div>
            <h3 id="task-details-title">جزئیات تسک</h3>
            <p className="light small">
              اطلاعات تسک را ببینید و در صورت نیاز تغییر دهید
            </p>
          </div>
          <button
            className="icon-btn"
            type="button"
            aria-label="بستن"
            disabled={busy}
            onClick={() => requestClose()}
          >
            <FiX aria-hidden />
          </button>
        </div>

        <label className="task-details-modal__field">
          <span>عنوان تسک</span>
          <textarea
            autoFocus
            rows="3"
            value={form.title}
            onChange={(event) => updateField("title", event.target.value)}
          />
        </label>

        {canShortenScheduledTask && (
          <section
            className="task-details-modal__duration"
            aria-labelledby="task-duration-label"
          >
            <span id="task-duration-label">مدت زمان تسک</span>
            <div className="task-details-modal__duration-control">
              <div className="task-details-modal__duration-value">
                <strong>{durationValue.toLocaleString("fa-IR")}</strong>
                <span>ساعت</span>
              </div>
              <div className="task-details-modal__duration-slider">
                <output
                  style={{ "--duration-progress": `${durationProgress}%` }}
                >
                  {durationValue.toLocaleString("fa-IR")} ساعت
                </output>
                <input
                  type="range"
                  min="1"
                  max={scheduledDuration}
                  step="1"
                  value={durationValue}
                  disabled={busy}
                  aria-label="مدت زمان تسک"
                  aria-valuetext={`${durationValue.toLocaleString("fa-IR")} ساعت`}
                  onChange={(event) =>
                    updateField("duration", Number(event.target.value))
                  }
                />
                <div className="task-details-modal__duration-limits">
                  <span>۱ ساعت</span>
                  <span>{scheduledDuration.toLocaleString("fa-IR")} ساعت</span>
                </div>
              </div>
            </div>
            <small>مدت تسک از این بخش قابل افزایش یا کاهش است.</small>
          </section>
        )}

        <div className="task-details-modal__grid">
          <div className="task-details-modal__field">
            <span>برچسب</span>
            <TaskTagDropdown
              value={form.tag}
              tags={tags}
              onChange={(value) => updateField("tag", value)}
            />
          </div>

          <div className="task-details-modal__field">
            <span>اولویت</span>
            <PriorityDropdown
              value={form.priorityId || undefined}
              options={priorities}
              onChange={(value) => updateField("priorityId", value ?? "")}
            />
          </div>

          {!isScheduled && (
            <label className="task-details-modal__field">
              <span>مدت (ساعت)</span>
              <input
                type="number"
                min="1"
                max="24"
                value={form.duration}
                onChange={(event) =>
                  updateField("duration", event.target.value)
                }
              />
            </label>
          )}
        </div>

        {error && <p className="error">{error}</p>}

        <div className="task-details-modal__actions">
          <button
            className="ghost task-details-modal__delete"
            type="button"
            disabled={busy}
            onClick={() => requestClose(onRequestDelete)}
          >
            <FiTrash2 aria-hidden />
            حذف تسک
          </button>
          <div className="modal__actions">
            <button
              className="ghost"
              type="button"
              disabled={busy}
              onClick={() => requestClose()}
            >
              انصراف
            </button>
            <button className="primary" type="submit" disabled={busy}>
              {busy ? "در حال ذخیره…" : "ذخیره تغییرات"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
