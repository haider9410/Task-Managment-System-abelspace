"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const POPUP_W = 256;

function toLocalDate(str) {
  if (!str) return null;
  const d = new Date(str + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DatePicker({
  value,
  onChange,
  placeholder = "No date",
  className = "",
}) {
  const selected = toLocalDate(value);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => selected || new Date());
  const [coords, setCoords] = useState(null);
  const btnRef = useRef(null);
  const popupRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const openPicker = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      const left = Math.min(
        Math.max(8, r.right - POPUP_W),
        Math.max(8, window.innerWidth - POPUP_W - 8)
      );
      setCoords({ top: r.bottom + 6, left });
    }
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (!open || !coords || !popupRef.current) return;
    const ph = popupRef.current.offsetHeight;
    const r = btnRef.current?.getBoundingClientRect();
    let top = coords.top;
    if (r && top + ph > window.innerHeight - 8 && r.top - ph - 6 > 8) {
      top = r.top - ph - 6;
    }
    setCoords((c) => (c && c.top === top ? c : { ...c, top }));
  }, [open, coords, selected]);

  const year = view.getFullYear();
  const month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = toDateStr(new Date());

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const pick = (d) => {
    onChange(toDateStr(d));
    setOpen(false);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => (open ? setOpen(false) : openPicker())}
        className={`flex w-full items-center justify-between gap-2 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${className}`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <Calendar
            size={13}
            className="shrink-0 text-gray-400 dark:text-gray-500"
          />
          <span className="truncate">
            {selected
              ? selected.toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : placeholder}
          </span>
        </span>
        {selected && (
          <span
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
            }}
            className="shrink-0 rounded p-0.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
            title="Clear date"
          >
            <X size={12} />
          </span>
        )}
      </button>

      {open && coords && (
        <div
          ref={popupRef}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left,
            zIndex: 9999,
          }}
          className="w-64 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView(new Date(year, month - 1, 1))}
              className="rounded-md p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ChevronLeft size={15} />
            </button>
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              {view.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              type="button"
              onClick={() => setView(new Date(year, month + 1, 1))}
              className="rounded-md p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {WEEKDAYS.map((w) => (
              <span
                key={w}
                className="py-1 text-[11px] font-medium text-gray-400 dark:text-gray-500"
              >
                {w}
              </span>
            ))}
            {cells.map((d, i) =>
              d === null ? (
                <span key={`empty-${i}`} />
              ) : (
                <button
                  key={d.getTime()}
                  type="button"
                  onClick={() => pick(d)}
                  className={`mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-[13px] transition-colors ${
                    selected && toDateStr(d) === toDateStr(selected)
                      ? "bg-accent font-semibold text-accent-foreground"
                      : toDateStr(d) === todayStr
                        ? "text-gray-900 dark:text-gray-100 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {d.getDate()}
                </button>
              )
            )}
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-2">
            <button
              type="button"
              onClick={() => {
                onChange(todayStr);
                setOpen(false);
              }}
              className="text-xs font-medium text-accent hover:opacity-80"
            >
              Today
            </button>
            {selected && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}