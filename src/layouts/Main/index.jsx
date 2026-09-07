import { Outlet } from "react-router-dom";
import { useState } from "react";
import SideBar from "./SideBar/index.jsx";
export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
        className="route-area"
      >
        <Outlet />
      </main>
    </div>
  );
}
