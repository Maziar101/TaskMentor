import { useCallback, useEffect, useState } from "react";
import { FiRefreshCw, FiUsers } from "react-icons/fi";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { adminApiRequest } from "../auth/adminSession";
import { formatDate, formatNumber, translate } from "../i18n/runtime";

const initialState = { users: [], loading: true, error: "" };

const roleMeta = {
  owner: { label: "مالک", color: "#f7d046", background: "rgba(247, 208, 70, 0.12)" },
  admin: { label: "ادمین", color: "#c4a8ff", background: "rgba(153, 126, 255, 0.16)" },
  user: { label: "کاربر", color: "#8ed9bd", background: "rgba(76, 201, 155, 0.12)" },
};

const subscriptionMeta = {
  enterprise: { label: "سازمانی", color: "#f7d046" },
  pro: { label: "حرفه‌ای", color: "#c4a8ff" },
  free: { label: "رایگان", color: "#a99fbd" },
};

function getInitials(username) {
  return username?.trim().charAt(0).toUpperCase() || "؟";
}

function formatJoinDate(value) {
  if (!value) return "—";
  return formatDate(new Date(value), { year: "numeric", month: "short", day: "numeric" });
}

export default function UsersPage() {
  const [state, setState] = useState(initialState);

  const loadUsers = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: "" }));
    try {
      const response = await adminApiRequest("/api/admin/users");
      setState({ users: response.data || [], loading: false, error: "" });
    } catch (error) {
      setState((current) => ({
        ...current,
        loading: false,
        error: error.message || "دریافت لیست کاربران انجام نشد",
      }));
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return (
    <Stack sx={{ gap: 3 }}>
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
            icon={<FiUsers aria-hidden />}
            label={`${formatNumber(state.users.length)} کاربر`}
            sx={{
              height: 42,
              px: 0.5,
              border: "1px solid rgba(247, 208, 70, 0.24)",
              color: "primary.main",
              bgcolor: "rgba(247, 208, 70, 0.08)",
              "& .MuiChip-icon": { color: "inherit" },
              "& .MuiChip-label": { fontWeight: 800 },
            }}
          />
          <Button
            variant="outlined"
            disabled={state.loading}
            startIcon={<FiRefreshCw aria-hidden />}
            onClick={loadUsers}
            sx={{
              minHeight: 42,
              borderRadius: "12px",
              borderColor: "rgba(153, 126, 255, 0.34)",
              color: "text.primary",
              fontWeight: 800,
              "&:hover": {
                borderColor: "primary.main",
                bgcolor: "rgba(247, 208, 70, 0.06)",
              },
            }}
          >
            {translate("تازه‌سازی")}
          </Button>
        </Stack>
      </Stack>

      {state.error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={loadUsers} sx={{ fontWeight: 800 }}>
              {translate("تلاش مجدد")}
            </Button>
          }
          sx={{ borderRadius: "12px", alignItems: "center" }}
        >
          {state.error}
        </Alert>
      )}

      <Paper
        sx={{
          overflow: "hidden",
          border: "1px solid rgba(153, 126, 255, 0.24)",
          bgcolor: "rgba(23, 16, 45, 0.78)",
          backgroundImage:
            "linear-gradient(145deg, rgba(161,107,255,0.05), rgba(247,208,70,0.025))",
          boxShadow: "0 18px 60px rgba(0,0,0,0.22)",
        }}
      >
        {state.loading ? (
          <Stack sx={{ minHeight: 300, alignItems: "center", justifyContent: "center", gap: 2 }}>
            <CircularProgress size={38} />
            <Typography sx={{ color: "text.secondary", fontSize: 14 }}>
              {translate("در حال دریافت کاربران...")}
            </Typography>
          </Stack>
        ) : state.users.length === 0 ? (
          <Stack sx={{ minHeight: 300, alignItems: "center", justifyContent: "center", gap: 1.5 }}>
            <Box sx={{ color: "primary.main", fontSize: 42, lineHeight: 0 }}>
              <FiUsers aria-hidden />
            </Box>
            <Typography sx={{ fontSize: 17, fontWeight: 800 }}>
              {translate("کاربری پیدا نشد")}
            </Typography>
          </Stack>
        ) : (
          <TableContainer sx={{ overflowX: "auto" }}>
            <Table sx={{ minWidth: 820 }} aria-label={translate("لیست کاربران")}>
              <TableHead>
                <TableRow sx={{ bgcolor: "rgba(12, 8, 28, 0.68)" }}>
                  {["کاربر", "شماره موبایل", "نقش", "اشتراک", "تاریخ عضویت"].map((label) => (
                    <TableCell
                      key={label}
                      sx={{
                        py: 2,
                        borderColor: "rgba(153, 126, 255, 0.16)",
                        color: "text.secondary",
                        fontSize: 12,
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {translate(label)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {state.users.map((user) => {
                  const role = roleMeta[user.role] || roleMeta.user;
                  const subscription = subscriptionMeta[user.subscription] || subscriptionMeta.free;

                  return (
                    <TableRow
                      key={user._id}
                      sx={{
                        transition: "background-color 160ms ease",
                        "&:hover": { bgcolor: "rgba(153, 126, 255, 0.07)" },
                        "&:last-child td": { borderBottom: 0 },
                      }}
                    >
                      <TableCell sx={{ py: 1.5, borderColor: "rgba(153, 126, 255, 0.12)" }}>
                        <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.25 }}>
                          <Avatar
                            src={user.avatarUrl || undefined}
                            alt={user.username || ""}
                            sx={{
                              width: 42,
                              height: 42,
                              color: "#1a132f",
                              bgcolor: "primary.main",
                              fontSize: 16,
                              fontWeight: 900,
                            }}
                          >
                            {getInitials(user.username)}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 800, whiteSpace: "nowrap" }}>
                              {user.username || "بدون نام"}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell
                        sx={{
                          borderColor: "rgba(153, 126, 255, 0.12)",
                          color: "text.secondary",
                          fontSize: 13,
                          direction: "ltr",
                          textAlign: "end",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user.phone || "—"}
                      </TableCell>
                      <TableCell sx={{ borderColor: "rgba(153, 126, 255, 0.12)" }}>
                        <Chip
                          label={translate(role.label)}
                          size="small"
                          sx={{
                            minWidth: 68,
                            color: role.color,
                            bgcolor: role.background,
                            border: `1px solid ${role.color}33`,
                            "& .MuiChip-label": { fontSize: 12, fontWeight: 800 },
                          }}
                        />
                      </TableCell>
                      <TableCell
                        sx={{
                          borderColor: "rgba(153, 126, 255, 0.12)",
                          color: subscription.color,
                          fontSize: 13,
                          fontWeight: 800,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {translate(subscription.label)}
                      </TableCell>
                      <TableCell
                        sx={{
                          borderColor: "rgba(153, 126, 255, 0.12)",
                          color: "text.secondary",
                          fontSize: 13,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {formatJoinDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Stack>
  );
}
