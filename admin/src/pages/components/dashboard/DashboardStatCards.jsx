import { FiTrendingUp, FiUserCheck, FiUsers } from "react-icons/fi";
import { TbCrown } from "react-icons/tb";
import { Box, Paper, Stack, Typography } from "@mui/material";
import { formatNumber, translate } from "../../../i18n/runtime";

const CARD_COLORS = {
  active: { color: "#b429ff", background: "rgba(180,41,255,0.22)" },
  regular: { color: "#ffffff", background: "rgba(95,114,255,0.24)" },
  premium: { color: "#11d885", background: "rgba(17,216,133,0.2)" },
  total: { color: "#ffffff", background: "rgba(255,255,255,0.1)" },
};

function StatCard({ title, value, caption, growth, icon: Icon, tone }) {
  const palette = CARD_COLORS[tone];
  const positive = growth >= 0;

  return (
    <Paper
      sx={{
        minHeight: 112,
        p: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "12px",
        bgcolor: "#0d0d0e",
        backgroundImage: "linear-gradient(145deg, rgba(255,255,255,0.025), transparent 62%)",
        boxShadow: "0 14px 36px rgba(0,0,0,0.28)",
      }}
    >
      <Stack sx={{ minWidth: 0, alignItems: "flex-start", gap: 0.4 }}>
        <Typography sx={{ color: "rgba(255,255,255,0.72)", fontSize: 12, fontWeight: 700 }}>
          {translate(title)}
        </Typography>
        <Typography sx={{ color: "#ffffff", fontSize: 24, fontWeight: 900, lineHeight: 1.35 }}>
          {formatNumber(value)}
        </Typography>
        <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 0.5 }}>
          <Typography sx={{ color: positive ? "#16df91" : "#ff647c", fontSize: 10, fontWeight: 800 }}>
            {positive ? "+" : ""}{formatNumber(growth)}٪
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.42)", fontSize: 9.5 }}>
            {translate(caption)}
          </Typography>
        </Stack>
      </Stack>
      <Box
        sx={{
          width: 44,
          height: 44,
          flex: "0 0 auto",
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          color: palette.color,
          bgcolor: palette.background,
          fontSize: 21,
        }}
      >
        <Icon aria-hidden />
      </Box>
    </Paper>
  );
}

export default function DashboardStatCards({ metrics }) {
  const freeShare = metrics.total ? Math.round((metrics.free / metrics.total) * 100) : 0;
  const paidShare = metrics.total ? Math.round((metrics.paid / metrics.total) * 100) : 0;
  const cards = [
    { title: "کاربران جدید ماه", value: metrics.monthly, caption: "نسبت به ماه گذشته", growth: metrics.growth, icon: FiTrendingUp, tone: "active" },
    { title: "کاربران رایگان", value: metrics.free, caption: "از کل کاربران", growth: freeShare, icon: FiUserCheck, tone: "regular" },
    { title: "کاربران ویژه", value: metrics.paid, caption: "از کل کاربران", growth: paidShare, icon: TbCrown, tone: "premium" },
    { title: "کل کاربران", value: metrics.total, caption: "نسبت به ماه گذشته", growth: metrics.growth, icon: FiUsers, tone: "total" },
  ];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
      {cards.map((card) => <StatCard key={card.title} {...card} />)}
    </Box>
  );
}
