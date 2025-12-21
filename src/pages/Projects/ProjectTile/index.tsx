import { FiCalendar, FiCheckCircle, FiFlag, FiPlus, FiTrash2 } from "react-icons/fi";
import Calender from "../../../components/Calender/index";
import {
  colorSeed,
  priorityLabel,
  projectInitials,
  projectProgress,
  type Project,
  type TaskDraft,
} from "../data/index";

type ProjectTileProps = {
  project: Project;
  draft: TaskDraft;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDelete: () => void;
  onDraftChange: (patch: Partial<TaskDraft>) => void;
  onAddTask: () => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
};

export default function ProjectTile({
  project,
  draft,
  isExpanded,
  onToggleExpand,
  onDelete,
  onDraftChange,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: ProjectTileProps) {
  const progress = projectProgress(project);
  const completedTasks = project.tasks.filter((task) => task.done);
  const lastDone = completedTasks[completedTasks.length - 1];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <article className="project-tile">
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
          onClick={onDelete}
          aria-label="حذف پروژه"
        >
          <FiTrash2 aria-hidden />
        </button>
      </div>

      <ProjectMetric label="وضعیت کل پروژه" percent={progress.percent} />
      <ProjectMetric label="وظایف من" percent={progress.percent} />

      <div className="project-tile__foot">
        <div>
          <span>آخرین وظیفه انجام شده:</span>
          <strong>{lastDone ? lastDone.title : "—"}</strong>
        </div>
        <span className="project-tile__count">
          وظایف انجام شده: {completedTasks.length} از {project.tasks.length}
        </span>
      </div>

      <button className="project-tile__toggle" type="button" onClick={onToggleExpand}>
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
              {project.due ? `تا ${project.due}` : "بدون ددلاین"}
            </span>
            <span className="pill">
              {progress.done}/{progress.total} تسک
            </span>
          </div>

          <div className="project-add-row">
            <input
              value={draft.title}
              onChange={(event) => onDraftChange({ title: event.target.value })}
              placeholder="تسک جدید..."
            />
            <Calender
              value={draft.due}
              onChange={(val) => onDraftChange({ due: val })}
              place="ددلاین تسک"
            />
            <button className="ghost" type="button" onClick={onAddTask}>
              <FiPlus aria-hidden /> افزودن
            </button>
          </div>

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
                    onClick={() => onToggleTask(task.id)}
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
                    onClick={() => onDeleteTask(task.id)}
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
}

type ProjectMetricProps = {
  label: string;
  percent: number;
};

function ProjectMetric({ label, percent }: ProjectMetricProps) {
  return (
    <div className="project-tile__metric">
      <span>{label}</span>
      <div className="project-tile__bar">
        <span style={{ width: `${percent}%` }} />
      </div>
      <span className="project-tile__percent">{percent}%</span>
    </div>
  );
}
