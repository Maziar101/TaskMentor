import { Navigate, createBrowserRouter } from "react-router-dom";
import AdminLayout from "../layouts/AdminLayout";
import DashboardPage from "../pages/DashboardPage";
import UsersPage from "../pages/UsersPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "users", element: <UsersPage /> },
    ],
  },
]);

export default router;