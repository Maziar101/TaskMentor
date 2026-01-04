import type { IconType } from "react-icons";
import {
  FiCalendar,
  FiTarget,
  FiFlag,
  FiPlusCircle,
  FiGrid,
  FiBarChart2,
  FiUser,
  FiBriefcase,
  FiUsers,
  FiSettings,
} from "react-icons/fi";

export type MenuItem = {
  label: string;
  to: string;
  icon: IconType;
};

export const menuItems: MenuItem[] = [
  { label: "داشبورد", to: "/dashboard", icon: FiGrid },
  { label: "برنامه‌ریز", to: "/planner", icon: FiCalendar },
  { label: "پروژه‌ها", to: "/projects", icon: FiBriefcase },
  { label: "تیم‌ها", to: "/teams", icon: FiUsers },
  { label: "اهداف کوتاه‌مدت", to: "/short-goals", icon: FiTarget },
  { label: "اهداف بلندمدت", to: "/long-goals", icon: FiFlag },
  { label: "افزودن هدف", to: "/goals/new", icon: FiPlusCircle },
  { label: "گزارش‌ها", to: "/reports", icon: FiBarChart2 },
  { label: "پروفایل", to: "/profile", icon: FiUser },
  { label: "تنظیمات", to: "/settings", icon: FiSettings },
];
