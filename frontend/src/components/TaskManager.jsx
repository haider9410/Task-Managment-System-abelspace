"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  MoreHorizontal,
  Calendar,
  Tag,
  ChevronDown,
  ChevronRight,
  PanelLeft,
  LayoutGrid,
  List as ListIcon,
  Filter,
  X,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Check,
  Trash2,
  Pencil,
  LayoutDashboard,
  FolderKanban,
  ChevronsUpDown,
  LogOut,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Lock,
  LockOpen,
  Users,
  Sparkles,
} from "lucide-react";
import TaskDetailPage from "./TaskDetailPage";
import ProjectDetailPage from "./ProjectDetailPage";
import AiAgentPanel from "./AiAgentPanel";
import {
  fetchTasks,
  addTask,
  updateTask,
  deleteTask,
} from "@/store/slices/tasksSlice";
import { fetchProjects } from "@/store/slices/projectsSlice";
import { clearAuth } from "@/store/slices/authSlice";
import { getGuestId, api, clearUserId, getStoredUserId } from "@/lib/api";

/* ---------------------------------- data ---------------------------------- */

const COLUMNS = [
  { id: "todo", title: "To Do", dot: "bg-slate-400" },
  { id: "doing", title: "Doing", dot: "bg-blue-500" },
  { id: "completed", title: "Completed", dot: "bg-emerald-500" },
  { id: "onhold", title: "On Hold", dot: "bg-amber-500" },
];

const MEMBERS = [
  { id: "m1", name: "Admin", color: "bg-slate-900", initial: "A" },
  { id: "m2", name: "QA Team", color: "bg-emerald-600", initial: "Q" },
  { id: "m3", name: "Designer", color: "bg-rose-500", initial: "D" },
  { id: "m4", name: "Security", color: "bg-amber-500", initial: "S" },
  { id: "m5", name: "Dev Team", color: "bg-blue-600", initial: "D" },
  { id: "m6", name: "Product", color: "bg-pink-500", initial: "P" },
  { id: "m7", name: "Engineer", color: "bg-indigo-500", initial: "E" },
];

const PRIORITIES = [
  { id: "High", icon: SignalHigh, cls: "text-rose-600 dark:text-rose-400" },
  {
    id: "Medium",
    icon: SignalMedium,
    cls: "text-amber-600 dark:text-amber-400",
  },
  { id: "Low", icon: SignalLow, cls: "text-slate-400 dark:text-slate-500" },
];

const FIELD_DEFS = [
  { key: "priority", label: "Priority" },
  { key: "members", label: "Members" },
  { key: "dueDate", label: "Due Date" },
  { key: "labels", label: "Labels" },
  { key: "status", label: "Status" },
  { key: "reporter", label: "Reporter" },
];

/* --------------------------------- helpers --------------------------------- */

const memberById = (id) => MEMBERS.find((m) => m.id === id);
const priorityById = (id) => PRIORITIES.find((p) => p.id === id);
const fmtDate = (iso) => {
  if (!iso) return "No date";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function useOutsideClose(open, onClose) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);
  return ref;
}

/* ------------------------------- small pieces ------------------------------- */

function Avatar({ memberId, size = "sm" }) {
  const m = memberById(memberId);
  if (!m) return null;
  const s = size === "sm" ? "h-6 w-6 text-[10px]" : "h-8 w-8 text-xs";
  return (
    <div
      className={`${s} ${m.color} flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white shrink-0`}
      title={m.name}
    >
      {m.initial}
    </div>
  );
}

function PriorityBadge({ priority }) {
  const cfg = priorityById(priority);
  if (!cfg)
    return (
      <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
    );
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.cls}`}
    >
      <Icon size={13} strokeWidth={2.5} />
      {priority}
    </span>
  );
}

function TagPill({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 dark:text-gray-300">
      <Tag size={10} />
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <X size={9} />
        </button>
      )}
    </span>
  );
}

function DueDate({ iso }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 text-[11px] font-medium text-red-600 dark:text-red-400">
      <Calendar size={11} />
      {fmtDate(iso)}
    </span>
  );
}

/* --------------------------------- menus --------------------------------- */

function RowMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="rounded-md p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-7 z-30 w-36 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-lg">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* --------------------------------- board --------------------------------- */

function TaskCard({ task, onOpen, onDelete, onDragStart, dragging }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onClick={() => onOpen(task)}
      className={`group cursor-grab rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 shadow-sm transition active:cursor-grabbing hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 ${
        dragging ? "opacity-40" : ""
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-gray-800 dark:text-gray-100">
          {task.title}
        </p>
        <RowMenu
          onEdit={() => onOpen(task)}
          onDelete={() => onDelete(task.id)}
        />
      </div>
      <div className="mb-2 flex items-center gap-2">
        <Avatar memberId={task.memberId} />
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {memberById(task.memberId)?.name}
        </span>
        <span className="ml-auto">
          <DueDate iso={task.dueDate} />
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {task.tags.map((t) => (
          <TagPill key={t} label={t} />
        ))}
      </div>
    </div>
  );
}

function BoardColumn({
  column,
  tasks,
  onOpen,
  onDelete,
  onDrop,
  draggedId,
  setDraggedId,
  onQuickAdd,
  canAdd = true,
}) {
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onDrop(column.id);
      }}
      className={`flex h-full w-72 shrink-0 flex-col rounded-xl transition ${over ? "bg-gray-100 dark:bg-gray-800/50" : ""}`}
    >
      <div className="mb-3 flex shrink-0 items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${column.dot}`} />
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            {column.title}
          </h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {tasks.length}
          </span>
        </div>
        {canAdd && (
          <button
            onClick={() => onQuickAdd(column.id)}
            className="rounded-md p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Plus size={14} />
          </button>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-1 pr-0.5">
        {tasks.map((t) => (
          <TaskCard
            key={t.id}
            task={t}
            onOpen={onOpen}
            onDelete={onDelete}
            dragging={draggedId === t.id}
            onDragStart={(e, id) => {
              e.dataTransfer.setData("text/plain", String(id));
              setDraggedId(id);
            }}
          />
        ))}
        {canAdd && (
          <button
            onClick={() => onQuickAdd(column.id)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2 text-left text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Plus size={14} /> Add Task
          </button>
        )}
      </div>
    </div>
  );
}

/* --------------------------------- table (list view) --------------------------------- */

function TableGroup({
  column,
  tasks,
  fields,
  collapsed,
  onToggle,
  onOpen,
  onDelete,
  onQuickAdd,
  canAdd = true,
}) {
  const colCount = 2 + Object.values(fields).filter(Boolean).length;
  return (
    <div className="mb-4">
      <button
        onClick={onToggle}
        className="mb-1.5 flex w-full items-center gap-1.5 px-1 py-1 text-left"
      >
        {collapsed ? (
          <ChevronRight
            size={14}
            className="text-gray-400 dark:text-gray-500"
          />
        ) : (
          <ChevronDown size={14} className="text-gray-400 dark:text-gray-500" />
        )}
        <span className={`h-2 w-2 rounded-full ${column.dot}`} />
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {column.title}
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {tasks.length}
        </span>
      </button>

      {!collapsed && (
        <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                <th className="px-4 py-2 font-medium">Task</th>
                {fields.priority && (
                  <th className="px-4 py-2 font-medium">Priority</th>
                )}
                {fields.members && (
                  <th className="px-4 py-2 font-medium">Members</th>
                )}
                {fields.dueDate && (
                  <th className="px-4 py-2 font-medium">Due Date</th>
                )}
                {fields.labels && (
                  <th className="px-4 py-2 font-medium">Labels</th>
                )}
                {fields.status && (
                  <th className="px-4 py-2 font-medium">Status</th>
                )}
                {fields.reporter && (
                  <th className="px-4 py-2 font-medium">Reporter</th>
                )}
                <th className="px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 && (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-4 py-4 text-center text-xs text-gray-400 dark:text-gray-500"
                  >
                    No tasks
                  </td>
                </tr>
              )}
              {tasks.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => onOpen(t)}
                  className="cursor-pointer border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-200">
                    {t.title}
                  </td>
                  {fields.priority && (
                    <td className="px-4 py-2.5">
                      <PriorityBadge priority={t.priority} />
                    </td>
                  )}
                  {fields.members && (
                    <td className="px-4 py-2.5">
                      <Avatar memberId={t.memberId} />
                    </td>
                  )}
                  {fields.dueDate && (
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                      {fmtDate(t.dueDate)}
                    </td>
                  )}
                  {fields.labels && (
                    <td className="px-4 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {t.tags.map((tag) => (
                          <TagPill key={tag} label={tag} />
                        ))}
                      </div>
                    </td>
                  )}
                  {fields.status && (
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                      {column.title}
                    </td>
                  )}
                  {fields.reporter && (
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                      {memberById(t.memberId)?.name}
                    </td>
                  )}
                  <td
                    className="px-4 py-2.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <RowMenu
                      onEdit={() => onOpen(t)}
                      onDelete={() => onDelete(t.id)}
                    />
                  </td>
                </tr>
              ))}
              {canAdd && (
                <tr className="border-t border-gray-100 dark:border-gray-800">
                  <td colSpan={colCount} className="px-4 py-2">
                    <button
                      onClick={() => onQuickAdd(column.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <Plus size={13} /> Add Task
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------- toolbar dropdowns ---------------------------------- */

function FieldsMenu({ fields, setFields }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <LayoutGrid size={14} /> Fields
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-30 w-48 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-1.5 shadow-lg">
          {FIELD_DEFS.map((f) => (
            <button
              key={f.key}
              onClick={() =>
                setFields((prev) => ({ ...prev, [f.key]: !prev[f.key] }))
              }
              className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {f.label}
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border ${fields[f.key] ? "border-accent bg-accent" : "border-gray-300 dark:border-gray-600"}`}
              >
                {fields[f.key] && (
                  <Check
                    size={11}
                    className="text-accent-foreground"
                    strokeWidth={3}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterMenu({ filters, setFilters }) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const activeCount = filters.priority.length + filters.member.length;

  const togglePriority = (p) =>
    setFilters((prev) => ({
      ...prev,
      priority: prev.priority.includes(p)
        ? prev.priority.filter((x) => x !== p)
        : [...prev.priority, p],
    }));
  const toggleMember = (id) =>
    setFilters((prev) => ({
      ...prev,
      member: prev.member.includes(id)
        ? prev.member.filter((x) => x !== id)
        : [...prev.member, id],
    }));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <Filter size={14} />
        {activeCount > 0 && (
          <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-foreground">
            {activeCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-30 w-56 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 shadow-lg">
          <div className="mb-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Priority
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => togglePriority(p.id)}
                  className={`rounded-md border px-2 py-1 text-xs font-medium ${
                    filters.priority.includes(p.id)
                      ? "border-accent bg-accent text-accent-foreground"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                >
                  {p.id}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Members
            </p>
            <div className="flex max-h-36 flex-col gap-1 overflow-y-auto">
              {MEMBERS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleMember(m.id)}
                  className="flex items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded border ${filters.member.includes(m.id) ? "border-accent bg-accent" : "border-gray-300 dark:border-gray-600"}`}
                  >
                    {filters.member.includes(m.id) && (
                      <Check
                        size={11}
                        className="text-accent-foreground"
                        strokeWidth={3}
                      />
                    )}
                  </span>
                  <Avatar memberId={m.id} />
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          {activeCount > 0 && (
            <button
              onClick={() => setFilters({ priority: [], member: [] })}
              className="mt-3 w-full rounded-md bg-gray-100 dark:bg-gray-800 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* --------------------------------- sidebar --------------------------------- */

function Sidebar({ collapsed, userName, initial, page, onNavigate, onLogout }) {
  const router = useRouter();
  if (collapsed) return null;
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-4">
      <div
        onClick={() => router.push("/profile")}
        className="mb-6 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer  hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900 dark:bg-gray-700 text-xs font-bold text-white">
          {initial}
        </span>
        <span className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100">
          {userName}
        </span>
        <ChevronsUpDown
          size={13}
          className="ml-auto text-gray-400 dark:text-gray-500"
        />
      </div>

      <p className="mb-2 flex items-center gap-1 px-2 text-xs font-medium text-gray-400 dark:text-gray-500">
        Workspace <ChevronDown size={12} />
      </p>
      <nav className="flex flex-col gap-0.5">
        <button
          onClick={() => onNavigate("tasks")}
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
            page === "main" || page === "task"
              ? "bg-accent text-accent-foreground"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <LayoutDashboard size={15} /> Tasks
        </button>
        <button
          onClick={() => onNavigate("projects")}
          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors ${
            page === "projects" || page === "project"
              ? "bg-accent text-accent-foreground"
              : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <FolderKanban size={15} /> Projects
        </button>
      </nav>

      <button
        onClick={onLogout}
        className="mt-auto flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400"
      >
        <LogOut size={15} /> Log out
      </button>
    </aside>
  );
}

/* ----------------------------------- root ----------------------------------- */

export default function TaskManager() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { logout: auth0Logout } = useAuth0();
  const tasks = useSelector((s) => s.tasks.items);
  const tasksLoading = useSelector((s) => s.tasks.loading);
  const tasksError = useSelector((s) => s.tasks.error);
  const auth = useSelector((s) => s.auth);

  const [view, setView] = useState("board");
  const [page, setPage] = useState("main"); // "main" | "task" | "projects" | "project"
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [search, setSearch] = useState("");
  const [fields, setFields] = useState({
    priority: true,
    members: true,
    dueDate: true,
    labels: false,
    status: false,
    reporter: false,
  });
  const [filters, setFilters] = useState({ priority: [], member: [] });
  const [draggedId, setDraggedId] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [presetStatus, setPresetStatus] = useState("todo");
  const [presetProjectId, setPresetProjectId] = useState("");
  const [taskReturnTo, setTaskReturnTo] = useState("main"); // "main" | "project"
  const [selectedProject, setSelectedProject] = useState(null);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [aiOpen, setAiOpen] = useState(false);

  const ownerKey = auth.user?.sub || "guest";
  useEffect(() => {
    dispatch(fetchTasks());
    dispatch(fetchProjects());
  }, [dispatch, ownerKey]);

  // Claim legacy AI-created items (stored as "guest" before the ownership fix)
  // so they become editable by whoever opens the app with their own id.
  useEffect(() => {
    if (auth.isLoading || (!auth.isAuthenticated && !auth.isGuest)) return;
    const me = auth.user?.sub || getStoredUserId() || getGuestId();
    if (!me || me === "guest") return;
    let cancelled = false;
    api("/api/projects/claim-guest", { method: "POST", ownerId: me })
      .then((r) => {
        if (!cancelled && r?.claimed > 0) {
          dispatch(fetchProjects());
          dispatch(fetchTasks());
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [auth.isLoading, auth.isAuthenticated, auth.isGuest, dispatch]);

  useEffect(() => {
    if (auth.isLoading) return;
    if (!auth.isAuthenticated && !auth.isGuest) router.replace("/auth");
  }, [auth.isLoading, auth.isAuthenticated, auth.isGuest, router]);

  const visibleTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch = t.title
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesPriority =
        filters.priority.length === 0 || filters.priority.includes(t.priority);
      const matchesMember =
        filters.member.length === 0 || filters.member.includes(t.memberId);
      return matchesSearch && matchesPriority && matchesMember;
    });
  }, [tasks, search, filters]);

  const handleDrop = (colId) => {
    if (draggedId == null) return;
    const task = tasks.find((t) => t.id === draggedId);
    if (task && task.status !== colId) {
      dispatch(updateTask({ id: draggedId, changes: { status: colId } }));
    }
    setDraggedId(null);
  };

  const openCreate = (status = "todo", projectId = "") => {
    setEditingTask(null);
    setPresetStatus(status);
    setPresetProjectId(projectId);
    setTaskReturnTo(page === "project" ? "project" : "main");
    setPage("task");
  };
  const openEdit = (task) => {
    setEditingTask(task);
    setTaskReturnTo(page === "project" ? "project" : "main");
    setPage("task");
  };
  const backToMain = () => {
    setEditingTask(null);
    setPresetProjectId("");
    setPage(taskReturnTo === "project" ? "project" : "main");
  };
  const saveTask = (task) => {
    if (editingTask) {
      dispatch(updateTask({ id: editingTask.id, changes: task }));
    } else {
      dispatch(addTask(task));
    }
    setEditingTask(null);
    setPresetProjectId("");
    setPage(taskReturnTo === "project" ? "project" : "main");
  };
  const autoSaveTask = (task) => {
    if (!editingTask || !task.id) return;
    dispatch(updateTask({ id: editingTask.id, changes: task }));
  };
  const duplicateTask = (task) => {
    const { id: _id, createdAt: _c, updatedAt: _u, ...copy } = task;
    dispatch(addTask({ ...copy, title: `${copy.title || "Untitled"} (copy)` }));
  };
  const deleteTask = (id) => {
    dispatch(deleteTask(id));
    if (editingTask?.id === id) {
      setEditingTask(null);
      setPresetProjectId("");
      setPage(taskReturnTo === "project" ? "project" : "main");
    }
  };
  const toggleGroup = (id) =>
    setCollapsedGroups((prev) => ({ ...prev, [id]: !prev[id] }));

  const meId = auth.user?.sub || getStoredUserId() || getGuestId();
  const projects = useSelector((s) => s.projects.items);

  const projectTasks = useMemo(
    () =>
      selectedProject
        ? tasks.filter((t) => t.projectId === selectedProject.id)
        : [],
    [tasks, selectedProject],
  );
  const canEditProject = !!selectedProject && selectedProject.ownerId === meId;

  const openProject = (project) => {
    setSelectedProject(project);
    setEditingTask(null);
    setPage("project");
  };
  const backToProjects = () => {
    setSelectedProject(null);
    setEditingTask(null);
    setPage("projects");
  };

  const userName = auth.user?.name || auth.user?.email || "Guest";
  const userInitial = (userName[0] || "G").toUpperCase();

  const handleLogout = () => {
    clearUserId();
    if (auth.isGuest) {
      dispatch(clearAuth());
      router.replace("/auth");
      return;
    }
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });
  };

  // Sidebar nav handler: maps nav targets to internal page state
  const handleNavigate = (target) => {
    if (target === "tasks") {
      setEditingTask(null);
      setSelectedProject(null);
      setPage("main");
    } else if (target === "projects") {
      setEditingTask(null);
      setSelectedProject(null);
      setPage("projects");
    }
  };

  const renderTaskViews = (taskList, canAdd, onQuickAdd) => (
    <div className="min-h-0 flex-1 overflow-hidden">
      {tasksLoading && taskList.length === 0 ? (
        <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Loading tasks…
        </div>
      ) : view === "board" ? (
        <div className="h-full overflow-x-auto overflow-y-hidden">
          <div className="flex h-full min-w-max gap-4">
            {COLUMNS.map((col) => (
              <BoardColumn
                key={col.id}
                column={col}
                tasks={taskList.filter((t) => t.status === col.id)}
                onOpen={openEdit}
                onDelete={deleteTask}
                onDrop={handleDrop}
                draggedId={draggedId}
                setDraggedId={setDraggedId}
                onQuickAdd={onQuickAdd}
                canAdd={canAdd}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="h-full overflow-y-auto">
          {COLUMNS.map((col) => (
            <TableGroup
              key={col.id}
              column={col}
              tasks={taskList.filter((t) => t.status === col.id)}
              fields={fields}
              collapsed={!!collapsedGroups[col.id]}
              onToggle={() => toggleGroup(col.id)}
              onOpen={openEdit}
              onDelete={deleteTask}
              onQuickAdd={onQuickAdd}
              canAdd={canAdd}
            />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-950 font-sans text-gray-800 dark:text-gray-100">
      <Sidebar
        collapsed={sidebarCollapsed}
        userName={userName}
        initial={userInitial}
        page={page}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* top bar */}
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2.5">
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="rounded-md p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <PanelLeft size={16} />
          </button>
          {page === "task" && (
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Tasks <ChevronRight size={13} className="mx-1 inline" />{" "}
              {editingTask ? editingTask.title : "New Task"}
            </span>
          )}
          {page === "projects" && (
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Projects
            </span>
          )}
          {page === "project" && selectedProject && (
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Projects <ChevronRight size={13} className="mx-1 inline" />{" "}
              {selectedProject.name}
            </span>
          )}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setAiOpen((o) => !o)}
              title={aiOpen ? "Close AI assistant" : "Open AI assistant"}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold transition hover:opacity-80 cursor-pointer ${
                aiOpen
                  ? "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 ring-2 ring-neutral-400 dark:ring-neutral-600"
                  : "bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900"
              }`}
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">AI</span>
            </button>
          </div>
        </div>

        {page === "task" ? (
          <TaskDetailPage
            initial={editingTask}
            defaultStatus={presetStatus}
            defaultProjectId={presetProjectId}
            projects={projects}
            columns={COLUMNS}
            members={MEMBERS}
            priorities={PRIORITIES}
            onBack={backToMain}
            onSave={saveTask}
            onDelete={deleteTask}
            onAutoSave={autoSaveTask}
            onDuplicate={duplicateTask}
          />
        ) : page === "projects" ? (
          <ProjectDetailPage onOpenProject={openProject} />
        ) : page === "project" && selectedProject ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-gray-950 px-5 py-4">
            <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={backToProjects}
                  className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100"
                >
                  <ArrowLeft size={15} /> Projects
                </button>
                <span className="h-5 w-px bg-gray-200 dark:bg-gray-700" />
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: selectedProject.color || "#171717",
                  }}
                >
                  <FolderKanban size={15} className="text-white" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="truncate text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {selectedProject.name}
                    </h1>
                    {selectedProject.private ? (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                        <Lock size={10} /> Private
                      </span>
                    ) : (
                      <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <LockOpen size={10} /> Public
                      </span>
                    )}
                  </div>
                  {selectedProject.desc && (
                    <p className="mt-0.5 truncate text-[13px] text-gray-500 dark:text-gray-400">
                      {selectedProject.desc}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300">
                  <Users
                    size={14}
                    className="text-gray-400 dark:text-gray-500"
                  />
                  {projectTasks.length} task
                  {projectTasks.length === 1 ? "" : "s"}
                </span>
                <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5">
                  <button
                    onClick={() => setView("board")}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      view === "board"
                        ? "bg-accent text-accent-foreground"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <LayoutGrid size={13} /> Board
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      view === "list"
                        ? "bg-accent text-accent-foreground"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <ListIcon size={13} /> List
                  </button>
                </div>
                {canEditProject && (
                  <button
                    onClick={() => openCreate("todo", selectedProject.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
                  >
                    <Plus size={14} /> Add Task
                  </button>
                )}
              </div>
            </div>

            {!canEditProject && (
              <p className="mb-3 flex items-center gap-1.5 text-[13px] text-gray-400 dark:text-gray-500">
                <LockOpen size={13} /> This is a shared project — you can view
                its tasks, but only the owner can add or edit them.
              </p>
            )}

            {tasksError && (
              <div className="mb-3 flex shrink-0 items-center gap-2 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle size={14} /> {tasksError}
                <button
                  onClick={() => dispatch(fetchTasks())}
                  className="ml-auto rounded-md p-1 hover:bg-red-100 dark:hover:bg-red-500/20"
                  title="Retry"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            )}

            {renderTaskViews(projectTasks, canEditProject, (status) =>
              openCreate(status, selectedProject.id),
            )}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-gray-950 px-5 py-4">
            <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
              <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Tasks
              </h1>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-0.5">
                  <button
                    onClick={() => setView("board")}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      view === "board"
                        ? "bg-accent text-accent-foreground"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <LayoutGrid size={13} /> Board
                  </button>
                  <button
                    onClick={() => setView("list")}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      view === "list"
                        ? "bg-accent text-accent-foreground"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <ListIcon size={13} /> List
                  </button>
                </div>

                <div className="relative">
                  <Search
                    size={14}
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
                  />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tasks..."
                    className="w-40 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1.5 pl-8 pr-2 text-sm text-gray-600 dark:text-gray-300 outline-none focus:border-gray-500 dark:focus:border-gray-400 sm:w-52"
                  />
                </div>

                <FieldsMenu fields={fields} setFields={setFields} />
                <FilterMenu filters={filters} setFilters={setFilters} />

                <button
                  onClick={() => openCreate("todo")}
                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
                >
                  <Plus size={14} /> Add Task
                </button>
              </div>
            </div>

            {tasksError && (
              <div className="mb-3 flex shrink-0 items-center gap-2 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle size={14} /> {tasksError}
                <button
                  onClick={() => dispatch(fetchTasks())}
                  className="ml-auto rounded-md p-1 hover:bg-red-100 dark:hover:bg-red-500/20"
                  title="Retry"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            )}

            {renderTaskViews(visibleTasks, true, openCreate)}
          </div>
        )}
      </div>

      {/* AI assistant split panel */}
      <div
        className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${
          aiOpen ? "w-[400px]" : "w-0"
        }`}
      >
        <AiAgentPanel open={aiOpen} onClose={() => setAiOpen(false)} />
      </div>
    </div>
  );
}
