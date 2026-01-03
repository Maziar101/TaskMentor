import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  generateId,
  loadProjects,
  saveProjects,
  type Project,
  type ProjectPriority,
} from "../data/index";

export type ProjectFormState = {
  title: string;
  priority?: ProjectPriority;
  due: string;
  description: string;
};

export default function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<ProjectFormState>({
    title: "",
    priority: undefined,
    due: "",
    description: "",
  });

  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const totals = useMemo(() => {
    const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
    const totalDone = projects.reduce(
      (acc, p) => acc + p.tasks.filter((t) => t.done).length,
      0
    );
    return { totalTasks, totalDone, totalProjects: projects.length };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter((project) => project.title.toLowerCase().includes(query));
  }, [filter, projects]);

  const handleAddProject = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = form.title.trim();
    if (!trimmed) return;
    const next: Project = {
      id: generateId(),
      title: trimmed,
      priority: form.priority,
      due: form.due || undefined,
      description: form.description.trim() || undefined,
      tasks: [],
      members: [],
      createdAt: new Date().toISOString(),
    };
    setProjects((prev) => [next, ...prev]);
    setForm({ title: "", priority: undefined, due: "", description: "" });
    setCreateOpen(false);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  const toggleCreateOpen = () => setCreateOpen((prev) => !prev);

  const openCreate = () => setCreateOpen(true);

  const closeCreate = () => setCreateOpen(false);

  const setFormField = <K extends keyof ProjectFormState>(
    key: K,
    value: ProjectFormState[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return {
    projects,
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
  };
}
