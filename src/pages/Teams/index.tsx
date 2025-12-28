import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { FiPlus } from "react-icons/fi";
import { useAuth } from "../../store/authStore";

type TeamMember = {
  user: string;
  role?: string;
  nickname?: string;
  status?: "active" | "disabled";
  joinedAt?: string;
};

type Team = {
  _id: string;
  name: string;
  owner: string;
  members?: TeamMember[];
};

type TeamInvite = {
  _id: string;
  type: "team_invite";
  title: string;
  body?: string;
  data?: { teamId?: string; teamName?: string; role?: string; nickname?: string };
  read?: boolean;
  createdAt: string;
};

const STRINGS = {
  fa: {
    eyebrow: "تیم‌ها",
    title: "تیم‌ها",
    createTeam: "ایجاد تیم جدید",
    teamName: "نام تیم",
    teamNamePlaceholder: "مثلا: تیم محصول",
    submitTeam: "ساخت تیم",
    cancel: "انصراف",
    filterPlaceholder: "فیلتر عنوان تیم...",
    teamCount: "تیم",
    memberCount: "عضو",
    owner: "مالک",
    member: "عضو",
    openTeam: "ورود به تیم",
    invites: "دعوت‌ها",
    noInvites: "دعوتی ندارید.",
    acceptInvite: "پذیرفتن دعوت",
    dismiss: "بعدا",
    inviteError: "دریافت دعوت‌ها ناموفق بود.",
    loadingInvites: "در حال دریافت دعوت‌ها...",
    emptyTeams: "هنوز تیمی ساخته نشده است.",
    locale: "EN",
  },
  en: {
    eyebrow: "Teams",
    title: "Teams",
    createTeam: "Create new team",
    teamName: "Team name",
    teamNamePlaceholder: "e.g. Product squad",
    submitTeam: "Create team",
    cancel: "Cancel",
    filterPlaceholder: "Filter teams...",
    teamCount: "teams",
    memberCount: "members",
    owner: "Owner",
    member: "Member",
    openTeam: "Open team",
    invites: "Invites",
    noInvites: "No invites yet.",
    acceptInvite: "Accept invite",
    dismiss: "Dismiss",
    inviteError: "Failed to load invites.",
    loadingInvites: "Loading invites...",
    emptyTeams: "No teams yet.",
    locale: "FA",
  },
};

export default function TeamsBoardPage() {
  const { user } = useAuth();
  const [locale, setLocale] = useState<"fa" | "en">(() => {
    if (typeof window === "undefined") return "fa";
    return (localStorage.getItem("taskmentor-locale") as "fa" | "en") || "fa";
  });
  const t = STRINGS[locale];
  const [teams, setTeams] = useState<Team[]>([]);
  const [filter, setFilter] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamInvites, setTeamInvites] = useState<TeamInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);
  const [invitesError, setInvitesError] = useState(false);
  const [acceptingInviteId, setAcceptingInviteId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.userId) return;
    fetchTeams();
  }, [user?.userId]);

  useEffect(() => {
    if (!user?.userId) return;
    fetchInvites();
  }, [user?.userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("taskmentor-locale", locale);
  }, [locale]);

  const totals = useMemo(() => {
    const totalTeams = teams.length;
    const totalMembers = teams.reduce((acc, team) => acc + (team.members?.length ?? 0), 0);
    return { totalTeams, totalMembers };
  }, [teams]);

  const filteredTeams = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return teams;
    return teams.filter((team) => team.name.toLowerCase().includes(query));
  }, [filter, teams]);

  const handleCreateTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user?.userId) return;
    const trimmed = teamName.trim();
    if (!trimmed) return;
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, userId: user.userId }),
    });
    if (!res.ok) return;
    setTeamName("");
    setCreateOpen(false);
    await fetchTeams();
  };

  const handleAcceptInvite = async (invite: TeamInvite) => {
    if (!user?.userId) return;
    const teamId = invite.data?.teamId;
    if (!teamId) return;
    setAcceptingInviteId(invite._id);
    try {
      const res = await fetch(`/api/teams/${teamId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId }),
      });
      if (res.ok) {
        await markNotificationRead(invite._id);
        await fetchTeams();
        await fetchInvites();
      }
    } finally {
      setAcceptingInviteId(null);
    }
  };

  const handleDismissInvite = async (inviteId: string) => {
    if (!user?.userId) return;
    await markNotificationRead(inviteId);
    setTeamInvites((prev) => prev.filter((item) => item._id !== inviteId));
  };

  const openCreate = () => setCreateOpen(true);

  const closeCreate = () => setCreateOpen(false);

  async function fetchTeams() {
    if (!user?.userId) return;
    const res = await fetch(`/api/teams?userId=${user.userId}`);
    if (!res.ok) return;
    const data = (await res.json()) as Team[];
    setTeams(data);
  }

  async function fetchInvites() {
    if (!user?.userId) return;
    setInvitesLoading(true);
    setInvitesError(false);
    try {
      const res = await fetch(`/api/notifications?userId=${user.userId}`);
      if (!res.ok) {
        setInvitesError(true);
        return;
      }
      const data = (await res.json()) as TeamInvite[];
      const invites = Array.isArray(data)
        ? data.filter((item) => item.type === "team_invite")
        : [];
      setTeamInvites(invites);
    } catch {
      setInvitesError(true);
    } finally {
      setInvitesLoading(false);
    }
  }

  async function markNotificationRead(notificationId: string) {
    if (!user?.userId) return;
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId }),
    });
  }

  return (
    <div className="projects-board" dir={locale === "fa" ? "rtl" : "ltr"}>
      <header className="projects-board__header">
        <div>
          <p className="projects-board__eyebrow">{t.eyebrow}</p>
          <h1>{t.title}</h1>
        </div>
        <div className="projects-board__actions">
          <button className="projects-board__create" type="button" onClick={openCreate}>
            <FiPlus aria-hidden /> {t.createTeam}
          </button>
          <button
            className="ghost"
            type="button"
            onClick={() => setLocale((prev) => (prev === "fa" ? "en" : "fa"))}
          >
            {t.locale}
          </button>
        </div>
      </header>

      <div className="projects-board__toolbar">
        <label className="projects-board__search">
          <input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder={t.filterPlaceholder}
          />
        </label>
        <div className="projects-board__stats">
          <span>
            {totals.totalTeams} {t.teamCount}
          </span>
          <span>
            {totals.totalMembers} {t.memberCount}
          </span>
        </div>
      </div>

      {(invitesLoading || invitesError || teamInvites.length > 0) && (
        <section className="panel">
          <div className="panel__header">
            <h2>{t.invites}</h2>
            {teamInvites.length > 0 && (
              <span className="badge badge--pill">{teamInvites.length}</span>
            )}
          </div>
          {invitesLoading && <p className="light small">{t.loadingInvites}</p>}
          {invitesError && <p className="error">{t.inviteError}</p>}
          {!invitesLoading && !invitesError && teamInvites.length === 0 && (
            <p className="empty">{t.noInvites}</p>
          )}
          {teamInvites.length > 0 && (
            <div className="notifications">
              {teamInvites.map((invite) => (
                <div
                  key={invite._id}
                  className={
                    invite.read ? "notification-card notification-card--read" : "notification-card"
                  }
                >
                  <div className="notification-card__head">
                    <strong>{invite.data?.teamName || invite.title}</strong>
                    <span className="light small">
                      {new Date(invite.createdAt).toLocaleDateString(locale)}
                    </span>
                  </div>
                  {invite.body && <p className="light small">{invite.body}</p>}
                  {invite.data?.role && <span className="pill">{invite.data.role}</span>}
                  <div className="notification-card__actions">
                    <button
                      className="primary"
                      type="button"
                      onClick={() => handleAcceptInvite(invite)}
                      disabled={acceptingInviteId === invite._id}
                    >
                      {t.acceptInvite}
                    </button>
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => handleDismissInvite(invite._id)}
                    >
                      {t.dismiss}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {teams.length === 0 && <p className="empty">{t.emptyTeams}</p>}

      <section className="projects-board__grid">
        {filteredTeams.map((team) => {
          const membersCount = team.members?.length ?? 0;
          const isOwner = team.owner === user?.userId;
          return (
            <article key={team._id} className="project-tile">
              <div className="project-tile__header">
                <div className="project-tile__avatar" style={{ background: colorSeed(team.name) }}>
                  {initials(team.name)}
                </div>
                <div>
                  <h3>{team.name}</h3>
                  <p className="project-tile__subtitle">{isOwner ? t.owner : t.member}</p>
                </div>
              </div>
              <div className="project-tile__meta">
                <span className="pill">
                  {membersCount} {t.memberCount}
                </span>
                <span className="pill pill--solid">{isOwner ? t.owner : t.member}</span>
              </div>
              <div className="project-tile__actions">
                <Link className="project-tile__toggle" to={`/teams/${team._id}`}>
                  {t.openTeam}
                </Link>
              </div>
            </article>
          );
        })}

        <article className="project-tile project-tile--new">
          <button className="project-tile__new-trigger" type="button" onClick={openCreate}>
            <span className="project-tile__new-icon">+</span>
            <span>{t.createTeam}</span>
          </button>
          {createOpen && (
            <form className="project-form" onSubmit={handleCreateTeam}>
              <label>
                <span>{t.teamName}</span>
                <input
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder={t.teamNamePlaceholder}
                />
              </label>
              <div className="project-form__actions">
                <button className="ghost" type="button" onClick={closeCreate}>
                  {t.cancel}
                </button>
                <button className="primary" type="submit">
                  {t.submitTeam}
                </button>
              </div>
            </form>
          )}
        </article>
      </section>
    </div>
  );
}

function initials(value?: string) {
  if (!value) return "؟";
  const trimmed = value.trim();
  if (!trimmed) return "؟";
  const parts = trimmed.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function colorSeed(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 65% 75%)`;
}
