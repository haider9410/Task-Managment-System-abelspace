"use client";

import { useEffect } from "react";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "@/store/store";
import { setAuthState } from "@/store/slices/authSlice";
import { STORAGE_KEY } from "@/lib/theme";
import { setUserId, clearUserId } from "@/lib/api";

const AUTH0_DOMAIN = "dev-8v4em6yqpctc0css.us.auth0.com";
const AUTH0_CLIENT_ID = "UdEyPCGS1DU5Aqozdv6YMHBjGdmhti28";

function AuthBridge() {
  const { isLoading, isAuthenticated, user, error } = useAuth0();
  const dispatch = useDispatch();

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user?.sub) setUserId(user.sub);
    else if (!isAuthenticated && !store.getState().auth.isGuest) clearUserId();
    const state = store.getState();
    if (!isAuthenticated && state.auth.isGuest) return;
    dispatch(
      setAuthState({
        isLoading: false,
        isAuthenticated,
        user: isAuthenticated ? user : null,
        error: isAuthenticated ? null : error?.message || null,
      })
    );
  }, [isLoading, isAuthenticated, user, error, dispatch]);

  return null;
}

function ThemeBridge() {
  const { theme, accentId, accentHex } = useSelector((s) => s.ui);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    const darkNeutral = theme === "dark" && accentId === "black";
    root.style.setProperty("--accent", darkNeutral ? "#e4e4e7" : accentHex);
    root.style.setProperty(
      "--accent-foreground",
      darkNeutral ? "#18181b" : "#ffffff"
    );
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ theme, accentId, accentHex })
      );
    } catch {}
  }, [theme, accentId, accentHex]);

  return null;
}

export default function Providers({ children }) {
  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri:
          typeof window !== "undefined" ? window.location.origin : undefined,
      }}
    >
      <Provider store={store}>
        <AuthBridge />
        <ThemeBridge />
        {children}
      </Provider>
    </Auth0Provider>
  );
}
