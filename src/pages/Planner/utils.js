import { loadPriorities } from "../../utils/priorities/index";
export const PRIORITY_LEVELS = [
    { id: undefined, label: "بدون اولویت", color: "var(--priority-none, #555a65)" },
    { id: "low", label: "پایین", color: "#2ecc71" },
    { id: "medium", label: "متوسط", color: "#f39c12" },
    { id: "high", label: "بالا", color: "#ff5f6d" },
];
export const tagLabels = {
    focus: "تمرکز",
    meeting: "جلسه",
    errand: "کارهای ریز",
};
export const baseTags = ["focus", "meeting", "errand"];
export const hours = Array.from({ length: 24 }, (_, i) => i);
export const STORAGE_KEY = "taskmentor-data";
export const PERSIAN_NUMBER = new Intl.NumberFormat("fa-IR");
const FALLBACK_HEX = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
export const JALALI_MONTHS = [
    "فروردین",
    "اردیبهشت",
    "خرداد",
    "تیر",
    "مرداد",
    "شهریور",
    "مهر",
    "آبان",
    "آذر",
    "دی",
    "بهمن",
    "اسفند",
];
const PRIORITY_RANK = {
    high: 0,
    medium: 1,
    low: 2,
};
export function plannerReducer(state, action) {
    switch (action.type) {
        case "set":
            return { ...state, ...action.payload };
        case "update":
            return action.updater(state);
        default:
            return state;
    }
}
export function createPlannerInitialState() {
    const stored = readStorage();
    const now = new Date();
    return {
        activeDay: todayKey(now),
        pool: [],
        schedule: {},
        notes: stored.notes ?? {},
        customTags: stored.customTags ?? [],
        newTaskTitle: "",
        newTaskTag: undefined,
        filterTag: "all",
        search: "",
        hoverHour: null,
        now,
        jalaliMonthView: toJalaliParts(now),
        tagModalOpen: false,
        tagModalValue: "",
        editingTag: null,
        tagModalError: "",
        formError: "",
        priorities: loadPriorities(),
        newTaskPriority: undefined,
        undoToast: null,
        undoTimer: null,
        toastKey: 0,
        deleteModal: null,
        deleteModalBusy: false,
        poolHover: false,
        calendarModal: null,
        taskDetails: null,
        taskDetailsBusy: false,
    };
}
export function generateId() {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);
        bytes[6] = (bytes[6] & 0x0f) | 0x40;
        bytes[8] = (bytes[8] & 0x3f) | 0x80;
        return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
            .join("")
            .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12}).*/, (_m, p1, p2, p3, p4, p5) => `${p1}-${p2}-${p3}-${p4}-${p5}`);
    }
    return FALLBACK_HEX.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
export function formatHour(hour) {
    return `${hour.toString().padStart(2, "0")}:00`;
}
export function todayKey(reference = new Date()) {
    return dateKeyFromGregorian(reference.getUTCFullYear(), reference.getUTCMonth() + 1, reference.getUTCDate());
}
export function readStorage() {
    if (typeof window === "undefined")
        return {};
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw)
        return {};
    try {
        const parsed = JSON.parse(raw);
        return {
            notes: parsed.notes ?? {},
            customTags: parsed.customTags ?? [],
        };
    }
    catch (e) {
        console.warn("Failed to parse stored data, resetting.", e);
        return {};
    }
}
export function priorityRank(id) {
    if (!id)
        return 3;
    return PRIORITY_RANK[id] ?? 3;
}
export function sortByHour(list) {
    return [...list].sort((a, b) => {
        if (a.hour !== b.hour)
            return a.hour - b.hour;
        const rankDiff = priorityRank(a.priorityId) - priorityRank(b.priorityId);
        if (rankDiff !== 0)
            return rankDiff;
        return a.title.localeCompare(b.title);
    });
}
export function mergeConsecutive(list) {
    if (list.length === 0)
        return [];
    const sorted = sortByHour(dedupe(list)).map((t) => ({
        ...t,
        done: Boolean(t.done),
    }));
    const merged = [];
    let current = null;
    for (const item of sorted) {
        const itemDuration = Math.max(1, Number(item.duration) || 1);
        const itemEnd = Math.min(24, item.hour + itemDuration);
        if (!current) {
            current = {
                task: { ...item, done: Boolean(item.done) },
                start: item.hour,
                end: itemEnd,
            };
            continue;
        }
        const isConsecutive = item.hour === current.end;
        const isSameTask = item.title.trim().toLowerCase() ===
            current.task.title.trim().toLowerCase() &&
            item.tag === current.task.tag;
        if (isConsecutive && isSameTask) {
            const mergedDone = Boolean(current.task.done && item.done);
            current = {
                ...current,
                task: { ...current.task, done: mergedDone },
                end: itemEnd,
            };
        }
        else {
            merged.push(current);
            current = {
                task: { ...item, done: Boolean(item.done) },
                start: item.hour,
                end: itemEnd,
            };
        }
    }
    if (current)
        merged.push(current);
    return merged;
}
export function dedupe(list) {
    const map = new Map();
    list.forEach((t) => {
        const key = `${t.title.trim().toLowerCase()}|${t.tag ?? "none"}|${t.priorityId ?? "none"}|${t.hour}|${t.day}`;
        map.set(key, t);
    });
    return Array.from(map.values()).sort((a, b) => {
        if (a.hour !== b.hour)
            return a.hour - b.hour;
        const rankDiff = priorityRank(a.priorityId) - priorityRank(b.priorityId);
        if (rankDiff !== 0)
            return rankDiff;
        return a.title.localeCompare(b.title);
    });
}
export function retagSchedule(schedule, fromTag, toTag) {
    const next = {};
    Object.entries(schedule).forEach(([day, list]) => {
        const updated = list.map((t) => t.tag === fromTag ? { ...t, tag: toTag } : t);
        next[day] = dedupe(updated);
    });
    return next;
}
export function getTagLabel(tag) {
    if (!tag)
        return "";
    return tagLabels[tag] ?? tag;
}
export function getTagClass(tag) {
    if (!tag)
        return "";
    return baseTags.includes(tag) ? `pill--${tag}` : "pill--custom";
}
export function getPriorityColor(id, priorities) {
    const fallback = "var(--priority-none, #555a65)";
    if (!id)
        return fallback;
    const builtin = PRIORITY_LEVELS.find((p) => p.id === id);
    if (builtin)
        return builtin.color;
    const found = priorities.find((p) => p.id === id);
    return found?.color ?? fallback;
}
export function dateKeyFromGregorian(gy, gm, gd) {
    return new Date(Date.UTC(gy, gm - 1, gd)).toISOString().slice(0, 10);
}
export function dateKeyFromJalali(jy, jm, jd) {
    const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
    return dateKeyFromGregorian(gy, gm, gd);
}
export function toJalaliParts(date) {
    return gregorianToJalali(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}
export function formatJalaliMonthName(date) {
    const { gy, gm, gd } = jalaliToGregorian(date.jy, date.jm, 1);
    const anchor = new Date(Date.UTC(gy, gm - 1, gd));
    return anchor.toLocaleDateString("fa-IR-u-ca-persian", { month: "long" });
}
export function formatGregorianSpanForJalaliMonth(jy, jm) {
    const start = jalaliToGregorian(jy, jm, 1);
    const end = jalaliToGregorian(jy, jm, jalaliMonthLength(jy, jm));
    const fmt = new Intl.DateTimeFormat("en-US", { month: "short" });
    const startLabel = fmt.format(new Date(Date.UTC(start.gy, start.gm - 1, start.gd)));
    const endLabel = fmt.format(new Date(Date.UTC(end.gy, end.gm - 1, end.gd)));
    return startLabel === endLabel ? startLabel : `${startLabel}-${endLabel}`;
}
export function buildJalaliMonthDays(jy, jm) {
    const count = jalaliMonthLength(jy, jm);
    const first = jalaliToGregorian(jy, jm, 1);
    const firstDate = new Date(Date.UTC(first.gy, first.gm - 1, first.gd));
    const jsWeekDay = firstDate.getUTCDay();
    const offset = (jsWeekDay + 1) % 7;
    const days = [];
    for (let i = 0; i < offset; i += 1)
        days.push(null);
    for (let d = 1; d <= count; d += 1)
        days.push(d);
    const remainder = days.length % 7;
    if (remainder !== 0) {
        const trailing = 7 - remainder;
        for (let i = 0; i < trailing; i += 1)
            days.push(null);
    }
    return days;
}
export function jalaliMonthLength(jy, jm) {
    const start = jalaliToGregorian(jy, jm, 1);
    const next = jm === 12
        ? jalaliToGregorian(jy + 1, 1, 1)
        : jalaliToGregorian(jy, jm + 1, 1);
    const startDate = new Date(Date.UTC(start.gy, start.gm - 1, start.gd)).getTime();
    const nextDate = new Date(Date.UTC(next.gy, next.gm - 1, next.gd)).getTime();
    const diff = Math.round((nextDate - startDate) / (24 * 60 * 60 * 1000));
    return diff;
}
export function buildYearOptions(current) {
    const start = current - 6;
    return Array.from({ length: 13 }, (_, i) => start + i);
}
const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const jDaysInMonth = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
export function gregorianToJalali(gy, gm, gd) {
    const gDayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    let gy2 = gy - 1600;
    let gm2 = gm - 1;
    const gd2 = gd - 1;
    let gDayNo = 365 * gy2 +
        Math.floor((gy2 + 3) / 4) -
        Math.floor((gy2 + 99) / 100) +
        Math.floor((gy2 + 399) / 400);
    gDayNo += gDayCount[gm2];
    if (gm2 > 1 && isGregorianLeap(gy))
        gDayNo += 1;
    gDayNo += gd2;
    let jDayNo = gDayNo - 79;
    const jNp = Math.floor(jDayNo / 12053);
    jDayNo %= 12053;
    let jy = 979 + 33 * jNp + 4 * Math.floor(jDayNo / 1461);
    jDayNo %= 1461;
    if (jDayNo >= 366) {
        jy += Math.floor((jDayNo - 1) / 365);
        jDayNo = (jDayNo - 1) % 365;
    }
    let jm = 0;
    for (; jm < 11 && jDayNo >= jDaysInMonth[jm]; jm += 1) {
        jDayNo -= jDaysInMonth[jm];
    }
    const jd = jDayNo + 1;
    return { jy, jm: jm + 1, jd };
}
export function jalaliToGregorian(jy, jm, jd) {
    jy -= 979;
    jm -= 1;
    jd -= 1;
    let jDayNo = 365 * jy + Math.floor(jy / 33) * 8 + Math.floor(((jy % 33) + 3) / 4);
    for (let i = 0; i < jm; i += 1) {
        jDayNo += jDaysInMonth[i];
    }
    jDayNo += jd;
    let gDayNo = jDayNo + 79;
    let gy = 1600 + 400 * Math.floor(gDayNo / 146097);
    gDayNo %= 146097;
    let leap = true;
    if (gDayNo >= 36525) {
        gDayNo -= 1;
        gy += 100 * Math.floor(gDayNo / 36524);
        gDayNo %= 36524;
        if (gDayNo >= 365) {
            gDayNo += 1;
        }
        else {
            leap = false;
        }
    }
    gy += 4 * Math.floor(gDayNo / 1461);
    gDayNo %= 1461;
    if (gDayNo >= 366) {
        leap = false;
        gDayNo -= 1;
        gy += Math.floor(gDayNo / 365);
        gDayNo %= 365;
    }
    let gm = 0;
    for (; gm < 11; gm += 1) {
        const monthLength = gDaysInMonth[gm] + (gm === 1 && leap ? 1 : 0);
        if (gDayNo < monthLength)
            break;
        gDayNo -= monthLength;
    }
    const gd = gDayNo + 1;
    return { gy, gm: gm + 1, gd };
}
export function isGregorianLeap(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}
