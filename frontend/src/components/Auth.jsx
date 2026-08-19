"use client";

import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { Triangle, Loader2 } from "lucide-react";
import { setGuest } from "@/store/slices/authSlice";

function GoogleIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      aria-hidden="true"
      className="text-neutral-900 dark:text-white"
    >
      <path
        fill="currentColor"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="currentColor"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="currentColor"
        d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"
      />
      <path
        fill="currentColor"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.581C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

export default function Auth() {
  const { loginWithRedirect, error } = useAuth0();
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, isGuest, isLoading } = useSelector((s) => s.auth);
  const [busy, setBusy] = useState("");
  const [localError, setLocalError] = useState(null);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated || isGuest) router.replace("/task");
  }, [isLoading, isAuthenticated, isGuest, router]);

  const login = (kind) => {
    setBusy(kind);
    setLocalError(null);
    if (kind === "guest") {
      dispatch(setGuest());
      router.replace("/task");
      return;
    }
    const opts = { authorizationParams: {} };
    if (kind === "google") {
      opts.authorizationParams.connection = "google-oauth2";
      opts.authorizationParams.screen_hint = "signup";
    } else if (kind === "signup") {
      opts.authorizationParams.screen_hint = "signup";
    } else {
      opts.authorizationParams.screen_hint = "login";
    }
    loginWithRedirect(opts).catch((err) => {
      console.error("Auth0 login failed:", err);
      setLocalError(err?.message || "Login failed. Please try again.");
      setBusy("");
    });
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-neutral-950 flex items-center justify-center px-4">
      <div className="w-full max-w-[450px] flex flex-col items-center">
        {/* Logo + wordmark */}
        <div className="flex items-center gap-2 mb-6">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center">
            <Triangle
              className="w-4 h-4 text-white dark:text-neutral-900"
              fill="currentColor"
              strokeWidth={1.5}
            />
          </div>
          <span className="text-[17px] font-semibold text-neutral-900 dark:text-neutral-100">
            Pyramid
          </span>
        </div>

        {/* Card */}
        <div className="w-full rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-8 pt-10 pb-8 flex flex-col items-center">
          <h1 className="text-[26px] font-bold text-neutral-900 dark:text-neutral-100 text-center tracking-tight">
            Let&apos;s get back on track
          </h1>
          <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400 text-center">
            Enter your email below to login to your account.
          </p>

          {error && (
            <p className="mt-4 w-full rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-[13px] text-red-600 dark:text-red-400">
              {error.message}
            </p>
          )}
          {localError && !error && (
            <p className="mt-4 w-full rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-[13px] text-red-600 dark:text-red-400">
              {localError}
            </p>
          )}

          <button
            type="button"
            onClick={() => login("guest")}
            disabled={!!busy}
            className="mt-8 w-full h-12 rounded-full bg-accent text-accent-foreground text-[15px] font-medium hover:bg-accent/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy === "guest" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            Continue as Guest
          </button>

          <button
            type="button"
            onClick={() => login("google")}
            disabled={!!busy}
            className="mt-3 w-full h-12 rounded-full border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-[15px] font-medium flex items-center justify-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-60"
          >
            {busy === "google" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            Login with Google
          </button>
        </div>

        {/* Legal text */}
        <p className="mt-6 text-[13px] text-neutral-400 dark:text-neutral-500 text-center leading-relaxed max-w-[320px]">
          By clicking continue, you agree to our{" "}
          <a
            href="#"
            className="underline decoration-neutral-300 dark:decoration-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            Terms of Service
          </a>{" "}
          and{" "}
          <a
            href="#"
            className="underline decoration-neutral-300 dark:decoration-neutral-600 hover:text-neutral-600 dark:hover:text-neutral-300"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
