import { FiBookmark } from "react-icons/fi";

export const CHAT_FILTERS = [
  { id: "all", label: "همه" },
  { id: "unread", label: "خوانده‌نشده" },
  { id: "projects", label: "پروژه‌ها" },
  { id: "support", label: "پشتیبانی" },
  { id: "archive", label: "آرشیو" },
];

export const INITIAL_CONVERSATIONS = [
  {
    id: "saved",
    name: "Save Message",
    preview: "پیام‌های شخصی خود را اینجا ذخیره کنید",
    time: "",
    unread: 0,
    category: "archive",
    pinned: true,
    avatar: "",
    icon: FiBookmark,
  },
];

export const INITIAL_MESSAGES = { saved: [] };
