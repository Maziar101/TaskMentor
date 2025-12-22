import { createBrowserRouter, Navigate } from "react-router-dom";
import type { ReactElement } from "react";
import App from "../App/index";
import PlannerPage from "../pages/Planner/index";
import DashboardPage from "../pages/Dashboard/index";
import ReportsPage from "../pages/Reports/index";
import ShortGoalsPage from "../pages/ShortGoals/index";
import LongGoalsPage from "../pages/LongGoals/index";
import AddGoalPage from "../pages/AddGoal/index";
import ProfilePage from "../pages/Profile/index";
import PrioritiesPage from "../pages/Priorities/index";
import ProjectsPage from "../pages/Projects/index";
import ProjectDetailsPage from "../pages/ProjectDetails/index";
import TeamsPage from "../pages/Teams/index";
import LoginPage from "../pages/Login/index";
import { useAuth } from "../context/AuthContext/index";

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
        path: "projects/:projectId",
        element: (
          <ProtectedRoute>
            <ProjectDetailsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "teams",
        element: (
          <ProtectedRoute>
            <TeamsPage />
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
