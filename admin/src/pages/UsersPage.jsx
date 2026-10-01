import { useCallback, useEffect, useMemo, useReducer } from "react";
import { FiUsers } from "react-icons/fi";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { useOutletContext } from "react-router-dom";
import { adminApiRequest } from "../auth/adminSession";
import { translate } from "../i18n/runtime";
import { HandleReduce } from "../../../src/utils/HandleReducer";
import UserActionDialog from "./components/users/UserActionDialog";
import UserEditDialog from "./components/users/UserEditDialog";
import UsersFilters from "./components/users/UsersFilters";
import UsersHeader from "./components/users/UsersHeader";
import UsersPagination from "./components/users/UsersPagination";
import UsersTable from "./components/users/UsersTable";
import { filterUsers, hasActiveUserFilters, paginateUsers } from "./components/users/userListUtils";

const defaultFilters = {
  query: "",
  role: "all",
  subscription: "all",
  status: "all",
};

const initialState = {
  users: [],
  loading: true,
  error: "",
  notice: "",
  editingUser: null,
  pendingAction: null,
  processingId: "",
  actionError: "",
  filters: defaultFilters,
  page: 1,
  rowsPerPage: 5,
};

function usersPageReducer(state, action) {
  if (action.type === "merge") return { ...state, ...action.payload };
  if (action.type === "replaceUser") {
    return {
      ...state,
      users: state.users.map((user) => user._id === action.payload._id ? action.payload : user),
    };
  }
  if (action.type === "removeUser") {
    return { ...state, users: state.users.filter((user) => user._id !== action.payload) };
  }
  return { ...state, [action.type]: action.payload };
}

export default function UsersPage() {
  const { adminUser } = useOutletContext();
  const [state, dispatch] = useReducer(usersPageReducer, initialState);
  const handleReducer = useMemo(() => HandleReduce(dispatch), []);

  const loadUsers = useCallback(async () => {
    handleReducer("merge", { loading: true, error: "" });
    try {
      const response = await adminApiRequest("/api/admin/users");
      handleReducer("merge", { users: response.data || [], loading: false, error: "" });
    } catch (error) {
      handleReducer("merge", {
        loading: false,
        error: error.message || "دریافت لیست کاربران انجام نشد",
      });
    }
  }, [handleReducer]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    return filterUsers(state.users, state.filters);
  }, [state.filters, state.users]);

  const pagination = useMemo(
    () => paginateUsers(filteredUsers, state.page, state.rowsPerPage),
    [filteredUsers, state.page, state.rowsPerPage],
  );
  const { page: currentPage, pageCount, visibleUsers } = pagination;
  const hasActiveFilters = hasActiveUserFilters(state.filters);

  useEffect(() => {
    if (state.page !== currentPage) handleReducer("page", currentPage);
  }, [currentPage, handleReducer, state.page]);

  const updateFilter = (field, value) => {
    handleReducer("merge", {
      filters: { ...state.filters, [field]: value },
      page: 1,
    });
  };

  const resetFilters = () => {
    handleReducer("merge", { filters: defaultFilters, page: 1 });
  };

  const saveUser = async (form) => {
    const response = await adminApiRequest(`/api/admin/users/${state.editingUser._id}`, {
      method: "PATCH",
      body: JSON.stringify(form),
    });
    handleReducer("replaceUser", response.data);
    handleReducer("merge", { editingUser: null, notice: "تغییرات کاربر ذخیره شد" });
  };

  const openToggleConfirmation = (user) => {
    handleReducer("merge", {
      pendingAction: { type: user.isActive === false ? "activate" : "deactivate", user },
      actionError: "",
    });
  };

  const runPendingAction = async () => {
    const action = state.pendingAction;
    if (!action) return;

    handleReducer("merge", { processingId: action.user._id, actionError: "" });
    try {
      if (action.type === "delete") {
        await adminApiRequest(`/api/admin/users/${action.user._id}`, { method: "DELETE" });
        handleReducer("removeUser", action.user._id);
        handleReducer("merge", {
          pendingAction: null,
          processingId: "",
          actionError: "",
          notice: "کاربر حذف شد",
        });
        return;
      }

      const isActive = action.type === "activate";
      const response = await adminApiRequest(`/api/admin/users/${action.user._id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      handleReducer("replaceUser", response.data);
      handleReducer("merge", {
        pendingAction: null,
        processingId: "",
        actionError: "",
        notice: isActive ? "حساب کاربر فعال شد" : "حساب کاربر غیرفعال شد",
      });
    } catch (error) {
      handleReducer("merge", {
        processingId: "",
        actionError: error.message || "انجام عملیات ممکن نشد",
      });
    }
  };

  return (
    <Stack sx={{ gap: 3 }}>
      <UsersHeader
        loading={state.loading}
        totalCount={state.users.length}
        filteredCount={filteredUsers.length}
        hasActiveFilters={hasActiveFilters}
        onRefresh={loadUsers}
      />

      {state.error && (
        <Alert
          severity="error"
          action={<Button onClick={loadUsers} sx={{ color: "inherit", fontWeight: 800 }}>{translate("تلاش مجدد")}</Button>}
          sx={{ borderRadius: "12px", alignItems: "center" }}
        >
          {state.error}
        </Alert>
      )}

      <UsersFilters
        filters={state.filters}
        filteredCount={filteredUsers.length}
        totalCount={state.users.length}
        hasActiveFilters={hasActiveFilters}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      <Paper
        sx={{
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.18)",
          bgcolor: "#0f0f0f",
          backgroundImage: "none",
          boxShadow: "0 18px 60px rgba(0,0,0,0.32)",
        }}
      >
        {state.loading ? (
          <Stack sx={{ minHeight: 300, alignItems: "center", justifyContent: "center", gap: 2 }}>
            <CircularProgress sx={{ width: 38, height: 38 }} />
            <Typography sx={{ color: "text.secondary", fontSize: 14 }}>{translate("در حال دریافت کاربران...")}</Typography>
          </Stack>
        ) : state.users.length === 0 ? (
          <Stack sx={{ minHeight: 300, alignItems: "center", justifyContent: "center", gap: 1.5 }}>
            <Box sx={{ color: "primary.main", fontSize: 42, lineHeight: 0 }}><FiUsers aria-hidden /></Box>
            <Typography sx={{ fontSize: 17, fontWeight: 800 }}>{translate("کاربری پیدا نشد")}</Typography>
          </Stack>
        ) : filteredUsers.length === 0 ? (
          <Stack sx={{ minHeight: 300, alignItems: "center", justifyContent: "center", gap: 1.5 }}>
            <Box sx={{ color: "text.secondary", fontSize: 42, lineHeight: 0 }}><FiUsers aria-hidden /></Box>
            <Typography sx={{ fontSize: 17, fontWeight: 800 }}>نتیجه‌ای با این فیلترها پیدا نشد</Typography>
            <Button
              variant="outlined"
              onClick={resetFilters}
              sx={{
                mt: 0.5,
                minHeight: 40,
                px: 2,
                borderColor: "rgba(255,255,255,0.24)",
                color: "text.primary",
                fontWeight: 800,
              }}
            >
              پاک‌کردن فیلترها
            </Button>
          </Stack>
        ) : (
          <>
            <UsersTable
              users={visibleUsers}
              currentUser={adminUser}
              processingId={state.processingId}
              onEdit={(user) => handleReducer("editingUser", user)}
              onDelete={(user) => handleReducer("merge", { pendingAction: { type: "delete", user }, actionError: "" })}
              onToggle={openToggleConfirmation}
            />
            <UsersPagination
              page={currentPage}
              pageCount={pageCount}
              rowsPerPage={state.rowsPerPage}
              total={filteredUsers.length}
              onPageChange={(page) => handleReducer("page", page)}
              onRowsPerPageChange={(rowsPerPage) => handleReducer("merge", { rowsPerPage, page: 1 })}
            />
          </>
        )}
      </Paper>

      <UserEditDialog
        open={Boolean(state.editingUser)}
        user={state.editingUser}
        currentUserRole={adminUser?.role}
        onClose={() => handleReducer("editingUser", null)}
        onConfirm={saveUser}
      />
      <UserActionDialog
        action={state.pendingAction}
        processing={Boolean(state.processingId)}
        error={state.actionError}
        onClose={() => handleReducer("merge", { pendingAction: null, actionError: "" })}
        onConfirm={runPendingAction}
      />
      <Snackbar
        open={Boolean(state.notice)}
        autoHideDuration={3200}
        onClose={() => handleReducer("notice", "")}
        message={state.notice}
        sx={{ "& .MuiSnackbarContent-root": { bgcolor: "#ffffff", color: "#000000", fontWeight: 800 } }}
      />
    </Stack>
  );
}
