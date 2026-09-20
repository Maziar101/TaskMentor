import { FiGlobe, FiLogOut, FiMenu, FiUser } from "react-icons/fi";
import { TbSettings } from "react-icons/tb";
import SideBarItem from "../SideBarItem";
import { menuItems } from "./menuConfig";
import Stack from "@mui/material/Stack";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../../store/authSlice";
import { getLanguage, toggleLanguage } from "../../../i18n/runtime";

export default function SideBar({ collapsed, onToggle }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const displayName = user?.username?.trim() || "بدون نام";
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const settingsOpen = Boolean(settingsAnchor);

  function closeSettings() {
    setSettingsAnchor(null);
  }

  function handleLanguageChange() {
    closeSettings();
    toggleLanguage();
  }

  function handleLogout() {
    closeSettings();
    dispatch(logout());
  }

  return (
    <Stack
      className={["sidebar", collapsed && "sidebar--collapsed"]
        .filter(Boolean)
        .join(" ")}
      sx={{ direction: "rtl", overflow: "auto" }}
    >
      <Stack
        sx={{ flexDirection: "row", display: collapsed ? "none" : "flex" }}
        className="sidebar__brand profile-card"
      >
        <div className="profile-card__avatar" aria-hidden>
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : <FiUser />}
        </div>
        <div className="profile-card__meta">
          <strong className="profile-card__name">{displayName}</strong>
          <span className="profile-card__role">کاربر</span>
        </div>
        {user && !collapsed && (
          <button
            className="profile-card__logout"
            type="button"
            aria-label="تنظیمات حساب"
            aria-controls={settingsOpen ? "account-settings-menu" : undefined}
            aria-haspopup="menu"
            aria-expanded={settingsOpen ? "true" : undefined}
            onClick={(event) => setSettingsAnchor(event.currentTarget)}
            title="تنظیمات"
          >
            <TbSettings />
          </button>
        )}
      </Stack>
      <Menu
        id="account-settings-menu"
        anchorEl={settingsAnchor}
        open={settingsOpen}
        onClose={closeSettings}
        anchorOrigin={{ vertical: "bottom", horizontal: "end" }}
        transformOrigin={{ vertical: "top", horizontal: "end" }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 190,
              border: "1px solid var(--tm-border)",
              borderRadius: 3,
              bgcolor: "var(--tm-surface-elevated-strong)",
              backgroundImage: "none",
              color: "var(--tm-text)",
              boxShadow: "0 18px 44px rgba(0, 0, 0, 0.42)",
              backdropFilter: "blur(18px)",
            },
          },
          list: { sx: { p: 0.75 } },
        }}
      >
        <MenuItem
          onClick={handleLanguageChange}
          sx={{ minHeight: 44, borderRadius: 2, gap: 1.25 }}
        >
          <ListItemIcon sx={{ minWidth: 0, color: "var(--tm-accent)", fontSize: 20 }}>
            <FiGlobe aria-hidden />
          </ListItemIcon>
          <ListItemText
            primary={
              getLanguage() === "fa"
                ? "تغییر زبان به: انگلیسی"
                : "Switch language to: فارسی"
            }
            slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 700 } } }}
            sx={{ m: 0 }}
          />
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{ minHeight: 44, borderRadius: 2, gap: 1.25, color: "#ff8da1" }}
        >
          <ListItemIcon sx={{ minWidth: 0, color: "inherit", fontSize: 19 }}>
            <FiLogOut aria-hidden />
          </ListItemIcon>
          <ListItemText
            primary="خروج"
            slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 700 } } }}
            sx={{ m: 0 }}
          />
        </MenuItem>
      </Menu>
      <nav className="sidebar__nav">
        {menuItems.map((item) => (
          <SideBarItem key={item.to} {...item} />
        ))}
        <button
          type="button"
          className="nav-link nav-toggle"
          onClick={onToggle}
        >
          <span className="nav-link__icon" aria-hidden>
            <FiMenu />
          </span>
          <span className="nav-link__label">
            {collapsed ? "باز کردن منو" : "بستن منو"}
          </span>
        </button>
      </nav>
    </Stack>
  );
}
