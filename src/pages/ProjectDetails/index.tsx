import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { FiCalendar, FiCheckCircle, FiFlag, FiTrash2 } from "react-icons/fi";
import DeleteModal from "../../components/DeleteModal";
import Calender from "../../components/Calender/index";
import {
  generateId,
  loadProjects,
  priorityLabel,
  projectProgress,
  saveProjects,
  type Project,
} from "../Projects/data/index";

type MemberFormState = {
  name: string;
  role: string;
};

type TaskDraft = {
  title: string;
  due: string;
};

type DeleteTarget =
  | { type: "member"; id: string; name: string }
  | { type: "task"; id: string; title: string };

const EMPTY_TASK_DRAFT: TaskDraft = { title: "", due: "" };

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [memberForm, setMemberForm] = useState<MemberFormState>({ name: "", role: "" });
  const [taskDraft, setTaskDraft] = useState<TaskDraft>(EMPTY_TASK_DRAFT);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const project = useMemo(
    () => projects.find((item) => item.id === projectId),
    [projects, projectId]
  );

  const progress = project ? projectProgress(project) : null;
  const progressPercent = progress?.percent ?? 0;
  const completedTasks = project?.tasks.filter((task) => task.done) ?? [];
  const lastDone = completedTasks[completedTasks.length - 1];
  const remainingTasks = progress ? Math.max(progress.total - progress.done, 0) : 0;
  const progressStyle = { "--progress": progressPercent } as CSSProperties;
  const today = new Date().toISOString().slice(0, 10);

  const handleAddMember = (event: FormEvent) => {
    event.preventDefault();
    if (!projectId) return;
    const trimmed = memberForm.name.trim();
    if (!trimmed) return;
    const role = memberForm.role.trim();
    setProjects((prev) =>
      prev.map((item) =>
        item.id === projectId
          ? {
              ...item,
              members: [
                ...item.members,
                { id: generateId(), name: trimmed, role: role || undefined },
              ],
            }
          : item
      )
    );
    setMemberForm({ name: "", role: "" });
  };

  const handleRemoveMember = (memberId: string) => {
    if (!projectId) return;
    setProjects((prev) =>
      prev.map((item) =>
        item.id === projectId
          ? { ...item, members: item.members.filter((member) => member.id !== memberId) }
          : item
      )
    );
  };

  const handleAddTask = (event: FormEvent) => {
    event.preventDefault();
    if (!projectId) return;
    const trimmed = taskDraft.title.trim();
    if (!trimmed) return;
    setProjects((prev) =>
      prev.map((item) =>
        item.id === projectId
          ? {
              ...item,
              tasks: [
                ...item.tasks,
                {
                  id: generateId(),
                  title: trimmed,
                  due: taskDraft.due || undefined,
                  done: false,
                },
              ],
            }
          : item
      )
    );
    setTaskDraft(EMPTY_TASK_DRAFT);
  };

  const toggleTask = (taskId: string) => {
    if (!projectId) return;
    setProjects((prev) =>
      prev.map((item) =>
        item.id === projectId
          ? {
              ...item,
              tasks: item.tasks.map((task) =>
                task.id === taskId ? { ...task, done: !task.done } : task
              ),
            }
          : item
      )
    );
  };

  const handleRemoveTask = (taskId: string) => {
    if (!projectId) return;
    setProjects((prev) =>
      prev.map((item) =>
        item.id === projectId
          ? { ...item, tasks: item.tasks.filter((task) => task.id !== taskId) }
          : item
      )
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "member") {
      handleRemoveMember(deleteTarget.id);
    } else {
      handleRemoveTask(deleteTarget.id);
    }
    setDeleteTarget(null);
  };

  if (!project) {
    return (
      <div className="projects-board project-details" dir="rtl">
        <header className="projects-board__header">
          <div>
            <p className="projects-board__eyebrow">پروژه</p>
            <h1>پروژه پیدا نشد</h1>
            <p className="light">ممکن است این پروژه حذف شده باشد.</p>
          </div>
          <Link className="primary" to="/projects">
            بازگشت به پروژه‌ها
          </Link>
        </header>
      </div>
    );
  }

  const deleteTitle = deleteTarget
    ? deleteTarget.type === "task"
      ? "حذف تسک"
      : "حذف عضو"
    : "";
  const deleteDescription = deleteTarget
    ? deleteTarget.type === "task"
      ? deleteTarget.title
        ? `حذف تسک "${deleteTarget.title}"؟`
        : "حذف این تسک؟"
      : `حذف عضو "${deleteTarget.name}" از پروژه؟`
    : "";

  return (
    <div className="projects-board project-details" dir="rtl">
      <header className="projects-board__header">
        <div>
          <p className="projects-board__eyebrow">پروژه</p>
          <h1>{project.title}</h1>
          <p className="light">{project.description || "بدون توضیحات ثبت شده."}</p>
        </div>
        <Link className="primary" to="/projects">
          بازگشت به پروژه‌ها
        </Link>
      </header>

      <section className="project-details__grid">
        <div className="panel project-details__overview">
          <div className="panel__header">
            <h2>نمای کلی</h2>
            <span className="badge badge--pill">{project.members.length} عضو</span>
          </div>
          <div className="project-details__overview-body">
            <div className="project-details__chart">
              <div className="project-progress" style={progressStyle}>
                <span>{progressPercent}%</span>
              </div>
              <div className="project-details__chart-label">
                <p className="light small">نمودار پیشرفت پروژه</p>
                <strong>
                  {progress?.done ?? 0} از {progress?.total ?? 0} تسک انجام شده
                </strong>
              </div>
            </div>
            <div className="project-details__stats">
              <div className="project-details__stat">
                <span>کل تسک‌ها</span>
                <strong>{progress?.total ?? 0}</strong>
              </div>
              <div className="project-details__stat">
                <span>تسک‌های انجام شده</span>
                <strong>{progress?.done ?? 0}</strong>
              </div>
              <div className="project-details__stat">
                <span>تسک‌های باقی‌مانده</span>
                <strong>{remainingTasks}</strong>
              </div>
              <div className="project-details__stat">
                <span>آخرین وظیفه انجام شده</span>
                <strong>{lastDone ? lastDone.title : "—"}</strong>
              </div>
            </div>
          </div>
          <div className="project-tile__meta">
            <span className={project.priority ? `pill pill--${project.priority}` : "pill"}>
              <FiFlag aria-hidden /> {priorityLabel(project.priority)}
            </span>
            <span className="pill pill--solid">
              <FiCalendar aria-hidden />
              {project.due ? `ددلاین: ${project.due}` : "بدون ددلاین"}
            </span>
          </div>
        </div>

        <div className="panel project-details__tasks">
          <div className="panel__header">
            <h2>تسک‌های پروژه</h2>
            <span className="counts">
              {progress?.done ?? 0}/{progress?.total ?? 0} انجام
            </span>
          </div>

          <form className="project-add-row" onSubmit={handleAddTask}>
            <input
              value={taskDraft.title}
              onChange={(event) => setTaskDraft((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="تسک جدید..."
            />
            <Calender
              value={taskDraft.due || null}
              onChange={(val) => setTaskDraft((prev) => ({ ...prev, due: val }))}
              place="ددلاین تسک"
            />
            <button className="ghost" type="submit">
              افزودن
            </button>
          </form>

          <div className="project-card__tasks">
            {project.tasks.length === 0 && (
              <p className="empty">تسکی تعریف نشده؛ یکی اضافه کن.</p>
            )}
            {project.tasks.map((task) => {
              const overdue = task.due && task.due < today && !task.done;
              return (
                <div key={task.id} className="project-task">
                  <button
                    className={"icon-btn " + (task.done ? "" : "pill")}
                    onClick={() => toggleTask(task.id)}
                    aria-label="علامت انجام"
                    type="button"
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
                    onClick={() =>
                      setDeleteTarget({ type: "task", id: task.id, title: task.title })
                    }
                    aria-label="حذف تسک"
                    type="button"
                  >
                    <FiTrash2 aria-hidden />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel project-details__members">
          <div className="panel__header">
            <h2>اعضای پروژه</h2>
            <span className="counts">{project.members.length} نفر</span>
          </div>

          <form className="team-form" onSubmit={handleAddMember}>
            <input
              value={memberForm.name}
              onChange={(event) => setMemberForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="نام عضو"
            />
            <input
              value={memberForm.role}
              onChange={(event) => setMemberForm((prev) => ({ ...prev, role: event.target.value }))}
              placeholder="نقش (اختیاری)"
            />
            <button className="primary" type="submit">
              افزودن عضو
            </button>
          </form>

          <div className="team-members">
            {project.members.length === 0 && (
              <p className="empty">هنوز عضوی اضافه نشده است.</p>
            )}
            {project.members.map((member) => (
              <div key={member.id} className="member-row">
                <div className="member-row__info">
                  <strong>{member.name}</strong>
                  {member.role && <span className="pill">{member.role}</span>}
                </div>
                <button
                  className="icon-btn icon-btn--danger"
                  type="button"
                  onClick={() =>
                    setDeleteTarget({ type: "member", id: member.id, name: member.name })
                  }
                  aria-label="حذف عضو"
                >
                  <FiTrash2 aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <DeleteModal
        open={Boolean(deleteTarget)}
        title={deleteTitle}
        description={deleteDescription}
        confirmLabel="حذف"
        cancelLabel="انصراف"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
