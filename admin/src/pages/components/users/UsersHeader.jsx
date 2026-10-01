import { FiRefreshCw, FiUsers } from "react-icons/fi";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { formatNumber, translate } from "../../../i18n/runtime";

export default function UsersHeader({ loading, totalCount, filteredCount, hasActiveFilters, onRefresh }) {
  return (
    <Stack
      sx={{
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box>
        <Typography component="h1" sx={{ fontSize: { xs: 25, sm: 31 }, fontWeight: 900 }}>
          {translate("لیست کاربران")}
        </Typography>
        <Typography sx={{ mt: 0.75, color: "text.secondary", fontSize: 14 }}>
          {translate("مشاهده و مدیریت کاربران TaskMentor")}
        </Typography>
      </Box>

      <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
        <Chip
          label={
            <Stack
              component="span"
              sx={{
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.75,
                whiteSpace: "nowrap",
              }}
            >
              <FiUsers aria-hidden />
              <Box component="span" sx={{ lineHeight: 1 }}>
                {hasActiveFilters
                  ? `${formatNumber(filteredCount)} از ${formatNumber(totalCount)} کاربر`
                  : `${formatNumber(totalCount)} کاربر`}
              </Box>
            </Stack>
          }
          sx={{
            height: 42,
            minWidth: 92,
            flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.24)",
            color: "primary.main",
            bgcolor: "rgba(255,255,255,0.08)",
            "& .MuiChip-label": { width: "100%", px: 1.5, fontWeight: 800 },
            "& svg": { flexShrink: 0, fontSize: 17 },
          }}
        />
        <Button
          variant="outlined"
          disabled={loading}
          onClick={onRefresh}
          sx={{
            width: 118,
            minWidth: 118,
            minHeight: 42,
            px: 2,
            flexShrink: 0,
            justifyContent: "center",
            gap: 0.75,
            borderRadius: "12px",
            borderColor: "rgba(255,255,255,0.34)",
            color: "text.primary",
            fontWeight: 800,
            whiteSpace: "nowrap",
            "& svg": { flexShrink: 0, fontSize: 17 },
            "&:hover": { borderColor: "primary.main", bgcolor: "rgba(255,255,255,0.12)" },
          }}
        >
          <FiRefreshCw aria-hidden />
          <Box component="span" sx={{ lineHeight: 1 }}>
            {translate("تازه‌سازی")}
          </Box>
        </Button>
      </Stack>
    </Stack>
  );
}
