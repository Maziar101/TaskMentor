import { NavLink } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { apiRequest } from "../../../services/api";
import { getLocale } from "../../../i18n/runtime";

export default function SideBarItem({ to, label, icon: Icon }) {
    const isChat = to === "/chat";
    const unreadConversations = useChatUnreadCount(isChat);
    return (<NavLink to={to} className={({ isActive }) => navClass(isActive)}>
      <span className="nav-link__icon" aria-hidden>
        <Icon />
      </span>
      <span className="nav-link__label">{label}</span>
      {isChat && unreadConversations > 0 && (
        <span
          className="nav-link__badge"
          aria-label={`${unreadConversations.toLocaleString(getLocale())} گفتگوی خوانده‌نشده`}
        >
          {unreadConversations.toLocaleString(getLocale())}
        </span>
      )}
    </NavLink>);
}

function useChatUnreadCount(enabled) {
    const userId = useSelector((state) => state.auth.user?.id || state.auth.user?._id);
    const [count, setCount] = useState(0);
    const refresh = useCallback(async () => {
        if (!enabled || !userId) {
            setCount(0);
            return;
        }
        try {
            const summary = await apiRequest("/api/chat/unread-summary");
            setCount(summary.conversationCount ?? 0);
        } catch {
            // Keep the last successful count during a transient polling failure.
        }
    }, [enabled, userId]);

    useEffect(() => {
        if (!enabled || !userId) return undefined;
        const initialRefresh = window.setTimeout(refresh, 0);
        const interval = window.setInterval(refresh, 4000);
        const handleUnreadChange = (event) => {
            const nextCount = event.detail?.conversationCount;
            if (Number.isInteger(nextCount)) setCount(nextCount);
            else refresh();
        };
        window.addEventListener("taskmentor:chat-unread-changed", handleUnreadChange);
        return () => {
            window.clearTimeout(initialRefresh);
            window.clearInterval(interval);
            window.removeEventListener("taskmentor:chat-unread-changed", handleUnreadChange);
        };
    }, [enabled, refresh, userId]);
    return count;
}

function navClass(isActive) {
    return isActive ? "nav-link nav-link--active" : "nav-link";
}
