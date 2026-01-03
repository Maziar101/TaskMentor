import { useState } from "react";
import DeleteModal from "../../components/DeleteModal";
import ProjectCreateTile from "./ProjectCreateTile/index";
import ProjectsHeader from "./ProjectsHeader/index";
import ProjectTile from "./ProjectTile/index";
import ProjectsToolbar from "./ProjectsToolbar/index";
import useProjects from "./useProjects/index";

type DeleteTarget = { projectId: string; title: string };

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
  } = useProjects();

  const deleteTitle = deleteTarget ? "حذف پروژه" : "";
  const deleteDescription = deleteTarget
    ? `آیا مطمئنی که می‌خواهی پروژه "${deleteTarget.title}" را حذف کنی؟`
    : "";

  const confirmDelete = () => {
    if (!deleteTarget) return;
    handleDeleteProject(deleteTarget.projectId);
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
            onDelete={() =>
              setDeleteTarget({
                projectId: project.id,
                title: project.title,
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
