import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import PlannerPage from "./pages/Planner";
import DashboardPage from "./pages/Dashboard";
import ReportsPage from "./pages/Reports";
import ShortGoalsPage from "./pages/ShortGoals";
import LongGoalsPage from "./pages/LongGoals";
import "./App.css";

function App() {
  return (
    <div className="shell">
      <aside className="sidebar" dir="rtl">
        <div className="sidebar__brand">TaskMentor Suite</div>
        <nav className="sidebar__nav">
          <NavLink
            to="/planner"
            className={({ isActive }) => navClass(isActive)}
          >
            برنامه‌ریز
          </NavLink>
          <NavLink
            to="/short-goals"
            className={({ isActive }) => navClass(isActive)}
          >
            اهداف کوتاه‌مدت
          </NavLink>
          <NavLink
            to="/long-goals"
            className={({ isActive }) => navClass(isActive)}
          >
            اهداف بلندمدت
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => navClass(isActive)}
          >
            داشبورد
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) => navClass(isActive)}
          >
            گزارش‌ها
          </NavLink>
        </nav>
      </aside>

      <main className="route-area">
        <Routes>
          <Route path="/" element={<Navigate to="/planner" replace />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/short-goals" element={<ShortGoalsPage />} />
          <Route path="/long-goals" element={<LongGoalsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Routes>
      </main>
    </div>
  );
}

function navClass(isActive: boolean) {
  return isActive ? "nav-link nav-link--active" : "nav-link";
}

export default App;
