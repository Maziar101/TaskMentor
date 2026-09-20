import { FiUsers } from "react-icons/fi";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { translate } from "../i18n/runtime";

export default function UsersPage() {
  return (
    <Stack sx={{ gap: 3 }}>
      <Box>
        <Typography component="h1" sx={{ fontSize: { xs: 25, sm: 31 }, fontWeight: 900 }}>
          {translate("لیست کاربران")}
        </Typography>
        <Typography sx={{ mt: 0.75, color: "text.secondary", fontSize: 14 }}>
          {translate("مشاهده و مدیریت کاربران TaskMentor")}
        </Typography>
      </Box>

      <Paper
        sx={{
          minHeight: 260,
          p: { xs: 2.5, sm: 4 },
          display: "grid",
          placeItems: "center",
          textAlign: "center",
          border: "1px solid rgba(153, 126, 255, 0.24)",
          bgcolor: "rgba(23, 16, 45, 0.72)",
          boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
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
              bgcolor: "rgba(247,208,70,0.1)",
              border: "1px solid rgba(247,208,70,0.22)",
              fontSize: 27,
            }}
          >
            <FiUsers aria-hidden />
          </Box>
          <Typography sx={{ fontSize: 18, fontWeight: 800 }}>{translate("لیست کاربران")}</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
            {translate("جدول و عملیات کاربران در این صفحه اضافه می‌شود.")}
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  );
}
