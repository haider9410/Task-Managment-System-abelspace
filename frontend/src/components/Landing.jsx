"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { Triangle, AlertTriangle } from "lucide-react";

export default function Landing() {
  const router = useRouter();
  const { isAuthenticated, isLoading, isGuest, error } = useSelector(
    (s) => s.auth
  );

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated || isGuest) router.replace("/task");
    else router.replace("/auth");
  }, [isLoading, isAuthenticated, isGuest, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white dark:bg-neutral-950">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 dark:bg-neutral-100">
          <Triangle
            className="h-4 w-4 text-white dark:text-neutral-900"
            fill="currentColor"
            strokeWidth={1.5}
          />
        </div>
        <span className="text-[17px] font-semibold text-neutral-900 dark:text-neutral-100">
          AbleSpace
        </span>
      </div>
      {error ? (
        <p className="flex max-w-md items-center gap-2 rounded-lg border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-4 py-2 text-center text-sm text-red-600 dark:text-red-400">
          <AlertTriangle size={15} /> {error}
        </p>
      ) : (
        <p className="text-sm text-neutral-400 dark:text-neutral-500">
          Loading your workspace…
        </p>
      )}
    </div>
  );
}
