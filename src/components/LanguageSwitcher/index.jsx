import Button from "@mui/material/Button";
import { FiGlobe } from "react-icons/fi";
import { getLanguage, toggleLanguage } from "../../i18n/runtime";

export default function LanguageSwitcher({ compact = false, floating = false }) {
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
        position: floating ? "fixed" : "static",
        insetBlockStart: floating ? 14 : "auto",
        insetInlineEnd: floating ? 16 : "auto",
        zIndex: floating ? theme.zIndex.tooltip + 1 : "auto",
        width: floating ? "auto" : "100%",
        minWidth: 0,
        px: compact ? 0.8 : 1.4,
        py: 0.8,
        justifyContent: compact ? "center" : "flex-start",
        gap: 0.5,
        border: "1px solid var(--tm-border)",
        borderRadius: 999,
        bgcolor: "color-mix(in srgb, var(--tm-surface-elevated-strong) 92%, transparent)",
        color: "var(--tm-text)",
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
          borderColor: "var(--tm-accent-border)",
          bgcolor: "var(--tm-primary-soft)",
        },
      })}
    >
      {compact ? null : nextLanguageLabel}
    </Button>
  );
}
