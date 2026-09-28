import { useEffect, useState } from "react";
import { FiAlertTriangle, FiArrowRight } from "react-icons/fi";
import { Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { Outlet } from "react-router-dom";
import { initializeAdminSession } from "./adminSession";

const initialAuthState = { status: "loading", message: "", user: null };

function getClientPanelUrl() {
  const configuredUrl = import.meta.env.VITE_CLIENT_PANEL_URL?.trim();
  return configuredUrl || `${window.location.protocol}//${window.location.hostname}:3000`;
}

export default function ProtectedAdminRoute() {
  const [authState, setAuthState] = useState(initialAuthState);

  useEffect(() => {
    let active = true;

    initializeAdminSession()
      .then((session) => {
        if (active) {
          setAuthState({ status: "authorized", message: "", user: session.user });
        }
      })
      .catch((error) => {
        if (active) {
          setAuthState({
            status: "denied",
            message: error.message || "احراز هویت پنل مدیریت انجام نشد",
            user: null,
          });
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (authState.status === "authorized") {
    return <Outlet context={{ adminUser: authState.user }} />;
  }

  const loading = authState.status === "loading";

  return (
    <Box
      sx={{
        minHeight: "100vh",
        p: 2,
        display: "grid",
        placeItems: "center",
        bgcolor: "background.default",
        backgroundImage: "none",
      }}
    >
      <Paper
        sx={{
          width: "100%",
          maxWidth: 430,
          p: { xs: 3, sm: 4 },
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.18)",
          bgcolor: "#0f0f0f",
          boxShadow: "0 24px 70px rgba(0,0,0,0.34)",
        }}
      >
        <Stack sx={{ alignItems: "center", gap: 2 }}>
          {loading ? (
            <CircularProgress size={42} aria-label="در حال احراز هویت" />
          ) : (
            <Box sx={{ color: "warning.main", fontSize: 42, lineHeight: 0 }}>
              <FiAlertTriangle aria-hidden />
            </Box>
          )}
          <Typography component="h1" sx={{ fontSize: 20, fontWeight: 900 }}>
            {loading ? "در حال ورود به پنل ادمین" : "دسترسی به پنل ادمین ممکن نیست"}
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
            {loading ? "نشست مدیریتی شما در حال بررسی است..." : authState.message}
          </Typography>
          {!loading && (
            <Button
              variant="contained"
              startIcon={<FiArrowRight aria-hidden />}
              onClick={() => window.location.assign(getClientPanelUrl())}
              sx={{ mt: 1, minHeight: 44, px: 3, borderRadius: "12px", fontWeight: 800 }}
            >
              بازگشت به پنل کاربری
            </Button>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
