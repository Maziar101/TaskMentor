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
    primary: { main: "#f7d046" },
    background: {
      default: "#0c0a18",
      paper: "#17102d",
    },
    text: {
      primary: "#f4edff",
      secondary: "#cbbde6",
    },
  },
  shape: { borderRadius: 14 },
});

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
