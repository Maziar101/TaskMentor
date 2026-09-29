export const avatarTabSx = (active) => ({
  minHeight: 44,
  gap: 1,
  color: active ? "var(--tm-text)" : "var(--tm-text-muted)",
  border: "1px solid",
  borderColor: active ? "rgba(255, 255, 255, 0.16)" : "transparent",
  bgcolor: active ? "rgba(255, 255, 255, 0.075)" : "transparent",
  backgroundImage: active
    ? "linear-gradient(145deg, rgba(255,255,255,0.13), rgba(255,255,255,0.035))"
    : "none",
  boxShadow: active
    ? "inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 26px rgba(0,0,0,0.2)"
    : "none",
  backdropFilter: active ? "blur(14px) saturate(140%)" : "none",
  WebkitBackdropFilter: active ? "blur(14px) saturate(140%)" : "none",
  "&:hover": {
    bgcolor: active ? "rgba(255, 255, 255, 0.11)" : "var(--tm-primary-soft)",
    color: "var(--tm-text)",
  },
});

export const glassActionButtonSx = {
  color: "var(--tm-text)",
  border: "1px solid rgba(255, 255, 255, 0.18)",
  bgcolor: "rgba(255, 255, 255, 0.08)",
  backgroundImage: "linear-gradient(145deg, rgba(255,255,255,0.14), rgba(255,255,255,0.04))",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.13), 0 12px 28px rgba(0,0,0,0.24)",
  backdropFilter: "blur(14px) saturate(140%)",
  WebkitBackdropFilter: "blur(14px) saturate(140%)",
  "&:hover": {
    color: "var(--tm-text)",
    bgcolor: "rgba(255, 255, 255, 0.13)",
    backgroundImage: "linear-gradient(145deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
  },
  "&.Mui-disabled": {
    color: "rgba(255,255,255,.5)",
    borderColor: "rgba(255,255,255,.08)",
    bgcolor: "rgba(255,255,255,.04)",
    backgroundImage: "none",
    boxShadow: "none",
  },
};
