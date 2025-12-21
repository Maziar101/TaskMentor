import { useEffect, useMemo, useState } from "react";
import { FiPlus, FiTrash2, FiCheckCircle, FiClock } from "react-icons/fi";
import { loadPriorities, savePriorities, generateId, type Priority } from "../../utils/priorities/index";

export default function PrioritiesPage() {
  const [priorities, setPriorities] = useState<Priority[]>(() => loadPriorities());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");
  const [color, setColor] = useState("#ff7b5f");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [selectedPriority, setSelectedPriority] = useState<string>("");

  useEffect(() => {
    savePriorities(priorities);
  }, [priorities]);

  function handleAddPriority() {
    const trimmed = title.trim();
    if (!trimmed) return;
    const next: Priority = {
      id: generateId(),
      title: trimmed,
      description: description.trim() || undefined,
      due: due || undefined,
      color,
      tasks: [],
    };
    setPriorities((prev) => [next, ...prev]);
    setTitle("");
    setDescription("");
    setDue("");
  }

  function handleDeletePriority(id: string) {
    setPriorities((prev) => prev.filter((p) => p.id !== id));
  }

  function handleAddTaskToPriority() {
    if (!selectedPriority) return;
    const trimmed = newTaskTitle.trim();
    if (!trimmed) return;
    setPriorities((prev) =>
      prev.map((p) =>
        p.id === selectedPriority
          ? {
              ...p,
              tasks: [
                { id: generateId(), title: trimmed, due: newTaskDue || undefined, done: false },
                ...p.tasks,
              ],
            }
          : p
      )
    );
    setNewTaskTitle("");
    setNewTaskDue("");
  }

  function toggleTask(priorityId: string, taskId: string) {
    setPriorities((prev) =>
      prev.map((p) =>
        p.id === priorityId
          ? {
              ...p,
              tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
            }
          : p
      )
    );
  }

  function deleteTask(priorityId: string, taskId: string) {
    setPriorities((prev) =>
      prev.map((p) =>
        p.id === priorityId
          ? {
              ...p,
              tasks: p.tasks.filter((t) => t.id !== taskId),
            }
          : p
      )
    );
  }

  const totalTasks = useMemo(
    () => priorities.reduce((acc, p) => acc + p.tasks.length, 0),
    [priorities]
  );

  return (
    <div className="priorities" dir="rtl">
      <header className="priorities__header">
        <div>
          <p className="eyebrow">اولویت‌ها</p>
          <h1>اولویت‌بندی شخصی</h1>
          <p className="light">برای هر حوزه‌ی مهم، تعریف کن چه چیزی در صدر جدول است و چه زمانی باید انجام شود.</p>
        </div>
        <div className="priorities__stats">
          <span className="pill">{priorities.length} اولویت</span>
          <span className="pill">{totalTasks} تسک مرتبط</span>
        </div>
      </header>

      <section className="priorities__grid">
        <div className="panel priorities__form">
          <h3>افزودن اولویت</h3>
          <div className="field">
            <label>عنوان</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثلا: رشد محصول" />
          </div>
          <div className="field">
            <label>توضیح</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="چرا این موضوع در صدر است؟"
            />
          </div>
          <div className="field-row">
            <label className="field">
              <span>تاریخ هدف</span>
              <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </label>
            <label className="field">
              <span>رنگ</span>
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            </label>
          </div>
          <button className="primary" type="button" onClick={handleAddPriority}>
            <FiPlus aria-hidden /> افزودن اولویت
          </button>
        </div>

        <div className="panel priorities__form">
          <h3>تسک برای اولویت</h3>
          <div className="field">
            <label>اولویت</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            >
              <option value="">انتخاب کن...</option>
              {priorities.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>عنوان تسک</label>
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="مثلا: ارائه نسخه آزمایشی"
            />
          </div>
          <div className="field">
            <label>تاریخ هدف</label>
            <input type="date" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} />
          </div>
          <button className="ghost" type="button" onClick={handleAddTaskToPriority}>
            <FiPlus aria-hidden /> افزودن تسک
          </button>
        </div>
      </section>

      <section className="priorities__list">
        {priorities.length === 0 && <p className="empty">هنوز اولویتی ثبت نشده</p>}
        {priorities.map((priority) => (
          <article key={priority.id} className="panel priority-card" style={{ borderColor: priority.color }}>
            <header className="priority-card__head">
              <div>
                <h3>{priority.title}</h3>
                {priority.description && <p className="light small">{priority.description}</p>}
                {priority.due && (
                  <span className="pill pill--solid">
                    <FiClock aria-hidden /> تا {priority.due}
                  </span>
                )}
              </div>
              <button className="icon-btn icon-btn--danger" onClick={() => handleDeletePriority(priority.id)}>
                <FiTrash2 />
              </button>
            </header>
            <div className="priority-card__tasks">
              {priority.tasks.length === 0 && <p className="empty">تسکی اضافه کن</p>}
              {priority.tasks.map((task) => (
                <div key={task.id} className="priority-task">
                  <button
                    className={"icon-btn " + (task.done ? "" : "pill")}
                    onClick={() => toggleTask(priority.id, task.id)}
                    aria-label="علامت انجام"
                  >
                    <FiCheckCircle aria-hidden />
                  </button>
                  <div className="priority-task__body">
                    <strong className={task.done ? "line-through" : ""}>{task.title}</strong>
                    {task.due && <span className="light small">تا {task.due}</span>}
                  </div>
                  <button className="icon-btn icon-btn--danger" onClick={() => deleteTask(priority.id, task.id)}>
                    <FiTrash2 aria-hidden />
                  </button>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
