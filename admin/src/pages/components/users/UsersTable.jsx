import {
  Avatar,
  Box,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { FiEdit2, FiPower, FiTrash2 } from "react-icons/fi";
import { formatDate, translate } from "../../../i18n/runtime";
import { getInitials, roleMeta, subscriptionMeta } from "./userMetadata";

function formatJoinDate(value) {
  if (!value) return "—";
  return formatDate(new Date(value), { year: "numeric", month: "short", day: "numeric" });
}

function UserActions({ user, currentUser, disabled, onEdit, onDelete, onToggle }) {
  const isSelf = user._id === currentUser?.id;
  const ownerRestricted = user.role === "owner" && currentUser?.role !== "owner";
  const destructiveDisabled = disabled || isSelf || ownerRestricted;

  return (
    <Stack
      sx={{
        width: "100%",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 0.5,
      }}
    >
      <Tooltip title={ownerRestricted ? "فقط مالک می‌تواند این حساب را ویرایش کند" : "ویرایش کاربر"}>
        <span>
          <IconButton
            aria-label={`ویرایش ${user.username || "کاربر"}`}
            disabled={disabled || ownerRestricted}
            onClick={() => onEdit(user)}
            sx={{ color: "text.primary", "&:hover": { bgcolor: "rgba(255,255,255,0.12)" } }}
          >
            <FiEdit2 size={17} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={isSelf ? "وضعیت حساب خودتان قابل تغییر نیست" : user.isActive === false ? "فعال‌سازی کاربر" : "غیرفعال‌سازی کاربر"}>
        <span>
          <IconButton
            aria-label={`${user.isActive === false ? "فعال‌سازی" : "غیرفعال‌سازی"} ${user.username || "کاربر"}`}
            disabled={destructiveDisabled}
            onClick={() => onToggle(user)}
            sx={{
              color: user.isActive === false ? "success.light" : "warning.light",
              "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
            }}
          >
            <FiPower size={17} />
          </IconButton>
        </span>
      </Tooltip>
      <Tooltip title={isSelf ? "حساب خودتان قابل حذف نیست" : "حذف کاربر"}>
        <span>
          <IconButton
            aria-label={`حذف ${user.username || "کاربر"}`}
            disabled={destructiveDisabled}
            onClick={() => onDelete(user)}
            sx={{ color: "error.light", "&:hover": { bgcolor: "rgba(211,47,47,0.14)" } }}
          >
            <FiTrash2 size={17} />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

export default function UsersTable({ users, currentUser, processingId, onEdit, onDelete, onToggle }) {
  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table
        aria-label={translate("لیست کاربران")}
        sx={{
          width: "100%",
          minWidth: 980,
          tableLayout: "fixed",
          "& .MuiTableCell-root": {
            px: 2,
            textAlign: "center",
            verticalAlign: "middle",
          },
          "& .MuiTableCell-root:nth-of-type(1)": { width: "22%", textAlign: "right" },
          "& .MuiTableCell-root:nth-of-type(2)": { width: "16%" },
          "& .MuiTableCell-root:nth-of-type(3)": { width: "11%" },
          "& .MuiTableCell-root:nth-of-type(4)": { width: "11%" },
          "& .MuiTableCell-root:nth-of-type(5)": { width: "11%" },
          "& .MuiTableCell-root:nth-of-type(6)": { width: "15%" },
          "& .MuiTableCell-root:nth-of-type(7)": { width: "14%" },
        }}
      >
        <TableHead>
          <TableRow sx={{ bgcolor: "#000000" }}>
            {["کاربر", "شماره موبایل", "نقش", "اشتراک", "وضعیت", "تاریخ عضویت", "عملیات"].map((label) => (
              <TableCell
                key={label}
                sx={{
                  py: 2,
                  borderColor: "rgba(255,255,255,0.16)",
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
          {users.map((user) => {
            const role = roleMeta[user.role] || roleMeta.user;
            const subscription = subscriptionMeta[user.subscription] || subscriptionMeta.free;
            const active = user.isActive !== false;

            return (
              <TableRow
                key={user._id}
                sx={{
                  opacity: active ? 1 : 0.58,
                  transition: "background-color 160ms ease, opacity 160ms ease",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
                  "&:last-child td": { borderBottom: 0 },
                }}
              >
                <TableCell sx={{ py: 1.5, borderColor: "rgba(255,255,255,0.12)" }}>
                  <Stack
                    sx={{
                      width: "100%",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 1.25,
                    }}
                  >
                    <Avatar
                      src={user.avatarUrl || undefined}
                      alt={user.username || ""}
                      sx={{
                        width: 42,
                        height: 42,
                        color: "#000000",
                        bgcolor: "primary.main",
                        fontSize: 16,
                        fontWeight: 900,
                      }}
                    >
                      {getInitials(user.username)}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography
                        sx={{
                          overflow: "hidden",
                          fontSize: 14,
                          fontWeight: 800,
                          textAlign: "right",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {user.username || "بدون نام"}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell
                  sx={{
                    borderColor: "rgba(255,255,255,0.12)",
                    color: "text.secondary",
                    fontSize: 13,
                    direction: "ltr",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.phone || "—"}
                </TableCell>
                <TableCell sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <Chip
                    label={translate(role.label)}
                    sx={{
                      height: 24,
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
                    borderColor: "rgba(255,255,255,0.12)",
                    color: subscription.color,
                    fontSize: 13,
                    fontWeight: 800,
                    whiteSpace: "nowrap",
                  }}
                >
                  {translate(subscription.label)}
                </TableCell>
                <TableCell sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <Chip
                    label={active ? "فعال" : "غیرفعال"}
                    sx={{
                      height: 24,
                      minWidth: 74,
                      color: active ? "success.light" : "text.secondary",
                      bgcolor: active ? "rgba(46,125,50,0.16)" : "rgba(255,255,255,0.06)",
                      border: "1px solid",
                      borderColor: active ? "rgba(102,187,106,0.38)" : "rgba(255,255,255,0.16)",
                      "& .MuiChip-label": { fontSize: 12, fontWeight: 800 },
                    }}
                  />
                </TableCell>
                <TableCell
                  sx={{
                    borderColor: "rgba(255,255,255,0.12)",
                    color: "text.secondary",
                    fontSize: 13,
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatJoinDate(user.createdAt)}
                </TableCell>
                <TableCell sx={{ borderColor: "rgba(255,255,255,0.12)" }}>
                  <UserActions
                    user={user}
                    currentUser={currentUser}
                    disabled={processingId === user._id}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggle={onToggle}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
