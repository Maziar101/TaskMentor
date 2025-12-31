import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FiEdit2,
  FiInfo,
  FiMoreHorizontal,
  FiPaperclip,
  FiPlus,
  FiSearch,
  FiSend,
  FiTrash2,
} from "react-icons/fi";
import { useAuth } from "../../store/authStore";
import DeleteModal from "../../components/DeleteModal";
import useTeamSocket from "./useTeamSocket";

type Team = {
  _id: string;
  name: string;
  owner: string;
};

type Member = {
  user: { _id: string; username: string; phone: string };
  role: string;
  nickname?: string;
  status: "active" | "disabled";
  joinedAt?: string;
};

type Group = {
  _id: string;
  name: string;
  isPublic: boolean;
  members: string[];
  createdBy?: string;
};

type Message = {
  _id: string;
  group: string;
  originGroup?: string;
  sender: { _id: string; username: string; phone: string };
  type: "text" | "file" | "task_link";
  text?: string;
  fileUrl?: string;
  fileName?: string;
  taskId?: string;
  replyTo?: string;
  createdAt: string;
  editedAt?: string;
};

type DeleteModalState = {
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
};

type AuditLog = {
  _id: string;
  action: string;
  targetType: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  actor?: { _id: string; username: string; phone: string };
  createdAt: string;
};

const STRINGS = {
  fa: {
    title: "مدیریت تیم و چت",
    teams: "تیم‌ها",
    members: "اعضا",
    phone: "شماره موبایل",
    role: "نقش",
    nickname: "نام نمایشی",
    addMember: "افزودن عضو",
    status: "وضعیت",
    online: "آنلاین",
    offline: "آفلاین",
    disabled: "مسدود",
    active: "فعال",
    promote: "ارتقا",
    demote: "تنزیل",
    disable: "مسدود",
    enable: "فعال",
    remove: "حذف",
    groups: "گروه‌ها",
    createGroup: "ساخت گروه",
    groupName: "نام گروه",
    pinned: "پیام سنجاق‌شده",
    membersCount: "نفر",
    messagePlaceholder: "پیام خود را بنویس...",
    attachFile: "افزودن فایل",
    send: "ارسال",
    taskLink: "لینک تسک",
    edit: "ویرایش",
    reply: "پاسخ",
    save: "ثبت",
    cancel: "لغو",
    noTeam: "تیمی وجود ندارد. یکی بساز.",
    noGroup: "گروهی انتخاب نشده است.",
    noMessages: "هنوز پیامی ارسال نشده است.",
    noAudit: "لاگی ثبت نشده است.",
    owner: "مالک",
    task: "تسک",
    audit: "تاریخچه تغییرات",
    filters: "فیلترها",
    search: "جستجو...",
    all: "همه",
    backToTeams: "بازگشت به تیم‌ها",
    deleteGroup: "حذف تاپیک",
    deleteGroupConfirm: "حذف تاپیک \"{name}\"؟",
    deletedGroup: "تاپیک حذف شده",
    deleteMessageConfirm: "آیا مطمئنی که می‌خواهی این پیام را حذف کنی؟",
    deleteMemberConfirm: "حذف عضو \"{name}\" از تیم؟",
    locale: "EN",
  },
  en: {
    title: "Team Management & Chat",
    teams: "Teams",
    members: "Members",
    phone: "Mobile number",
    role: "Role",
    nickname: "Nickname",
    addMember: "Add member",
    status: "Status",
    online: "Online",
    offline: "Offline",
    disabled: "Disabled",
    active: "Active",
    promote: "Promote",
    demote: "Demote",
    disable: "Disable",
    enable: "Enable",
    remove: "Remove",
    groups: "Groups",
    createGroup: "Create group",
    groupName: "Group name",
    pinned: "Pinned message",
    membersCount: "members",
    messagePlaceholder: "Write a message...",
    attachFile: "Attach file",
    send: "Send",
    taskLink: "Task link",
    edit: "Edit",
    reply: "Reply",
    save: "Save",
    cancel: "Cancel",
    noTeam: "No team yet. Create one.",
    noGroup: "No group selected.",
    noMessages: "No messages yet.",
    noAudit: "No audit logs yet.",
    owner: "Owner",
    task: "Task",
    audit: "Audit log",
    filters: "Filters",
    search: "Search...",
    all: "All",
    backToTeams: "Back to teams",
    deleteGroup: "Delete topic",
    deleteGroupConfirm: "Delete \"{name}\" topic?",
    deletedGroup: "Deleted topic",
    deleteMessageConfirm: "Delete this message?",
    deleteMemberConfirm: "Remove \"{name}\" from the team?",
    locale: "FA",
  },
};

const ROLE_OPTIONS = ["owner", "admin", "manager", "developer", "viewer", "member"];
const DEFAULT_GROUP_NAME = "عمومی";
const isDefaultGroupName = (name?: string) => name?.trim() === DEFAULT_GROUP_NAME;

export default function TeamChatPage() {
  const { user } = useAuth();
  const { teamId } = useParams();
  const [locale, setLocale] = useState<"fa" | "en">(() => {
    if (typeof window === "undefined") return "fa";
    return (localStorage.getItem("taskmentor-locale") as "fa" | "en") || "fa";
  });
  const t = STRINGS[locale];
  const [teams, setTeams] = useState<Team[]>([]);
  const activeTeamId = teamId ?? null;
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const [memberPhone, setMemberPhone] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [memberNickname, setMemberNickname] = useState("");
  const [groupName, setGroupName] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [taskLink, setTaskLink] = useState("");
  const [sendError, setSendError] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [unreadGroups, setUnreadGroups] = useState<Record<string, number>>({});
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);
  const [deleteModalBusy, setDeleteModalBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);

  const activeTeam = teams.find((team) => team._id === activeTeamId) || null;
  const activeGroup = groups.find((group) => group._id === activeGroupId) || null;
  const defaultGroupId = useMemo(
    () => groups.find((group) => isDefaultGroupName(group.name))?._id ?? null,
    [groups]
  );
  const isGeneralGroup = activeGroup ? isDefaultGroupName(activeGroup.name) : false;
  const groupNameById = useMemo(
    () => new Map(groups.map((group) => [group._id, group.name])),
    [groups]
  );
  const pinnedMessage = useMemo(() => {
    if (!messages.length) return null;
    const withAttachment = [...messages].reverse().find((item) => item.type !== "text");
    return withAttachment || messages[messages.length - 1];
  }, [messages]);
  const latestMessage = messages[messages.length - 1];

  const filteredGroups = useMemo(() => {
    const needle = chatSearch.trim().toLowerCase();
    const visibleGroups = !needle
      ? groups
      : groups.filter((group) => group.name.toLowerCase().includes(needle));
    const defaults = visibleGroups.filter((group) => isDefaultGroupName(group.name));
    const rest = visibleGroups.filter((group) => !isDefaultGroupName(group.name));
    return [...defaults, ...rest];
  }, [groups, chatSearch]);

  useTeamSocket({
    userId: user?.userId,
    teamId: activeTeamId,
    groupId: activeGroupId,
    handlers: {
      onMessageCreated: ({ groupId, message }) => {
        const payload = message as Message;
        if (groupId === activeGroupId) {
          setMessages((prev) => {
            if (prev.some((item) => item._id === payload._id)) return prev;
            return [...prev, payload];
          });
          scrollToBottom();
        } else {
          setUnreadGroups((prev) => ({
            ...prev,
            [groupId]: (prev[groupId] || 0) + 1,
          }));
        }
      },
      onMessageUpdated: ({ groupId, message }) => {
        if (groupId !== activeGroupId) return;
        const payload = message as Message;
        setMessages((prev) => prev.map((item) => (item._id === payload._id ? payload : item)));
      },
      onMessageDeleted: ({ groupId, messageId }) => {
        if (groupId !== activeGroupId) return;
        setMessages((prev) => prev.filter((item) => item._id !== messageId));
      },
      onMemberStatus: ({ memberId, status }) => {
        setOnlineMap((prev) => ({ ...prev, [memberId]: status === "online" }));
      },
    },
  });

  useEffect(() => {
    if (!user?.userId) return;
    fetchTeams();
  }, [user?.userId]);

  useEffect(() => {
    setMembers([]);
    setGroups([]);
    setMessages([]);
    setAuditLogs([]);
    setOnlineMap({});
    setUnreadGroups({});
    setActiveGroupId(null);
    setMessageDraft("");
    setTaskLink("");
    setSendError("");
    setEditingMessageId(null);
    setEditingText("");
    setReplyTo(null);
    setDeleteModal(null);
    setDeleteModalBusy(false);
  }, [activeTeamId]);

  useEffect(() => {
    if (!activeTeamId || !user?.userId) return;
    fetchMembers(activeTeamId);
    fetchGroups(activeTeamId);
    fetchAudit(activeTeamId);
  }, [activeTeamId, user?.userId]);

  useEffect(() => {
    if (!activeTeamId || !activeGroupId || !user?.userId) return;
    fetchMessages(activeTeamId, activeGroupId);
    setUnreadGroups((prev) => ({ ...prev, [activeGroupId]: 0 }));
  }, [activeTeamId, activeGroupId, user?.userId]);

  useEffect(() => {
    if (!activeTeamId || !groups.length) return;
    if (!activeGroupId || !groups.some((group) => group._id === activeGroupId)) {
      setActiveGroupId(defaultGroupId || groups[0]._id);
    }
  }, [activeTeamId, groups, activeGroupId, defaultGroupId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("taskmentor-locale", locale);
  }, [locale]);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (roleFilter && member.role !== roleFilter) return false;
      if (statusFilter && member.status !== statusFilter) return false;
      if (search) {
        const needle = search.toLowerCase();
        const name = member.user.username?.toLowerCase() || "";
        const phone = member.user.phone?.toLowerCase() || "";
        const nickname = member.nickname?.toLowerCase() || "";
        if (!name.includes(needle) && !phone.includes(needle) && !nickname.includes(needle)) {
          return false;
        }
      }
      return true;
    });
  }, [members, roleFilter, search, statusFilter]);

  const handleAddMember = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeTeamId || !user?.userId) return;
    const phone = memberPhone.trim();
    if (!phone) return;
    const res = await fetch(`/api/teams/${activeTeamId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.userId,
        phone,
        role: memberRole,
        nickname: memberNickname.trim() || undefined,
      }),
    });
    if (!res.ok) return;
    setMemberPhone("");
    setMemberRole("member");
    setMemberNickname("");
    await fetchMembers(activeTeamId);
    await fetchAudit(activeTeamId);
  };

  const handleUpdateMember = async (memberId: string, patch: Partial<Member>) => {
    if (!activeTeamId || !user?.userId) return;
    const res = await fetch(`/api/teams/${activeTeamId}/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.userId,
        role: patch.role,
        status: patch.status,
        nickname: patch.nickname,
      }),
    });
    if (!res.ok) return;
    await fetchMembers(activeTeamId);
    await fetchAudit(activeTeamId);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!activeTeamId || !user?.userId) return;
    const res = await fetch(`/api/teams/${activeTeamId}/members/${memberId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId }),
    });
    if (!res.ok) return;
    await fetchMembers(activeTeamId);
    await fetchAudit(activeTeamId);
  };

  const handleCreateGroup = async (event: FormEvent) => {
    event.preventDefault();
    if (!activeTeamId || !user?.userId) return;
    const trimmed = groupName.trim();
    if (!trimmed) return;
    const res = await fetch(`/api/teams/${activeTeamId}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId, name: trimmed, isPublic: false }),
    });
    if (!res.ok) return;
    setGroupName("");
    await fetchGroups(activeTeamId);
  };

  const handleDeleteGroup = async (group: Group) => {
    if (!activeTeamId || !user?.userId) return;
    if (isDefaultGroupName(group.name)) return;
    setDeletingGroupId(group._id);
    try {
      const res = await fetch(`/api/teams/${activeTeamId}/groups/${group._id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId }),
      });
      if (!res.ok) return;
      if (activeGroupId === group._id) {
        setActiveGroupId(null);
      }
      await fetchGroups(activeTeamId);
    } finally {
      setDeletingGroupId(null);
    }
  };

  const handleSendMessage = async () => {
    if (!activeTeamId || !activeGroupId || !user?.userId) return;
    const trimmed = messageDraft.trim();
    if (!trimmed && !taskLink) return;
    setSendError("");
    const payload =
      taskLink.trim().length > 0
        ? { type: "task_link", taskId: taskLink.trim(), text: trimmed || undefined }
        : { type: "text", text: trimmed };
    const res = await fetch(`/api/teams/${activeTeamId}/groups/${activeGroupId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.userId,
        ...payload,
        replyTo: replyTo?._id,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSendError(data?.message || "ارسال پیام ناموفق بود");
      return;
    }
    const data = (await res.json()) as Message;
    setMessages((prev) => {
      if (prev.some((item) => item._id === data._id)) return prev;
      return [...prev, data];
    });
    scrollToBottom();
    setMessageDraft("");
    setTaskLink("");
    setReplyTo(null);
  };

  const handleSendFile = async (file: File) => {
    if (!activeTeamId || !activeGroupId || !user?.userId) return;
    setSendError("");
    const fileUrl = await readFileAsDataUrl(file);
    const res = await fetch(`/api/teams/${activeTeamId}/groups/${activeGroupId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user.userId,
        type: "file",
        fileUrl,
        fileName: file.name,
        replyTo: replyTo?._id,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSendError(data?.message || "ارسال فایل ناموفق بود");
      return;
    }
    const data = (await res.json()) as Message;
    setMessages((prev) => {
      if (prev.some((item) => item._id === data._id)) return prev;
      return [...prev, data];
    });
    scrollToBottom();
    setReplyTo(null);
  };

  const handleEditMessage = async () => {
    if (!activeTeamId || !activeGroupId || !user?.userId || !editingMessageId) return;
    const trimmed = editingText.trim();
    if (!trimmed) return;
    const res = await fetch(
      `/api/teams/${activeTeamId}/groups/${activeGroupId}/messages/${editingMessageId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId, text: trimmed }),
      }
    );
    if (!res.ok) return;
    setEditingMessageId(null);
    setEditingText("");
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!activeTeamId || !activeGroupId || !user?.userId) return;
    const res = await fetch(
      `/api/teams/${activeTeamId}/groups/${activeGroupId}/messages/${messageId}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId }),
      }
    );
    if (!res.ok) return;
  };

  const closeDeleteModal = () => {
    if (deleteModalBusy) return;
    setDeleteModal(null);
  };

  const confirmDeleteModal = async () => {
    if (!deleteModal) return;
    setDeleteModalBusy(true);
    try {
      await deleteModal.onConfirm();
      setDeleteModal(null);
    } finally {
      setDeleteModalBusy(false);
    }
  };

  function scrollToBottom() {
    if (!messageListRef.current) return;
    messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
  }

  async function fetchTeams() {
    if (!user?.userId) return;
    const res = await fetch(`/api/teams?userId=${user.userId}`);
    if (!res.ok) return;
    const data = (await res.json()) as Team[];
    setTeams(data);
  }

  async function fetchMembers(teamId: string) {
    if (!user?.userId) return;
    const params = new URLSearchParams({
      userId: user.userId,
      role: roleFilter || "",
      status: statusFilter || "",
      search: search || "",
    });
    const res = await fetch(`/api/teams/${teamId}/members?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    setMembers(data.members || []);
  }

  async function fetchGroups(teamId: string) {
    if (!user?.userId) return;
    const res = await fetch(`/api/teams/${teamId}/groups?userId=${user.userId}`);
    if (!res.ok) return;
    const data = (await res.json()) as Group[];
    setGroups(data);
  }

  async function fetchMessages(teamId: string, groupId: string) {
    if (!user?.userId) return;
    const res = await fetch(
      `/api/teams/${teamId}/groups/${groupId}/messages?userId=${user.userId}`
    );
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages || []);
    setTimeout(scrollToBottom, 0);
  }

  async function fetchAudit(teamId: string) {
    if (!user?.userId) return;
    const res = await fetch(`/api/teams/${teamId}/audit?userId=${user.userId}`);
    if (!res.ok) return;
    const data = (await res.json()) as AuditLog[];
    setAuditLogs(data);
  }

  const onlineCount = members.filter((m) => onlineMap[m.user._id]).length;

  return (
    <div className="teams chat-shell" dir={locale === "fa" ? "rtl" : "ltr"}>
      <aside className="chat-shell__list">
        <div className="panel">
          <div className="panel__header">
            <div>
              <p className="eyebrow">{t.teams}</p>
              <h2>{activeTeam?.name || t.noTeam}</h2>
            </div>
            <div className="panel__actions">
              <Link className="ghost" to="/teams">
                {t.backToTeams}
              </Link>
              <button
                className="ghost"
                type="button"
                onClick={() => setLocale((prev) => (prev === "fa" ? "en" : "fa"))}
              >
                {t.locale}
              </button>
            </div>
          </div>
          <p className="light small">
            {activeTeam ? `${members.length} ${t.members}` : t.noTeam}
          </p>
        </div>

        <div className="panel conversations">
          <div className="conversations__search">
            <FiSearch aria-hidden />
            <input
              value={chatSearch}
              onChange={(event) => setChatSearch(event.target.value)}
              placeholder={t.search}
            />
          </div>
          <div className="conversations__list">
            {filteredGroups.map((group) => {
              const isActive = group._id === activeGroupId;
              const isDefault = isDefaultGroupName(group.name);
              const canDelete =
                !isDefault &&
                (group.createdBy === user?.userId || activeTeam?.owner === user?.userId);
              const preview =
                isActive && latestMessage
                  ? latestMessage.type === "text"
                    ? latestMessage.text
                    : latestMessage.type === "file"
                    ? latestMessage.fileName || t.attachFile
                    : latestMessage.taskId
                  : t.noMessages;
              const timeLabel =
                isActive && latestMessage
                  ? new Date(latestMessage.createdAt).toLocaleTimeString(locale, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
              return (
                <div
                  key={group._id}
                  className={isActive ? "conversation conversation--active" : "conversation"}
                  onClick={() => setActiveGroupId(group._id)}
                  onKeyDown={(event) => {
                    if (event.currentTarget !== event.target) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveGroupId(group._id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="conversation__avatar">
                    <span>{initials(group.name)}</span>
                  </div>
                  <div className="conversation__body">
                    <div className="conversation__head">
                      <strong>#{group.name}</strong>
                      <span className="light small">{timeLabel}</span>
                    </div>
                    <p className="light small">{preview}</p>
                  </div>
                  <div className="conversation__actions">
                    {unreadGroups[group._id] ? (
                      <span className="badge badge--pill">{unreadGroups[group._id]}</span>
                    ) : null}
                    {canDelete ? (
                      <button
                        className="icon-btn icon-btn--danger conversation__delete"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteModal({
                            title: t.deleteGroup,
                            description: t.deleteGroupConfirm.replace("{name}", group.name),
                            confirmLabel: t.remove,
                            onConfirm: () => handleDeleteGroup(group),
                          });
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                        aria-label={t.deleteGroup}
                        disabled={deletingGroupId === group._id}
                      >
                        <FiTrash2 aria-hidden />
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
          <form className="group-form" onSubmit={handleCreateGroup}>
            <input
              value={groupName}
              onChange={(event) => setGroupName(event.target.value)}
              placeholder={t.groupName}
            />
            <button className="ghost" type="submit">
              <FiPlus aria-hidden /> {t.createGroup}
            </button>
          </form>
        </div>
      </aside>

      <main className="chat-shell__main">
        <div className="panel chat-panel">
          <div className="chat-panel__header">
            <div className="chat-panel__title">
              <h2>{activeGroup ? `#${activeGroup.name}` : t.noGroup}</h2>
              <span className="light small">
                {members.length} {t.membersCount}
              </span>
            </div>
            <div className="chat-panel__actions">
              <button className="icon-btn" type="button" aria-label="Search">
                <FiSearch aria-hidden />
              </button>
              <button className="icon-btn" type="button" aria-label="Info">
                <FiInfo aria-hidden />
              </button>
              <button className="icon-btn" type="button" aria-label="More">
                <FiMoreHorizontal aria-hidden />
              </button>
            </div>
          </div>

          {pinnedMessage && (
            <div className="chat-pinned">
              <p className="chat-pinned__label">{t.pinned}</p>
              <div className="chat-pinned__body">
                {pinnedMessage.type === "file" ? (
                  <span>{pinnedMessage.fileName || t.attachFile}</span>
                ) : pinnedMessage.type === "task_link" ? (
                  <span>{pinnedMessage.taskId}</span>
                ) : (
                  <span>{pinnedMessage.text}</span>
                )}
              </div>
            </div>
          )}

          <div className="chat-messages" ref={messageListRef}>
            {messages.length === 0 && <p className="empty">{t.noMessages}</p>}
            {messages.map((message, index) => {
              const isMine = message.sender?._id === user?.userId;
              const previous = messages[index - 1];
              const currentDateKey = message.createdAt.slice(0, 10);
              const previousDateKey = previous?.createdAt?.slice(0, 10);
              const showDate = currentDateKey !== previousDateKey;
              const showOrigin =
                isGeneralGroup && message.originGroup && message.originGroup !== activeGroupId;
              const originGroupName = message.originGroup
                ? groupNameById.get(message.originGroup) || t.deletedGroup
                : "";
              const reply = message.replyTo
                ? messages.find((item) => item._id === message.replyTo)
                : null;
              return (
                <div key={message._id}>
                  {showDate && (
                    <div className="chat-date">
                      <span>{new Date(message.createdAt).toLocaleDateString(locale)}</span>
                    </div>
                  )}
                  <div className={isMine ? "chat-message chat-message--mine" : "chat-message"}>
                    <div className="chat-message__avatar">
                      <span>{initials(message.sender?.username || message.sender?.phone)}</span>
                    </div>
                    <div className="chat-message__bubble">
                      <div className="chat-message__head">
                        <span>{message.sender?.username || message.sender?.phone}</span>
                        <span className="light small">
                          {new Date(message.createdAt).toLocaleTimeString(locale, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      {showOrigin && (
                        <div className="chat-message__meta">
                          <span className="pill pill--solid chat-message__tag">
                            #{originGroupName}
                          </span>
                        </div>
                      )}
                      {reply && (
                        <div className="chat-message__quote">
                          <span>{reply.sender?.username || reply.sender?.phone}</span>
                          <p>{reply.text || reply.taskId}</p>
                        </div>
                      )}
                      {message.type === "file" && message.fileUrl && (
                        <div className="chat-message__file">
                          {message.fileUrl.startsWith("data:image") ? (
                            <img src={message.fileUrl} alt={message.fileName || "file"} />
                          ) : (
                            <a href={message.fileUrl} download={message.fileName || "file"}>
                              {message.fileName || t.attachFile}
                            </a>
                          )}
                        </div>
                      )}
                      {message.type === "task_link" && (
                        <div className="chat-message__task">
                          <span className="pill">{t.task}</span>
                          <span>{message.taskId}</span>
                        </div>
                      )}
                      {editingMessageId === message._id ? (
                        <div className="chat-message__edit">
                          <input
                            value={editingText}
                            onChange={(event) => setEditingText(event.target.value)}
                          />
                          <div className="chat-message__actions">
                            <button className="ghost" type="button" onClick={handleEditMessage}>
                              {t.save}
                            </button>
                            <button
                              className="ghost"
                              type="button"
                              onClick={() => {
                                setEditingMessageId(null);
                                setEditingText("");
                              }}
                            >
                              {t.cancel}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="chat-message__text">{message.text}</p>
                      )}
                      {message.editedAt && <span className="light small">{t.edit}</span>}
                      <div className="chat-message__actions">
                        <button
                          className="ghost"
                          type="button"
                          onClick={() => setReplyTo(message)}
                        >
                          {t.reply}
                        </button>
                        {isMine && (
                          <>
                            <button
                              className="ghost"
                              type="button"
                              onClick={() => {
                                setEditingMessageId(message._id);
                                setEditingText(message.text || "");
                              }}
                            >
                              <FiEdit2 aria-hidden /> {t.edit}
                            </button>
                            <button
                              className="ghost"
                              type="button"
                              onClick={() =>
                                setDeleteModal({
                                  title: t.remove,
                                  description: t.deleteMessageConfirm,
                                  confirmLabel: t.remove,
                                  onConfirm: () => handleDeleteMessage(message._id),
                                })
                              }
                            >
                              <FiTrash2 aria-hidden /> {t.remove}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="chat-composer">
            {replyTo && (
              <div className="chat-composer__reply">
                <span>{replyTo.sender?.username || replyTo.sender?.phone}</span>
                <strong>{replyTo.text || replyTo.taskId}</strong>
                <button className="ghost" type="button" onClick={() => setReplyTo(null)}>
                  <FiTrash2 aria-hidden />
                </button>
              </div>
            )}
            <div className="chat-composer__row">
              <input
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder={t.messagePlaceholder}
              />
              <button
                className="icon-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label={t.attachFile}
              >
                <FiPaperclip aria-hidden />
              </button>
              <button className="primary" type="button" onClick={handleSendMessage}>
                <FiSend aria-hidden /> {t.send}
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleSendFile(file);
                }
                event.target.value = "";
              }}
            />
            {sendError && <p className="chat-error">{sendError}</p>}
          </div>
        </div>
      </main>

      <aside className="chat-shell__info">
        <div className="panel">
          <div className="panel__header">
            <h2>{t.members}</h2>
            <span className="counts">
              {onlineCount}/{members.length}
            </span>
          </div>

          <div className="team-filters">
            <span className="eyebrow">{t.filters}</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.search}
            />
            <div className="team-filters__row">
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="">{t.all}</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">{t.all}</option>
                <option value="active">{t.active}</option>
                <option value="disabled">{t.disabled}</option>
              </select>
            </div>
          </div>

          <form className="team-form" onSubmit={handleAddMember}>
            <input
              value={memberPhone}
              onChange={(event) => setMemberPhone(event.target.value)}
              placeholder={t.phone}
              maxLength={11}
            />
            <input
              value={memberNickname}
              onChange={(event) => setMemberNickname(event.target.value)}
              placeholder={t.nickname}
            />
            <select value={memberRole} onChange={(event) => setMemberRole(event.target.value)}>
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button className="primary" type="submit">
              <FiPlus aria-hidden /> {t.addMember}
            </button>
          </form>

          <div className="team-members">
            {filteredMembers.map((member) => {
              const memberId = member.user._id;
              const isOnline = onlineMap[memberId];
              const statusClass =
                member.status === "disabled"
                  ? "status-dot status-dot--disabled"
                  : isOnline
                  ? "status-dot status-dot--online"
                  : "status-dot status-dot--offline";
              return (
                <div key={memberId} className="member-row">
                  <div className="member-row__info">
                    <span className={statusClass} />
                    <div>
                      <strong>{member.nickname || member.user.username}</strong>
                      <span className="light small">{member.user.phone}</span>
                    </div>
                    <span className="badge">{member.role}</span>
                  </div>
                  <div className="member-actions">
                    <button
                      className="ghost"
                      type="button"
                      onClick={() =>
                        handleUpdateMember(memberId, {
                          role: member.role === "member" ? "developer" : "member",
                        })
                      }
                    >
                      {member.role === "member" ? t.promote : t.demote}
                    </button>
                    <button
                      className="ghost"
                      type="button"
                      onClick={() =>
                        handleUpdateMember(memberId, {
                          status: member.status === "disabled" ? "active" : "disabled",
                        })
                      }
                    >
                      {member.status === "disabled" ? t.enable : t.disable}
                    </button>
                    <button
                      className="ghost"
                      type="button"
                      onClick={() =>
                        setDeleteModal({
                          title: t.remove,
                          description: t.deleteMemberConfirm.replace(
                            "{name}",
                            member.nickname || member.user.username || member.user.phone
                          ),
                          confirmLabel: t.remove,
                          onConfirm: () => handleRemoveMember(memberId),
                        })
                      }
                    >
                      {t.remove}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="panel compact">
          <div className="panel__header">
            <h2>{t.audit}</h2>
          </div>
          <div className="audit-list">
            {auditLogs.length === 0 && <p className="empty">{t.noAudit}</p>}
            {auditLogs.map((log) => (
              <div key={log._id} className="audit-row">
                <div>
                  <strong>{log.action}</strong>
                  <p className="light small">
                    {log.actor?.username || log.actor?.phone} ·{" "}
                    {new Date(log.createdAt).toLocaleString(locale)}
                  </p>
                </div>
                <span className="pill">{log.targetType}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <DeleteModal
        open={Boolean(deleteModal)}
        title={deleteModal?.title ?? ""}
        description={deleteModal?.description}
        confirmLabel={deleteModal?.confirmLabel ?? t.remove}
        cancelLabel={t.cancel}
        busy={deleteModalBusy}
        onConfirm={confirmDeleteModal}
        onCancel={closeDeleteModal}
      />
    </div>
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("file read error"));
    reader.readAsDataURL(file);
  });
}

function initials(value?: string) {
  if (!value) return "؟";
  const trimmed = value.trim();
  if (!trimmed) return "؟";
  const parts = trimmed.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
