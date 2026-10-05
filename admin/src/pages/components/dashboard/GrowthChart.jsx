import { useState } from "react";
import { Box, MenuItem, Paper, Select, Stack, Tooltip, Typography } from "@mui/material";
import { FiCalendar, FiCheck, FiUsers } from "react-icons/fi";
import { HiOutlineUserGroup } from "react-icons/hi2";
import { formatNumber, translate } from "../../../i18n/runtime";

const metricOptions = [
  { value: "users", label: "رشد کاربران", icon: FiUsers },
  { value: "groups", label: "رشد گروه‌ها", icon: HiOutlineUserGroup },
];

const periodOptions = [
  { value: 6, label: "۶ ماه اخیر" },
  { value: 12, label: "۱۲ ماه اخیر" },
];

const selectSx = {
  height: 38,
  minWidth: 132,
  color: "rgba(255,255,255,0.86)",
  bgcolor: "rgba(255,255,255,0.025)",
  borderRadius: "8px",
  fontSize: 11,
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.14)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(161,0,255,0.7)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "#a100ff",
    borderWidth: 1,
  },
  "& .MuiSelect-select": {
    px: 1.2,
    py: 0,
    display: "flex",
    alignItems: "center",
  },
  "& .MuiSelect-icon": {
    color: "rgba(255,255,255,0.62)",
  },
};

const menuProps = {
  PaperProps: {
    sx: {
      mt: 0.75,
      minWidth: 150,
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "8px",
      bgcolor: "#151516",
      backgroundImage: "none",
      boxShadow: "0 16px 34px rgba(0,0,0,0.55)",
      overflow: "hidden",
    },
  },
  MenuListProps: {
    sx: { p: 0.5 },
  },
};

const tooltipSlotProps = {
  tooltip: {
    sx: {
      px: 1.25,
      py: 0.75,
      border: "1px solid rgba(216,56,255,0.5)",
      borderRadius: "7px",
      bgcolor: "#171218",
      color: "#fff",
      boxShadow: "0 10px 28px rgba(0,0,0,0.45)",
      fontSize: 11,
      fontWeight: 800,
      direction: "rtl",
    },
  },
  arrow: {
    sx: { color: "#171218" },
  },
};

function SelectValue({ icon: Icon, label }) {
  return (
    <Stack
      component="span"
      sx={{
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        gap: 0.8,
        direction: "rtl",
      }}
    >
      <Box component={Icon} aria-hidden sx={{ flexShrink: 0, fontSize: 16, color: "#c85cff" }} />
      <Box component="span" sx={{ whiteSpace: "nowrap" }}>{translate(label)}</Box>
    </Stack>
  );
}

export default function GrowthChart({ charts }) {
  const [metric, setMetric] = useState("users");
  const [period, setPeriod] = useState(6);
  const data = charts[metric][period];
  const selectedMetric = metricOptions.find((option) => option.value === metric);
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
      <Stack
        sx={{
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "flex-start" },
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 900 }}>{translate(selectedMetric.label)}</Typography>
          <Typography sx={{ mt: 0.5, color: "text.secondary", fontSize: 10.5 }}>
            {translate(metric === "users" ? "تعداد کل کاربران در بازه انتخاب‌شده" : "تعداد کل گروه‌ها در بازه انتخاب‌شده")}
          </Typography>
        </Box>
        <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1, direction: "ltr" }}>
          <Select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            renderValue={(value) => (
              <SelectValue icon={FiCalendar} label={periodOptions.find((option) => option.value === value).label} />
            )}
            inputProps={{ "aria-label": translate("انتخاب بازه زمانی نمودار") }}
            MenuProps={menuProps}
            sx={{ ...selectSx, minWidth: 120 }}
          >
            {periodOptions.map((option) => (
              <MenuItem
                key={option.value}
                value={option.value}
                sx={{
                  minHeight: 38,
                  px: 1.2,
                  direction: "rtl",
                  gap: 1,
                  borderRadius: "6px",
                  fontSize: 11,
                  "&.Mui-selected": { bgcolor: "rgba(161,0,255,0.18)" },
                  "&.Mui-selected:hover": { bgcolor: "rgba(161,0,255,0.25)" },
                }}
              >
                <Box component={FiCalendar} aria-hidden sx={{ fontSize: 16, color: "#c85cff" }} />
                <Typography sx={{ flexGrow: 1, fontSize: 11 }}>{translate(option.label)}</Typography>
                {period === option.value && <Box component={FiCheck} aria-hidden sx={{ color: "#d838ff", fontSize: 16 }} />}
              </MenuItem>
            ))}
          </Select>
          <Select
            value={metric}
            onChange={(event) => setMetric(event.target.value)}
            renderValue={(value) => {
              const option = metricOptions.find((item) => item.value === value);
              return <SelectValue icon={option.icon} label={option.label} />;
            }}
            inputProps={{ "aria-label": translate("انتخاب نوع روند نمودار") }}
            MenuProps={menuProps}
            sx={selectSx}
          >
            {metricOptions.map((option) => (
              <MenuItem
                key={option.value}
                value={option.value}
                sx={{
                  minHeight: 38,
                  px: 1.2,
                  direction: "rtl",
                  gap: 1,
                  borderRadius: "6px",
                  fontSize: 11,
                  "&.Mui-selected": { bgcolor: "rgba(161,0,255,0.18)" },
                  "&.Mui-selected:hover": { bgcolor: "rgba(161,0,255,0.25)" },
                }}
              >
                <Box component={option.icon} aria-hidden sx={{ fontSize: 16, color: "#c85cff" }} />
                <Typography sx={{ flexGrow: 1, fontSize: 11 }}>{translate(option.label)}</Typography>
                {metric === option.value && <Box component={FiCheck} aria-hidden sx={{ color: "#d838ff", fontSize: 16 }} />}
              </MenuItem>
            ))}
          </Select>
        </Stack>
      </Stack>
      <Box sx={{ mt: 1, width: "100%", overflow: "hidden" }}>
        <Box
          component="svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          sx={{
            width: "100%",
            height: { xs: 220, sm: 270 },
            display: "block",
            "& .growth-chart-point": { cursor: "pointer", outline: "none" },
            "& .growth-chart-hit": { fill: "transparent" },
            "& .growth-chart-dot": { transition: "r 140ms ease, filter 140ms ease" },
            "& .growth-chart-point:hover .growth-chart-dot, & .growth-chart-point:focus .growth-chart-dot": {
              r: 6,
              filter: "drop-shadow(0 0 5px rgba(216,56,255,0.9))",
            },
          }}
        >
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
            <Tooltip
              key={point.key}
              title={`${point.label}: ${formatNumber(point.value)}`}
              arrow
              placement="top"
              enterTouchDelay={0}
              leaveTouchDelay={2000}
              slotProps={tooltipSlotProps}
            >
              <g
                className="growth-chart-point"
                tabIndex={0}
                aria-label={`${point.label}: ${formatNumber(point.value)}`}
              >
                <circle className="growth-chart-hit" cx={point.x} cy={point.y} r="13" />
                <circle className="growth-chart-dot" cx={point.x} cy={point.y} r="4.5" fill="#aa12ff" stroke="#d99cff" strokeWidth="1.5" />
                <text x={point.x} y={height - 17} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9">
                  {point.label}
                </text>
              </g>
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
