export const textFieldSx = {
  width: "100%",
  "& .MuiOutlinedInput-root": {
    borderRadius: "14px",
    bgcolor: "var(--tm-surface-elevated)",
    "& fieldset": { borderColor: "var(--tm-border-soft)" },
    "&:hover fieldset": { borderColor: "var(--tm-accent-border)" },
    "&.Mui-focused fieldset": { borderColor: "var(--tm-accent)" },
  },
  "& .MuiInputBase-input, & .MuiInputAdornment-root": {
    color: "var(--tm-text)",
  },
};

export const primaryButtonSx = {
  width: "100%",
  minHeight: 46,
  border: "1px solid transparent",
  bgcolor: "var(--tm-accent)",
  color: "var(--tm-on-accent)",
  boxShadow: "0 10px 24px var(--tm-accent-glow)",
  "&:hover": { bgcolor: "var(--tm-primary)" },
  'html[data-accent-theme="monochrome"] &': {
    borderColor: "var(--tm-border-strong)",
    bgcolor: "#0f0f0f",
    backgroundImage: "linear-gradient(145deg, #181818, #0f0f0f)",
    color: "#ffffff",
    boxShadow: "0 12px 28px rgba(0, 0, 0, 0.46)",
    "&:hover": {
      borderColor: "#ffffff",
      bgcolor: "#181818",
      backgroundImage: "none",
    },
    "&.Mui-disabled": {
      borderColor: "var(--tm-border-soft)",
      bgcolor: "#0f0f0f",
      backgroundImage: "none",
      color: "rgba(255, 255, 255, 0.42)",
    },
  },
};
