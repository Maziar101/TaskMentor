import { MenuItem, Pagination, PaginationItem, Select, Stack, Typography } from "@mui/material";
import { formatNumber } from "../../../i18n/runtime";

const rowsPerPageOptions = [5, 10, 20];

export default function UsersPagination({ page, pageCount, rowsPerPage, total, onPageChange, onRowsPerPageChange }) {
  const firstItem = total === 0 ? 0 : ((page - 1) * rowsPerPage) + 1;
  const lastItem = Math.min(page * rowsPerPage, total);

  return (
    <Stack
      sx={{
        minHeight: 68,
        px: { xs: 1.5, sm: 2 },
        py: 1.25,
        flexDirection: { xs: "column", sm: "row" },
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1.5,
        borderTop: "1px solid rgba(255,255,255,0.12)",
        bgcolor: "rgba(0,0,0,0.18)",
      }}
    >
      <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
        <Typography sx={{ color: "text.secondary", fontSize: 12.5, whiteSpace: "nowrap" }}>
          تعداد در صفحه
        </Typography>
        <Select
          value={rowsPerPage}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
          inputProps={{ "aria-label": "تعداد کاربر در هر صفحه" }}
          sx={{
            width: 78,
            height: 36,
            bgcolor: "rgba(255,255,255,0.05)",
            "& .MuiSelect-select": { py: 0.75, textAlign: "center" },
          }}
        >
          {rowsPerPageOptions.map((value) => (
            <MenuItem key={value} value={value}>{formatNumber(value)}</MenuItem>
          ))}
        </Select>
      </Stack>

      <Pagination
        count={pageCount}
        page={page}
        onChange={(_event, nextPage) => onPageChange(nextPage)}
        getItemAriaLabel={(type, itemPage) => {
          if (type === "page") return `صفحه ${formatNumber(itemPage)}`;
          if (type === "next") return "صفحه بعد";
          if (type === "previous") return "صفحه قبل";
          return type;
        }}
        renderItem={(item) => (
          <PaginationItem
            {...item}
            page={typeof item.page === "number" ? formatNumber(item.page) : item.page}
          />
        )}
        sx={{
          direction: "ltr",
          "& .MuiPaginationItem-root": {
            minWidth: 34,
            height: 34,
            color: "text.secondary",
            border: "1px solid transparent",
            fontWeight: 800,
          },
          "& .MuiPaginationItem-root:hover": { bgcolor: "rgba(255,255,255,0.08)" },
          "& .MuiPaginationItem-root.Mui-selected": {
            color: "#ffffff",
            bgcolor: "rgba(255,255,255,0.12)",
            borderColor: "rgba(255,255,255,0.28)",
          },
        }}
      />

      <Typography sx={{ color: "text.secondary", fontSize: 12.5, whiteSpace: "nowrap" }}>
        {`${formatNumber(firstItem)} تا ${formatNumber(lastItem)} از ${formatNumber(total)}`}
      </Typography>
    </Stack>
  );
}
