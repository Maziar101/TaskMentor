import {
  FiGlobe,
  FiMenu,
  FiShield,
  FiX,
} from "react-icons/fi";
import { TbSettings } from "react-icons/tb";
import {
  Box,
  Divider,
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

export default function SideBar({ collapsed = false, mobile = false, onClose, onToggle }) {
  const compact = collapsed && !mobile;
  const isRtl = getDirection() === "rtl";
  const tooltipPlacement = isRtl ? "left" : "right";
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
        px: compact ? 1.25 : mobile ? 1.5 : 2,
        py: 2.5,
        bgcolor: "#17102d",
        backgroundImage: "linear-gradient(180deg, #1b1232 0%, #120c24 100%)",
        color: "text.primary",
        gap: 2.5,
        overflowX: "hidden",
      }}
    >
      <Stack
        sx={{
          minHeight: 56,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: compact ? "center" : "space-between",
          gap: mobile ? 0.5 : 1.25,
        }}
      >
        <Stack
          sx={{
            minWidth: 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: mobile ? 1 : 1.25,
          }}
        >
          <Box
            sx={{
              width: mobile ? 40 : 44,
              height: mobile ? 40 : 44,
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              borderRadius: 3,
              color: "#1a132f",
              bgcolor: "primary.main",
              backgroundImage: "linear-gradient(135deg, #f7d046, #f0a63c)",
              boxShadow: "0 10px 28px rgba(247, 208, 70, 0.2)",
              fontSize: 23,
            }}
          >
            <FiShield aria-hidden />
          </Box>
          {!compact && (
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{ fontSize: mobile ? 15 : 17, fontWeight: 800, whiteSpace: "nowrap" }}
              >
                TaskMentor
              </Typography>
              <Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: 12 }}>
                {translate("پنل مدیریت")}
              </Typography>
            </Box>
          )}
        </Stack>

        {!compact && (
          <Stack sx={{ flexDirection: "row", alignItems: "center", gap: mobile ? 0 : 0.5 }}>
            <IconButton
              aria-label={translate("تنظیمات")}
              aria-controls={settingsOpen ? "admin-settings-menu" : undefined}
              aria-haspopup="menu"
              aria-expanded={settingsOpen ? "true" : undefined}
              onClick={(event) => setSettingsAnchor(event.currentTarget)}
              sx={{
                width: mobile ? 32 : 38,
                height: mobile ? 32 : 38,
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px",
                color: "text.primary",
                bgcolor: "rgba(255,255,255,0.06)",
                "&:hover": {
                  bgcolor: "rgba(149, 118, 255, 0.18)",
                  borderColor: "rgba(153, 126, 255, 0.38)",
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
                  color: "text.secondary",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.07)" },
                }}
              >
                <FiX />
              </IconButton>
            )}
          </Stack>
        )}
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
              border: "1px solid rgba(153, 126, 255, 0.2)",
              borderRadius: "12px",
              bgcolor: "#17102d",
              backgroundImage: "none",
              color: "text.primary",
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
          <ListItemIcon sx={{ minWidth: 0, color: "primary.main", fontSize: 20 }}>
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

      <Divider sx={{ borderColor: "rgba(153, 126, 255, 0.2)" }} />

      <Box component="nav" aria-label={translate("منوی مدیریت")} sx={{ flex: 1, minHeight: 0 }}>
        <List sx={{ height: "100%", p: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
          {MENU_CONFIG.map(({ label, to, icon: Icon }) => (
            <Tooltip key={to} title={compact ? label : ""} placement={tooltipPlacement} arrow>
              <ListItemButton
                component={NavLink}
                to={to}
                onClick={mobile ? onClose : undefined}
                sx={{
                  minHeight: 50,
                  flexGrow: 0,
                  flexShrink: 0,
                  px: compact ? 0 : 1.5,
                  justifyContent: compact ? "center" : "flex-start",
                  gap: compact ? 0 : "10px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: "12px",
                  color: "text.secondary",
                  bgcolor: "rgba(255,255,255,0.035)",
                  transition: "background-color 160ms ease, color 160ms ease, border-color 160ms ease",
                  "&:hover": {
                    color: "text.primary",
                    bgcolor: "rgba(149, 118, 255, 0.15)",
                    borderColor: "rgba(153, 126, 255, 0.38)",
                  },
                  "&.active": {
                    color: "#1a132f",
                    bgcolor: "primary.main",
                    backgroundImage: "linear-gradient(120deg, #f7d046, #f0a63c)",
                    borderColor: "transparent",
                    boxShadow: "0 10px 24px rgba(247, 208, 70, 0.16)",
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
                  minHeight: 50,
                  flexGrow: 0,
                  flexShrink: 0,
                  mt: "auto",
                  px: compact ? 0 : 1.5,
                  justifyContent: compact ? "center" : "flex-start",
                  gap: compact ? 0 : "10px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "12px",
                  color: "text.secondary",
                  bgcolor: "rgba(255,255,255,0.04)",
                  "&:hover": {
                    color: "text.primary",
                    bgcolor: "rgba(149, 118, 255, 0.15)",
                    borderColor: "rgba(153, 126, 255, 0.38)",
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
