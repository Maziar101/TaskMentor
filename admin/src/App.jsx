import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import { getDirection, getLanguage } from "./i18n/runtime";

const language = getLanguage();
const theme = createTheme({
  direction: getDirection(language),
  typography: {
    fontFamily:
      language === "fa"
        ? '"IRANYekanX", Tahoma, Arial, sans-serif'
        : '"NotionInter", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  palette: {
    mode: "dark",
    primary: { main: "#ffffff", contrastText: "#000000" },
    secondary: { main: "#ffffff", contrastText: "#000000" },
    error: { main: "#ffffff", contrastText: "#000000" },
    warning: { main: "#ffffff", contrastText: "#000000" },
    info: { main: "#ffffff", contrastText: "#000000" },
    success: { main: "#ffffff", contrastText: "#000000" },
    background: {
      default: "#000000",
      paper: "#0f0f0f",
    },
    text: {
      primary: "#ffffff",
      secondary: "rgba(255, 255, 255, 0.68)",
    },
    divider: "rgba(255, 255, 255, 0.18)",
    action: {
      hover: "rgba(255, 255, 255, 0.12)",
      selected: "rgba(255, 255, 255, 0.16)",
      disabled: "rgba(255, 255, 255, 0.3)",
      disabledBackground: "rgba(255, 255, 255, 0.08)",
    },
  },
  shape: { borderRadius: 14 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: "#000000" },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
      },
    },
  },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
