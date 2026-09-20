import { Button } from "@mui/material";
import { FiGlobe } from "react-icons/fi";
import { getLanguage, toggleLanguage } from "../i18n/runtime";

export default function LanguageSwitcher({ compact = false }) {
  const language = getLanguage();
  const nextLanguageLabel = language === "fa" ? "English" : "فارسی";
  const ariaLabel = language === "fa" ? "Switch language to English" : "تغییر زبان به فارسی";

  return (
    <Button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={toggleLanguage}
      startIcon={<FiGlobe aria-hidden />}
      sx={(theme) => ({
        position: "static",
        zIndex: theme.zIndex.drawer + 1,
        width: "100%",
        minWidth: 0,
        px: compact ? 0.8 : 1.4,
        py: 0.8,
        justifyContent: compact ? "center" : "flex-start",
        gap: 0.5,
        border: "1px solid rgba(153, 126, 255, 0.45)",
        borderRadius: 999,
        bgcolor: "rgba(23, 16, 45, 0.9)",
        color: "text.primary",
        boxShadow: "0 10px 28px rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(14px)",
        fontSize: 12,
        fontWeight: 800,
        lineHeight: 1.5,
        textTransform: "none",
        "& .MuiButton-startIcon": {
          m: 0,
          fontSize: 17,
        },
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: "rgba(149, 118, 255, 0.18)",
        },
      })}
    >
      {compact ? null : nextLanguageLabel}
    </Button>
  );
}
