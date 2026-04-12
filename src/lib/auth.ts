import { API_BASE_URL, TOKEN_KEY, USER_KEY } from "../config";
import type { AuthResponse, AuthStatusResponse, User } from "../types";

const buildUrl = (path: string) => `${API_BASE_URL}${path}`;

function envFlag(name: string, defaultValue: boolean) {
  const value = import.meta.env[name];

  if (value === undefined || value === "") {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function getOAuthBaseUrl() {
  if (envFlag("VITE_PREFER_SAME_ORIGIN_OAUTH_START", false)) {
    return "";
  }

  return import.meta.env.VITE_OAUTH_BASE_URL || API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:8080`;
}

function getOAuthStartPath() {
  const directPath = import.meta.env.VITE_OAUTH_DIRECT_START_PATH || "/oauth2/authorization/google";
  const proxiedPath = import.meta.env.VITE_OAUTH_START_PATH || directPath;

  return envFlag("VITE_USE_DIRECT_OAUTH_START", true) ? directPath : proxiedPath;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAuth(data: AuthResponse | { accessToken: string; user: User }) {
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user ?? {}));
}

export function saveUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getStoredUser(): User | null {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function getUserDisplayName(user?: User | null) {
  if (!user) {
    return "";
  }

  const trimmedName = user.name?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  const emailName = user.email?.trim();
  if (emailName) {
    return emailName;
  }

  return "User";
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function fetchAuthStatus(): Promise<AuthStatusResponse> {
  const token = getToken();
  const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(buildUrl("/auth/status"), {
    headers,
    credentials: "include"
  });

  if (!response.ok) {
    return { authenticated: false };
  }

  return response.json();
}

export async function fetchCurrentUser(token?: string) {
  const activeToken = token ?? getToken();
  const headers: HeadersInit = activeToken ? { Authorization: `Bearer ${activeToken}` } : {};
  const response = await fetch(buildUrl("/auth/user"), {
    headers,
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error("Unable to load current user.");
  }

  return (await response.json()) as User;
}

export async function loginOrRegister(path: "/auth/login" | "/auth/register", payload: object) {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || "Authentication failed.");
  }

  return data as AuthResponse;
}

export function startGoogleLogin() {
  const baseUrl = getOAuthBaseUrl().replace(/\/$/, "");
  const startPath = getOAuthStartPath().startsWith("/")
    ? getOAuthStartPath()
    : `/${getOAuthStartPath()}`;
  window.location.assign(`${baseUrl}${startPath}`);
}

export async function logout() {
  clearAuth();
  try {
    await fetch(buildUrl("/auth/logout"), {
      credentials: "include"
    });
  } catch {
    // Local auth is already cleared, so guest mode can continue even if backend logout fails.
  }
}
