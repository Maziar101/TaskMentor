import { FiPlus } from "react-icons/fi";

type ProjectsHeaderProps = {
  onToggleCreate: () => void;
};

export default function ProjectsHeader({ onToggleCreate }: ProjectsHeaderProps) {
  return (
    <header className="projects-board__header">
      <div>
        <p className="projects-board__eyebrow">پروژه‌ها</p>
        <h1>پروژه‌ها</h1>
      </div>
      <div className="projects-board__actions">
        <button
          className="projects-board__create"
          type="button"
          onClick={onToggleCreate}
        >
          <FiPlus aria-hidden /> ایجاد پروژه جدید
        </button>
      </div>
    </header>
  );
}
