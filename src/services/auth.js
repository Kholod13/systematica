import { ENDPOINTS } from "../services/endpoints";

// src/services/auth.js
let accessToken = localStorage.getItem("access") || null;
let refreshPromise = null;

export function setAccess(token) {
  accessToken = token;
  localStorage.setItem("access", token);
}

export function getAccess() {
  return accessToken;
}

export function clearAccess() {
  accessToken = null;
  localStorage.removeItem("access");
  localStorage.removeItem("user");
}

// 🔹 обновление access по refresh (refresh хранится в cookie HttpOnly)
async function callRefresh() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const resp = await fetch(ENDPOINTS.REFRESH, {
      method: "POST",
      credentials: "include", // cookie обязательно
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!resp.ok) {
      throw new Error("Refresh failed");
    }

    const data = await resp.json();
    if (!data.access) throw new Error("No access in refresh response");

    setAccess(data.access);
    refreshPromise = null;
    return accessToken;
  })();

  try {
    return await refreshPromise;
  } catch (e) {
    refreshPromise = null;
    clearAccess();
    throw e;
  }
}

// 🔹 универсальная обёртка для API-запросов
export async function fetchWithAuth(url, opts = {}, retry = true) {
  opts.credentials = "include";
  opts.headers = opts.headers ? { ...opts.headers } : {};

  if (accessToken) {
    opts.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let resp = await fetch(url, opts);

  if (resp.status !== 401) {
    return resp;
  }

  if (!retry) return resp;

  try {
    await callRefresh();
  } catch (e) {
    clearAccess();
    window.location.href = "/login"; // принудительный logout
    throw e;
  }

  if (accessToken) {
    opts.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return fetch(url, opts);
}
