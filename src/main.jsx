import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import {
  applyAccentTheme,
  getStoredAccentTheme,
} from "./utils/accentThemes";
import { getLanguage, initializeLanguageDocument } from "./i18n/runtime";

applyAccentTheme(getStoredAccentTheme());
initializeLanguageDocument();
document.title = getLanguage() === "en" ? "TaskMentor | Task Manager" : "TaskMentor | تسک منیجر";

createRoot(document.getElementById("root")).render(<StrictMode>
    <App />
  </StrictMode>);
