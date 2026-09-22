import { useState } from "react";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonAddAltRoundedIcon from "@mui/icons-material/PersonAddAltRounded";
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { primaryButtonSx, textFieldSx } from "./NewChatActions.styles";

export default function AddContactDialog({ busy, open, onAdd, onClose }) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const closeDialog = () => {
    setPhone("");
    setError("");
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    const result = await onAdd(phone);
    if (result.success) closeDialog();
    else setError(result.error);
  };

  return (
    <Dialog
      open={open}
      onClose={busy ? undefined : closeDialog}
      aria-labelledby="add-contact-title"
      sx={{
        position: "fixed",
        inset: 0,
        "& .MuiDialog-container": {
          p: 1.5,
          alignItems: "center",
        },
      }}
      PaperProps={{
        sx: {
          width: "calc(100% - 24px)",
          maxWidth: 460,
          m: 0,
          border: "1px solid var(--tm-accent-border)",
          borderRadius: "18px",
          background: "linear-gradient(145deg, var(--tm-surface-elevated), var(--tm-surface-deep))",
          boxShadow: "0 28px 75px rgba(0, 0, 0, 0.55)",
          color: "var(--tm-text)",
          direction: "rtl",
        },
      }}
      slotProps={{
        backdrop: {
          sx: {
            position: "fixed",
            backgroundColor: "rgba(4, 2, 12, 0.72)",
            backdropFilter: "blur(7px)",
          },
        },
      }}
    >
      <DialogTitle
        id="add-contact-title"
        sx={{
          p: "22px 22px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1.25 }}>
          <PersonAddAltRoundedIcon sx={{ color: "var(--tm-accent)" }} />
          <Typography component="span" sx={{ fontSize: "1.05rem", fontWeight: 800 }}>
            افزودن مخاطب جدید
          </Typography>
        </Stack>
        <IconButton
          type="button"
          onClick={closeDialog}
          disabled={busy}
          aria-label="بستن"
          sx={{ color: "var(--tm-text-muted)", "&:hover": { bgcolor: "var(--tm-accent-tint)" } }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: "14px 22px 24px !important" }}>
        <Stack component="form" onSubmit={handleSubmit} sx={{ gap: 2 }}>
          <Typography sx={{ color: "var(--tm-text-muted)", fontSize: "0.8rem", lineHeight: 1.9 }}>
            شماره موبایل کاربری را وارد کنید که قبلاً در TaskMentor ثبت‌نام کرده است.
          </Typography>
          <TextField
            autoFocus
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="09xxxxxxxxx"
            inputProps={{ inputMode: "numeric", maxLength: 11, "aria-label": "شماره موبایل مخاطب" }}
            sx={[
              textFieldSx,
              { "& input": { direction: "ltr", textAlign: "left" } },
            ]}
          />
          {error && <Alert severity="error" sx={{ borderRadius: "12px" }}>{error}</Alert>}
          <Button
            type="submit"
            disabled={busy || !phone.trim()}
            sx={primaryButtonSx}
          >
            {busy ? "در حال افزودن…" : "افزودن به مخاطبین"}
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
