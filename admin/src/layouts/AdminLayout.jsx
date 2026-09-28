import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { Box, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { Outlet, useOutletContext } from "react-router-dom";
import SideBar from "../components/SideBar";
import { getDirection, translate } from "../i18n/runtime";

const SIDEBAR_WIDTH = 220;
const COLLAPSED_WIDTH = 88;

export default function AdminLayout() {
  const { adminUser } = useOutletContext();
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
        backgroundImage: "none",
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
            borderInlineEnd: "1px solid rgba(255,255,255,0.18)",
            boxShadow:
              direction === "rtl"
                ? "-6px 0 22px rgba(0,0,0,0.35)"
                : "6px 0 22px rgba(0,0,0,0.35)",
            transition: "width 220ms ease",
          },
        }}
      >
        <SideBar
          user={adminUser}
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />
      </Drawer>

      <Drawer
        anchor={drawerAnchor}
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH, border: 0 },
        }}
      >
        <SideBar user={adminUser} mobile onClose={() => setMobileOpen(false)} />
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
            borderBottom: "1px solid rgba(255,255,255,0.18)",
            bgcolor: "rgba(0,0,0,0.9)",
            backdropFilter: "blur(12px)",
          }}
        >
          <Typography sx={{ fontSize: 16, fontWeight: 800 }}>{translate("پنل مدیریت")}</Typography>
          <IconButton
            aria-label={translate("باز کردن منو")}
            onClick={() => setMobileOpen(true)}
            sx={{ color: "#ffffff", bgcolor: "rgba(255,255,255,0.06)" }}
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
