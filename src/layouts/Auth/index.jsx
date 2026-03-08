// import { Navigate, Outlet, useLocation } from "react-router-dom";
// import { useAuth } from "../../store/authStore";

// export default function AuthLayout() {
//   const { user } = useAuth();
//   const location = useLocation();
//   const isLoginPage = location.pathname === "/login";

//   if (!user && !isLoginPage) {
//     return <Navigate to="/login" replace />;
//   }

//   if (user && isLoginPage) {
//     return <Navigate to="/planner" replace />;
//   }

//   return <Outlet />;
// }

import React from "react";
import { useUserStore } from "../../store/userStore";
import { Navigate, Outlet } from "react-router-dom";

export default function AuthLayout({ type = "login" }) {
  const { token } = useUserStore();
  if (type === "login") {
    return token ? <Navigate to="/planner" /> : <Outlet />;
  } else {
    return token ? <Outlet /> : <Navigate to="/login" />;
  }
}
