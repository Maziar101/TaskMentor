import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { Box, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";
import SideBar from "../components/SideBar";
import { getDirection, translate } from "../i18n/runtime";

const SIDEBAR_WIDTH = 272;
const COLLAPSED_WIDTH = 84;

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const desktopWidth = collapsed ? COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  const direction = getDirection();
  const drawerAnchor = direction === "rtl" ? "right" : "left";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        backgroundImage:
          "radial-gradient(circle at 18% 10%, rgba(107,75,255,0.24), transparent 32%), radial-gradient(circle at 85% 0%, rgba(247,208,70,0.12), transparent 25%)",
      }}
    >
      <Drawer
        anchor={drawerAnchor}
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          width: desktopWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: desktopWidth,
            overflow: "hidden",
            border: 0,
            borderInlineEnd: "1px solid rgba(153, 126, 255, 0.2)",
            boxShadow:
              direction === "rtl"
                ? "-8px 0 30px rgba(0,0,0,0.26)"
                : "8px 0 30px rgba(0,0,0,0.26)",
            transition: "width 220ms ease",
          },
        }}
      >
        <SideBar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      </Drawer>

      <Drawer
        anchor={drawerAnchor}
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: 280, border: 0 },
        }}
      >
        <SideBar mobile onClose={() => setMobileOpen(false)} />
      </Drawer>

      <Box
        component="main"
        sx={{
          minHeight: "100vh",
          marginInlineStart: { xs: 0, md: `${desktopWidth}px` },
          transition: "margin-inline-start 220ms ease",
        }}
      >
        <Stack
          component="header"
          sx={{
            display: { xs: "flex", md: "none" },
            height: 68,
            px: 2,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(153, 126, 255, 0.2)",
            bgcolor: "rgba(18, 12, 36, 0.86)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 800 }}>{translate("پنل مدیریت")}</Typography>
          <IconButton
            aria-label={translate("باز کردن منو")}
            onClick={() => setMobileOpen(true)}
            sx={{ color: "text.primary", bgcolor: "rgba(255,255,255,0.06)" }}
          >
            <FiMenu />
          </IconButton>
        </Stack>

        <Box sx={{ width: "100%", maxWidth: 1440, mx: "auto", p: { xs: 2, sm: 3, lg: 4 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
