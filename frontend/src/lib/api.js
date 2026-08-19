export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const USER_ID_KEY = "ablespace_user_id";
const GUEST_ID_KEY = "ablespace_guest_id";

export function getStoredUserId() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(USER_ID_KEY) || null;
  } catch {
    return null;
  }
}

export function setUserId(id) {
  if (typeof window === "undefined" || !id) return;
  try {
    localStorage.setItem(USER_ID_KEY, id);
  } catch {
    /* ignore */
  }
}

export function clearUserId() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(USER_ID_KEY);
  } catch {
    /* ignore */
  }
}

export function getGuestId() {
  if (typeof window === "undefined") return "guest";
  let id = null;
  try {
    id = localStorage.getItem(GUEST_ID_KEY);
  } catch {
    id = null;
  }
  if (!id) {
    id =
      "guest_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    try {
      localStorage.setItem(GUEST_ID_KEY, id);
    } catch {
      /* ignore */
    }
  }
  return id;
}

export function resolveOwnerId(state) {
  const user = state.auth?.user;
  if (user?.sub) return user.sub;
  return getStoredUserId() || getGuestId();
}

export async function api(path, { method = "GET", body, ownerId } = {}) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "x-user-id": ownerId || getStoredUserId() || getGuestId(),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = {};
    }
    if (!res.ok) {
      throw new Error(data?.message || `Request failed (${res.status})`);
    }
    return data;
  } catch (err) {
    console.warn(`[api] Fallback handled for ${path}:`, err.message);
    if (path.includes("/tasks")) return [];
    if (path.includes("/projects")) return [];
    if (path.includes("/profile")) return { name: "Guest", email: "guest@example.com" };
    return {};
  }
}
