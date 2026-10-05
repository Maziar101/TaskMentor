import { Box, Paper, Stack, Typography } from "@mui/material";
import { formatNumber, translate } from "../../../i18n/runtime";
import GrowthChart from "./GrowthChart";

function SubscriptionChart({ freeUsers, paidUsers, totalUsers }) {
  const paidPercent = totalUsers ? Math.round((paidUsers / totalUsers) * 100) : 0;
  const freePercent = 100 - paidPercent;

  return (
    <Paper
      sx={{
        p: { xs: 2, sm: 2.5 },
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "12px",
        bgcolor: "#0d0d0e",
        backgroundImage: "linear-gradient(145deg, rgba(255,255,255,0.025), transparent 65%)",
        boxShadow: "0 14px 36px rgba(0,0,0,0.28)",
      }}
    >
      <Typography sx={{ fontSize: 15, fontWeight: 900 }}>{translate("توزیع نوع اشتراک کاربران")}</Typography>
      <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 10.5 }}>
        {translate("مقایسه کاربران ویژه و رایگان")}
      </Typography>
      <Box sx={{ my: 2.5, display: "grid", placeItems: "center" }}>
        <Box
          sx={{
            width: 172,
            height: 172,
            display: "grid",
            placeItems: "center",
            borderRadius: "50%",
            background: `conic-gradient(#9d00ff 0 ${paidPercent}%, #5958ff ${paidPercent}% 100%)`,
            transform: "rotate(-90deg)",
          }}
        >
          <Box
            sx={{
              width: 102,
              height: 102,
              display: "grid",
              placeItems: "center",
              borderRadius: "50%",
              bgcolor: "#111113",
              transform: "rotate(90deg)",
              textAlign: "center",
            }}
          >
            <Box>
              <Typography sx={{ fontSize: 22, fontWeight: 900, lineHeight: 1.2 }}>{formatNumber(totalUsers)}</Typography>
              <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 10 }}>{translate("کل کاربران")}</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
      <Stack sx={{ gap: 1 }}>
        {[
          { label: "کاربران ویژه", count: paidUsers, percent: paidPercent, color: "#9d00ff" },
          { label: "کاربران رایگان", count: freeUsers, percent: freePercent, color: "#5958ff" },
        ].map((item) => (
          <Stack
            key={item.label}
            sx={{
              px: 1.3,
              py: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: "8px",
              bgcolor: "rgba(255,255,255,0.04)",
            }}
          >
            <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 0.8 }}>
              <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: item.color }} />
              <Box>
                <Typography sx={{ fontSize: 10.5, fontWeight: 800 }}>{translate(item.label)}</Typography>
                <Typography sx={{ color: "text.secondary", fontSize: 10 }}>{formatNumber(item.count)}</Typography>
              </Box>
            </Stack>
            <Typography sx={{ color: item.color, fontSize: 11, fontWeight: 900 }}>{formatNumber(item.percent)}٪</Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}

export default function DashboardCharts({ metrics }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(250px, 0.82fr) minmax(0, 2fr)" }, gap: 1.5 }}>
      <SubscriptionChart freeUsers={metrics.free} paidUsers={metrics.paid} totalUsers={metrics.total} />
      <GrowthChart charts={metrics.charts} />
    </Box>
  );
}
