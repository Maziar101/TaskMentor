import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { FiAlertTriangle, FiPhone, FiUser, FiUserX, FiX } from "react-icons/fi";
import ChatAvatar from "./ChatAvatar";

const dialogPaperSx = {
  width: "min(430px, calc(100vw - 32px))",
  m: 2,
  border: "1px solid rgba(153, 126, 255, 0.28)",
  borderRadius: 4,
  bgcolor: "#17102d",
  backgroundImage: "linear-gradient(155deg, rgba(32, 20, 58, 0.98), rgba(15, 9, 29, 0.98))",
  color: "text.primary",
  boxShadow: "0 28px 80px rgba(0, 0, 0, 0.52)",
};

export default function ContactProfileDialog({ open, conversation, busy, onBlock, onClose }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [blockError, setBlockError] = useState("");

  const closeProfile = () => {
    if (busy) return;
    setConfirmOpen(false);
    setBlockError("");
    onClose();
  };

  const confirmBlock = async () => {
    setBlockError("");
    const result = await onBlock();
    if (result.success) {
      setConfirmOpen(false);
      return;
    }
    setBlockError(result.error || "بلاک کردن کاربر ناموفق بود");
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={closeProfile}
        aria-labelledby="contact-profile-title"
        slotProps={{
          paper: { sx: dialogPaperSx },
          backdrop: { sx: { bgcolor: "rgba(4, 2, 10, 0.72)", backdropFilter: "blur(5px)" } },
        }}
      >
        <DialogTitle id="contact-profile-title" sx={{ p: 2.5 }}>
          <Stack sx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
            <Typography component="span" sx={{ fontSize: 17, fontWeight: 800 }}>
              پروفایل کاربر
            </Typography>
            <IconButton
              aria-label="بستن پروفایل"
              onClick={closeProfile}
              disabled={busy}
              sx={{ color: "text.secondary", "&:hover": { bgcolor: "rgba(255,255,255,0.07)" } }}
            >
              <FiX />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider sx={{ borderColor: "rgba(153, 126, 255, 0.18)" }} />

        <DialogContent sx={{ p: 2.5 }}>
          <Stack sx={{ alignItems: "center", gap: 2.5 }}>
            <Box sx={{ "& .messenger-avatar": { width: 76, height: 76, fontSize: 25 } }}>
              <ChatAvatar conversation={conversation} size="large" />
            </Box>

            <Stack sx={{ width: "100%", gap: 1.25 }}>
              <Stack
                sx={{
                  minHeight: 54,
                  px: 1.75,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 1.25,
                  border: "1px solid rgba(153, 126, 255, 0.2)",
                  borderRadius: 2.5,
                  bgcolor: "rgba(255,255,255,0.035)",
                }}
              >
                <FiUser aria-hidden />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: "text.secondary", fontSize: 11 }}>نام کاربر</Typography>
                  <Typography sx={{ mt: 0.25, fontSize: 14, fontWeight: 700 }}>{conversation.name}</Typography>
                </Box>
              </Stack>

              <Stack
                sx={{
                  minHeight: 54,
                  px: 1.75,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 1.25,
                  border: "1px solid rgba(153, 126, 255, 0.2)",
                  borderRadius: 2.5,
                  bgcolor: "rgba(255,255,255,0.035)",
                }}
              >
                <FiPhone aria-hidden />
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: "text.secondary", fontSize: 11 }}>شماره تلفن</Typography>
                  <Typography sx={{ mt: 0.25, direction: "ltr", textAlign: "start", fontSize: 14, fontWeight: 700 }}>
                    {conversation.phone || "ثبت نشده"}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            {blockError && <Alert severity="error" sx={{ width: "100%" }}>{blockError}</Alert>}

            <Button
              type="button"
              variant="outlined"
              disabled={busy || conversation.blockedByMe}
              onClick={() => { setBlockError(""); setConfirmOpen(true); }}
              sx={{
                width: "100%",
                minHeight: 48,
                gap: 1,
                borderColor: "rgba(255, 99, 132, 0.55)",
                color: "#ff7893",
                "&:hover": { borderColor: "#ff7893", bgcolor: "rgba(255, 99, 132, 0.08)" },
              }}
            >
              <FiUserX aria-hidden />
              {conversation.blockedByMe ? "این کاربر بلاک شده است" : "بلاک کردن کاربر"}
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={() => { if (!busy) setConfirmOpen(false); }}
        aria-labelledby="block-confirm-title"
        slotProps={{
          paper: { sx: { ...dialogPaperSx, width: "min(390px, calc(100vw - 32px))" } },
          backdrop: { sx: { bgcolor: "rgba(4, 2, 10, 0.82)", backdropFilter: "blur(7px)" } },
        }}
      >
        <DialogTitle id="block-confirm-title" sx={{ pt: 3, textAlign: "center" }}>
          <Box sx={{ mx: "auto", mb: 1.5, display: "grid", placeItems: "center", color: "#ff7893", fontSize: 34 }}>
            <FiAlertTriangle aria-hidden />
          </Box>
          <Typography component="span" sx={{ fontSize: 17, fontWeight: 800 }}>
            بلاک کردن {conversation.name}؟
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3, color: "text.secondary", textAlign: "center", fontSize: 13.5, lineHeight: 2 }}>
          این کاربر دیگر نمی‌تواند برای شما پیام ارسال کند. آیا از بلاک کردن او مطمئن هستید؟
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, flexDirection: "row", gap: 1 }}>
          <Button
            type="button"
            variant="outlined"
            disabled={busy}
            onClick={() => setConfirmOpen(false)}
            sx={{ flex: 1, borderColor: "rgba(255,255,255,0.16)", color: "text.secondary" }}
          >
            انصراف
          </Button>
          <Button
            type="button"
            variant="contained"
            disabled={busy}
            onClick={confirmBlock}
            sx={{ flex: 1, bgcolor: "#d9385f", color: "#fff", "&:hover": { bgcolor: "#b9294d" } }}
          >
            {busy ? "در حال بلاک…" : "تأیید و بلاک"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
