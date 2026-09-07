import { FiCalendar, FiGrid, FiUser } from "react-icons/fi";
import { IoMdChatbubbles } from "react-icons/io";

export const menuItems = [
    { label: "داشبورد", to: "/dashboard", icon: FiGrid },
    { label: "برنامه‌ریز", to: "/planner", icon: FiCalendar },
    { label:"چت" , to: "/chat", icon: IoMdChatbubbles },
    { label: "پروفایل", to: "/profile", icon: FiUser },
];
