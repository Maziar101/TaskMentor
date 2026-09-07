import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

export default function AuthLayout({ type = "login" }) {
  const token = useSelector((state) => state.auth.token);
  if (type === "login") {
    return token ? <Navigate to="/planner" /> : <Outlet />;
  } else {
    return token ? <Outlet /> : <Navigate to="/login" />;
  }
}
