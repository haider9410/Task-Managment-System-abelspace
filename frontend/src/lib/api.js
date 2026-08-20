export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const USER_ID_KEY = "ablespace_user_id";
const GUEST_ID_KEY = "ablespace_guest_id";
const LOCAL_TASKS_KEY = "ablespace_local_tasks";
const LOCAL_PROJECTS_KEY = "ablespace_local_projects";

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
  const user = state?.auth?.user;
  if (user?.sub) return user.sub;
  return getStoredUserId() || getGuestId();
}

function getLocalTasks() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalTasks(tasks) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_TASKS_KEY, JSON.stringify(tasks));
  } catch {
    /* ignore */
  }
}

function getLocalProjects() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalProjects(projects) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
  } catch {
    /* ignore */
  }
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
    console.warn(`[api] Safe fallback for ${method} ${path}:`, err.message);
    const upperMethod = method.toUpperCase();

    // ---------------- TASK HANDLERS ----------------
    if (path.includes("/tasks")) {
      const isSingleTask = /\/tasks\/[^/]+$/.test(path);
      const taskId = isSingleTask ? path.split("/").pop() : null;

      if (upperMethod === "POST") {
        const newTask = {
          id: "task_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36),
          ownerId: ownerId || getGuestId(),
          title: body?.title || "New Task",
          desc: body?.desc || "",
          status: body?.status || "todo",
          priority: body?.priority || "Medium",
          memberId: body?.memberId || "m1",
          projectId: body?.projectId || "",
          dueDate: body?.dueDate || "",
          tags: Array.isArray(body?.tags) ? body.tags : [],
          subtasks: Array.isArray(body?.subtasks) ? body.subtasks : [],
          comments: Array.isArray(body?.comments) ? body.comments : [],
          resources: Array.isArray(body?.resources) ? body.resources : [],
          watchers: Array.isArray(body?.watchers) ? body.watchers : [],
          locked: !!body?.locked,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const tasks = getLocalTasks();
        tasks.unshift(newTask);
        saveLocalTasks(tasks);
        return newTask;
      }

      if (upperMethod === "PUT" && taskId) {
        const tasks = getLocalTasks();
        const idx = tasks.findIndex((t) => String(t.id) === String(taskId));
        if (idx !== -1) {
          tasks[idx] = { ...tasks[idx], ...body, updatedAt: new Date().toISOString() };
          saveLocalTasks(tasks);
          return tasks[idx];
        }
        return { id: taskId, ...body };
      }

      if (upperMethod === "DELETE" && taskId) {
        let tasks = getLocalTasks();
        tasks = tasks.filter((t) => String(t.id) !== String(taskId));
        saveLocalTasks(tasks);
        return { success: true, id: taskId };
      }

      if (upperMethod === "GET") {
        return getLocalTasks();
      }
    }

    // ---------------- PROJECT HANDLERS ----------------
    if (path.includes("/projects")) {
      const isSingleProj = /\/projects\/[^/]+$/.test(path);
      const projId = isSingleProj ? path.split("/").pop() : null;

      if (upperMethod === "POST") {
        const newProj = {
          id: "proj_" + Math.random().toString(36).slice(2, 9) + Date.now().toString(36),
          ownerId: ownerId || getGuestId(),
          name: body?.name || "New Project",
          desc: body?.desc || "",
          color: body?.color || "#171717",
          private: !!body?.private,
          priority: body?.priority || "no_priority",
          dueDate: body?.dueDate || "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const projects = getLocalProjects();
        projects.unshift(newProj);
        saveLocalProjects(projects);
        return newProj;
      }

      if (upperMethod === "PUT" && projId) {
        const projects = getLocalProjects();
        const idx = projects.findIndex((p) => String(p.id) === String(projId));
        if (idx !== -1) {
          projects[idx] = { ...projects[idx], ...body, updatedAt: new Date().toISOString() };
          saveLocalProjects(projects);
          return projects[idx];
        }
        return { id: projId, ...body };
      }

      if (upperMethod === "DELETE" && projId) {
        let projects = getLocalProjects();
        projects = projects.filter((p) => String(p.id) !== String(projId));
        saveLocalProjects(projects);
        return { success: true, id: projId };
      }

      if (upperMethod === "GET") {
        return getLocalProjects();
      }
    }

    if (path.includes("/profile")) return { name: "Guest", email: "guest@example.com" };
    return {};
  }
}
