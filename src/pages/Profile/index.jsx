import { useEffect, useState, useTransition } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiLogOut } from "react-icons/fi";
import Loading from "../../components/Loading";
import { profileApi, reportsApi } from "../../services/api";
import { HotToast } from "../../utils/HotToast";
import {
  logout,
  setAccentTheme,
  setUser,
} from "../../store/authSlice";
import { ACCENT_THEMES } from "../../utils/accentThemes";
import AvatarPickerModal from "./AvatarPickerModal";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { accentTheme, user } = useSelector((state) => state.auth);
  const [reports, setReports] = useState(null);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [isPending, startPending] = useTransition();

  useEffect(() => {
    startPending(async () => {
      try {
        const [profileResponse, reportsResponse] = await Promise.all([
          profileApi.get(),
          reportsApi.get(),
        ]);
        dispatch(setUser(profileResponse.data));
        setReports(reportsResponse.data);
      } catch (err) {
        HotToast("error", err.message);
      }
    });
  }, [dispatch]);

  if (isPending && !user) return <Loading />;

  const displayName = user?.username?.trim() || "مازیار";
  const email = user?.email || "ایمیل هنوز ثبت نشده";
  const initials = displayName.slice(0, 2);
  const completedTasks =
    reports?.chart?.reduce((total, day) => total + (Number(day.done) || 0), 0) ??
    0;
  const inProgress = reports?.summary?.remainingTasks ?? 0;
  const streak = reports?.streak ?? 0;

  return (
    <div className="profile" dir="rtl">
      <section className="profile-hero">
        <div className="profile-hero__top">
          <div className="profile-hero__identity">
            <button
              className="profile-avatar"
              type="button"
              aria-label="تغییر تصویر پروفایل"
              title="تغییر تصویر پروفایل"
              onClick={() => setAvatarPickerOpen(true)}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={`تصویر پروفایل ${displayName}`} />
              ) : (
                <span>{initials}</span>
              )}
            </button>
            <div className="profile-hero__copy">
              <div className="profile-hero__name-row">
                <h1>{displayName}</h1>
                <span className="profile-badge">کاربر</span>
              </div>
              <p>{email}</p>
            </div>
          </div>
          <button
            className="profile-logout"
            type="button"
            onClick={() => dispatch(logout())}
          >
            <FiLogOut aria-hidden />
            خروج
          </button>
        </div>

        <div className="profile-stats">
          <article className="profile-stat">
            <strong>{completedTasks}</strong>
            <span>تسک تکمیل‌شده</span>
          </article>
          <article className="profile-stat">
            <strong>{inProgress}</strong>
            <span>در حال انجام</span>
          </article>
          <article className="profile-stat">
            <strong>{streak} روز</strong>
            <span>روند فعالیت</span>
          </article>
        </div>
      </section>

      <section className="profile__grid">
        <section className="profile-panel profile-panel--appearance">
          <div className="profile-panel__head">
            <h2>ظاهر</h2>
            <p>رنگ تاکیدی برنامه را انتخاب کنید.</p>
          </div>
          <div className="profile-accent">
            <span>رنگ تاکیدی</span>
            <div className="profile-swatches" role="group" aria-label="انتخاب تم رنگی">
              {Object.entries(ACCENT_THEMES).map(([id, colorTheme]) => (
                <button
                  key={id}
                  className={[
                    "profile-swatch",
                    accentTheme === id && "profile-swatch--active",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  type="button"
                  aria-label={`تم ${colorTheme.label}`}
                  aria-pressed={accentTheme === id}
                  title={`تم ${colorTheme.label}`}
                  style={{ "--profile-swatch-color": colorTheme.swatch }}
                  onClick={() => dispatch(setAccentTheme(id))}
                />
              ))}
            </div>
          </div>
        </section>
      </section>
      <AvatarPickerModal
        open={avatarPickerOpen}
        currentAvatar={user?.avatarUrl || ""}
        displayName={displayName}
        onClose={() => setAvatarPickerOpen(false)}
        onSaved={(updatedUser) => {
          dispatch(setUser(updatedUser));
          setAvatarPickerOpen(false);
          HotToast("success", "تصویر پروفایل ذخیره شد");
        }}
      />
    </div>
  );
}
