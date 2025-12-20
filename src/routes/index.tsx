import { createBrowserRouter, Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import App from "../App";
import PlannerPage from "../pages/Planner";
import DashboardPage from "../pages/Dashboard";
import ReportsPage from "../pages/Reports";
import ShortGoalsPage from "../pages/ShortGoals";
import LongGoalsPage from "../pages/LongGoals";
import AddGoalPage from "../pages/AddGoal";
import ProfilePage from "../pages/Profile";
import PrioritiesPage from "../pages/Priorities";
import ProjectsPage from "../pages/Projects";
import LoginPage from "../pages/Login";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function IndexRedirect() {
  const { user } = useAuth();
  return user ? (
    <Navigate to="/planner" replace />
  ) : (
    <Navigate to="/login" replace />
  );
}

function LoginRoute() {
  const { setUser } = useAuth();
  return <LoginPage setUser={setUser} />;
}

const routes = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <IndexRedirect /> },
      { path: "login", element: <LoginRoute /> },
      {
        path: "planner",
        element: (
          <ProtectedRoute>
            <PlannerPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "priorities",
        element: (
          <ProtectedRoute>
            <PrioritiesPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "projects",
        element: (
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "short-goals",
        element: (
          <ProtectedRoute>
            <ShortGoalsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "long-goals",
        element: (
          <ProtectedRoute>
            <LongGoalsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "goals/new",
        element: (
          <ProtectedRoute>
            <AddGoalPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "dashboard",
        element: (
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "reports",
        element: (
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "profile",
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

export default routes;
