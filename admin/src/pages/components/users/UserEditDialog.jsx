import { useEffect, useMemo, useReducer } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FiCheck, FiEdit2, FiX } from "react-icons/fi";
import { HandleReduce } from "../../../../../src/utils/HandleReducer";
import { roleMeta, roleOptions, subscriptionMeta, subscriptionOptions } from "./userMetadata";

const emptyState = {
  form: { username: "", phone: "", role: "user", subscription: "free" },
  step: "form",
  saving: false,
  error: "",
};

function createState(user) {
  return {
    ...emptyState,
    form: {
      username: user?.username || "",
      phone: user?.phone || "",
      role: user?.role || "user",
      subscription: user?.subscription || "free",
    },
  };
}

function editDialogReducer(state, action) {
  if (action.type === "reset") return action.payload;
  if (action.type === "merge") return { ...state, ...action.payload };
  if (action.type === "field") {
    return {
      ...state,
      form: { ...state.form, [action.payload.field]: action.payload.value },
      error: "",
    };
  }
  return { ...state, [action.type]: action.payload };
}

export default function UserEditDialog({ open, user, currentUserRole, onClose, onConfirm }) {
  const [state, dispatch] = useReducer(editDialogReducer, user, createState);
  const handleReducer = useMemo(() => HandleReduce(dispatch), []);

  useEffect(() => {
    if (open) handleReducer("reset", createState(user));
  }, [handleReducer, open, user]);

  const setField = (field, value) => {
    handleReducer("field", { field, value });
  };

  const requestConfirmation = () => {
    const username = state.form.username.trim();
    const phone = state.form.phone.trim();
    if (!username) {
      handleReducer("error", "نام کاربر را وارد کنید");
      return;
    }
    if (phone && !/^09[0-9]{9}$/.test(phone)) {
      handleReducer("error", "شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد");
      return;
    }
    handleReducer("merge", {
      form: { ...state.form, username, phone },
      step: "confirm",
      error: "",
    });
  };

  const submit = async () => {
    handleReducer("merge", { saving: true, error: "" });
    try {
      await onConfirm(state.form);
    } catch (error) {
      handleReducer("merge", {
        saving: false,
        error: error.message || "ویرایش کاربر انجام نشد",
      });
    }
  };

  const isOwnerTarget = user?.role === "owner";
  const canChangeRole = currentUserRole === "owner";

  return (
    <Dialog
      open={open}
      onClose={state.saving ? undefined : onClose}
      aria-labelledby="edit-user-dialog-title"
      sx={{
        "& .MuiDialog-paper": {
          width: "min(100% - 32px, 520px)",
          maxWidth: 520,
          border: "1px solid rgba(255,255,255,0.18)",
          bgcolor: "#0f0f0f",
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle id="edit-user-dialog-title" sx={{ fontSize: 20, fontWeight: 900 }}>
        {state.step === "form" ? "ویرایش کاربر" : "تأیید ویرایش"}
      </DialogTitle>
      <DialogContent sx={{ pt: "10px !important" }}>
        {state.error && <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>{state.error}</Alert>}

        {state.step === "form" ? (
          <Stack sx={{ gap: 2 }}>
            <TextField
              autoFocus
              value={state.form.username}
              onChange={(event) => setField("username", event.target.value)}
              placeholder="نام کاربر"
              inputProps={{ "aria-label": "نام کاربر", maxLength: 120 }}
              sx={{ width: "100%" }}
            />
            <TextField
              value={state.form.phone}
              onChange={(event) => setField("phone", event.target.value.replace(/\D/g, "").slice(0, 11))}
              placeholder="شماره موبایل (اختیاری)"
              inputProps={{ "aria-label": "شماره موبایل اختیاری", inputMode: "numeric" }}
              sx={{ width: "100%", "& input": { direction: "ltr", textAlign: "right" } }}
            />
            <Select
              value={state.form.role}
              onChange={(event) => setField("role", event.target.value)}
              disabled={!canChangeRole || isOwnerTarget && currentUserRole !== "owner"}
              inputProps={{ "aria-label": "نقش کاربر" }}
              sx={{ width: "100%" }}
            >
              {roleOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
            <Select
              value={state.form.subscription}
              onChange={(event) => setField("subscription", event.target.value)}
              inputProps={{ "aria-label": "نوع اشتراک" }}
              sx={{ width: "100%" }}
            >
              {subscriptionOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
              ))}
            </Select>
          </Stack>
        ) : (
          <Stack sx={{ gap: 2 }}>
            <Typography sx={{ color: "text.secondary", lineHeight: 1.9 }}>
              آیا از ذخیره تغییرات این کاربر مطمئن هستید؟
            </Typography>
            <Box sx={{ p: 2, borderRadius: "12px", bgcolor: "rgba(255,255,255,0.06)" }}>
              <Typography sx={{ fontWeight: 900 }}>{state.form.username}</Typography>
              <Typography sx={{ mt: 0.75, color: "text.secondary", direction: "ltr", textAlign: "right" }}>
                {state.form.phone || "بدون شماره موبایل"}
              </Typography>
              <Typography sx={{ mt: 0.75, color: "text.secondary", fontSize: 13 }}>
                {roleMeta[state.form.role]?.label} • {subscriptionMeta[state.form.subscription]?.label}
              </Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {state.step === "confirm" && (
          <Button
            disabled={state.saving}
            onClick={() => handleReducer("merge", { step: "form", error: "" })}
            sx={{ color: "text.secondary", fontWeight: 800 }}
          >
            بازگشت
          </Button>
        )}
        <Button
          disabled={state.saving}
          startIcon={<FiX aria-hidden />}
          onClick={onClose}
          sx={{
            color: "text.secondary",
            fontWeight: 800,
            gap: 0.75,
            "& .MuiButton-startIcon": { m: 0 },
            "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "text.primary" },
          }}
        >
          انصراف
        </Button>
        <Button
          variant="contained"
          disabled={state.saving}
          startIcon={state.saving ? <CircularProgress sx={{ width: 16, height: 16 }} /> : state.step === "form" ? <FiEdit2 aria-hidden /> : <FiCheck aria-hidden />}
          onClick={state.step === "form" ? requestConfirmation : submit}
          sx={{
            minWidth: 140,
            minHeight: 42,
            color: "#ffffff",
            bgcolor: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.28)",
            fontWeight: 900,
            gap: 0.75,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            "& .MuiButton-startIcon": { m: 0 },
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.16)",
              borderColor: "rgba(255,255,255,0.42)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            },
            "&.Mui-disabled": {
              color: "rgba(255,255,255,0.46)",
              bgcolor: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.1)",
            },
          }}
        >
          {state.saving ? "در حال ذخیره..." : state.step === "form" ? "ادامه" : "تأیید و ذخیره"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
