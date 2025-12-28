import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../store/authStore";

export default function AuthLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  if (!user && !isLoginPage) {
    return <Navigate to="/login" replace />;
  }

  if (user && isLoginPage) {
    return <Navigate to="/planner" replace />;
  }

  return <Outlet />;
}
