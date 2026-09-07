import { createSlice } from "@reduxjs/toolkit";
import {
  getStoredAccentTheme,
  normalizeAccentTheme,
  persistAccentTheme,
} from "../utils/accentThemes";

const STORAGE_KEY = "taskmentor-auth";

function loadAuth() {
  if (typeof window === "undefined") return { token: null, user: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

const initialState = {
  ...loadAuth(),
  themeMode:
    typeof window !== "undefined"
      ? localStorage.getItem("taskmentor-theme") || "dark"
      : "dark",
  accentTheme: getStoredAccentTheme(),
};

const persistAuth = ({ token, user }) => {
  if (typeof window === "undefined") return;
  if (!token) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, user }));
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      persistAuth({ token: state.token, user: state.user });
    },
    setUser(state, action) {
      state.user = action.payload;
      persistAuth({ token: state.token, user: state.user });
    },
    logout(state) {
      state.token = null;
      state.user = null;
      persistAuth({ token: null, user: null });
    },
    toggleTheme(state) {
      state.themeMode = state.themeMode === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        localStorage.setItem("taskmentor-theme", state.themeMode);
      }
    },
    setAccentTheme(state, action) {
      state.accentTheme = normalizeAccentTheme(action.payload);
      persistAccentTheme(state.accentTheme);
    },
  },
});

export const { logout, setCredentials, setUser, setAccentTheme, toggleTheme } =
  authSlice.actions;
export const selectAuth = (state) => state.auth;
export default authSlice.reducer;
