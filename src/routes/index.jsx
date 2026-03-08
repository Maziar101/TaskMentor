import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layouts/Main";
import AuthLayout from "../layouts/Auth";
import PlannerPage from "../pages/Planner/index";
import DashboardPage from "../pages/Dashboard/index";
import ReportsPage from "../pages/Reports/index";
import ShortGoalsPage from "../pages/ShortGoals/index";
import LongGoalsPage from "../pages/LongGoals/index";
import AddGoalPage from "../pages/AddGoal/index";
import ProfilePage from "../pages/Profile/index";
import ProjectsPage from "../pages/Projects/index";
import ProjectDetailsPage from "../pages/ProjectDetails/index";
import TeamsBoardPage from "../pages/Teams/index";
import TeamChatPage from "../pages/Teams/TeamChat";
import LoginPage from "../pages/Login";
import SettingsPage from "../pages/Settings/index";
import NotFoundPage from "../pages/NotFound/index";

const useRoutesConfig = () =>
  createBrowserRouter([
    {
      path: "/",
      element: <AuthLayout type="client" />,
      children: [
        { index: true, element: <Navigate to="/planner" replace /> },

        {
          element: <MainLayout />,
          children: [
            { path: "planner", element: <PlannerPage /> },
            { path: "projects", element: <ProjectsPage /> },
            { path: "projects/:projectId", element: <ProjectDetailsPage /> },
            { path: "teams", element: <TeamsBoardPage /> },
            { path: "teams/:teamId", element: <TeamChatPage /> },
            { path: "short-goals", element: <ShortGoalsPage /> },
            { path: "long-goals", element: <LongGoalsPage /> },
            { path: "goals/new", element: <AddGoalPage /> },
            { path: "dashboard", element: <DashboardPage /> },
            { path: "reports", element: <ReportsPage /> },
            { path: "profile", element: <ProfilePage /> },
            { path: "settings", element: <SettingsPage /> },
            { path: "*", element: <NotFoundPage /> },
          ],
        },
      ],
    },
    {
      path: "login",
      element: <AuthLayout type="login" />,
      children: [
        {
          index: true,
          element: <LoginPage />,
        },
      ],
    },
  ]);

export default useRoutesConfig;
