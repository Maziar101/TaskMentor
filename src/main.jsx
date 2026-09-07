import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import {
  applyAccentTheme,
  getStoredAccentTheme,
} from "./utils/accentThemes";

applyAccentTheme(getStoredAccentTheme());

createRoot(document.getElementById("root")).render(<StrictMode>
    <App />
  </StrictMode>);
