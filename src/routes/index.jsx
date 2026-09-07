import { createBrowserRouter, Navigate } from "react-router-dom";
import MainLayout from "../layouts/Main";
import AuthLayout from "../layouts/Auth";
import PlannerPage from "../pages/Planner/index.jsx";
import DashboardPage from "../pages/Dashboard/index";
import ProfilePage from "../pages/Profile/index";
import LoginPage from "../pages/Login";
import NotFoundPage from "../pages/NotFound/index";
import ChatPage from "../pages/Chat/index.jsx";

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
            { path: "dashboard", element: <DashboardPage /> },
            { path: "chat", element: <ChatPage /> },
            { path: "profile", element: <ProfilePage /> },
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
