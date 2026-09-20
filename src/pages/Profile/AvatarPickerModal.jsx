import { useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Fade,
  IconButton,
  Modal,
  Typography,
} from "@mui/material";
import {
  CheckRounded,
  CloseRounded,
  CloudUploadRounded,
  ImageRounded,
  PaletteRounded,
  RestartAltRounded,
} from "@mui/icons-material";
import { profileApi } from "../../services/api";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function AvatarPickerModal({
  currentAvatar,
  displayName,
  onClose,
  onSaved,
  open,
}) {
  const [tab, setTab] = useState("presets");
  const [presets, setPresets] = useState([]);
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatar || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setTab("presets");
    setSelectedAvatar(currentAvatar || "");
    setSelectedFile(null);
    setPreviewUrl("");
    setError("");
    setLoading(true);
    profileApi.getAvatars()
      .then((response) => {
        if (active) setPresets(response.data || []);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || "دریافت آواتارها ناموفق بود");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [currentAvatar, open]);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const preview = previewUrl || selectedAvatar;
  const initials = useMemo(() => displayName.trim().slice(0, 2) || "؟", [displayName]);
  const hasChanges = Boolean(selectedFile) || selectedAvatar !== (currentAvatar || "");

  const chooseFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_TYPES.has(file.type)) {
      setError("فرمت تصویر باید JPG، PNG یا WebP باشد.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      setError("حجم تصویر نباید بیشتر از ۵ مگابایت باشد.");
      return;
    }
    setError("");
    setSelectedFile(file);
    setSelectedAvatar("");
    setPreviewUrl(URL.createObjectURL(file));
  };

  const choosePreset = (url) => {
    setSelectedFile(null);
    setPreviewUrl("");
    setSelectedAvatar(url);
    setError("");
  };

  const saveAvatar = async () => {
    if (!hasChanges || saving) return;
    setSaving(true);
    setError("");
    try {
      const response = selectedFile
        ? await profileApi.uploadAvatar(selectedFile)
        : await profileApi.update({ avatarUrl: selectedAvatar });
      onSaved(response.data);
    } catch (requestError) {
      setError(requestError.message || "ذخیره تصویر پروفایل ناموفق بود");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={saving ? undefined : onClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 250,
          sx: {
            bgcolor: "rgba(5, 2, 14, 0.82)",
            backdropFilter: "blur(8px)",
          },
        },
      }}
      aria-labelledby="avatar-picker-title"
      aria-describedby="avatar-picker-description"
    >
      <Fade in={open}>
        <Box
          dir="rtl"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "min(calc(100% - 24px), 680px)",
            maxHeight: "calc(100dvh - 32px)",
            overflowY: "auto",
            border: "1px solid var(--tm-border-strong)",
            borderRadius: { xs: "20px", sm: "26px" },
            bgcolor: "var(--tm-surface-solid)",
            backgroundImage: "radial-gradient(circle at 15% 0%, var(--tm-primary-soft), transparent 38%), linear-gradient(160deg, var(--tm-surface-1), var(--tm-surface-2))",
            boxShadow: "0 34px 90px rgba(0, 0, 0, 0.62), 0 0 50px var(--tm-primary-glow)",
            p: { xs: 2, sm: 3 },
            outline: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography id="avatar-picker-title" component="h2" sx={{ color: "var(--tm-text)", fontSize: { xs: "1.2rem", sm: "1.45rem" }, fontWeight: 900 }}>
                انتخاب تصویر پروفایل
              </Typography>
              <Typography id="avatar-picker-description" sx={{ color: "var(--tm-text-muted)", mt: 0.5, fontSize: "0.83rem" }}>
                یک آواتار آماده انتخاب کنید یا تصویر خودتان را بارگذاری کنید.
              </Typography>
            </Box>
            <IconButton
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="بستن"
              sx={{
                flex: "0 0 auto",
                width: 42,
                height: 42,
                color: "var(--tm-text-muted)",
                border: "1px solid var(--tm-border-soft)",
                bgcolor: "rgba(255, 255, 255, 0.035)",
                "&:hover": { bgcolor: "var(--tm-primary-soft)", color: "var(--tm-text)" },
              }}
            >
              <CloseRounded />
            </IconButton>
          </Box>

          <Box sx={{ display: "grid", placeItems: "center", py: { xs: 2.5, sm: 3 } }}>
            <Box sx={{ position: "relative" }}>
              <Avatar
                src={preview || undefined}
                alt={preview ? `تصویر پروفایل ${displayName}` : undefined}
                sx={{
                  width: { xs: 108, sm: 126 },
                  height: { xs: 108, sm: 126 },
                  color: "var(--tm-text)",
                  bgcolor: "var(--tm-surface-elevated)",
                  border: "4px solid var(--tm-primary)",
                  boxShadow: "0 0 0 7px var(--tm-primary-tint), 0 0 34px var(--tm-primary-glow)",
                  fontSize: "2rem",
                  fontWeight: 900,
                }}
              >
                {initials}
              </Avatar>
              <Box sx={{ position: "absolute", insetInlineEnd: -4, bottom: 4, width: 32, height: 32, borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff", bgcolor: "var(--tm-primary)", border: "3px solid var(--tm-surface-solid)", boxShadow: "0 5px 14px rgba(0, 0, 0, 0.35)" }}>
                <ImageRounded sx={{ fontSize: 17 }} />
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, p: 0.5, borderRadius: "14px", border: "1px solid var(--tm-border-subtle)", bgcolor: "rgba(0, 0, 0, 0.18)" }}>
            <Button
              type="button"
              onClick={() => setTab("presets")}
              aria-pressed={tab === "presets"}
              sx={{ minHeight: 44, gap: 1, color: tab === "presets" ? "#fff" : "var(--tm-text-muted)", bgcolor: tab === "presets" ? "var(--tm-primary)" : "transparent", backgroundImage: tab === "presets" ? "linear-gradient(135deg, var(--tm-primary), var(--tm-primary-strong))" : "none", boxShadow: tab === "presets" ? "0 10px 24px var(--tm-primary-glow)" : "none", "&:hover": { bgcolor: tab === "presets" ? "var(--tm-primary)" : "var(--tm-primary-soft)" } }}
            >
              <PaletteRounded sx={{ fontSize: 20 }} />
              آواتارهای آماده
            </Button>
            <Button
              type="button"
              onClick={() => setTab("upload")}
              aria-pressed={tab === "upload"}
              sx={{ minHeight: 44, gap: 1, color: tab === "upload" ? "#fff" : "var(--tm-text-muted)", bgcolor: tab === "upload" ? "var(--tm-primary)" : "transparent", backgroundImage: tab === "upload" ? "linear-gradient(135deg, var(--tm-primary), var(--tm-primary-strong))" : "none", boxShadow: tab === "upload" ? "0 10px 24px var(--tm-primary-glow)" : "none", "&:hover": { bgcolor: tab === "upload" ? "var(--tm-primary)" : "var(--tm-primary-soft)" } }}
            >
              <CloudUploadRounded sx={{ fontSize: 20 }} />
              آپلود تصویر
            </Button>
          </Box>

          <Box sx={{ minHeight: { xs: 220, sm: 250 }, mt: 2 }}>
            {tab === "presets" ? (
              loading ? (
                <Box sx={{ minHeight: 220, display: "grid", placeItems: "center" }}>
                  <CircularProgress size={34} sx={{ color: "var(--tm-primary)" }} />
                </Box>
              ) : (
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, minmax(0, 1fr))", sm: "repeat(6, minmax(0, 1fr))" }, gap: { xs: 1, sm: 1.25 } }}>
                  {presets.map((avatar, index) => {
                    const selected = !selectedFile && selectedAvatar === avatar.url;
                    return (
                      <Button
                        key={avatar.id}
                        type="button"
                        onClick={() => choosePreset(avatar.url)}
                        aria-label={`انتخاب آواتار ${index + 1}`}
                        aria-pressed={selected}
                        sx={{ position: "relative", minWidth: 0, width: "100%", aspectRatio: "1", p: "5px", borderRadius: "16px", border: selected ? "2px solid var(--tm-primary)" : "1px solid var(--tm-border-subtle)", bgcolor: selected ? "var(--tm-primary-soft)" : "rgba(255,255,255,0.025)", boxShadow: selected ? "0 0 20px var(--tm-primary-glow)" : "none", "&:hover": { bgcolor: "var(--tm-primary-soft)", borderColor: "var(--tm-border-strong)", transform: "translateY(-2px)" }, transition: "transform 160ms ease, border-color 160ms ease, background-color 160ms ease" }}
                      >
                        <Avatar src={avatar.url} alt="" sx={{ width: "100%", height: "100%", borderRadius: "12px" }} />
                        {selected && (
                          <Box sx={{ position: "absolute", top: 4, insetInlineStart: 4, width: 22, height: 22, display: "grid", placeItems: "center", borderRadius: "50%", bgcolor: "#fff", color: "var(--tm-primary-strong)", boxShadow: "0 4px 12px rgba(0,0,0,.35)" }}>
                            <CheckRounded sx={{ fontSize: 17 }} />
                          </Box>
                        )}
                      </Button>
                    );
                  })}
                </Box>
              )
            ) : (
              <Box sx={{ minHeight: 220, display: "grid", placeItems: "center", alignContent: "center", gap: 1.5, px: 2, borderRadius: "18px", border: "1px dashed var(--tm-border-strong)", bgcolor: "rgba(255, 255, 255, 0.025)", textAlign: "center" }}>
                <CloudUploadRounded sx={{ fontSize: 46, color: "var(--tm-text-accent)" }} />
                <Typography sx={{ color: "var(--tm-text)", fontWeight: 800 }}>تصویر دلخواهتان را انتخاب کنید</Typography>
                <Typography sx={{ color: "var(--tm-text-muted)", fontSize: "0.78rem" }}>JPG، PNG یا WebP تا حداکثر ۵ مگابایت</Typography>
                <Button component="label" sx={{ mt: 0.5, minHeight: 42, px: 3, gap: 1, color: "#fff", bgcolor: "var(--tm-primary)", backgroundImage: "linear-gradient(135deg, var(--tm-primary), var(--tm-primary-strong))", "&:hover": { bgcolor: "var(--tm-primary-strong)" } }}>
                  <CloudUploadRounded sx={{ fontSize: 20 }} />
                  انتخاب فایل
                  <Box component="input" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} sx={{ display: "none" }} />
                </Button>
                {selectedFile && <Typography sx={{ maxWidth: "100%", color: "var(--tm-text-accent)", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedFile.name}</Typography>}
              </Box>
            )}
          </Box>

          {error && (
            <Typography role="alert" sx={{ color: "#ffaaaa", bgcolor: "rgba(255, 75, 95, 0.1)", border: "1px solid rgba(255, 100, 120, 0.24)", borderRadius: "12px", px: 1.5, py: 1, mt: 1.5, fontSize: "0.82rem" }}>
              {error}
            </Typography>
          )}

          <Button
            type="button"
            onClick={() => choosePreset("")}
            sx={{ width: "100%", minHeight: 48, mt: 2, gap: 1, color: "var(--tm-text-muted)", border: "1px solid var(--tm-border-subtle)", bgcolor: "rgba(255,255,255,0.025)", "&:hover": { bgcolor: "var(--tm-primary-soft)", color: "var(--tm-text)" } }}
          >
            <RestartAltRounded sx={{ fontSize: 21 }} />
            بازگشت به آواتار پیش‌فرض
          </Button>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25, mt: 1.5 }}>
            <Button type="button" onClick={saveAvatar} disabled={!hasChanges || saving} sx={{ minHeight: 48, gap: 1, color: "#fff", bgcolor: "var(--tm-primary)", backgroundImage: "linear-gradient(135deg, var(--tm-primary), var(--tm-primary-strong))", boxShadow: "0 14px 28px var(--tm-primary-glow)", "&:hover": { bgcolor: "var(--tm-primary-strong)" }, "&.Mui-disabled": { color: "rgba(255,255,255,.5)", bgcolor: "rgba(255,255,255,.08)", backgroundImage: "none" } }}>
              {saving ? <CircularProgress size={21} sx={{ color: "inherit" }} /> : <ImageRounded sx={{ fontSize: 20 }} />}
              {saving ? "در حال ذخیره…" : "ذخیره تصویر"}
            </Button>
            <Button type="button" onClick={onClose} disabled={saving} sx={{ minHeight: 48, color: "var(--tm-text-muted)", border: "1px solid var(--tm-border-subtle)", bgcolor: "rgba(255,255,255,0.025)", "&:hover": { bgcolor: "rgba(255,255,255,0.06)", color: "var(--tm-text)" } }}>
              انصراف
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
