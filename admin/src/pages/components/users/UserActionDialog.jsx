import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { FiCheck, FiTrash2, FiX } from "react-icons/fi";

const copy = {
  delete: {
    title: "تأیید حذف کاربر",
    message: "این عمل قابل بازگشت نیست. آیا از حذف کامل کاربر مطمئن هستید؟",
    confirm: "بله، حذف شود",
    danger: true,
  },
  deactivate: {
    title: "تأیید غیرفعال‌سازی",
    message: "پس از غیرفعال‌سازی، این کاربر با رمز یا توکن فعلی نمی‌تواند از سیستم استفاده کند.",
    confirm: "غیرفعال شود",
    danger: true,
  },
  activate: {
    title: "تأیید فعال‌سازی",
    message: "با فعال‌سازی، کاربر دوباره امکان ورود و استفاده از حساب را خواهد داشت.",
    confirm: "فعال شود",
    danger: false,
  },
};

export default function UserActionDialog({ action, processing, error, onClose, onConfirm }) {
  const content = action ? copy[action.type] : copy.activate;

  return (
    <Dialog
      open={Boolean(action)}
      onClose={processing ? undefined : onClose}
      aria-labelledby="user-action-dialog-title"
      sx={{
        "& .MuiDialog-paper": {
          width: "min(100% - 32px, 460px)",
          maxWidth: 460,
          border: "1px solid rgba(255,255,255,0.18)",
          bgcolor: "#0f0f0f",
          backgroundImage: "none",
        },
      }}
    >
      <DialogTitle id="user-action-dialog-title" sx={{ fontSize: 20, fontWeight: 900 }}>
        {content.title}
      </DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: "12px" }}>{error}</Alert>}
        <Typography sx={{ color: "text.secondary", lineHeight: 1.9 }}>
          {content.message}
        </Typography>
        <Typography sx={{ mt: 2, fontWeight: 900 }}>{action?.user.username || "بدون نام"}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button
          disabled={processing}
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
          disabled={processing}
          startIcon={processing ? <CircularProgress sx={{ width: 16, height: 16 }} /> : content.danger ? <FiTrash2 aria-hidden /> : <FiCheck aria-hidden />}
          onClick={onConfirm}
          sx={{
            minWidth: 140,
            minHeight: 42,
            color: "#ffffff",
            bgcolor: content.danger ? "rgba(239,68,68,0.14)" : "rgba(255,255,255,0.1)",
            backdropFilter: "blur(12px)",
            border: "1px solid",
            borderColor: content.danger ? "rgba(248,113,113,0.45)" : "rgba(255,255,255,0.28)",
            fontWeight: 900,
            gap: 0.75,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
            "& .MuiButton-startIcon": { m: 0 },
            "&:hover": {
              bgcolor: content.danger ? "rgba(239,68,68,0.22)" : "rgba(255,255,255,0.16)",
              borderColor: content.danger ? "rgba(248,113,113,0.68)" : "rgba(255,255,255,0.42)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            },
            "&.Mui-disabled": {
              color: "rgba(255,255,255,0.46)",
              bgcolor: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.1)",
            },
          }}
        >
          {processing ? "در حال انجام..." : content.confirm}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
