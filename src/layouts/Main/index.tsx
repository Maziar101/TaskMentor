import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import SideBar from "./SideBar";

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  const isProjectsPage = location.pathname.startsWith("/projects");
  const isTeamsBoard = location.pathname === "/teams";
  const isEdgeToEdge = isProjectsPage || isTeamsBoard;

  return (
    <div
      className={["shell", sidebarCollapsed && "shell--collapsed"]
        .filter(Boolean)
        .join(" ")}
    >
      <SideBar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <main
        className={["route-area", isEdgeToEdge && "route-area--projects"]
          .filter(Boolean)
          .join(" ")}
      >
        <Outlet />
      </main>
    </div>
  );
}
