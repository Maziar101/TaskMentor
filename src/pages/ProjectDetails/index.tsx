import { useMemo, useState, useEffect } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";
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

export default function ProjectDetailsPage() {
  const { projectId } = useParams();
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [memberForm, setMemberForm] = useState<MemberFormState>({ name: "", role: "" });

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const project = useMemo(
    () => projects.find((item) => item.id === projectId),
    [projects, projectId]
  );

  const progress = project ? projectProgress(project) : null;

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

  if (!project) {
    return (
      <div className="teams" dir="rtl">
        <header className="page__header">
          <div>
            <p className="eyebrow">پروژه</p>
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

  return (
    <div className="teams" dir="rtl">
      <header className="page__header">
        <div>
          <p className="eyebrow">پروژه</p>
          <h1>{project.title}</h1>
          <p className="light">{project.description || "بدون توضیحات ثبت شده."}</p>
        </div>
        <Link className="primary" to="/projects">
          بازگشت به پروژه‌ها
        </Link>
      </header>

      <section className="panels-grid">
        <div className="panel">
          <div className="panel__header">
            <h2>نمای کلی</h2>
            <span className="badge badge--pill">{project.members.length} عضو</span>
          </div>
          <div className="project-tile__meta">
            <span className={project.priority ? `pill pill--${project.priority}` : "pill"}>
              {priorityLabel(project.priority)}
            </span>
            <span className="pill pill--solid">
              {project.due ? `ددلاین: ${project.due}` : "بدون ددلاین"}
            </span>
            <span className="pill">
              {progress?.done ?? 0}/{progress?.total ?? 0} تسک
            </span>
          </div>
        </div>

        <div className="panel">
          <div className="panel__header">
            <h2>اعضای پروژه</h2>
            <span className="counts">
              {project.members.length} نفر
            </span>
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
                  onClick={() => handleRemoveMember(member.id)}
                  aria-label="حذف عضو"
                >
                  <FiTrash2 aria-hidden />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
