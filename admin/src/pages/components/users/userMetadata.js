import { formatDate } from "../../../i18n/runtime.js";

export const roleMeta = {
  owner: { label: "مالک", color: "#ffffff", background: "rgba(255,255,255,0.14)" },
  admin: { label: "ادمین", color: "#ffffff", background: "rgba(255,255,255,0.1)" },
  user: { label: "کاربر", color: "#ffffff", background: "rgba(255,255,255,0.06)" },
};

export const subscriptionMeta = {
  enterprise: { label: "سازمانی", color: "#ffffff" },
  pro: { label: "حرفه‌ای", color: "rgba(255,255,255,0.82)" },
  free: { label: "رایگان", color: "rgba(255,255,255,0.68)" },
};

export const roleOptions = Object.entries(roleMeta).map(([value, item]) => ({
  value,
  label: item.label,
}));

export const subscriptionOptions = Object.entries(subscriptionMeta).map(([value, item]) => ({
  value,
  label: item.label,
}));

export const statusOptions = [
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
];

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizeUserSearch(value) {
  return String(value || "")
    .toLocaleLowerCase("fa")
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ")
    .trim();
}

export function getUserSearchText(user) {
  const active = user.isActive !== false;
  const joinDate = user.createdAt
    ? formatDate(new Date(user.createdAt), { year: "numeric", month: "short", day: "numeric" })
    : "";

  return normalizeUserSearch([
    user.username,
    user.phone,
    user.role,
    roleMeta[user.role]?.label,
    user.subscription,
    subscriptionMeta[user.subscription]?.label,
    active ? "فعال active" : "غیرفعال inactive disabled",
    joinDate,
    user.createdAt,
  ].join(" "));
}

export function getInitials(username) {
  return username?.trim().charAt(0).toUpperCase() || "؟";
}
