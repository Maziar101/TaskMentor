import { Box, Stack, Typography } from "@mui/material";
import { FiChevronLeft } from "react-icons/fi";
import { getLocale } from "../../../../i18n/runtime";

export default function GroupMediaRow({ Icon, label, count }) {
  return (
    <Stack
      sx={{
        minHeight: 58,
        px: 1.5,
        flexDirection: "row",
        alignItems: "center",
        gap: 1.25,
        borderTop: "1px solid var(--tm-border-soft)",
        bgcolor: "rgba(255,255,255,0.012)",
      }}
    >
      <Box
        sx={{
          width: 42,
          height: 42,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.055)",
          fontSize: 21,
        }}
      >
        <Icon aria-hidden />
      </Box>
      <Typography sx={{ flex: 1, fontSize: 14.5, fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography sx={{ color: "var(--tm-text-muted)", fontSize: 13 }}>
        {count.toLocaleString(getLocale())} مورد
      </Typography>
      <FiChevronLeft aria-hidden />
    </Stack>
  );
}
