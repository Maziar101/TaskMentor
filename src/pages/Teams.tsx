import { useEffect, useMemo, useState } from "react";
import { FiUsers, FiBell, FiCheck, FiSend } from "react-icons/fi";
import Calender from "../components/Calender";

type Member = {
  user: string;
  role?: string;
  nickname?: string;
};

type Team = {
  _id: string;
  name: string;
  owner: string;
  members: Member[];
};

type TeamTask = {
  _id: string;
  team: string;
  assignedTo: string;
  title: string;
  priority?: string;
  status: "open" | "done";
  dueDate?: string;
  createdAt?: string;
};

type NotificationItem = {
  _id: string;
  type: "team_invite" | "team_task";
  title: string;
  body?: string;
  data?: any;
  read: boolean;
};

export default function TeamsPage() {
  const storedUser =
    typeof window !== "undefined"
      ? localStorage.getItem("taskmentor-user")
      : null;
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const userId: string | null = parsedUser?.userId ?? null;

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState("");
  const [inviteNick, setInviteNick] = useState("");
  const [assignTitle, setAssignTitle] = useState("");
  const [assignPriority, setAssignPriority] = useState("");
  const [assignDue, setAssignDue] = useState<string | null>(null);
  const [assignMember, setAssignMember] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [myTeamTasks, setMyTeamTasks] = useState<TeamTask[]>([]);
  const [teamTasks, setTeamTasks] = useState<TeamTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedTeam = useMemo(
    () => teams.find((t) => t._id === selectedTeamId) ?? teams[0],
    [selectedTeamId, teams]
  );
  const isOwner = selectedTeam ? selectedTeam.owner === userId : false;

  useEffect(() => {
    if (!userId) return;
    loadTeams();
    loadNotifications();
    loadMyTeamTasks();
  }, [userId]);

  useEffect(() => {
    if (!selectedTeam || !userId) return;
    if (selectedTeam.owner === userId) {
      loadTeamTasks(selectedTeam._id);
    } else {
      setTeamTasks([]);
    }
  }, [selectedTeam?._id, selectedTeam?.owner, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadTeams() {
    try {
      const res = await fetch(`/api/teams?userId=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load teams");
      setTeams(data);
      if (!selectedTeamId && data.length > 0) {
        setSelectedTeamId(data[0]._id);
      }
    } catch (err) {
      console.error(err);
      setError("لود تیم‌ها ناموفق بود");
    }
  }

  async function loadNotifications() {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load notifications");
      setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadMyTeamTasks() {
    try {
      const res = await fetch(`/api/team-tasks?userId=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load tasks");
      setMyTeamTasks(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function loadTeamTasks(teamId: string) {
    try {
      const res = await fetch(`/api/team-tasks/team/${teamId}?userId=${userId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load team tasks");
      setTeamTasks(data);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateTeam() {
    if (!newTeamName.trim()) {
      setError("نام تیم را وارد کن");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName.trim(), userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "ساخت تیم ناموفق بود");
      setTeams((prev) => [data, ...prev]);
      setSelectedTeamId(data._id);
      setNewTeamName("");
      setMessage("تیم ساخته شد");
    } catch (err: any) {
      setError(err.message || "ساخت تیم ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite() {
    if (!selectedTeam) return;
    if (!invitePhone.trim()) {
      setError("شماره را وارد کن");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/teams/${selectedTeam._id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          phone: invitePhone.trim(),
          role: inviteRole.trim(),
          nickname: inviteNick.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "ارسال دعوت‌نامه ناموفق بود");
      setInvitePhone("");
      setInviteNick("");
      setInviteRole("");
      setMessage("دعوت‌نامه ارسال شد");
      await loadTeams();
      await loadNotifications();
    } catch (err: any) {
      setError(err.message || "ارسال دعوت‌نامه ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign() {
    if (!selectedTeam) return;
    if (!assignMember || !assignTitle.trim()) {
      setError("عضو و عنوان را وارد کن");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/team-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          teamId: selectedTeam._id,
          assigneeId: assignMember,
          title: assignTitle.trim(),
          priority: assignPriority || undefined,
          dueDate: assignDue || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "تسک ثبت نشد");
      setAssignTitle("");
      setAssignMember("");
      setAssignPriority("");
      setAssignDue(null);
      setMessage("تسک برای عضو ثبت شد");
      await Promise.all([loadTeamTasks(selectedTeam._id), loadMyTeamTasks(), loadNotifications()]);
    } catch (err: any) {
      setError(err.message || "تسک ثبت نشد");
    } finally {
      setLoading(false);
    }
  }

  async function acceptInvite(teamId: string, notificationId?: string) {
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "پیوستن ناموفق بود");
      setMessage("به تیم اضافه شدی");
      await loadTeams();
      await loadNotifications();
      if (notificationId) {
        await markNotificationRead(notificationId);
      }
    } catch (err: any) {
      setError(err.message || "پیوستن ناموفق بود");
    } finally {
      setLoading(false);
    }
  }

  async function markNotificationRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      await loadNotifications();
    } catch (err) {
      console.error(err);
    }
  }

  function memberLabel(member: Member) {
    if (member.nickname) return member.nickname;
    return member.role ? `${member.role}` : "عضو";
  }

  return (
    <div className="page teams" dir="rtl">
      <header className="page__header">
        <div>
          <h1>مدیریت تیم</h1>
          <p className="light">
            تیم بساز، اعضا را با شماره اضافه کن و برای هر نفر تسک بفرست.
          </p>
        </div>
        <div className="badge badge--pill">
          <FiUsers aria-hidden />
          <span>تیم‌ها</span>
        </div>
      </header>

      <div className="panel">
        <div className="panel__header">
          <h3>ساخت تیم جدید</h3>
          <span className="light small">هر کاربر می‌تواند مدیر تیم خودش باشد</span>
        </div>
        <div className="team-form">
          <input
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            placeholder="مثلا: تیم فرانت‌اند"
          />
          <button className="primary" onClick={handleCreateTeam} disabled={loading}>
            ایجاد تیم
          </button>
        </div>
      </div>

      <div className="panels-grid">
        <div className="panel">
          <div className="panel__header">
            <h3>تیم‌های من</h3>
          </div>
          <div className="team-list">
            {teams.length === 0 && <p className="empty">تیمی نداری</p>}
            {teams.map((team) => (
              <button
                key={team._id}
                className={[
                  "team-card",
                  selectedTeam?._id === team._id && "team-card--active",
                ]
                  .filter(Boolean)
                  .join(" ")}
                type="button"
                onClick={() => setSelectedTeamId(team._id)}
              >
                <div className="team-card__title">
                  <strong>{team.name}</strong>
                  {team.owner === userId ? (
                    <span className="pill pill--solid">مدیر</span>
                  ) : (
                    <span className="pill">عضو</span>
                  )}
                </div>
                <p className="light small">اعضا: {team.members?.length ?? 0}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel__header">
            <h3>اعضای تیم</h3>
            {selectedTeam && <span className="light small">{selectedTeam.name}</span>}
          </div>
          <div className="team-members">
            {!selectedTeam && <p className="empty">تیمی انتخاب نشده</p>}
            {selectedTeam &&
              (selectedTeam.members?.length ? (
                selectedTeam.members.map((member) => (
                  <div key={member.user} className="member-row">
                    <div>
                      <strong>{memberLabel(member)}</strong>
                      <p className="light small">#{member.user.slice(-6)}</p>
                    </div>
                    <span className="pill">{member.role || "عضو"}</span>
                  </div>
                ))
              ) : (
                <p className="empty">عضوی نداری</p>
              ))}
          </div>
        </div>
      </div>

      {selectedTeam && isOwner && (
        <div className="panels-grid">
          <div className="panel">
            <div className="panel__header">
              <h3>دعوت با شماره</h3>
              <span className="light small">دعوت می‌شود و نوتیف دریافت می‌کند</span>
            </div>
            <div className="team-form">
              <input
                value={invitePhone}
                onChange={(e) => setInvitePhone(e.target.value)}
                placeholder="شماره کاربر"
              />
              <input
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                placeholder="نقش (مثلا فرانت‌اند)"
              />
              <input
                value={inviteNick}
                onChange={(e) => setInviteNick(e.target.value)}
                placeholder="لقب اختیاری"
              />
              <button className="primary" onClick={handleInvite} disabled={loading}>
                ارسال دعوت‌نامه
              </button>
            </div>
          </div>

          <div className="panel">
            <div className="panel__header">
              <h3>تسک برای عضو</h3>
              <span className="light small">تسک مستقیم برای یک نفر</span>
            </div>
            <div className="team-form">
              <select
                value={assignMember}
                onChange={(e) => setAssignMember(e.target.value)}
              >
                <option value="">انتخاب عضو</option>
                {selectedTeam.members.map((member) => (
                  <option key={member.user} value={member.user}>
                    {memberLabel(member)}
                  </option>
                ))}
              </select>
              <input
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
                placeholder="عنوان تسک"
              />
              <input
                value={assignPriority}
                onChange={(e) => setAssignPriority(e.target.value)}
                placeholder="اولویت/تگ دلخواه"
              />
              <Calender value={assignDue ?? undefined} onChange={(val) => setAssignDue(val || null)} />
              <button className="primary" onClick={handleAssign} disabled={loading}>
                ارسال تسک
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="panels-grid">
        <div className="panel">
          <div className="panel__header">
            <h3>تسک‌های تیمی من</h3>
          </div>
          <div className="team-tasks">
            {myTeamTasks.length === 0 && <p className="empty">فعلا تسکی نداری</p>}
            {myTeamTasks.map((task) => (
              <div key={task._id} className="task task--team">
                <div className="task__title">{task.title}</div>
                <div className="task__meta">
                  <span className="pill">{task.priority || "بدون اولویت"}</span>
                  <span className="pill">{task.status === "done" ? "انجام شده" : "باز"}</span>
                  {task.dueDate && (
                    <span className="pill pill--solid">
                      موعد: {new Date(task.dueDate).toLocaleDateString("fa-IR")}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedTeam && isOwner && (
          <div className="panel">
            <div className="panel__header">
              <h3>تسک‌های این تیم</h3>
              <button
                className="ghost tiny"
                type="button"
                onClick={() => loadTeamTasks(selectedTeam._id)}
              >
                بروزرسانی
              </button>
            </div>
            <div className="team-tasks">
              {teamTasks.length === 0 && <p className="empty">تسکی ثبت نشده</p>}
              {teamTasks.map((task) => (
                <div key={task._id} className="task task--team">
                  <div className="task__title">{task.title}</div>
                  <div className="task__meta">
                    <span className="pill">{task.priority || "بدون اولویت"}</span>
                    <span className="pill">
                      تحویل: {new Date(task.createdAt ?? task.dueDate ?? Date.now()).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="panel">
          <div className="panel__header">
            <h3>نوتیفیکیشن‌ها</h3>
            <FiBell aria-hidden />
          </div>
          <div className="notifications">
            {notifications.length === 0 && <p className="empty">نوتیفی نداری</p>}
            {notifications.map((item) => (
              <div
                key={item._id}
                className={[
                  "notification-card",
                  item.read && "notification-card--read",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div className="notification-card__head">
                  <strong>{item.title}</strong>
                  {!item.read && (
                    <span className="badge badge--new">
                      <FiBell aria-hidden />
                      جدید
                    </span>
                  )}
                </div>
                <p className="light small">{item.body}</p>
                {item.type === "team_invite" && item.data?.teamId && (
                  <div className="notification-card__actions">
                    <button
                      className="primary tiny"
                      type="button"
                      onClick={() => acceptInvite(item.data.teamId, item._id)}
                    >
                      <FiCheck aria-hidden /> پیوستن
                    </button>
                    <button
                      className="ghost tiny"
                      type="button"
                      onClick={() => markNotificationRead(item._id)}
                    >
                      <FiSend aria-hidden /> بستن
                    </button>
                  </div>
                )}
                {item.type === "team_task" && (
                  <div className="notification-card__actions">
                    <button
                      className="ghost tiny"
                      type="button"
                      onClick={() => markNotificationRead(item._id)}
                    >
                      دیدم
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {(message || error) && (
        <div className="toast" role="status">
          <div className="toast__content">
            <span>{error || message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
