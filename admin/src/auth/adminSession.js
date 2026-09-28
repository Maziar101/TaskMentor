const STORAGE_KEY = "taskmentor-admin-auth";
const ADMIN_ROLES = new Set(["admin", "owner"]);
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/$/, "") || "";

let initializationPromise;

function getStoredSession() {
  try {
    const rawSession = sessionStorage.getItem(STORAGE_KEY);
    return rawSession ? JSON.parse(rawSession) : null;
  } catch {
    return null;
  }
}

function storeSession(session) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

function consumeHandoffToken() {
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const handoffToken = hashParams.get("handoff")?.trim();

  if (handoffToken) {
    window.history.replaceState(
      window.history.state,
      document.title,
      `${window.location.pathname}${window.location.search}`,
    );
  }

  return handoffToken;
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "احراز هویت پنل مدیریت انجام نشد");
  }

  return data;
}

async function exchangeHandoff(handoffToken) {
  const data = await request("/api/auth/admin-exchange", {
    method: "POST",
    body: JSON.stringify({ handoffToken }),
  });
  const session = { token: data.token, user: data.user };
  storeSession(session);
  return session;
}

async function validateStoredSession(session) {
  const data = await request("/api/auth/admin-session", {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  const nextSession = { token: session.token, user: data.data };
  storeSession(nextSession);
  return nextSession;
}

async function initialize() {
  try {
    const handoffToken = consumeHandoffToken();
    const session = handoffToken
      ? await exchangeHandoff(handoffToken)
      : await validateStoredSession(getStoredSession() || {});

    if (!session.token || !ADMIN_ROLES.has(session.user?.role)) {
      throw new Error("دسترسی به پنل مدیریت مجاز نیست");
    }

    return session;
  } catch (error) {
    clearSession();
    throw error;
  }
}

export function initializeAdminSession() {
  if (!initializationPromise) initializationPromise = initialize();
  return initializationPromise;
}

export function resolveAdminAssetUrl(assetUrl) {
  if (!assetUrl || /^(?:[a-z]+:)?\/\//i.test(assetUrl) || !apiBaseUrl) {
    return assetUrl;
  }

  return `${apiBaseUrl}${assetUrl.startsWith("/") ? "" : "/"}${assetUrl}`;
}

export function adminApiRequest(path, options = {}) {
  const session = getStoredSession();

  if (!session?.token) {
    return Promise.reject(new Error("نشست مدیریت پیدا نشد. دوباره وارد شوید"));
  }

  return request(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${session.token}`,
      ...(options.headers || {}),
    },
  });
}
