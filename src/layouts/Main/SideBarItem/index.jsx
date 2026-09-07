import { NavLink } from "react-router-dom";
export default function SideBarItem({ to, label, icon: Icon }) {
    return (<NavLink to={to} className={({ isActive }) => navClass(isActive)}>
      <span className="nav-link__icon" aria-hidden>
        <Icon />
      </span>
      <span className="nav-link__label">{label}</span>
    </NavLink>);
}
function navClass(isActive) {
    return isActive ? "nav-link nav-link--active" : "nav-link";
}
