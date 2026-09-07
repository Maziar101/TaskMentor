import { useEffect, useState, useTransition } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiCamera, FiLogOut, FiMoon, FiSave } from "react-icons/fi";
import Loading from "../../components/Loading";
import { profileApi, reportsApi } from "../../services/api";
import { HotToast } from "../../utils/HotToast";
import {
  logout,
  setAccentTheme,
  setUser,
  toggleTheme,
} from "../../store/authSlice";
import { ACCENT_THEMES } from "../../utils/accentThemes";

export default function ProfilePage() {
  const dispatch = useDispatch();
  const { accentTheme, user, themeMode } = useSelector((state) => state.auth);
  const [name, setName] = useState(user?.username || "");
  const [reports, setReports] = useState(null);
  const [isPending, startPending] = useTransition();

  useEffect(() => {
    startPending(async () => {
      try {
        const [profileResponse, reportsResponse] = await Promise.all([
          profileApi.get(),
          reportsApi.get(),
        ]);
        dispatch(setUser(profileResponse.data));
        setName(profileResponse.data.username || "");
        setReports(reportsResponse.data);
      } catch (err) {
        HotToast("error", err.message);
      }
    });
  }, [dispatch]);

  const saveProfile = (event) => {
    event.preventDefault();
    startPending(async () => {
      try {
        const response = await profileApi.update({ username: name });
        dispatch(setUser(response.data));
        HotToast("success", "پروفایل ذخیره شد");
      } catch (err) {
        HotToast("error", err.message);
      }
    });
  };

  if (isPending && !user) return <Loading />;

  const displayName = user?.username?.trim() || "مازیار";
  const email = user?.email || "ایمیل هنوز ثبت نشده";
  const initials = displayName.slice(0, 2);
  const completedTasks =
    reports?.chart?.reduce((total, day) => total + (Number(day.done) || 0), 0) ??
    0;
  const inProgress = reports?.summary?.remainingTasks ?? 0;
  const streak = reports?.streak ?? 0;
  const isDark = themeMode === "dark";

  return (
    <div className="profile" dir="rtl">
      <section className="profile-hero">
        <div className="profile-hero__top">
          <div className="profile-hero__identity">
            <div className="profile-avatar" aria-label={displayName}>
              <span>{initials}</span>
              <button
                className="profile-avatar__camera"
                type="button"
                aria-label="تغییر تصویر پروفایل"
              >
                <FiCamera aria-hidden />
              </button>
            </div>
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
        <form className="profile-panel profile-panel--info" onSubmit={saveProfile}>
          <div className="profile-panel__head">
            <h2>اطلاعات کاربر</h2>
            <p>نام نمایشی و ایمیل خود را ویرایش کنید.</p>
          </div>
          <label className="profile-field">
            <span>نام</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="profile-field">
            <span>ایمیل</span>
            <input type="email" value={user?.email || ""} disabled />
          </label>
          <button className="profile-save" type="submit" disabled={isPending}>
            <FiSave aria-hidden />
            ذخیره تغییرات
          </button>
        </form>

        <section className="profile-panel profile-panel--appearance">
          <div className="profile-panel__head">
            <h2>ظاهر</h2>
            <p>حالت نمایش برنامه را انتخاب کنید.</p>
          </div>
          <div className="profile-theme-control">
            <label className="profile-switch">
              <input
                type="checkbox"
                checked={isDark}
                onChange={() => dispatch(toggleTheme())}
              />
              <span aria-hidden />
            </label>
            <div>
              <strong>{isDark ? "تم تیره" : "تم روشن"}</strong>
              <small>{isDark ? "فعال" : "فعال"}</small>
            </div>
            <div className="profile-theme-icon" aria-hidden>
              <FiMoon />
            </div>
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
    </div>
  );
}
