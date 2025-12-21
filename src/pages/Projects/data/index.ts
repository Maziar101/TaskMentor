export type ProjectPriority = "high" | "medium" | "low";

export type ProjectTask = {
  id: string;
  title: string;
  due?: string;
  done: boolean;
};

export type Project = {
  id: string;
  title: string;
  priority?: ProjectPriority;
  due?: string;
  description?: string;
  tasks: ProjectTask[];
  createdAt: string;
};

export type TaskDraft = { title: string; due: string };
export type TaskDrafts = Record<string, TaskDraft>;

export type ProjectsSummary = {
  totalProjects: number;
  totalTasks: number;
  doneTasks: number;
  percent: number;
  nextDeadline?: string;
  overdueTasks: number;
  highestPriority?: ProjectPriority;
};

export const STORAGE_KEY = "taskmentor-projects";
export const SUMMARY_KEY = "taskmentor-projects-summary";
export const PRIORITY_ORDER: ProjectPriority[] = ["high", "medium", "low"];
export const PRIORITY_LEVELS: Array<{
  id?: ProjectPriority;
  label: string;
  color: string;
}> = [
  { id: undefined, label: "بدون اولویت", color: "var(--priority-none, #555a65)" },
  { id: "low", label: "پایین", color: "#2ecc71" },
  { id: "medium", label: "متوسط", color: "#f39c12" },
  { id: "high", label: "بالا", color: "#ff5f6d" },
];

export function generateId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function loadProjects(): Project[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function summarizeProjects(projects: Project[]): ProjectsSummary {
  const totalProjects = projects.length;
  const totalTasks = projects.reduce((acc, p) => acc + p.tasks.length, 0);
  const doneTasks = projects.reduce((acc, p) => acc + p.tasks.filter((t) => t.done).length, 0);
  const percent = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const allDeadlines: string[] = [];
  projects.forEach((p) => {
    if (p.due) allDeadlines.push(p.due);
    p.tasks.forEach((t) => t.due && allDeadlines.push(t.due));
  });
  const nextDeadline = allDeadlines.sort()[0];
  const today = new Date().toISOString().slice(0, 10);
  const overdueTasks = projects.reduce(
    (acc, p) => acc + p.tasks.filter((t) => !t.done && t.due && t.due < today).length,
    0
  );
  const highestPriority = PRIORITY_ORDER.find((level) =>
    projects.some((p) => p.priority === level)
  );
  return { totalProjects, totalTasks, doneTasks, percent, nextDeadline, overdueTasks, highestPriority };
}

export function saveProjects(projects: Project[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  const summary = summarizeProjects(projects);
  localStorage.setItem(SUMMARY_KEY, JSON.stringify(summary));
}

export function projectProgress(project: Project) {
  const total = project.tasks.length || 1;
  const done = project.tasks.filter((t) => t.done).length;
  return { total, done, percent: Math.round((done / total) * 100) };
}

export function priorityLabel(priority?: ProjectPriority) {
  const map = {
    high: "اولویت بالا",
    medium: "اولویت متوسط",
    low: "اولویت کم",
    undefined: "بدون اولویت",
  };
  return map[priority as keyof typeof map];
}

export function projectInitials(projectTitle: string) {
  const trimmed = projectTitle.trim();
  if (!trimmed) return "پ";
  const parts = trimmed.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
}

export function colorSeed(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 65% 75%)`;
}
