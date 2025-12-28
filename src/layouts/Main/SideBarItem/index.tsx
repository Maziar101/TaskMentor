import { NavLink } from "react-router-dom";
import type { IconType } from "react-icons";

type SideBarItemProps = {
  to: string;
  label: string;
  icon: IconType;
};

export default function SideBarItem({ to, label, icon: Icon }: SideBarItemProps) {
  return (
    <NavLink to={to} className={({ isActive }) => navClass(isActive)}>
      <span className="nav-link__icon" aria-hidden>
        <Icon />
      </span>
      <span className="nav-link__label">{label}</span>
    </NavLink>
  );
}

function navClass(isActive: boolean) {
  return isActive ? "nav-link nav-link--active" : "nav-link";
}
