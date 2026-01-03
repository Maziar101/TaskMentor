import { Link } from "react-router-dom";
import { FiTrash2 } from "react-icons/fi";
import {
  colorSeed,
  priorityLabel,
  projectInitials,
  projectProgress,
  type Project,
} from "../data/index";

type ProjectTileProps = {
  project: Project;
  onDelete: () => void;
};

export default function ProjectTile({
  project,
  onDelete,
}: ProjectTileProps) {
  const progress = projectProgress(project);
  const completedTasks = project.tasks.filter((task) => task.done);
  const lastDone = completedTasks[completedTasks.length - 1];

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

      <div className="project-tile__actions">
        <Link className="project-tile__toggle" to={`/projects/${project.id}`}>
          جزئیات پروژه
        </Link>
      </div>
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
