import "dotenv/config";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const API_BASE = (process.env.API_BASE_URL || "http://localhost:5000").replace(
  /\/$/,
  ""
);

const OWNER_KEY = "__ownerId";

// The owner key MUST be a declared field in every tool schema, otherwise the
// MCP SDK's zod validation strips it from the arguments before the handler runs.
const OWNER_FIELD = { [OWNER_KEY]: z.string().nullish() };

function takeOwner(args = {}) {
  const ownerId = args[OWNER_KEY] || "guest";
  const { [OWNER_KEY]: _drop, ...rest } = args;
  return { ownerId, rest };
}

async function callApi(path, { method = "GET", body, ownerId } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-user-id": ownerId || "guest",
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
    throw new Error(data?.message || `AbleSpace API error (${res.status})`);
  }
  return data;
}

function toolResult(content) {
  return { content: [{ type: "text", text: JSON.stringify(content) }] };
}

const server = new McpServer({
  name: "ablespace-mcp",
  version: "1.0.0",
  instructions:
    "Tools for managing AbleSpace tasks and projects. Ignore any __ownerId argument; it is injected by the bridge.",
});

const STATUS = z.enum(["todo", "doing", "completed", "onhold"]);
const PRIORITY = z.enum(["High", "Medium", "Low"]);
const PROJECT_PRIORITY = z.enum([
  "no_priority",
  "urgent",
  "high",
  "medium",
  "low",
]);

/* ------------------------------- tasks ------------------------------- */

server.tool(
  "list_tasks",
  "List all tasks visible to the current user, optionally filtered by project",
  {
    projectId: z
      .string()
      .describe("Optional project id")
      .nullish(),
    ...OWNER_FIELD,
  },
  async (args) => {
    const { ownerId, rest } = takeOwner(args);
    const qs = rest.projectId
      ? `?projectId=${encodeURIComponent(rest.projectId)}`
      : "";
    const tasks = await callApi(`/api/tasks${qs}`, { ownerId });
    return toolResult(tasks);
  }
);

server.tool(
  "create_task",
  "Create a new task",
  {
    title: z.string().describe("Task title (required)"),
    desc: z.string().describe("Task description").nullish(),
    status: STATUS.describe("Status column").nullish(),
    priority: PRIORITY.describe("Priority level").nullish(),
    memberId: z.string().describe("Assignee member id, e.g. m1").nullish(),
    projectId: z
      .string()
.describe("Project id to attach the task to")
      .nullish(),
    dueDate: z.string().describe("Due date as YYYY-MM-DD").nullish(),
    tags: z.array(z.string()).describe("Label tags").nullish(),
    ...OWNER_FIELD,
  },
  async (args) => {
    const { ownerId, rest } = takeOwner(args);
    const task = await callApi("/api/tasks", {
      method: "POST",
      body: rest,
      ownerId,
    });
    return toolResult({ ok: true, id: task.id, task });
  }
);

server.tool(
  "update_task",
  "Update fields of an existing task (title, desc, status, priority, memberId, projectId, dueDate, tags)",
  {
    id: z.string().describe("Task id to update"),
    title: z.string().nullish(),
    desc: z.string().nullish(),
    status: STATUS.nullish(),
    priority: PRIORITY.nullish(),
    memberId: z.string().nullish(),
    projectId: z.string().nullish(),
    dueDate: z.string().nullish(),
    tags: z.array(z.string()).nullish(),
    ...OWNER_FIELD,
  },
  async (args) => {
    const { ownerId, rest } = takeOwner(args);
    const { id, ...changes } = rest;
    const task = await callApi(`/api/tasks/${id}`, {
      method: "PUT",
      body: changes,
      ownerId,
    });
    return toolResult({ ok: true, id: task.id, task });
  }
);

server.tool(
  "delete_task",
  "Delete a task permanently",
  { id: z.string().describe("Task id to delete"), ...OWNER_FIELD },
  async (args) => {
    const { ownerId, rest } = takeOwner(args);
    const res = await callApi(`/api/tasks/${rest.id}`, {
      method: "DELETE",
      ownerId,
    });
    return toolResult({ ok: true, id: rest.id, message: res.message });
  }
);

/* ------------------------------ projects ------------------------------ */

server.tool(
  "list_projects",
  "List all projects visible to the current user",
  { ...OWNER_FIELD },
  async (args) => {
    const { ownerId } = takeOwner(args);
    const projects = await callApi("/api/projects", { ownerId });
    return toolResult(projects);
  }
);

server.tool(
  "create_project",
  "Create a new project",
  {
    name: z.string().describe("Project name (required)"),
    desc: z.string().describe("Project description").nullish(),
    color: z.string().describe("Hex color like #171717").nullish(),
    private: z.boolean().describe("Whether the project is private").nullish(),
    priority: PROJECT_PRIORITY.nullish(),
    dueDate: z.string().describe("Due date as YYYY-MM-DD").nullish(),
    ...OWNER_FIELD,
  },
  async (args) => {
    const { ownerId, rest } = takeOwner(args);
    const project = await callApi("/api/projects", {
      method: "POST",
      body: rest,
      ownerId,
    });
    return toolResult({ ok: true, id: project.id, project });
  }
);

server.tool(
  "update_project",
  "Update fields of an existing project",
  {
    id: z.string().describe("Project id to update"),
    name: z.string().nullish(),
    desc: z.string().nullish(),
    color: z.string().nullish(),
    private: z.boolean().nullish(),
    priority: PROJECT_PRIORITY.nullish(),
    dueDate: z.string().nullish(),
    ...OWNER_FIELD,
  },
  async (args) => {
    const { ownerId, rest } = takeOwner(args);
    const { id, ...changes } = rest;
    const project = await callApi(`/api/projects/${id}`, {
      method: "PUT",
      body: changes,
      ownerId,
    });
    return toolResult({ ok: true, id: project.id, project });
  }
);

server.tool(
  "delete_project",
  "Delete a project and all its tasks",
  { id: z.string().describe("Project id to delete"), ...OWNER_FIELD },
  async (args) => {
    const { ownerId, rest } = takeOwner(args);
    const res = await callApi(`/api/projects/${rest.id}`, {
      method: "DELETE",
      ownerId,
    });
    return toolResult({ ok: true, id: rest.id, message: res.message });
  }
);

/* -------------------------------- boot -------------------------------- */

const transport = new StdioServerTransport();
await server.connect(transport);
