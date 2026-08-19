"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Lock,
  LockOpen,
  Eye,
  Share2,
  MoreHorizontal,
  PanelRight,
  ChevronDown,
  ChevronUp,
  Tag,
  Calendar,
  Plus,
  Settings,
  Check,
  Paperclip,
  Send,
  SignalMedium,
  User,
  Users,
  Layers,
  ArrowLeft,
  X,
  Trash2,
  FileText,
  Link2,
  Copy,
  AlertTriangle,
  Folder,
} from "lucide-react";
import DatePicker from "./DatePicker";

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

const uid = () =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const fmtTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtDate = (val) => {
  if (!val) return "";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(val)
    ? new Date(val + "T00:00:00")
    : new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function IconButton({ children, badge, onClick, active, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`relative flex h-8 w-8 items-center justify-center rounded-lg border transition ${
        active
          ? "border-accent bg-accent text-accent-foreground hover:bg-accent/90"
          : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      {children}
      {badge != null && badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-semibold text-accent-foreground">
          {badge}
        </span>
      )}
    </button>
  );
}

function UserAvatar({ name, picture, size = "h-6 w-6 text-[10px]" }) {
  if (picture) {
    return (
      <img
        src={picture}
        alt={name || "user"}
        className={`${size} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 font-semibold text-white`}
    >
      {(name?.[0] || "?").toUpperCase()}
    </div>
  );
}

function TagPill({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
      <Tag size={11} />
      {label}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-0.5 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600"
        >
          <X size={10} />
        </button>
      )}
    </span>
  );
}

function PriorityTag({ id, priorities }) {
  const p =
    priorities.find((x) => x.id === id) ?? priorities[priorities.length - 1];
  const Icon = p.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${p.cls}`}
    >
      <Icon size={13} strokeWidth={2.5} />
      {p.id}
    </span>
  );
}

function MiniAvatar({ initial, color }) {
  return (
    <div
      className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white ${color}`}
    >
      {initial}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  valueNode,
  popover,
  popoverWidth = "w-52",
}) {
  const [open, setOpen] = useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  return (
    <div
      className="relative flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 py-2.5"
      ref={ref}
    >
      <div className="flex w-20 shrink-0 items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
        <Icon size={13} />
        {label}
      </div>
      <button
        type="button"
        onClick={() => popover && setOpen((o) => !o)}
        className="flex flex-1 items-center gap-1 rounded-md px-1.5 py-1 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        {valueNode}
        {popover &&
          (open ? (
            <ChevronUp
              size={12}
              className="ml-auto text-gray-400 dark:text-gray-500"
            />
          ) : null)}
      </button>
      {open && popover && (
        <div
          className={`absolute left-20 top-9 z-30 ${popoverWidth} overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-lg`}
        >
          {popover(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export default function TaskDetailPage({
  initial,
  defaultStatus,
  columns,
  members,
  priorities,
  projects = [],
  defaultProjectId = "",
  onBack,
  onSave,
  onDelete,
  onAutoSave,
  onDuplicate,
}) {
  const { user } = useAuth0();
  const isEdit = !!initial;
  const me = user?.sub || "guest";
  const myName = user?.name || user?.nickname || user?.email || "Guest";
  const myPicture = user?.picture || "";

  const [title, setTitle] = useState(initial?.title ?? "");
  const [desc, setDesc] = useState(initial?.desc ?? "");
  const [status, setStatus] = useState(
    initial?.status ?? defaultStatus ?? columns[0].id,
  );
  const [priority, setPriority] = useState(
    initial?.priority ?? priorities[1]?.id ?? priorities[0].id,
  );
  const [memberId, setMemberId] = useState(initial?.memberId ?? members[0].id);
  const [projectId, setProjectId] = useState(
    initial?.projectId ?? defaultProjectId ?? "",
  );
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [tags, setTags] = useState(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [subtasks, setSubtasks] = useState(initial?.subtasks ?? []);
  const [subtaskInput, setSubtaskInput] = useState("");
  const [comments, setComments] = useState(initial?.comments ?? []);
  const [comment, setComment] = useState("");
  const [resources, setResources] = useState(initial?.resources ?? []);
  const [resourceName, setResourceName] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [locked, setLocked] = useState(!!initial?.locked);
  const [watchers, setWatchers] = useState(initial?.watchers ?? []);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [menu, setMenu] = useState(null); // "watchers" | "share" | "more"
  const [copied, setCopied] = useState(false);
  const [autoError, setAutoError] = useState(null);

  const menuRef = useOutsideClose(menu !== null, () => setMenu(null));

  const col = columns.find((c) => c.id === status) ?? columns[0];
  const assignee = members.find((m) => m.id === memberId) ?? members[0];
  const project = projects.find((p) => p.id === projectId) ?? null;
  const isWatching = watchers.some((w) => w.id === me);

  const buildTask = () => ({
    id: initial?.id ?? "",
    title,
    desc,
    status,
    priority,
    memberId,
    projectId,
    dueDate,
    tags,
    subtasks,
    comments,
    resources,
    locked,
    watchers,
  });

  const autoSave = (patch) => {
    if (!isEdit) return;
    try {
      onAutoSave?.(patch);
      setAutoError(null);
    } catch (err) {
      setAutoError(err?.message || "Failed to save");
    }
  };

  /* ------------------------------- tags ------------------------------- */

  const addTag = () => {
    const v = tagInput.trim();
    if (v && !tags.includes(v)) {
      const next = [...tags, v];
      setTags(next);
      autoSave({ ...buildTask(), tags: next });
    }
    setTagInput("");
  };
  const removeTag = (t) => {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    autoSave({ ...buildTask(), tags: next });
  };

  /* ----------------------------- subtasks ----------------------------- */

  const addSubtask = () => {
    const v = subtaskInput.trim();
    if (!v) return;
    const next = [...subtasks, { id: uid(), title: v, done: false }];
    setSubtasks(next);
    autoSave({ ...buildTask(), subtasks: next });
    setSubtaskInput("");
  };
  const toggleSubtask = (id) => {
    const next = subtasks.map((s) =>
      s.id === id ? { ...s, done: !s.done } : s,
    );
    setSubtasks(next);
    autoSave({ ...buildTask(), subtasks: next });
  };
  const removeSubtask = (id) => {
    const next = subtasks.filter((s) => s.id !== id);
    setSubtasks(next);
    autoSave({ ...buildTask(), subtasks: next });
  };

  /* ----------------------------- comments ----------------------------- */

  const addComment = () => {
    const text = comment.trim();
    if (!text) return;
    const next = [
      ...comments,
      {
        id: uid(),
        text,
        author: me,
        authorName: myName,
        authorPicture: myPicture,
        createdAt: new Date().toISOString(),
      },
    ];
    setComments(next);
    autoSave({ ...buildTask(), comments: next });
    setComment("");
  };
  const removeComment = (id) => {
    const next = comments.filter((c) => c.id !== id);
    setComments(next);
    autoSave({ ...buildTask(), comments: next });
  };

  /* ----------------------------- resources ---------------------------- */

  const addResource = () => {
    const url = resourceUrl.trim();
    const name = resourceName.trim() || url;
    if (!url && !name) return;
    const next = [...resources, { id: uid(), name, url }];
    setResources(next);
    autoSave({ ...buildTask(), resources: next });
    setResourceName("");
    setResourceUrl("");
  };
  const removeResource = (id) => {
    const next = resources.filter((r) => r.id !== id);
    setResources(next);
    autoSave({ ...buildTask(), resources: next });
  };

  /* ---------------------------- lock / watch --------------------------- */

  const toggleLock = () => {
    const next = !locked;
    setLocked(next);
    autoSave({ ...buildTask(), locked: next });
  };
  const toggleWatch = () => {
    const next = isWatching
      ? watchers.filter((w) => w.id !== me)
      : [...watchers, { id: me, name: myName, picture: myPicture }];
    setWatchers(next);
    autoSave({ ...buildTask(), watchers: next });
    if (!next.length) setMenu(null);
  };

  const copyLink = async () => {
    const link = window.location.origin + "/task";
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ------------------------------- submit ------------------------------ */

  const submit = () => {
    if (!title.trim()) return;
    onSave({
      ...buildTask(),
      title: title.trim(),
    });
  };

  const doneCount = subtasks.filter((s) => s.done).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-gray-950">
      {/* top bar */}
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 px-6 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100"
        >
          <ArrowLeft size={15} /> Back to Tasks
        </button>
        <div className="relative flex items-center gap-2" ref={menuRef}>
          {autoError && (
            <span className="mr-1 flex items-center gap-1 text-xs text-red-500 dark:text-red-400">
              <AlertTriangle size={12} /> {autoError}
            </span>
          )}

          <IconButton
            onClick={toggleLock}
            active={locked}
            title={
              locked
                ? "Private task — only you can see it"
                : "Public task — click to lock"
            }
          >
            {locked ? (
              <Lock size={14} fill="currentColor" />
            ) : (
              <LockOpen size={14} />
            )}
          </IconButton>

          <IconButton
            onClick={() => setMenu(menu === "watchers" ? null : "watchers")}
            badge={watchers.length}
            title="Watchers"
          >
            <Eye size={14} />
          </IconButton>
          {menu === "watchers" && (
            <div className="absolute right-0 top-10 z-40 w-60 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-lg">
              <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                Watchers
              </p>
              {watchers.length === 0 && (
                <p className="px-3 py-1.5 text-sm text-gray-400 dark:text-gray-500">
                  No watchers yet
                </p>
              )}
              {watchers.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200"
                >
                  <UserAvatar
                    name={w.name}
                    picture={w.picture}
                    size="h-5 w-5 text-[9px]"
                  />
                  <span className="truncate">
                    {w.name || "Unknown"}
                    {w.id === me ? " (you)" : ""}
                  </span>
                </div>
              ))}
              <button
                type="button"
                onClick={toggleWatch}
                className="mt-1 flex w-full items-center gap-2 border-t border-gray-100 dark:border-gray-800 px-3 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Eye size={13} />
                {isWatching ? "Unwatch task" : "Watch task"}
              </button>
            </div>
          )}

          <IconButton
            onClick={() => setMenu(menu === "share" ? null : "share")}
            title="Share"
          >
            <Share2 size={14} />
          </IconButton>
          {menu === "share" && (
            <div className="absolute right-0 top-10 z-40 w-72 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-3 shadow-lg">
              <p className="px-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                Share this task
              </p>
              <p className="px-3 pb-2 text-xs text-gray-400 dark:text-gray-500">
                {locked
                  ? "Task is private. Unlock it to make it shareable."
                  : "Anyone in the workspace can open this link."}
              </p>
              <div className="mx-3 flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                <Link2
                  size={13}
                  className="shrink-0 text-gray-400 dark:text-gray-500"
                />
                <span className="flex-1 truncate text-xs text-gray-500 dark:text-gray-400">
                  {typeof window !== "undefined"
                    ? window.location.origin + "/task"
                    : "/task"}
                </span>
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground hover:bg-accent/90"
                >
                  {copied ? (
                    <Check size={11} strokeWidth={3} />
                  ) : (
                    <Copy size={11} />
                  )}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>
          )}

          <IconButton
            onClick={() => setMenu(menu === "more" ? null : "more")}
            title="More actions"
          >
            <MoreHorizontal size={14} />
          </IconButton>
          {menu === "more" && (
            <div className="absolute right-0 top-10 z-40 w-44 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  onDuplicate?.(buildTask());
                  setMenu(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <Copy size={13} /> Duplicate
              </button>
              {isEdit && (
                <button
                  type="button"
                  onClick={() => onDelete(initial.id)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg border text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 ${
              sidebarOpen
                ? "border-accent bg-accent text-accent-foreground hover:bg-accent/90"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            <PanelRight size={14} />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* main column */}
        <div className="min-w-0 flex-1 overflow-y-auto px-8 py-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Untitled Task"
            className="mb-2 w-full border-none bg-transparent text-2xl font-semibold text-gray-900 dark:text-gray-100 outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
          />
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Add a description…"
            rows={2}
            className="mb-6 w-full resize-none border-none bg-transparent text-sm leading-relaxed text-gray-500 dark:text-gray-400 outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
          />

          {/* Properties */}
          <div className="mb-4 flex items-start gap-4 text-sm">
            <span className="w-24 shrink-0 pt-1 font-medium text-gray-400 dark:text-gray-500">
              Properties
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 py-1 pl-1 pr-2.5 text-xs font-medium text-gray-600 dark:text-gray-300">
                <MiniAvatar initial={assignee.initial} color={assignee.color} />
                {assignee.name}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-red-50 dark:bg-red-500/10 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400">
                <Calendar size={11} /> {dueDate ? fmtDate(dueDate) : "No date"}
              </span>
              {project && (
                <span
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
                  style={{
                    backgroundColor: project.color + "1A",
                    color: project.color,
                  }}
                >
                  <Folder size={11} /> {project.name}
                </span>
              )}
              {locked && (
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 dark:bg-gray-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300">
                  <Lock size={11} /> Private
                </span>
              )}
            </div>
          </div>

          {/* Labels */}
          <div className="mb-4 flex items-start gap-4 text-sm">
            <span className="w-24 shrink-0 pt-1 font-medium text-gray-400 dark:text-gray-500">
              Labels
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              {tags.map((t) => (
                <TagPill key={t} label={t} onRemove={() => removeTag(t)} />
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
                onBlur={addTag}
                placeholder="Add label…"
                className="w-24 rounded-md border border-dashed border-gray-300 dark:border-gray-600 bg-transparent px-2 py-1 text-xs text-gray-600 dark:text-gray-300 outline-none focus:border-gray-500 dark:focus:border-gray-400"
              />
            </div>
          </div>

          {/* Resources */}
          <div className="mb-6 flex items-start gap-4 text-sm">
            <span className="w-24 shrink-0 pt-1 font-medium text-gray-400 dark:text-gray-500">
              Resources
            </span>
            <div className="flex flex-1 flex-col gap-2">
              {resources.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  No resources yet
                </p>
              )}
              {resources.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-100 dark:border-gray-800 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  {r.url ? (
                    <Link2
                      size={13}
                      className="shrink-0 text-gray-400 dark:text-gray-500"
                    />
                  ) : (
                    <FileText
                      size={13}
                      className="shrink-0 text-gray-400 dark:text-gray-500"
                    />
                  )}
                  <span className="flex-1 truncate text-sm text-gray-700 dark:text-gray-200">
                    {r.name || "Unnamed"}
                  </span>
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                    >
                      Open ↗
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => removeResource(r.id)}
                    className="shrink-0 rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  value={resourceName}
                  onChange={(e) => setResourceName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addResource())
                  }
                  placeholder="Name"
                  className="w-36 rounded-md border border-dashed border-gray-300 dark:border-gray-600 bg-transparent px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 outline-none focus:border-gray-500 dark:focus:border-gray-400"
                />
                <input
                  value={resourceUrl}
                  onChange={(e) => setResourceUrl(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && (e.preventDefault(), addResource())
                  }
                  placeholder="Paste a link…"
                  className="min-w-0 flex-1 rounded-md border border-dashed border-gray-300 dark:border-gray-600 bg-transparent px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 outline-none focus:border-gray-500 dark:focus:border-gray-400"
                />
                <button
                  type="button"
                  onClick={addResource}
                  className="flex shrink-0 items-center gap-1 rounded-md bg-accent px-2.5 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90"
                >
                  <Plus size={12} /> Add
                </button>
              </div>
            </div>
          </div>

          {/* Subtasks */}
          <div className="mb-6">
            <button
              type="button"
              className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-200"
            >
              <ChevronDown
                size={14}
                className="text-gray-400 dark:text-gray-500"
              />{" "}
              Subtasks
              {subtasks.length > 0 && (
                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                  {doneCount}/{subtasks.length} done
                </span>
              )}
            </button>
            {subtasks.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                {subtasks.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2.5 border-t border-gray-100 dark:border-gray-800 px-4 py-2 first:border-t-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <button
                      type="button"
                      onClick={() => toggleSubtask(s.id)}
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                        s.done
                          ? "border-accent bg-accent"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-500 dark:hover:border-gray-400"
                      }`}
                      title={s.done ? "Mark as not done" : "Mark as done"}
                    >
                      {s.done && (
                        <Check
                          size={10}
                          className="text-accent-foreground"
                          strokeWidth={3}
                        />
                      )}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        s.done
                          ? "text-gray-400 dark:text-gray-500 line-through"
                          : "text-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {s.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeSubtask(s.id)}
                      className="rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-red-500 dark:hover:text-red-400"
                      title="Delete subtask"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-center gap-2">
              <input
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addSubtask())
                }
                placeholder="Add a subtask…"
                className="flex-1 rounded-md border border-dashed border-gray-300 dark:border-gray-600 bg-transparent px-2 py-1.5 text-xs text-gray-600 dark:text-gray-300 outline-none focus:border-gray-500 dark:focus:border-gray-400"
              />
              <button
                type="button"
                onClick={addSubtask}
                className="rounded-md bg-accent p-1.5 text-accent-foreground hover:bg-accent/90"
                title="Add subtask"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-200">
              Comments
            </h3>
            <div className="mb-4 flex flex-col gap-3">
              {comments.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  No comments yet
                </p>
              )}
              {comments.map((c) => (
                <div key={c.id} className="group flex items-start gap-2.5">
                  <UserAvatar
                    name={c.authorName}
                    picture={c.authorPicture}
                    size="h-6 w-6 text-[10px]"
                  />
                  <div className="flex-1 rounded-lg bg-gray-50 dark:bg-gray-800 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                        {c.authorName || "Unknown"}
                      </span>
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">
                        {fmtTime(c.createdAt)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeComment(c.id)}
                        className="ml-auto rounded p-0.5 text-gray-300 dark:text-gray-600 opacity-0 transition group-hover:opacity-100 hover:text-red-500 dark:hover:text-red-400"
                        title="Delete comment"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
                      {c.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5">
              <UserAvatar
                name={myName}
                picture={myPicture}
                size="h-6 w-6 text-[10px]"
              />
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addComment())
                }
                placeholder="Add a comment…"
                className="flex-1 bg-transparent text-sm text-gray-600 dark:text-gray-300 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <button
                type="button"
                onClick={addComment}
                className="rounded-md p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
                title="Send comment"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* right sidebar */}
        {sidebarOpen && (
          <div className="w-72 shrink-0 overflow-y-auto border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4">
            <div className="mb-4 rounded-xl border border-gray-200 dark:border-gray-800 p-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <ChevronDown size={13} /> Details
                </span>
                <Settings
                  size={13}
                  className="text-gray-400 dark:text-gray-500"
                />
              </div>

              <DetailRow
                icon={Layers}
                label="Status"
                valueNode={
                  <span className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${col.dot}`} />{" "}
                    {col.title}
                  </span>
                }
                popover={(close) => (
                  <>
                    {columns.map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => {
                          setStatus(opt.id);
                          close();
                        }}
                        className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${opt.dot}`} />{" "}
                          {opt.title}
                        </span>
                        {status === opt.id && (
                          <Check
                            size={13}
                            className="text-gray-900 dark:text-gray-100"
                          />
                        )}
                      </button>
                    ))}
                  </>
                )}
              />

              <DetailRow
                icon={Folder}
                label="Project"
                valueNode={
                  project ? (
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      {project.name}
                    </span>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">
                      No project
                    </span>
                  )
                }
                popoverWidth="w-64"
                popover={(close) => (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setProjectId("");
                        close();
                      }}
                      className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span className="text-gray-400 dark:text-gray-500">
                        No project
                      </span>
                      {!projectId && (
                        <Check
                          size={13}
                          className="text-gray-900 dark:text-gray-100"
                        />
                      )}
                    </button>
                    {projects.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => {
                          setProjectId(p.id);
                          close();
                        }}
                        className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="truncate">{p.name}</span>
                        </span>
                        {projectId === p.id && (
                          <Check
                            size={13}
                            className="text-gray-900 dark:text-gray-100"
                          />
                        )}
                      </button>
                    ))}
                  </>
                )}
              />

              <DetailRow
                icon={SignalMedium}
                label="Priority"
                valueNode={
                  <PriorityTag id={priority} priorities={priorities} />
                }
                popover={(close) => (
                  <>
                    {priorities.map((opt) => {
                      const Ic = opt.icon;
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          onClick={() => {
                            setPriority(opt.id);
                            close();
                          }}
                          className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <span
                            className={`flex items-center gap-2 ${opt.cls}`}
                          >
                            <Ic size={13} /> {opt.id}
                          </span>
                          {priority === opt.id && (
                            <Check
                              size={13}
                              className="text-gray-900 dark:text-gray-100"
                            />
                          )}
                        </button>
                      );
                    })}
                  </>
                )}
              />

              <DetailRow
                icon={Users}
                label="Members"
                valueNode={
                  <span className="flex items-center gap-2">
                    <MiniAvatar
                      initial={assignee.initial}
                      color={assignee.color}
                    />{" "}
                    {assignee.name}
                  </span>
                }
                popover={(close) => (
                  <>
                    {members.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => {
                          setMemberId(m.id);
                          close();
                        }}
                        className="flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <span className="flex items-center gap-2">
                          <MiniAvatar initial={m.initial} color={m.color} />{" "}
                          {m.name}
                        </span>
                        {memberId === m.id && (
                          <Check
                            size={13}
                            className="text-gray-900 dark:text-gray-100"
                          />
                        )}
                      </button>
                    ))}
                  </>
                )}
              />

              <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 py-2.5 ">
                <div className="flex w-20 shrink-0 items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <Calendar size={13} /> Dates
                </div>
                <DatePicker
                  value={dueDate}
                  onChange={(v) => {
                    setDueDate(v);
                    autoSave({ ...buildTask(), dueDate: v });
                  }}
                />
              </div>

              <DetailRow
                icon={User}
                label="Reporter"
                valueNode={
                  <span className="text-gray-700 dark:text-gray-200">
                    {myName}
                  </span>
                }
              />
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={submit}
                className="w-full rounded-lg bg-accent py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90"
              >
                {isEdit ? "Save Changes" : "Create Task"}
              </button>
              {isEdit && (
                <button
                  type="button"
                  onClick={() => onDelete(initial.id)}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <Trash2 size={14} /> Delete Task
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
