import {
  FiChevronLeft,
  FiChevronRight,
  FiShield,
  FiX,
} from "react-icons/fi";
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import { MENU_CONFIG } from "./menuConfig";
import { getDirection, translate } from "../../i18n/runtime";
import LanguageSwitcher from "../LanguageSwitcher";

export default function SideBar({ collapsed = false, mobile = false, onClose, onToggle }) {
  const compact = collapsed && !mobile;
  const isRtl = getDirection() === "rtl";
  const tooltipPlacement = isRtl ? "left" : "right";

  return (
    <Stack
      component="aside"
      sx={{
        minHeight: "100%",
        px: compact ? 1.25 : 2,
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
          gap: 1.25,
        }}
      >
        <Stack
          sx={{
            minWidth: 0,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.25,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
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
              <Typography sx={{ fontSize: 17, fontWeight: 800, whiteSpace: "nowrap" }}>
                TaskMentor
              </Typography>
              <Typography sx={{ mt: 0.25, color: "text.secondary", fontSize: 12 }}>
                {translate("پنل مدیریت")}
              </Typography>
            </Box>
          )}
        </Stack>

        {mobile && (
          <IconButton
            aria-label={translate("بستن منو")}
            onClick={onClose}
            sx={{ color: "text.secondary", "&:hover": { bgcolor: "rgba(255,255,255,0.07)" } }}
          >
            <FiX />
          </IconButton>
        )}
      </Stack>

      <Divider sx={{ borderColor: "rgba(153, 126, 255, 0.2)" }} />

      <Box component="nav" aria-label={translate("منوی مدیریت")} sx={{ flex: 1 }}>
        {!compact && (
          <Typography
            sx={{ px: 1.5, mb: 1, color: "rgba(203, 189, 230, 0.72)", fontSize: 11, fontWeight: 700 }}
          >
            {translate("منوی اصلی")}
          </Typography>
        )}
        <List sx={{ p: 0, display: "flex", flexDirection: "column", gap: 1 }}>
          {MENU_CONFIG.map(({ label, to, icon: Icon }) => (
            <Tooltip key={to} title={compact ? label : ""} placement={tooltipPlacement} arrow>
              <ListItemButton
                component={NavLink}
                to={to}
                onClick={mobile ? onClose : undefined}
                sx={{
                  minHeight: 50,
                  px: compact ? 0 : 1.5,
                  justifyContent: compact ? "center" : "flex-start",
                  gap: compact ? 0 : "10px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 3,
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
        </List>
      </Box>

      <LanguageSwitcher compact={compact} />

      {!mobile && (
        <Tooltip title={translate(compact ? "باز کردن منو" : "جمع کردن منو")} placement={tooltipPlacement} arrow>
          <ListItemButton
            onClick={onToggle}
            aria-label={translate(compact ? "باز کردن منو" : "جمع کردن منو")}
            sx={{
              minHeight: 46,
              flexGrow: 0,
              flexShrink: 0,
              px: compact ? 0 : 1.5,
              justifyContent: compact ? "center" : "flex-start",
              gap: compact ? 0 : "10px",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 3,
              color: "text.secondary",
              "&:hover": { color: "text.primary", bgcolor: "rgba(255,255,255,0.06)" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, color: "inherit", justifyContent: "center", fontSize: 20 }}>
              {compact === isRtl ? <FiChevronLeft aria-hidden /> : <FiChevronRight aria-hidden />}
            </ListItemIcon>
            {!compact && (
              <ListItemText
                primary={translate("جمع کردن منو")}
                slotProps={{ primary: { sx: { fontSize: 13, fontWeight: 700 } } }}
                sx={{ m: 0, flex: "0 0 auto" }}
              />
            )}
          </ListItemButton>
        </Tooltip>
      )}
    </Stack>
  );
}
