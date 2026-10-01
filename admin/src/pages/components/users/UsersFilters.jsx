import { FiX } from "react-icons/fi";
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { formatNumber } from "../../../i18n/runtime";
import { roleOptions, statusOptions, subscriptionOptions } from "./userMetadata";

const selectSx = {
  width: { xs: "100%", md: 160 },
  minWidth: { md: 160 },
  height: 44,
  bgcolor: "rgba(255,255,255,0.04)",
  "& .MuiSelect-select": { py: 1.25 },
};

export default function UsersFilters({
  filters,
  filteredCount,
  totalCount,
  hasActiveFilters,
  onChange,
  onReset,
}) {
  return (
    <Paper
      component="section"
      aria-label="فیلترهای لیست کاربران"
      sx={{
        p: 2,
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: "14px",
        bgcolor: "rgba(255,255,255,0.035)",
        backgroundImage: "none",
      }}
    >
      <Stack
        sx={{
          flexDirection: { xs: "column", md: "row" },
          alignItems: { xs: "stretch", md: "center" },
          gap: 1.25,
        }}
      >
        <TextField
          value={filters.query}
          onChange={(event) => onChange("query", event.target.value)}
          placeholder="جستجو در همه ستون‌ها..."
          inputProps={{ "aria-label": "جستجو در همه ستون‌های کاربران" }}
          sx={{
            flex: 1,
            minWidth: { md: 240 },
            "& .MuiOutlinedInput-root": { height: 44, bgcolor: "rgba(255,255,255,0.04)" },
          }}
        />
        <Select
          value={filters.role}
          onChange={(event) => onChange("role", event.target.value)}
          inputProps={{ "aria-label": "فیلتر نقش" }}
          sx={selectSx}
        >
          <MenuItem value="all">همه نقش‌ها</MenuItem>
          {roleOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
        </Select>
        <Select
          value={filters.subscription}
          onChange={(event) => onChange("subscription", event.target.value)}
          inputProps={{ "aria-label": "فیلتر اشتراک" }}
          sx={selectSx}
        >
          <MenuItem value="all">همه اشتراک‌ها</MenuItem>
          {subscriptionOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
        </Select>
        <Select
          value={filters.status}
          onChange={(event) => onChange("status", event.target.value)}
          inputProps={{ "aria-label": "فیلتر وضعیت" }}
          sx={selectSx}
        >
          <MenuItem value="all">همه وضعیت‌ها</MenuItem>
          {statusOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
          ))}
        </Select>
        <Button
          variant="outlined"
          disabled={!hasActiveFilters}
          onClick={onReset}
          sx={{
            minWidth: 116,
            minHeight: 44,
            px: 1.5,
            flexShrink: 0,
            gap: 0.75,
            borderRadius: "12px",
            borderColor: "rgba(255,255,255,0.24)",
            color: "text.primary",
            fontWeight: 800,
            whiteSpace: "nowrap",
            "& svg": { flexShrink: 0, fontSize: 17 },
            "&:hover": { borderColor: "rgba(255,255,255,0.42)", bgcolor: "rgba(255,255,255,0.08)" },
          }}
        >
          <FiX aria-hidden />
          <Box component="span" sx={{ lineHeight: 1 }}>پاک‌کردن</Box>
        </Button>
      </Stack>
      <Typography sx={{ mt: 1.25, color: "text.secondary", fontSize: 12.5 }}>
        {hasActiveFilters
          ? `${formatNumber(filteredCount)} نتیجه از ${formatNumber(totalCount)} کاربر`
          : `نمایش همه ${formatNumber(totalCount)} کاربر`}
      </Typography>
    </Paper>
  );
}
