import { FiLogOut, FiMenu, FiUser } from "react-icons/fi";
import { useAuth } from "../../../store/authStore";
import SideBarItem from "../SideBarItem";
import { menuItems } from "./menuConfig";

type SideBarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export default function SideBar({ collapsed, onToggle }: SideBarProps) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={["sidebar", collapsed && "sidebar--collapsed"]
        .filter(Boolean)
        .join(" ")}
      dir="rtl"
    >
      <div className="sidebar__brand profile-card">
        <div className="profile-card__avatar" aria-hidden>
          <FiUser />
        </div>
        <div className="profile-card__meta">
          <strong className="profile-card__name">مازیار</strong>
          <span className="profile-card__role">کاربر</span>
        </div>
        {user && !collapsed && (
          <button
            className="profile-card__logout"
            type="button"
            aria-label="خروج"
            onClick={logout}
            title="خروج"
          >
            <FiLogOut />
          </button>
        )}
      </div>
      <nav className="sidebar__nav">
        {menuItems.map((item) => (
          <SideBarItem key={item.to} {...item} />
        ))}
        <button type="button" className="nav-link nav-toggle" onClick={onToggle}>
          <span className="nav-link__icon" aria-hidden>
            <FiMenu />
          </span>
          <span className="nav-link__label">
            {collapsed ? "باز کردن منو" : "بستن منو"}
          </span>
        </button>
      </nav>
    </aside>
  );
}
