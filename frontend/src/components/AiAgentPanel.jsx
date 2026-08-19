"use client";

import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchTasks } from "@/store/slices/tasksSlice";
import { fetchProjects } from "@/store/slices/projectsSlice";
import {
  Sparkles,
  X,
  ArrowUp,
  Check,
  Loader2,
  AlertTriangle,
  Bot,
  ListChecks,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { getGuestId, getStoredUserId } from "@/lib/api";
import Markdown from "@/components/Markdown";

const AI_URL = process.env.NEXT_PUBLIC_AI_URL || "http://localhost:5001";

const SUGGESTIONS = [
  "Show me all my tasks",
  "Create a task: 'Send weekly report' due Friday, High priority",
  "What's due today?",
  "Create a project called Launch Website",
  "Mark the stale tasks as on hold",
];

/**
 * Every tool gets its own glyph + tone instead of a uniform icon —
 * the shape of the action (read / create / update / delete) is
 * information the user should be able to scan at a glance.
 */
const STEP_META = {
  list_tasks: { label: "Read tasks", icon: ListChecks, tone: "read" },
  list_projects: { label: "Read projects", icon: ListChecks, tone: "read" },
  create_task: { label: "Created task", icon: Plus, tone: "create" },
  create_project: { label: "Created project", icon: Plus, tone: "create" },
  update_task: { label: "Updated task", icon: Pencil, tone: "update" },
  update_project: { label: "Updated project", icon: Pencil, tone: "update" },
  delete_task: { label: "Deleted task", icon: Trash2, tone: "delete" },
  delete_project: { label: "Deleted project", icon: Trash2, tone: "delete" },
};

const MUTATION_TOOLS = new Set([
  "create_task",
  "update_task",
  "delete_task",
  "create_project",
  "update_project",
  "delete_project",
]);

const TONE_STYLES = {
  read: {
    ring: "ring-violet-500/25 dark:ring-violet-400/20",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    icon: "text-violet-600 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  create: {
    ring: "ring-emerald-500/25 dark:ring-emerald-400/20",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    icon: "text-emerald-600 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  update: {
    ring: "ring-amber-500/25 dark:ring-amber-400/20",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    icon: "text-amber-600 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  delete: {
    ring: "ring-rose-500/25 dark:ring-rose-400/20",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    icon: "text-rose-600 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

let idCounter = 0;
function genId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  idCounter += 1;
  return "msg-" + Date.now().toString(36) + "-" + idCounter.toString(36);
}

/* ------------------------------ Agent mark ------------------------------ */
/* A single-hue mark with a soft glow ring, replacing the generic
   indigo/purple/pink gradient badge — one committed color reads more
   like a considered identity than a rainbow. */
function AgentMark({ size = 32, busy = false }) {
  return (
    <span
      className="relative flex shrink-0 items-center justify-center rounded-xl bg-violet-600 dark:bg-violet-500 shadow-[0_2px_10px_-2px_rgba(124,58,237,0.55)]"
      style={{ width: size, height: size }}
    >
      <span
        className={`absolute inset-0 rounded-xl border border-violet-400/40 dark:border-violet-300/30 ${
          busy ? "ablespace-ring-pulse" : ""
        }`}
      />
      <Sparkles size={size * 0.5} className="text-white" strokeWidth={2.25} />
    </span>
  );
}

/* ------------------------------ Step ledger ------------------------------ */
/* Tool calls render as a connected activity ledger rather than loose
   pills — each node is colored by what actually happened. */
function StepLedger({ steps }) {
  return (
    <ol className="relative ml-4 flex flex-col gap-2.5 border-l border-dashed border-gray-200 dark:border-gray-700 pl-4">
      {steps.map((step, i) => {
        const meta = STEP_META[step.name] || {
          label: step.name,
          icon: Check,
          tone: "read",
        };
        const tone = TONE_STYLES[meta.tone];
        const Icon = meta.icon;
        return (
          <li
            key={i}
            className="ablespace-pop-in relative flex items-center gap-2"
            style={{ animationDelay: `${i * 70}ms` }}
          >
            <span
              className={`absolute -left-[21px] flex h-4 w-4 items-center justify-center rounded-full ${tone.dot} ring-4 ring-white dark:ring-gray-900`}
            />
            <span
              className={`flex items-center gap-1.5 rounded-lg ${tone.bg} ${tone.ring} ring-1 px-2.5 py-1`}
            >
              <Icon size={12} className={tone.icon} strokeWidth={2.25} />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                {meta.label}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* Replaces the generic three-bouncing-dots pattern: a working agent
   should read as "doing something," not "typing a text message." */
function AgentWorking() {
  return (
    <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 px-3.5 py-2.5">
      <Loader2
        size={13}
        className="animate-spin text-violet-500 dark:text-violet-400"
      />
      <span className="ablespace-shimmer text-xs font-medium text-gray-500 dark:text-gray-400">
        Working on it…
      </span>
    </div>
  );
}

export default function AiAgentPanel({ open, onClose }) {
  const auth = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const ownerId = auth.user?.sub || getStoredUserId() || getGuestId();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (text) => {
    const trimmed = String(text || "").trim();
    if (!trimmed || loading) return;
    const userMsg = { id: genId(), role: "user", content: trimmed };
    const turn = [...messages, userMsg];
    setMessages(turn);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${AI_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: turn.map((m) => ({ role: m.role, content: m.content })),
          ownerId,
        }),
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
      const steps = Array.isArray(data.steps) ? data.steps : [];
      setMessages([
        ...turn,
        {
          id: genId(),
          role: "assistant",
          content: data.text || "Done.",
          steps,
        },
      ]);
      if (steps.some((s) => MUTATION_TOOLS.has(s.name))) {
        dispatch(fetchTasks());
        dispatch(fetchProjects());
      }
    } catch (err) {
      setError(err.message || "Failed to reach the AI agent");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex h-full w-full sm:w-[400px] flex-col border-l border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-2xl md:static md:z-auto md:shadow-none">
      <style>{`
        @keyframes ablespace-ring-pulse {
          0%   { transform: scale(1);    opacity: .9; }
          70%  { transform: scale(1.55); opacity: 0;  }
          100% { transform: scale(1.55); opacity: 0;  }
        }
        .ablespace-ring-pulse { animation: ablespace-ring-pulse 2.2s ease-out infinite; }

        @keyframes ablespace-fade-in {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ablespace-fade-in { animation: ablespace-fade-in .28s ease-out both; }

        @keyframes ablespace-pop-in {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .ablespace-pop-in { animation: ablespace-pop-in .22s ease-out both; }

        @keyframes ablespace-shimmer {
          0%, 100% { opacity: .55; }
          50%      { opacity: 1; }
        }
        .ablespace-shimmer { animation: ablespace-shimmer 1.6s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .ablespace-ring-pulse, .ablespace-fade-in, .ablespace-pop-in, .ablespace-shimmer {
            animation: none !important;
          }
        }
      `}</style>

      {/* header */}
      <div className="flex shrink-0 items-center gap-2.5 border-b border-gray-200 dark:border-gray-800 px-4 py-3.5">
        <AgentMark size={34} busy={loading} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
            AbleSpace AI
          </p>
          <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
            Manages your tasks &amp; projects for you
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto rounded-md p-1.5 text-gray-400 dark:text-gray-500 transition hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
          title="Close assistant"
        >
          <X size={16} />
        </button>
      </div>

      {/* messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && !loading && (
          <div className="ablespace-fade-in flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 dark:bg-violet-500 shadow-[0_2px_10px_-2px_rgba(124,58,237,0.55)]">
                <Bot size={16} className="text-white" />
              </span>
              <div className="rounded-2xl rounded-tl-sm border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 px-3.5 py-2.5 text-sm leading-relaxed text-gray-700 dark:text-gray-200">
                Hi! I&apos;m your AI assistant. Tell me what to do — I can
                create tasks, update statuses, manage projects and more, right
                from here.
              </div>
            </div>
            <p className="mt-2 px-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
              Try asking
            </p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={loading}
                  className="group flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-left text-xs text-gray-600 dark:text-gray-300 transition hover:-translate-y-0.5 hover:border-violet-300 dark:hover:border-violet-500/50 hover:text-gray-900 dark:hover:text-gray-100 hover:shadow-sm disabled:pointer-events-none disabled:opacity-50"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400 dark:bg-violet-500 transition group-hover:scale-125" />
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="ablespace-fade-in flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-gray-900 dark:bg-gray-100 px-3.5 py-2.5 text-sm leading-relaxed text-white dark:text-gray-900">
                  {m.content}
                </div>
              </div>
            ) : (
              <div key={m.id} className="ablespace-fade-in flex flex-col gap-2">
                <div className="flex items-start gap-2.5">
                  <AgentMark size={32} />
                  <div className="min-w-0 max-w-[85%] rounded-2xl rounded-tl-sm border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 px-3.5 py-2.5">
                    <Markdown>{m.content}</Markdown>
                  </div>
                </div>
                {m.steps.length > 0 && (
                  <div className="ml-10">
                    <StepLedger steps={m.steps} />
                  </div>
                )}
              </div>
            ),
          )}

          {loading && (
            <div className="ablespace-fade-in flex items-start gap-2.5">
              <AgentMark size={32} busy />
              <AgentWorking />
            </div>
          )}

          {error && (
            <div className="ablespace-fade-in flex items-start gap-2 rounded-lg border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 px-3 py-2 text-sm text-rose-600 dark:text-rose-400">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* composer */}
      <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-end gap-1.5 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 px-2 py-1.5 transition focus-within:border-violet-400 dark:focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-500/10">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            disabled={loading}
            placeholder="Ask me to manage your tasks…"
            className="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none disabled:opacity-50"
          />
          <button
            onClick={() => send(input)}
            disabled={loading || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-600 dark:bg-violet-500 text-white shadow-[0_2px_10px_-2px_rgba(124,58,237,0.55)] transition hover:bg-violet-700 dark:hover:bg-violet-400 disabled:opacity-40 disabled:shadow-none"
            title="Send"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ArrowUp size={14} strokeWidth={2.5} />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-gray-400 dark:text-gray-500">
          Powered by Groq · actions go through the AbleSpace MCP agent
        </p>
      </div>
    </div>
  );
}
