import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { getLanguage, initializeLanguageDocument } from "./i18n/runtime";

initializeLanguageDocument();
document.title = getLanguage() === "en" ? "TaskMentor Admin Panel" : "پنل مدیریت TaskMentor";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
