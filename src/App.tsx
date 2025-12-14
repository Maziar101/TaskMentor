import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import {
  FiCalendar,
  FiTarget,
  FiFlag,
  FiPlusCircle,
  FiGrid,
  FiBarChart2,
  FiUser,
  FiMenu,
  FiLogOut,
} from "react-icons/fi";
import PlannerPage from "./pages/Planner";
import DashboardPage from "./pages/Dashboard";
import ReportsPage from "./pages/Reports";
import ShortGoalsPage from "./pages/ShortGoals";
import LongGoalsPage from "./pages/LongGoals";
import AddGoalPage from "./pages/AddGoal";
import ProfilePage from "./pages/Profile";
import PrioritiesPage from "./pages/Priorities";
import LoginPage from "./pages/Login";
import "./App.css";

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState<null | { userId: string; username: string }>(
    () => {
      if (typeof window === "undefined") return null;
      const raw = localStorage.getItem("taskmentor-user");
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    }
  );

  const requireAuth = (element: ReactElement) =>
    user ? element : <Navigate to="/login" replace />;

  const handleLogout = () => {
    localStorage.removeItem("taskmentor-user");
    setUser(null);
  };

  useEffect(() => {
    let ignore = false;
    async function verifyUser() {
      if (!user) return;
      try {
        const res = await fetch(`/api/users/${user.userId}`);
        if (!res.ok) {
          throw new Error("user not valid");
        }
      } catch {
        localStorage.removeItem("taskmentor-user");
        if (!ignore) setUser(null);
      }
    }
    verifyUser();
    return () => {
      ignore = true;
    };
  }, [user]);

  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

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
                onClick={handleLogout}
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

      <main className="route-area">
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Navigate to="/planner" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/planner" element={requireAuth(<PlannerPage />)} />
          <Route path="/priorities" element={requireAuth(<PrioritiesPage />)} />
          <Route
            path="/short-goals"
            element={requireAuth(<ShortGoalsPage />)}
          />
          <Route path="/long-goals" element={requireAuth(<LongGoalsPage />)} />
          <Route path="/goals/new" element={requireAuth(<AddGoalPage />)} />
          <Route path="/dashboard" element={requireAuth(<DashboardPage />)} />
          <Route path="/reports" element={requireAuth(<ReportsPage />)} />
          <Route path="/profile" element={requireAuth(<ProfilePage />)} />
        </Routes>
      </main>
    </div>
  );
}

function navClass(isActive: boolean) {
  return isActive ? "nav-link nav-link--active" : "nav-link";
}

export default App;
