import { useState } from "react";
import DeleteModal from "../../components/DeleteModal";
import ProjectCreateTile from "./ProjectCreateTile/index";
import ProjectsHeader from "./ProjectsHeader/index";
import ProjectTile from "./ProjectTile/index";
import ProjectsToolbar from "./ProjectsToolbar/index";
import useProjects from "./useProjects/index";

const EMPTY_DRAFT = { title: "", due: "" };

type DeleteTarget =
  | { type: "project"; projectId: string; title: string }
  | { type: "task"; projectId: string; taskId: string; title: string };

export default function ProjectsPage() {
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
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

  const deleteTitle = deleteTarget
    ? deleteTarget.type === "project"
      ? "حذف پروژه"
      : "حذف تسک"
    : "";
  const deleteDescription = deleteTarget
    ? deleteTarget.type === "project"
      ? `آیا مطمئنی که می‌خواهی پروژه "${deleteTarget.title}" را حذف کنی؟`
      : deleteTarget.title
      ? `حذف تسک "${deleteTarget.title}"؟`
      : "حذف این تسک؟"
    : "";

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "project") {
      handleDeleteProject(deleteTarget.projectId);
    } else {
      deleteTask(deleteTarget.projectId, deleteTarget.taskId);
    }
    setDeleteTarget(null);
  };

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
            onDelete={() =>
              setDeleteTarget({
                type: "project",
                projectId: project.id,
                title: project.title,
              })
            }
            onDraftChange={(patch) => updateTaskDraft(project.id, patch)}
            onAddTask={() => handleAddTask(project.id)}
            onToggleTask={(taskId) => toggleTask(project.id, taskId)}
            onDeleteTask={(taskId) =>
              setDeleteTarget({
                type: "task",
                projectId: project.id,
                taskId,
                title: project.tasks.find((task) => task.id === taskId)?.title ?? "",
              })
            }
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
