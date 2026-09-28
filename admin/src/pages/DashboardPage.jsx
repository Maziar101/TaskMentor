import { FiActivity, FiGrid } from "react-icons/fi";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { translate } from "../i18n/runtime";

export default function DashboardPage() {
  return (
    <Stack sx={{ gap: 3 }}>
      <Box>
        <Typography component="h1" sx={{ fontSize: { xs: 25, sm: 31 }, fontWeight: 900 }}>
          {translate("داشبورد")}
        </Typography>
        <Typography sx={{ mt: 0.75, color: "text.secondary", fontSize: 14 }}>
          {translate("نمای کلی پنل مدیریت TaskMentor")}
        </Typography>
      </Box>

      <Paper
        sx={{
          minHeight: 260,
          p: { xs: 2.5, sm: 4 },
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.18)",
          bgcolor: "#0f0f0f",
          backgroundImage: "none",
          boxShadow: "0 18px 60px rgba(0,0,0,0.32)",
        }}
      >
        <Stack sx={{ alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 58,
              height: 58,
              display: "grid",
              placeItems: "center",
              borderRadius: 4,
              color: "primary.main",
              bgcolor: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.22)",
              fontSize: 27,
            }}
          >
            <FiGrid aria-hidden />
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 800 }}>{translate("داشبورد مدیریت آماده است")}</Typography>
          <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 0.75, color: "text.secondary" }}>
            <FiActivity aria-hidden />
            <Typography sx={{ fontSize: 13 }}>{translate("ویجت‌های مدیریتی در این بخش قرار می‌گیرند.")}</Typography>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
