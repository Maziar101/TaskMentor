export type StatusLabel = "in-progress" | "blocked" | "done";
export type ImpactLabel = "high" | "medium" | "low";

export function statusLabel(status: StatusLabel) {
  const map = {
    "in-progress": "در حال انجام",
    blocked: "مسدود",
    done: "انجام شد",
  };
  return map[status];
}

export function impactLabel(impact: ImpactLabel) {
  const map = {
    high: "اولویت بالا",
    medium: "اولویت متوسط",
    low: "اولویت کم",
  };
  return map[impact];
}
