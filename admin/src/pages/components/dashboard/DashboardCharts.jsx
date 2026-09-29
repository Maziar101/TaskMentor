import { Box, Paper, Stack, Typography } from "@mui/material";
import { formatNumber, translate } from "../../../i18n/runtime";

function GrowthChart({ data }) {
  const width = 720;
  const height = 250;
  const left = 50;
  const right = 18;
  const top = 26;
  const bottom = 46;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const chartMax = Math.max(5, Math.ceil(maxValue / 5) * 5);
  const points = data.map((item, index) => ({
    ...item,
    x: left + (index * (width - left - right)) / Math.max(data.length - 1, 1),
    y: top + (1 - item.value / chartMax) * (height - top - bottom),
  }));
  const linePath = points.map((point, index) => `${index ? "L" : "M"} ${point.x} ${point.y}`).join(" ");
  const areaPath = `${linePath} L ${points.at(-1).x} ${height - bottom} L ${points[0].x} ${height - bottom} Z`;

  return (
    <Paper
      sx={{
        minWidth: 0,
        p: { xs: 2, sm: 2.5 },
        border: "1px solid rgba(255,255,255,0.14)",
        borderRadius: "12px",
        bgcolor: "#0d0d0e",
        backgroundImage: "linear-gradient(145deg, rgba(255,255,255,0.025), transparent 65%)",
        boxShadow: "0 14px 36px rgba(0,0,0,0.28)",
      }}
    >
      <Stack sx={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 900 }}>{translate("رشد کاربران")}</Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 10.5 }}>
            {translate("تعداد کل کاربران در ۶ ماه اخیر")}
          </Typography>
        </Box>
        <Box
          sx={{
            px: 1.4,
            py: 0.8,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "8px",
            color: "rgba(255,255,255,0.78)",
            bgcolor: "rgba(255,255,255,0.02)",
            fontSize: 10.5,
            whiteSpace: "nowrap",
          }}
        >
          {translate("۶ ماه اخیر")}⌄
        </Box>
      </Stack>
      <Box sx={{ mt: 1, width: "100%", overflow: "hidden" }}>
        <Box component="svg" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" sx={{ width: "100%", height: { xs: 220, sm: 270 }, display: "block" }}>
          <defs>
            <linearGradient id="dashboard-area-gradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#9b00ff" stopOpacity="0.48" />
              <stop offset="100%" stopColor="#9b00ff" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = top + ratio * (height - top - bottom);
            return (
              <g key={ratio}>
                <line x1={left} x2={width - right} y1={y} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                <text x={left - 12} y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize="9">
                  {formatNumber(Math.round(chartMax * (1 - ratio)))}
                </text>
              </g>
            );
          })}
          {points.map((point) => (
            <line key={`grid-${point.key}`} x1={point.x} x2={point.x} y1={top} y2={height - bottom} stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
          ))}
          <path d={areaPath} fill="url(#dashboard-area-gradient)" />
          <path d={linePath} fill="none" stroke="#a100ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          {points.map((point) => (
            <g key={point.key}>
              <circle cx={point.x} cy={point.y} r="4.5" fill="#aa12ff" stroke="#d99cff" strokeWidth="1.5" />
              <text x={point.x} y={height - 17} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9">
                {point.label}
              </text>
            </g>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}

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
      <GrowthChart data={metrics.chart} />
    </Box>
  );
}
