import { FiCalendar, FiGrid, FiMessageSquare, FiUser } from "react-icons/fi";

export const menuItems = [
    { label: "داشبورد", to: "/dashboard", icon: FiGrid },
    { label: "برنامه‌ریز", to: "/planner", icon: FiCalendar },
    { label:"چت" , to: "/chat", icon: FiMessageSquare },
    { label: "پروفایل", to: "/profile", icon: FiUser },
];
