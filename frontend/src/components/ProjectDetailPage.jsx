"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  Plus,
  X,
  Trash2,
  Pencil,
  Loader2,
  AlertTriangle,
  Lock,
  LockOpen,
  FolderKanban,
  RefreshCw,
  MoreHorizontal,
  Minus,
  ChevronDown,
} from "lucide-react";
import {
  fetchProjects,
  addProject,
  updateProject,
  deleteProject,
} from "@/store/slices/projectsSlice";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { getGuestId, getStoredUserId } from "@/lib/api";
import { COLOR_OPTIONS, BLACK_ACCENT } from "@/lib/theme";
import DatePicker from "./DatePicker";

const fmtDueDate = (d) => {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* ----------------------------- priority config ----------------------------- */

const PRIORITY_OPTIONS = [
  { id: "no_priority", label: "No Priority", color: "#9ca3af", bars: 0 },
  { id: "urgent", label: "Urgent", color: "#ef4444", bars: 3, urgent: true },
  { id: "high", label: "High", color: "#f43f5e", bars: 3 },
  { id: "medium", label: "Medium", color: "#f59e0b", bars: 2 },
  { id: "low", label: "Low", color: "#9ca3af", bars: 1 },
];

const getPriority = (id) =>
  PRIORITY_OPTIONS.find((p) => p.id === id) || PRIORITY_OPTIONS[0];

/* small ascending-bars icon, like Linear's priority glyph */
function PriorityBars({ priority, size = 13 }) {
  const { color, bars, urgent, id } = priority;

  if (id === "no_priority") {
    return <Minus size={size} className="shrink-0" style={{ color }} />;
  }

  if (urgent) {
    return <AlertTriangle size={size} className="shrink-0" style={{ color }} />;
  }

  const heights = [4, 7, 10];
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" className="shrink-0">
      {heights.map((h, i) => (
        <rect
          key={i}
          x={i * 4}
          y={12 - h}
          width={2.5}
          height={h}
          rx={0.6}
          fill={i < bars ? color : "#e5e7eb"}
        />
      ))}
    </svg>
  );
}

function PriorityBadge({ priorityId }) {
  const priority = getPriority(priorityId);
  if (priority.id === "no_priority") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 dark:text-gray-500">
        <PriorityBars priority={priority} /> No Priority
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[13px] font-medium"
      style={{ color: priority.color }}
    >
      <PriorityBars priority={priority} /> {priority.label}
    </span>
  );
}

/* dropdown used inside the modal to pick a priority */
function PrioritySelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = getPriority(value);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-700 dark:text-gray-200 outline-none focus:border-gray-400 dark:focus:border-gray-500"
      >
        <span className="flex items-center gap-2">
          <PriorityBars priority={current} />
          {current.label}
        </span>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-10 w-full min-w-[180px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1.5 shadow-xl">
          {PRIORITY_OPTIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(p.id);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <PriorityBars priority={p} />
              <span
                className="flex-1"
                style={{ color: p.id === "no_priority" ? undefined : p.color }}
              >
                {p.label}
              </span>
              {value === p.id && (
                <span className="text-gray-400 dark:text-gray-500">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* row-level "..." action menu, matches the compact look in the reference */
function RowActionsMenu({ onEdit, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="rounded-md p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
        title="More actions"
      >
        <MoreHorizontal size={15} />
      </button>

      {open && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-[calc(100%+4px)] z-10 w-36 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-1.5 shadow-xl"
        >
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ----------------------------- project form modal ----------------------------- */

function ProjectFormModal({ mode, project, onClose, onSave }) {
  const [name, setName] = useState(project?.name || "");
  const [desc, setDesc] = useState(project?.desc || "");
  const [color, setColor] = useState(project?.color || BLACK_ACCENT);
  const [isPrivate, setIsPrivate] = useState(!!project?.private);
  const [priority, setPriority] = useState(project?.priority || "no_priority");
  const [dueDate, setDueDate] = useState(project?.dueDate || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!mode) return;
    const handleKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [mode, onClose]);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        desc: desc.trim(),
        color,
        private: isPrivate,
        priority,
        dueDate,
      });
    } catch (err) {
      setError(err?.message || "Failed to save project");
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {mode === "edit" ? "Edit project" : "New project"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="e.g. Website Redesign"
              autoFocus
              className="h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 text-sm text-gray-700 dark:text-gray-200 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500"
            />
          </label>

          {/* priority + due date, side by side like the reference */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Priority
              </span>
              <PrioritySelect value={priority} onChange={setPriority} />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Due Date
              </span>
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder="No due date"
                className="h-10"
              />
            </label>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Description
            </span>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What is this project about?"
              rows={2}
              className="resize-none rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-gray-400 dark:focus:border-gray-500"
            />
          </label>

          <div>
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Color
            </span>
            <div className="mt-2 flex items-center gap-2">
              {COLOR_OPTIONS.map(({ id, hex }) => {
                const c = hex || BLACK_ACCENT;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setColor(c)}
                    title={id}
                    className={`h-7 w-7 rounded-lg transition ${
                      color === c
                        ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-900 dark:ring-gray-600"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsPrivate((p) => !p)}
            className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <span>
              <span className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Private project
              </span>
              <span className="block text-xs text-gray-400 dark:text-gray-500">
                Only you can see it and its tasks
              </span>
            </span>
            <span
              className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                isPrivate ? "bg-accent" : "bg-gray-300 dark:bg-gray-700"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${
                  isPrivate ? "left-[18px]" : "left-0.5"
                }`}
              />
            </span>
          </button>
        </div>

        {error && (
          <p className="mt-4 flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-[13px] text-red-600 dark:text-red-400">
            <AlertTriangle size={13} /> {error}
          </p>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-full px-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || !name.trim()}
            className="flex h-10 items-center gap-2 rounded-full bg-accent px-5 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            {mode === "edit" ? "Save changes" : "Add Project"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- delete confirm modal ----------------------------- */

function DeleteProjectModal({ project, onClose, onConfirm }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err?.message || "Failed to delete project");
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Delete project?
        </h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-700 dark:text-gray-200">
            {project?.name}
          </span>{" "}
          and all of its tasks will be permanently deleted. This cannot be
          undone.
        </p>
        {error && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-[13px] text-red-600 dark:text-red-400">
            <AlertTriangle size={13} /> {error}
          </p>
        )}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-full px-4 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="flex h-10 items-center gap-2 rounded-full bg-red-600 px-5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            {busy && <Loader2 size={14} className="animate-spin" />}
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------- root ----------------------------------- */

export default function ProjectDetailPage({ onOpenProject }) {
  const dispatch = useDispatch();
  const { items: projects, loading, error } = useSelector((s) => s.projects);
  const auth = useSelector((s) => s.auth);
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [modal, setModal] = useState(null); // null | {mode:"create"} | {mode:"edit", project}
  const [deleteTarget, setDeleteTarget] = useState(null);

  const meId = auth.user?.sub || getStoredUserId() || getGuestId();

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  const visibleProjects = useMemo(() => {
    if (!search) return projects;
    const q = search.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q),
    );
  }, [projects, search]);

  const saveProject = async (payload) => {
    if (modal?.mode === "edit") {
      await dispatch(
        updateProject({ id: modal.project.id, changes: payload }),
      ).unwrap();
    } else {
      await dispatch(addProject(payload)).unwrap();
    }
    setModal(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(deleteProject(deleteTarget.id)).unwrap();
    dispatch(fetchTasks());
    setDeleteTarget(null);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-gray-950 px-5 py-4">
      <div className="mb-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Projects
        </h1>

        <div className="flex items-center gap-2">
          {searchOpen ? (
            <div className="relative">
              <Search
                size={14}
                className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"
              />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={() => !search && setSearchOpen(false)}
                placeholder="Search projects..."
                className="w-48 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-1.5 pl-8 pr-2 text-sm text-gray-600 dark:text-gray-300 outline-none focus:border-gray-500 dark:focus:border-gray-400"
              />
            </div>
          ) : (
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <Search size={14} />
            </button>
          )}

          <button
            onClick={() => setModal({ mode: "create" })}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            <Plus size={14} /> Add Project
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 flex shrink-0 items-center gap-2 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          <AlertTriangle size={14} /> {error}
          <button
            onClick={() => dispatch(fetchProjects())}
            className="ml-auto rounded-md p-1 hover:bg-red-100 dark:hover:bg-red-500/20"
            title="Retry"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-gray-200 dark:border-gray-800">
        {loading && projects.length === 0 ? (
          <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <Loader2 size={16} className="animate-spin" /> Loading projects…
          </div>
        ) : (
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/60 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                <th className="px-4 py-2.5 font-medium">Projects</th>
                <th className="px-4 py-2.5 font-medium">Priority</th>
                <th className="px-4 py-2.5 font-medium">Due Date</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
                <th className="px-4 py-2.5 font-medium">Visibility</th>
                <th className="px-4 py-2.5 font-medium">Owner</th>
                <th className="w-10 px-4 py-2.5 font-medium" />
              </tr>
            </thead>
            <tbody>
              {visibleProjects.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-xs text-gray-400 dark:text-gray-500"
                  >
                    {search
                      ? "No projects match your search"
                      : "No projects yet — create your first project"}
                  </td>
                </tr>
              )}
              {visibleProjects.map((p) => {
                const isOwner = p.ownerId === meId;
                return (
                  <tr
                    key={p.id}
                    onClick={() => onOpenProject?.(p)}
                    className="cursor-pointer border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: p.color || BLACK_ACCENT,
                          }}
                        >
                          <FolderKanban size={14} className="text-white" />
                        </span>
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <PriorityBadge priorityId={p.priority} />
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                      {p.dueDate ? (
                        fmtDueDate(p.dueDate)
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">
                          —
                        </span>
                      )}
                    </td>
                    <td className="max-w-[240px] px-4 py-2.5 text-gray-500 dark:text-gray-400">
                      <span className="block truncate">
                        {p.desc || "No description"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {p.private ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400">
                          <Lock size={10} /> Private
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                          <LockOpen size={10} /> Public
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400">
                      {isOwner ? "You" : "Shared"}
                    </td>
                    <td
                      className="px-4 py-2.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isOwner && (
                        <RowActionsMenu
                          onEdit={() => setModal({ mode: "edit", project: p })}
                          onDelete={() => setDeleteTarget(p)}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <ProjectFormModal
          mode={modal.mode}
          project={modal.project}
          onClose={() => setModal(null)}
          onSave={saveProject}
        />
      )}
      {deleteTarget && (
        <DeleteProjectModal
          project={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
