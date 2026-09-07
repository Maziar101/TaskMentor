export function statusLabel(status) {
    const map = {
        "in-progress": "در حال انجام",
        blocked: "مسدود",
        done: "انجام شد",
    };
    return map[status];
}
export function impactLabel(impact) {
    const map = {
        high: "اولویت بالا",
        medium: "اولویت متوسط",
        low: "اولویت کم",
    };
    return map[impact];
}
