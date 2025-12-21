import { impactLabel, statusLabel, type ImpactLabel, type StatusLabel } from "../../utils/labels/index";

type GoalCardProps = {
  title: string;
  desc: string;
  due: string;
  status: StatusLabel;
  impact: ImpactLabel;
  progress?: number;
};

export default function GoalCard({
  title,
  desc,
  due,
  status,
  impact,
  progress,
}: GoalCardProps) {
  return (
    <article className="goal-card">
      <div className="goal-card__top">
        <h3>{title}</h3>
        <span className={`badge badge--${status}`}>{statusLabel(status)}</span>
      </div>
      <p className="light">{desc}</p>
      <div className="goal-card__meta">
        <span className="pill">موعد: {due}</span>
        <span className={`pill pill--${impact}`}>{impactLabel(impact)}</span>
      </div>
      <div className="progress">
        <span
          className={`progress__fill progress__fill--${status}`}
          style={progress === undefined ? undefined : { width: `${progress}%` }}
        />
      </div>
    </article>
  );
}
