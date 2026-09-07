const STORAGE_KEY = "taskmentor-priorities";
export function loadPriorities() {
    if (typeof window === "undefined")
        return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw)
        return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
}
export function savePriorities(priorities) {
    if (typeof window === "undefined")
        return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(priorities));
}
export function generateId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
