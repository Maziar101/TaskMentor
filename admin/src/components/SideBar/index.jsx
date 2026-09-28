import { FiGlobe, FiMenu, FiX } from "react-icons/fi";
import { TbSettings } from "react-icons/tb";
import {
  Avatar,
  Box,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { MENU_CONFIG } from "./menuConfig";
import { getDirection, getLanguage, toggleLanguage, translate } from "../../i18n/runtime";
import { resolveAdminAssetUrl } from "../../auth/adminSession";

export default function SideBar({ user, collapsed = false, mobile = false, onClose, onToggle }) {
  const compact = collapsed && !mobile;
  const isRtl = getDirection() === "rtl";
  const tooltipPlacement = isRtl ? "left" : "right";
  const displayName = user?.username?.trim() || translate("بدون نام");
  const avatarUrl = resolveAdminAssetUrl(user?.avatarUrl);
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const settingsOpen = Boolean(settingsAnchor);

  function closeSettings() {
    setSettingsAnchor(null);
  }

  function handleLanguageChange() {
    closeSettings();
    toggleLanguage();
  }

  return (
    <Stack
      component="aside"
      sx={{
        minHeight: "100%",
        px: "14px",
        py: "18px",
        bgcolor: "#000000",
        backgroundImage: "linear-gradient(180deg, #0f0f0f 0%, #000000 100%)",
        color: "#ffffff",
        gap: "14px",
        overflowX: "hidden",
      }}
    >
      <Stack
        sx={{
          display: compact ? "none" : "grid",
          gridTemplateColumns: mobile ? "40px minmax(0, 1fr) auto" : "42px minmax(0, 1fr) auto",
          alignItems: "center",
          gap: "8px",
          p: "8px",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "14px",
          bgcolor: "rgba(255,255,255,0.06)",
        }}
      >
        <Avatar
          src={avatarUrl || undefined}
          alt=""
          sx={{
            width: mobile ? 40 : 42,
            height: mobile ? 40 : 42,
            borderRadius: "12px",
            color: "#000000",
            bgcolor: "#ffffff",
            fontSize: 18,
            fontWeight: 900,
            "& .MuiAvatar-img": { objectFit: "cover" },
          }}
        >
          {displayName.slice(0, 1)}
        </Avatar>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              overflow: "hidden",
              color: "#f7f2ff",
              fontSize: mobile ? 15 : 17,
              fontWeight: 800,
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayName}
          </Typography>
          <Typography sx={{ mt: "4px", color: "#ffffff", fontSize: "0.85rem" }}>
            {translate("پنل مدیریت")}
          </Typography>
        </Box>

        <Stack sx={{ flexDirection: "row", alignItems: "center", gap: mobile ? "4px" : 0 }}>
          <IconButton
            aria-label={translate("تنظیمات")}
            aria-controls={settingsOpen ? "admin-settings-menu" : undefined}
            aria-haspopup="menu"
            aria-expanded={settingsOpen ? "true" : undefined}
            onClick={(event) => setSettingsAnchor(event.currentTarget)}
            sx={{
              width: mobile ? 34 : 38,
              height: mobile ? 34 : 38,
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "12px",
              color: "#ffffff",
              bgcolor: "rgba(255,255,255,0.06)",
              "&:hover": {
                color: "#ffdede",
                bgcolor: "rgba(255,96,96,0.18)",
                borderColor: "rgba(255,96,96,0.4)",
              },
            }}
          >
            <TbSettings aria-hidden />
          </IconButton>
          {mobile && (
            <IconButton
              aria-label={translate("بستن منو")}
              onClick={onClose}
              sx={{
                width: 32,
                height: 32,
                color: "rgba(255,255,255,0.68)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.07)" },
              }}
            >
              <FiX />
            </IconButton>
          )}
        </Stack>
      </Stack>

      <Menu
        id="admin-settings-menu"
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
              border: "1px solid rgba(255,255,255,0.28)",
              borderRadius: "12px",
              bgcolor: "#0f0f0f",
              backgroundImage: "none",
              color: "#ffffff",
              boxShadow: "0 18px 44px rgba(0, 0, 0, 0.42)",
              backdropFilter: "blur(18px)",
            },
          },
          list: { sx: { p: 0.75 } },
        }}
      >
        <MenuItem
          onClick={handleLanguageChange}
          sx={{ minHeight: 44, borderRadius: "8px", gap: 1.25 }}
        >
          <ListItemIcon sx={{ minWidth: 0, color: "#ffffff", fontSize: 20 }}>
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
      </Menu>

      <Box component="nav" aria-label={translate("منوی مدیریت")} sx={{ flex: 1, minHeight: 0 }}>
        <List sx={{ height: "100%", p: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
          {MENU_CONFIG.map(({ label, to, icon: Icon }) => (
            <Tooltip key={to} title={compact ? label : ""} placement={tooltipPlacement} arrow>
              <ListItemButton
                component={NavLink}
                to={to}
                onClick={mobile ? onClose : undefined}
                sx={{
                  minHeight: 48,
                  flexGrow: 0,
                  flexShrink: 0,
                  px: compact ? 0 : "12px",
                  justifyContent: compact ? "center" : "flex-start",
                  gap: compact ? 0 : "10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  color: "#f1e9ff",
                  bgcolor: "rgba(255,255,255,0.04)",
                  transition: "background-color 160ms ease, color 160ms ease, border-color 160ms ease",
                  "&:hover": {
                    color: "#f8f2ff",
                    bgcolor: "rgba(255,255,255,0.12)",
                    borderColor: "rgba(255,255,255,0.62)",
                  },
                  "&.active": {
                    color: "#000000",
                    bgcolor: "#ffffff",
                    backgroundImage: "none",
                    borderColor: "transparent",
                    "&:hover": {
                      color: "#000000",
                      bgcolor: "#ffffff",
                      borderColor: "transparent",
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{ minWidth: 0, color: "inherit", justifyContent: "center", fontSize: 21 }}
                >
                  <Icon aria-hidden />
                </ListItemIcon>
                {!compact && (
                  <ListItemText
                    primary={label}
                    slotProps={{ primary: { sx: { fontSize: 14, fontWeight: 700 } } }}
                    sx={{ m: 0, flex: "0 0 auto" }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          ))}

          {!mobile && (
            <Tooltip
              title={translate(compact ? "باز کردن منو" : "بستن منو")}
              placement={tooltipPlacement}
              arrow
            >
              <ListItemButton
                onClick={onToggle}
                aria-label={translate(compact ? "باز کردن منو" : "بستن منو")}
                sx={{
                  minHeight: 48,
                  flexGrow: 0,
                  flexShrink: 0,
                  mt: "auto",
                  px: compact ? 0 : "12px",
                  justifyContent: compact ? "center" : "flex-start",
                  gap: compact ? 0 : "10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  color: "#f1e9ff",
                  bgcolor: "rgba(255,255,255,0.04)",
                  "&:hover": {
                    color: "#f8f2ff",
                    bgcolor: "rgba(255,255,255,0.12)",
                    borderColor: "rgba(255,255,255,0.62)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{ minWidth: 0, color: "inherit", justifyContent: "center", fontSize: 20 }}
                >
                  <FiMenu aria-hidden />
                </ListItemIcon>
                {!compact && (
                  <ListItemText
                    primary={translate("بستن منو")}
                    slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 700 } } }}
                    sx={{ m: 0, flex: "0 0 auto" }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          )}
        </List>
      </Box>
    </Stack>
  );
}
