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
import PrioritiesPage from "../pages/Priorities/index";
import ProjectsPage from "../pages/Projects/index";
import ProjectDetailsPage from "../pages/ProjectDetails/index";
import TeamsPage from "../pages/Teams/index";
import LoginPage from "../pages/Login/index";

const useRoutesConfig = () =>
  createBrowserRouter([
    {
      path: "/",
      element: <AuthLayout />,
      children: [
        { index: true, element: <Navigate to="/planner" replace /> },
        { path: "login", element: <LoginPage /> },
        {
          element: <MainLayout />,
          children: [
            { path: "planner", element: <PlannerPage /> },
            { path: "priorities", element: <PrioritiesPage /> },
            { path: "projects", element: <ProjectsPage /> },
            { path: "projects/:projectId", element: <ProjectDetailsPage /> },
            { path: "teams", element: <TeamsPage /> },
            { path: "short-goals", element: <ShortGoalsPage /> },
            { path: "long-goals", element: <LongGoalsPage /> },
            { path: "goals/new", element: <AddGoalPage /> },
            { path: "dashboard", element: <DashboardPage /> },
            { path: "reports", element: <ReportsPage /> },
            { path: "profile", element: <ProfilePage /> },
          ],
        },
      ],
    },
  ]);

export default useRoutesConfig;
