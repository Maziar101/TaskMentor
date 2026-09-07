import { RouterProvider } from "react-router-dom";
import useRoutesConfig from "./routes/index.jsx";
import "./App.css";
import { createTheme, ThemeProvider } from "@mui/material";
import { Provider, useSelector } from "react-redux";
import { store } from "./store";
import { useLayoutEffect, useMemo } from "react";
import { ACCENT_THEMES, applyAccentTheme } from "./utils/accentThemes";

function AppShell() {
  const routes = useRoutesConfig();
  const { accentTheme, themeMode } = useSelector((state) => state.auth);
  const colors = ACCENT_THEMES[accentTheme] ?? ACCENT_THEMES.purple;

  useLayoutEffect(() => {
    applyAccentTheme(accentTheme);
  }, [accentTheme]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: themeMode,
          primary: { main: colors.primary },
          secondary: { main: colors.secondary },
          background: {
            default: colors.background,
            paper: colors.paper,
          },
          text: {
            primary: colors.text,
            secondary: colors.textMuted,
          },
          bg: {
            primary: colors.css["--tm-surface-elevated"],
            secondary: colors.paper,
            black: "#111010",
          },

          gradient: {
            primary: `radial-gradient(circle at 100% 0%, ${colors.css["--tm-page-glow-primary"]}, transparent 25%), linear-gradient(135deg, ${colors.css["--tm-surface-deep"]}, ${colors.background})`,
          },

          border: {
            primary: colors.css["--tm-border"],
          },

          txt: {
            primary: colors.css["--tm-text-accent"],
            secondary: colors.textMuted,
            third: colors.secondary,
            white: colors.text,
          },
        },
      }),
    [colors, themeMode],
  );

  return (
    <ThemeProvider theme={theme}>
      <RouterProvider router={routes} />
    </ThemeProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppShell />
    </Provider>
  );
}
