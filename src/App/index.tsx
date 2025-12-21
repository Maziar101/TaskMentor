import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  FiCalendar,
  FiTarget,
  FiFlag,
  FiPlusCircle,
  FiGrid,
  FiBarChart2,
  FiUser,
  FiBriefcase,
  FiMenu,
  FiLogOut,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext/index";
import "../App.css";

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const location = useLocation();
  const isLoginPage = location.pathname === "/login";
  const isProjectsPage = location.pathname.startsWith("/projects");

  return (
    <div
      className={[
        "shell",
        sidebarCollapsed && "shell--collapsed",
        isLoginPage && "shell--login",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {!isLoginPage && (
        <aside
          className={["sidebar", sidebarCollapsed && "sidebar--collapsed"]
            .filter(Boolean)
            .join(" ")}
          dir="rtl"
        >
          <div className="sidebar__brand profile-card">
            <div className="profile-card__avatar" aria-hidden>
              <FiUser />
            </div>
            <div className="profile-card__meta">
              <strong className="profile-card__name">مازیار</strong>
              <span className="profile-card__role">کاربر</span>
            </div>
            {user && !sidebarCollapsed && (
              <button
                className="profile-card__logout"
                type="button"
                aria-label="خروج"
                onClick={logout}
                title="خروج"
              >
                <FiLogOut />
              </button>
            )}
          </div>
          <nav className="sidebar__nav">
            <NavLink
              to="/dashboard"
              className={({ isActive }) => navClass(isActive)}
            >
              <span className="nav-link__icon" aria-hidden>
                <FiGrid />
              </span>
              <span className="nav-link__label">داشبورد</span>
            </NavLink>
            <NavLink
              to="/planner"
              className={({ isActive }) => navClass(isActive)}
            >
              <span className="nav-link__icon" aria-hidden>
                <FiCalendar />
              </span>
              <span className="nav-link__label">برنامه‌ریز</span>
            </NavLink>
            <NavLink
              to="/priorities"
              className={({ isActive }) => navClass(isActive)}
            >
              <span className="nav-link__icon" aria-hidden>
                <FiTarget />
              </span>
              <span className="nav-link__label">اولویت‌ها</span>
            </NavLink>
            <NavLink
              to="/projects"
              className={({ isActive }) => navClass(isActive)}
            >
              <span className="nav-link__icon" aria-hidden>
                <FiBriefcase />
              </span>
              <span className="nav-link__label">پروژه‌ها</span>
            </NavLink>
            <NavLink
              to="/short-goals"
              className={({ isActive }) => navClass(isActive)}
            >
              <span className="nav-link__icon" aria-hidden>
                <FiTarget />
              </span>
              <span className="nav-link__label">اهداف کوتاه‌مدت</span>
            </NavLink>
            <NavLink
              to="/long-goals"
              className={({ isActive }) => navClass(isActive)}
            >
              <span className="nav-link__icon" aria-hidden>
                <FiFlag />
              </span>
              <span className="nav-link__label">اهداف بلندمدت</span>
            </NavLink>
            <NavLink
              to="/goals/new"
              className={({ isActive }) => navClass(isActive)}
            >
              <span className="nav-link__icon" aria-hidden>
                <FiPlusCircle />
              </span>
              <span className="nav-link__label">افزودن هدف</span>
            </NavLink>

            <NavLink
              to="/reports"
              className={({ isActive }) => navClass(isActive)}
            >
              <span className="nav-link__icon" aria-hidden>
                <FiBarChart2 />
              </span>
              <span className="nav-link__label">گزارش‌ها</span>
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) => navClass(isActive)}
            >
              <span className="nav-link__icon" aria-hidden>
                <FiUser />
              </span>
              <span className="nav-link__label">پروفایل</span>
            </NavLink>
            <button
              type="button"
              className="nav-link nav-toggle"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
            >
              <span className="nav-link__icon" aria-hidden>
                <FiMenu />
              </span>
              <span className="nav-link__label">
                {sidebarCollapsed ? "باز کردن منو" : "بستن منو"}
              </span>
            </button>
          </nav>
        </aside>
      )}

      <main
        className={["route-area", isProjectsPage && "route-area--projects"]
          .filter(Boolean)
          .join(" ")}
      >
        <Outlet />
      </main>
    </div>
  );
}

function navClass(isActive: boolean) {
  return isActive ? "nav-link nav-link--active" : "nav-link";
}

export default App;
