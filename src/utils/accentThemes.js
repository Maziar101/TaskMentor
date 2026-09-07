export const ACCENT_THEME_STORAGE_KEY = "taskmentor-accent-theme";
export const DEFAULT_ACCENT_THEME = "purple";

export const ACCENT_THEMES = {
  red: {
    label: "قرمز",
    swatch: "oklch(74.4451% 0.15501 21.503538)",
    primary: "#ff5c7a",
    primaryStrong: "#e84467",
    secondary: "#f35fa1",
    background: "#140305",
    paper: "#21070d",
    text: "#f8edf0",
    textMuted: "#d7b8c0",
    css: {
      "--tm-page-base": "oklch(8.4403% 0.034635 29.233885)",
      "--tm-page-glow-primary": "oklch(74.4451% 0.15501 21.503538 / 0.24)",
      "--tm-page-glow-secondary": "oklch(76.5693% 0.127601 358.963602 / 0.13)",
      "--tm-surface-deep": "oklch(7.8495% 0.032211 29.233885)",
      "--tm-surface-solid": "oklch(12% 0.037 29.233885)",
      "--tm-surface-1": "oklch(14% 0.04 29.233885 / 0.96)",
      "--tm-surface-2": "oklch(7.2587% 0.029786 29.233885 / 0.99)",
      "--tm-surface-elevated": "oklch(13% 0.038 29.233885 / 0.9)",
      "--tm-surface-elevated-strong": "oklch(10% 0.034 29.233885 / 0.96)",
      "--tm-primary": "oklch(74.4451% 0.15501 21.503538)",
      "--tm-primary-strong": "oklch(66% 0.17 21.503538)",
      "--tm-accent": "oklch(74.4451% 0.15501 21.503538)",
      "--tm-accent-strong": "oklch(76.5693% 0.127601 358.963602)",
      "--tm-accent-tint": "oklch(74.4451% 0.15501 21.503538 / 0.08)",
      "--tm-accent-soft": "oklch(74.4451% 0.15501 21.503538 / 0.17)",
      "--tm-accent-border": "oklch(74.4451% 0.15501 21.503538 / 0.58)",
      "--tm-accent-glow": "oklch(74.4451% 0.15501 21.503538 / 0.3)",
      "--tm-on-accent": "oklch(14.889% 0.031002 21.503538)",
      "--tm-text": "oklch(90.8178% 0.042616 28.361575)",
      "--tm-text-muted": "oklch(80.596% 0.014745 17.463351)",
      "--tm-text-accent": "oklch(86% 0.07 17.463351)",
      "--tm-border-subtle": "oklch(74.4451% 0.15501 21.503538 / 0.18)",
      "--tm-border-soft": "oklch(74.4451% 0.15501 21.503538 / 0.26)",
      "--tm-border": "oklch(74.4451% 0.15501 21.503538 / 0.38)",
      "--tm-border-strong": "oklch(74.4451% 0.15501 21.503538 / 0.62)",
      "--tm-primary-soft": "oklch(74.4451% 0.15501 21.503538 / 0.18)",
      "--tm-primary-tint": "oklch(74.4451% 0.15501 21.503538 / 0.11)",
      "--tm-primary-glow": "oklch(74.4451% 0.15501 21.503538 / 0.28)",
    },
  },
  green: {
    label: "سبز",
    swatch: "#00d49b",
    primary: "#00d49b",
    primaryStrong: "#00a879",
    secondary: "#6de8c7",
    background: "#06110e",
    paper: "#0b201a",
    text: "#edfff9",
    textMuted: "#b8d8cf",
    css: {
      "--tm-page-base": "#06110e",
      "--tm-page-glow-primary": "rgba(0, 212, 155, 0.22)",
      "--tm-page-glow-secondary": "rgba(109, 232, 199, 0.12)",
      "--tm-surface-deep": "#071712",
      "--tm-surface-solid": "#0b201a",
      "--tm-surface-1": "rgba(10, 38, 30, 0.96)",
      "--tm-surface-2": "rgba(5, 22, 17, 0.99)",
      "--tm-surface-elevated": "rgba(9, 34, 27, 0.88)",
      "--tm-surface-elevated-strong": "rgba(6, 25, 20, 0.95)",
      "--tm-primary": "#00d49b",
      "--tm-primary-strong": "#00a879",
      "--tm-accent": "#00d49b",
      "--tm-accent-strong": "#6de8c7",
      "--tm-accent-tint": "rgba(0, 212, 155, 0.08)",
      "--tm-accent-soft": "rgba(0, 212, 155, 0.17)",
      "--tm-accent-border": "rgba(0, 212, 155, 0.58)",
      "--tm-accent-glow": "rgba(0, 212, 155, 0.3)",
      "--tm-on-accent": "#031a12",
      "--tm-text": "#edfff9",
      "--tm-text-muted": "#b8d8cf",
      "--tm-text-accent": "#8ff5d8",
      "--tm-border-subtle": "rgba(0, 212, 155, 0.18)",
      "--tm-border-soft": "rgba(0, 212, 155, 0.26)",
      "--tm-border": "rgba(0, 212, 155, 0.38)",
      "--tm-border-strong": "rgba(0, 212, 155, 0.62)",
      "--tm-primary-soft": "rgba(0, 212, 155, 0.18)",
      "--tm-primary-tint": "rgba(0, 212, 155, 0.11)",
      "--tm-primary-glow": "rgba(0, 212, 155, 0.28)",
    },
  },
  blue: {
    label: "آبی",
    swatch: "#574dff",
    primary: "#6258ff",
    primaryStrong: "#4036dc",
    secondary: "#8ba7ff",
    background: "#080b18",
    paper: "#10162c",
    text: "#f0f2ff",
    textMuted: "#bbc4e6",
    css: {
      "--tm-page-base": "#080b18",
      "--tm-page-glow-primary": "rgba(98, 88, 255, 0.27)",
      "--tm-page-glow-secondary": "rgba(139, 167, 255, 0.13)",
      "--tm-surface-deep": "#0b1022",
      "--tm-surface-solid": "#10162c",
      "--tm-surface-1": "rgba(18, 25, 54, 0.96)",
      "--tm-surface-2": "rgba(8, 12, 29, 0.99)",
      "--tm-surface-elevated": "rgba(16, 23, 49, 0.88)",
      "--tm-surface-elevated-strong": "rgba(10, 15, 34, 0.95)",
      "--tm-primary": "#6258ff",
      "--tm-primary-strong": "#4036dc",
      "--tm-accent": "#6258ff",
      "--tm-accent-strong": "#8ba7ff",
      "--tm-accent-tint": "rgba(98, 88, 255, 0.08)",
      "--tm-accent-soft": "rgba(98, 88, 255, 0.17)",
      "--tm-accent-border": "rgba(98, 88, 255, 0.58)",
      "--tm-accent-glow": "rgba(98, 88, 255, 0.3)",
      "--tm-on-accent": "#080622",
      "--tm-text": "#f0f2ff",
      "--tm-text-muted": "#bbc4e6",
      "--tm-text-accent": "#bac5ff",
      "--tm-border-subtle": "rgba(98, 88, 255, 0.18)",
      "--tm-border-soft": "rgba(98, 88, 255, 0.26)",
      "--tm-border": "rgba(98, 88, 255, 0.38)",
      "--tm-border-strong": "rgba(98, 88, 255, 0.62)",
      "--tm-primary-soft": "rgba(98, 88, 255, 0.18)",
      "--tm-primary-tint": "rgba(98, 88, 255, 0.11)",
      "--tm-primary-glow": "rgba(98, 88, 255, 0.28)",
    },
  },
  cosmic: {
    label: "کیهانی",
    swatch: "oklch(63.8157% 0.104714 274.911693)",
    primary: "#8974c8",
    primaryStrong: "#7159ba",
    secondary: "#c2bf5b",
    background: "#02030d",
    paper: "#070817",
    text: "#c3c3cf",
    textMuted: "#9b9baa",
    css: {
      "--tm-page-base": "oklch(7.5005% 0.032812 261.193135)",
      "--tm-page-glow-primary":
        "oklch(63.8157% 0.104714 274.911693 / 0.22)",
      "--tm-page-glow-secondary":
        "oklch(66.1932% 0.27127 321.436916 / 0.12)",
      "--tm-surface-deep": "oklch(6.9755% 0.030515 261.193135)",
      "--tm-surface-solid": "oklch(9.5% 0.034 261.193135)",
      "--tm-surface-1": "oklch(11% 0.036 261.193135 / 0.97)",
      "--tm-surface-2": "oklch(6.4504% 0.028218 261.193135 / 0.99)",
      "--tm-surface-elevated": "oklch(12% 0.035 261.193135 / 0.9)",
      "--tm-surface-elevated-strong":
        "oklch(8.5% 0.032 261.193135 / 0.97)",
      "--tm-primary": "oklch(63.8157% 0.104714 274.911693)",
      "--tm-primary-strong": "oklch(54% 0.12 274.911693)",
      "--tm-accent": "oklch(66.1932% 0.27127 321.436916)",
      "--tm-accent-strong": "oklch(75.1048% 0.105944 97.996309)",
      "--tm-accent-tint": "oklch(66.1932% 0.27127 321.436916 / 0.08)",
      "--tm-accent-soft": "oklch(66.1932% 0.27127 321.436916 / 0.17)",
      "--tm-accent-border": "oklch(66.1932% 0.27127 321.436916 / 0.58)",
      "--tm-accent-glow": "oklch(66.1932% 0.27127 321.436916 / 0.3)",
      "--tm-on-accent": "oklch(13.2386% 0.054254 321.436916)",
      "--tm-text": "oklch(80.3279% 0.015554 277.793376)",
      "--tm-text-muted": "oklch(68% 0.02 277.793376)",
      "--tm-text-accent": "oklch(82% 0.075 274.911693)",
      "--tm-border-subtle":
        "oklch(63.8157% 0.104714 274.911693 / 0.17)",
      "--tm-border-soft":
        "oklch(63.8157% 0.104714 274.911693 / 0.25)",
      "--tm-border": "oklch(63.8157% 0.104714 274.911693 / 0.36)",
      "--tm-border-strong":
        "oklch(63.8157% 0.104714 274.911693 / 0.62)",
      "--tm-primary-soft":
        "oklch(63.8157% 0.104714 274.911693 / 0.18)",
      "--tm-primary-tint":
        "oklch(63.8157% 0.104714 274.911693 / 0.11)",
      "--tm-primary-glow":
        "oklch(63.8157% 0.104714 274.911693 / 0.28)",
    },
  },
  purple: {
    label: "بنفش",
    swatch: "#a900f7",
    primary: "#a16bff",
    primaryStrong: "#6f4bff",
    secondary: "#f7d046",
    background: "#0c0a18",
    paper: "#120c27",
    text: "#f4edff",
    textMuted: "#cbbde6",
    css: {
      "--tm-page-base": "#0c0a18",
      "--tm-page-glow-primary": "rgba(107, 75, 255, 0.32)",
      "--tm-page-glow-secondary": "rgba(255, 193, 78, 0.22)",
      "--tm-surface-deep": "#110b24",
      "--tm-surface-solid": "#120c27",
      "--tm-surface-1": "rgba(27, 18, 50, 0.95)",
      "--tm-surface-2": "rgba(18, 12, 36, 0.98)",
      "--tm-surface-elevated": "rgba(17, 12, 32, 0.82)",
      "--tm-surface-elevated-strong": "rgba(17, 12, 32, 0.94)",
      "--tm-primary": "#a16bff",
      "--tm-primary-strong": "#6f4bff",
      "--tm-accent": "#f7d046",
      "--tm-accent-strong": "#f0a63c",
      "--tm-accent-tint": "rgba(247, 208, 70, 0.08)",
      "--tm-accent-soft": "rgba(247, 208, 70, 0.17)",
      "--tm-accent-border": "rgba(247, 208, 70, 0.58)",
      "--tm-accent-glow": "rgba(247, 208, 70, 0.3)",
      "--tm-on-accent": "#1a132f",
      "--tm-text": "#f4edff",
      "--tm-text-muted": "#cbbde6",
      "--tm-text-accent": "#d6b6ff",
      "--tm-border-subtle": "rgba(153, 126, 255, 0.18)",
      "--tm-border-soft": "rgba(153, 126, 255, 0.25)",
      "--tm-border": "rgba(153, 126, 255, 0.35)",
      "--tm-border-strong": "rgba(153, 126, 255, 0.62)",
      "--tm-primary-soft": "rgba(149, 118, 255, 0.2)",
      "--tm-primary-tint": "rgba(161, 107, 255, 0.12)",
      "--tm-primary-glow": "rgba(120, 85, 255, 0.28)",
    },
  },
};

export function normalizeAccentTheme(value) {
  return Object.hasOwn(ACCENT_THEMES, value) ? value : DEFAULT_ACCENT_THEME;
}

export function getStoredAccentTheme() {
  if (typeof window === "undefined") return DEFAULT_ACCENT_THEME;
  return normalizeAccentTheme(localStorage.getItem(ACCENT_THEME_STORAGE_KEY));
}

export function applyAccentTheme(value) {
  if (typeof document === "undefined") return;
  const themeId = normalizeAccentTheme(value);
  const root = document.documentElement;
  root.dataset.accentTheme = themeId;
  Object.entries(ACCENT_THEMES[themeId].css).forEach(([property, color]) => {
    root.style.setProperty(property, color);
  });
}

export function persistAccentTheme(value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    ACCENT_THEME_STORAGE_KEY,
    normalizeAccentTheme(value),
  );
}
