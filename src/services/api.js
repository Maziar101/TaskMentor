import { store } from "../store";
import { logout } from "../store/authSlice";

export async function apiRequest(path, options = {}) {
  const token = store.getState().auth.token;
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...(!isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(path, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    store.dispatch(logout());
  }

  if (!response.ok) {
    const message = data?.message || "درخواست ناموفق بود";
    throw new Error(message);
  }

  return data;
}

export const authApi = {
  sendCode: (payload) =>
    apiRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  verify: (payload) =>
    apiRequest("/api/auth/verify", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  me: () => apiRequest("/api/auth/me"),
};

export const taskApi = {
  getPool: () => apiRequest("/api/tasks?unscheduled=true"),
  createPoolTask: (payload) =>
    apiRequest("/api/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  deletePoolTask: (id) =>
    apiRequest(`/api/tasks/${id}`, {
      method: "DELETE",
    }),
};

export const scheduleApi = {
  getByDay: (day) => apiRequest(`/api/schedule?day=${day}`),
  create: (payload) =>
    apiRequest("/api/schedule", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id, payload) =>
    apiRequest(`/api/schedule?id=${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  delete: (id) =>
    apiRequest(`/api/schedule?id=${id}`, {
      method: "DELETE",
    }),
};

export const profileApi = {
  get: () => apiRequest("/api/profile"),
  update: (payload) =>
    apiRequest("/api/profile", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

export const reportsApi = {
  get: () => apiRequest("/api/reports"),
};
