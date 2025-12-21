import ProjectCreateTile from "./ProjectCreateTile/index";
import ProjectsHeader from "./ProjectsHeader/index";
import ProjectTile from "./ProjectTile/index";
import ProjectsToolbar from "./ProjectsToolbar/index";
import useProjects from "./useProjects/index";

const EMPTY_DRAFT = { title: "", due: "" };

export default function ProjectsPage() {
  const {
    filteredProjects,
    totals,
    filter,
    setFilter,
    createOpen,
    toggleCreateOpen,
    openCreate,
    closeCreate,
    form,
    setFormField,
    handleAddProject,
    handleDeleteProject,
    taskDrafts,
    updateTaskDraft,
    handleAddTask,
    toggleTask,
    deleteTask,
    expandedProjectId,
    toggleExpanded,
  } = useProjects();

  return (
    <div className="projects-board" dir="rtl">
      <ProjectsHeader onToggleCreate={toggleCreateOpen} />

      <ProjectsToolbar
        filter={filter}
        onFilterChange={setFilter}
        totalProjects={totals.totalProjects}
        totalDone={totals.totalDone}
        totalTasks={totals.totalTasks}
      />

      <section className="projects-board__grid">
        {filteredProjects.map((project) => (
          <ProjectTile
            key={project.id}
            project={project}
            draft={taskDrafts[project.id] ?? EMPTY_DRAFT}
            isExpanded={expandedProjectId === project.id}
            onToggleExpand={() => toggleExpanded(project.id)}
            onDelete={() => handleDeleteProject(project.id)}
            onDraftChange={(patch) => updateTaskDraft(project.id, patch)}
            onAddTask={() => handleAddTask(project.id)}
            onToggleTask={(taskId) => toggleTask(project.id, taskId)}
            onDeleteTask={(taskId) => deleteTask(project.id, taskId)}
          />
        ))}

        <ProjectCreateTile
          open={createOpen}
          form={form}
          onOpen={openCreate}
          onClose={closeCreate}
          onSubmit={handleAddProject}
          onFieldChange={setFormField}
        />
      </section>
    </div>
  );
}
