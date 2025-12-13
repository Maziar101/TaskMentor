import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { useState } from "react";
import {
  FiCalendar,
  FiTarget,
  FiFlag,
  FiPlusCircle,
  FiGrid,
  FiBarChart2,
  FiUser,
  FiMenu,
} from "react-icons/fi";
import PlannerPage from "./pages/Planner";
import DashboardPage from "./pages/Dashboard";
import ReportsPage from "./pages/Reports";
import ShortGoalsPage from "./pages/ShortGoals";
import LongGoalsPage from "./pages/LongGoals";
import AddGoalPage from "./pages/AddGoal";
import ProfilePage from "./pages/Profile";
import "./App.css";

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div
      className={["shell", sidebarCollapsed && "shell--collapsed"]
        .filter(Boolean)
        .join(" ")}
    >
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
        </div>
        <nav className="sidebar__nav">
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
            to="/dashboard"
            className={({ isActive }) => navClass(isActive)}
          >
            <span className="nav-link__icon" aria-hidden>
              <FiGrid />
            </span>
            <span className="nav-link__label">داشبورد</span>
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

      <main className="route-area">
        <Routes>
          <Route path="/" element={<Navigate to="/planner" replace />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/short-goals" element={<ShortGoalsPage />} />
          <Route path="/long-goals" element={<LongGoalsPage />} />
          <Route path="/goals/new" element={<AddGoalPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </div>
  );
}

function navClass(isActive: boolean) {
  return isActive ? "nav-link nav-link--active" : "nav-link";
}

export default App;
