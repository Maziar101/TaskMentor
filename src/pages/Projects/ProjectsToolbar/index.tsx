type ProjectsToolbarProps = {
  filter: string;
  onFilterChange: (value: string) => void;
  totalProjects: number;
  totalDone: number;
  totalTasks: number;
};

export default function ProjectsToolbar({
  filter,
  onFilterChange,
  totalProjects,
  totalDone,
  totalTasks,
}: ProjectsToolbarProps) {
  return (
    <div className="projects-board__toolbar">
      <label className="projects-board__search">
        <input
          value={filter}
          onChange={(event) => onFilterChange(event.target.value)}
          placeholder="فیلتر عنوان پروژه..."
        />
      </label>
      <div className="projects-board__stats">
        <span>{totalProjects} پروژه</span>
        <span>
          {totalDone}/{totalTasks} تسک انجام
        </span>
      </div>
    </div>
  );
}
