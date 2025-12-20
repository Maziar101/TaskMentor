  
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { FiPlus, FiTrash2, FiCheckCircle, FiFlag, FiCalendar } from "react-icons/fi";
import Calender from "../components/Calender";

type ProjectTask = {
  id: string;
  title: string;
  due?: string;
  done: boolean;
};

type Project = {
  id: string;
  title: string;
  priority?: "high" | "medium" | "low";
  due?: string;
  description?: string;
  tasks: ProjectTask[];
  createdAt: string;
};

type TaskDrafts = Record<string, { title: string; due: string }>;

type ProjectsSummary = {
  totalProjects: number;
  totalTasks: number;
  doneTasks: number;
  percent: number;
  nextDeadline?: string;
  overdueTasks: number;
  highestPriority?: Project["priority"];
};

const STORAGE_KEY = "taskmentor-projects";
const SUMMARY_KEY = "taskmentor-projects-summary";
const PRIORITY_ORDER: Array<Project["priority"]> = ["high", "medium", "low"];
const PRIORITY_LEVELS: Array<{
  id?: Project["priority"];
  label: string;
  color: string;
}> = [
  { id: undefined, label: "بدون اولویت", color: "var(--priority-none, #555a65)" },
  { id: "low", label: "پایین", color: "#2ecc71" },
  { id: "medium", label: "متوسط", color: "#f39c12" },
  { id: "high", label: "بالا", color: "#ff5f6d" },
];

function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  const summary = summarizeProjects(projects);
  localStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
}

function summarizeProjects(projects: Project[]): ProjectsSummary {
  const totalProjects = projects.length;
  const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const doneTasks = projects.reduce((acc, p) => acc + p.tasks.filter((t) => t.done).length, 0);
  const percent = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const allDeadlines: string[] = [];
  projects.forEach((p) => {
    if (p.due) allDeadlines.push(p.due);
    p.tasks.forEach((t) => t.due && allDeadlines.push(t.due));
  });
  const nextDeadline = allDeadlines.sort()[0];
  const today = new Date().toISOString().slice(0, 10);
  const overdueTasks = projects.reduce(
    (acc, p) => acc + p.tasks.filter((t) => !t.done && t.due && t.due < today).length,
    0
  );
  const highestPriority = PRIORITY_ORDER.find((level) =>
    projects.some((p) => p.priority === level)
  );
  return { totalProjects, totalTasks, doneTasks, percent, nextDeadline, overdueTasks, highestPriority };
}

function projectProgress(project: Project) {
  const total = project.tasks.length || 1;
  const done = project.tasks.filter((t) => t.done).length;
  return { total, done, percent: Math.round((done / total) * 100) };
}

function daysUntil(dateStr?: string) {
  if (!dateStr) return null;
  const today = new Date();
  const target = new Date(dateStr + "T00:00:00Z");
  const diff = target.getTime() - Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

function priorityLabel(priority: Project["priority"]) {
  const map = {
    high: "اولویت بالا",
    medium: "اولویت متوسط",
    low: "اولویت کم",
    undefined: "بدون اولویت",
  };
  return map[priority as keyof typeof map];
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Project["priority"]>();
  const [due, setDue] = useState("");
  const [description, setDescription] = useState("");
  const [taskDrafts, setTaskDrafts] = useState<TaskDrafts>({});
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const totalTasks = useMemo(
    () => projects.reduce((acc, p) => acc + p.tasks.length, 0),
    [projects]
  );
  const totalDone = useMemo(
    () => projects.reduce((acc, p) => acc + p.tasks.filter((t) => t.done).length, 0),
    [projects]
  );

  const filteredProjects = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) => project.title.toLowerCase().includes(query));
  }, [filter, projects]);

  function handleAddProject(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    const next: Project = {
      id: generateId(),
      title: trimmed,
      priority,
      due: due || undefined,
      description: description.trim() || undefined,
      tasks: [],
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [next, ...prev]);
    setTitle("");
    setPriority(undefined);
    setDue("");
    setDescription("");
    setCreateOpen(false);
  }

  function handleDeleteProject(projectId: string) {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }

  function handleAddTask(projectId: string) {
    const draft = taskDrafts[projectId];
    const trimmed = draft?.title.trim() ?? "";
    if (!trimmed) return;
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              tasks: [
                ...p.tasks,
                {
                  id: generateId(),
                  title: trimmed,
                  due: draft.due || undefined,
                  done: false,
                },
              ],
            }
          : p
      )
    );
    setTaskDrafts((prev) => ({ ...prev, [projectId]: { title: "", due: "" } }));
  }

  function toggleTask(projectId: string, taskId: string) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)) }
          : p
      )
    );
  }

  function deleteTask(projectId: string, taskId: string) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p
      )
    );
  }

  function projectInitials(projectTitle: string) {
    const trimmed = projectTitle.trim();
    if (!trimmed) return "پ";
    const parts = trimmed.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2);
    return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
  }

  function colorSeed(input: string) {
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = input.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue} 65% 75%)`;
  }

  return (
    <div className="projects-board" dir="rtl">
      <header className="projects-board__header">
        <div>
          <p className="projects-board__eyebrow">پروژه‌ها</p>
          <h1>پروژه‌ها</h1>
        </div>
        <div className="projects-board__actions">
          <button className="projects-board__create" type="button" onClick={() => setCreateOpen((prev) => !prev)}>
            <FiPlus aria-hidden /> ایجاد پروژه جدید
          </button>
        </div>
      </header>

      <div className="projects-board__toolbar">
        <label className="projects-board__search">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="فیلتر عنوان پروژه..."
          />
        </label>
        <div className="projects-board__stats">
          <span>{projects.length} پروژه</span>
          <span>
            {totalDone}/{totalTasks} تسک انجام
          </span>
        </div>
      </div>

      <section className="projects-board__grid">
        {filteredProjects.map((project) => {
          const progress = projectProgress(project);
          const completedTasks = project.tasks.filter((task) => task.done);
          const lastDone = completedTasks[completedTasks.length - 1];
          const draft = taskDrafts[project.id] ?? { title: "", due: "" };
          const isExpanded = expandedProjectId === project.id;
          return (
            <article key={project.id} className="project-tile">
              <div className="project-tile__header">
                <div className="project-tile__avatar" style={{ background: colorSeed(project.title) }}>
                  {projectInitials(project.title)}
                </div>
                <div>
                  <h3>{project.title}</h3>
                  <p className="project-tile__subtitle">
                    {project.priority ? priorityLabel(project.priority) : "پروژه عمومی"}
                  </p>
                </div>
                <button
                  className="project-tile__delete"
                  type="button"
                  onClick={() => handleDeleteProject(project.id)}
                  aria-label="حذف پروژه"
                >
                  <FiTrash2 aria-hidden />
                </button>
              </div>

              <div className="project-tile__metric">
                <span>وضعیت کل پروژه</span>
                <div className="project-tile__bar">
                  <span style={{ width: `${progress.percent}%` }} />
                </div>
                <span className="project-tile__percent">{progress.percent}%</span>
              </div>

              <div className="project-tile__metric">
                <span>وظایف من</span>
                <div className="project-tile__bar">
                  <span style={{ width: `${progress.percent}%` }} />
                </div>
                <span className="project-tile__percent">{progress.percent}%</span>
              </div>

              <div className="project-tile__foot">
                <div>
                  <span>آخرین وظیفه انجام شده:</span>
                  <strong>{lastDone ? lastDone.title : "—"}</strong>
                </div>
                <span className="project-tile__count">
                  وظایف انجام شده: {completedTasks.length} از {project.tasks.length}
                </span>
              </div>

              <button
                className="project-tile__toggle"
                type="button"
                onClick={() => setExpandedProjectId(isExpanded ? null : project.id)}
              >
                {isExpanded ? "بستن جزئیات" : "جزئیات و تسک‌ها"}
              </button>

              {isExpanded && (
                <div className="project-tile__details">
                  <div className="project-tile__meta">
                    <span className={project.priority ? `pill pill--${project.priority}` : "pill"}>
                      <FiFlag aria-hidden /> {priorityLabel(project.priority)}
                    </span>
                    <span className="pill pill--solid">
                      <FiCalendar aria-hidden />
                      {project.due
                        ? `تا ${project.due}`
                        : "بدون ددلاین"}
                    </span>
                    <span className="pill">
                      {progress.done}/{progress.total} تسک
                    </span>
                  </div>

                  <div className="project-add-row">
                    <input
                      value={draft.title}
                      onChange={(e) =>
                        setTaskDrafts((prev) => ({
                          ...prev,
                          [project.id]: { ...draft, title: e.target.value },
                        }))
                      }
                      placeholder="تسک جدید..."
                    />
                    <Calender
                      value={draft.due}
                      onChange={(val) =>
                        setTaskDrafts((prev) => ({
                          ...prev,
                          [project.id]: { ...draft, due: val },
                        }))
                      }
                      place="ددلاین تسک"
                    />
                    <button className="ghost" type="button" onClick={() => handleAddTask(project.id)}>
                      <FiPlus aria-hidden /> افزودن
                    </button>
                  </div>

                  <div className="project-card__tasks">
                    {project.tasks.length === 0 && <p className="empty">تسکی تعریف نشده؛ یکی اضافه کن.</p>}
                    {project.tasks.map((task) => {
                      const overdue =
                        task.due && task.due < new Date().toISOString().slice(0, 10) && !task.done;
                      return (
                        <div key={task.id} className="project-task">
                          <button
                            className={"icon-btn " + (task.done ? "" : "pill")}
                            onClick={() => toggleTask(project.id, task.id)}
                            aria-label="علامت انجام"
                          >
                            <FiCheckCircle aria-hidden />
                          </button>
                          <div className="project-task__body">
                            <strong className={task.done ? "line-through" : ""}>{task.title}</strong>
                            <div className="project-task__meta">
                              {task.due && (
                                <span className={overdue ? "pill pill--blocked" : "pill"}>
                                  <FiCalendar aria-hidden /> تا {task.due}
                                </span>
                              )}
                              {task.done && <span className="pill pill--solid">انجام شد</span>}
                            </div>
                          </div>
                          <button
                            className="icon-btn icon-btn--danger"
                            onClick={() => deleteTask(project.id, task.id)}
                            aria-label="حذف تسک"
                          >
                            <FiTrash2 aria-hidden />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </article>
          );
        })}

        <article className="project-tile project-tile--new">
          <button
            className="project-tile__new-trigger"
            type="button"
            onClick={() => setCreateOpen(true)}
          >
            <span className="project-tile__new-icon">+</span>
            <span>پروژه جدید</span>
          </button>
          {createOpen && (
            <form className="project-form" onSubmit={handleAddProject}>
              <label>
                <span>عنوان پروژه</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلا: لانچ نسخه جدید پرداخت"
                />
              </label>
              <label>
                <span>توضیح</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="چرا این پروژه مهم است؟"
                />
              </label>
              <div className="project-form__row">
                <div className="project-form__field">
                  <span>اولویت</span>
                  <div className="priority-picker" style={{ position: "relative" }}>
                    <button
                      type="button"
                      className="priority-dropdown__button"
                      onClick={() => setPriorityOpen((v) => !v)}
                    >
                      <span
                        className="priority-dot"
                        style={{
                          backgroundColor:
                            PRIORITY_LEVELS.find((p) => p.id === priority)?.color ??
                            "var(--priority-none, #555a65)",
                        }}
                      />
                      <span className="priority-dropdown__label">
                        {PRIORITY_LEVELS.find((p) => p.id === priority)?.label || "بدون اولویت"}
                      </span>
                      <span className="priority-dropdown__caret">▾</span>
                    </button>
                    {priorityOpen && (
                      <div className="priority-dropdown__menu">
                        {PRIORITY_LEVELS.map((level) => (
                          <button
                            key={level.id ?? "none"}
                            type="button"
                            className={[
                              "priority-dropdown__item",
                              priority === level.id && "priority-dropdown__item--active",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                            onClick={() => {
                              setPriority(level.id);
                              setPriorityOpen(false);
                            }}
                          >
                            <span
                              className="priority-dot"
                              style={{ backgroundColor: level.color }}
                              aria-hidden
                            />
                            <span>{level.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <label>
                  <span>ددلاین پروژه</span>
                  <Calender value={due} onChange={setDue} place="مثلا 1402-12-01" />
                </label>
              </div>
              <div className="project-form__actions">
                <button className="ghost" type="button" onClick={() => setCreateOpen(false)}>
                  انصراف
                </button>
                <button className="primary" type="submit">
                  ساخت پروژه
                </button>
              </div>
            </form>
          )}
        </article>
      </section>
    </div>
  );
}
