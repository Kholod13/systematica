// src/services/auth.js
import { ENDPOINTS } from "../services/endpoints";

let accessToken = localStorage.getItem("access") || null;
let refreshPromise = null;

// ---------------- Access token ----------------
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

// ---------------- Refresh token via HttpOnly cookie ----------------
async function callRefresh() {
  // если уже идёт обновление, ждём текущий промис
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const resp = await fetch(ENDPOINTS.REFRESH, {
        method: "POST",
        credentials: "include", // обязательно для HttpOnly cookie
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // backend берёт refresh из cookie
      });

      if (!resp.ok) {
        throw new Error(`Refresh failed with status ${resp.status}`);
      }

      const data = await resp.json();

      if (!data.access) throw new Error("No access token in refresh response");

      setAccess(data.access);
      refreshPromise = null;
      return accessToken;
    } catch (e) {
      refreshPromise = null;
      clearAccess(); // токен недействителен
      throw e;
    }
  })();

  return refreshPromise;
}

// ---------------- Универсальный fetch с авто-refresh ----------------
export async function fetchWithAuth(url, opts = {}, retry = true) {
  opts.credentials = "include"; // cookie отправляем всегда
  opts.headers = opts.headers ? { ...opts.headers } : {};

  // добавляем Authorization, если есть access token
  if (accessToken) {
    opts.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  let resp = await fetch(url, opts);

  // если не 401 — возвращаем ответ сразу
  if (resp.status !== 401) return resp;

  // если уже пробовали обновить токен — возвращаем 401
  if (!retry) return resp;

  try {
    await callRefresh(); // обновляем access
  } catch (e) {
    console.error("❌ Refresh failed:", e);
    clearAccess();
    // можно принудительно редиректить на логин:
    // window.location.href = "/login";
    throw e;
  }

  // повторяем запрос с новым access
  if (accessToken) {
    opts.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return fetch(url, opts);
}
