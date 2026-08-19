"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";
import {
  ArrowLeft,
  Search,
  User,
  Sun,
  Moon,
  Square,
  Pencil,
  Loader2,
  Check,
  LogOut,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import {
  fetchProfile,
  updateProfile,
  deleteProfile,
  resetSaved,
} from "@/store/slices/profileSlice";
import { clearAuth } from "@/store/slices/authSlice";
import { setTheme, setAccent } from "@/store/slices/uiSlice";
import { THEME_OPTIONS, COLOR_OPTIONS } from "@/lib/theme";
import { clearUserId } from "@/lib/api";

const THEME_ICONS = { light: Sun, dark: Moon };

function NavItem({
  icon: Icon,
  label,
  active,
  iconFilled,
  iconColor,
  onClick,
  hasSubmenu,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[14px] transition-colors ${
        active
          ? "bg-accent text-accent-foreground font-medium"
          : "text-neutral-700 hover:bg-neutral-200/40 dark:text-neutral-300 dark:hover:bg-neutral-800/50"
      }`}
    >
      <Icon
        className="w-4 h-4 shrink-0"
        style={iconColor ? { color: iconColor } : undefined}
        fill={iconFilled ? "currentColor" : "none"}
        strokeWidth={2}
      />
      <span className="flex-1 text-left">{label}</span>
      {hasSubmenu && <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />}
    </button>
  );
}

function Row({ label, sublabel, children, border = true }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-6 px-8 ${
        border ? "border-b border-neutral-100 dark:border-neutral-800" : ""
      }`}
    >
      <div>
        <p className="text-[14px] text-neutral-900 dark:text-neutral-100">
          {label}
        </p>
        {sublabel && (
          <p className="text-[13px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            {sublabel}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function ProfileForm({ profile, auth, saving, saved, error, onSave, onLeave }) {
  const [form, setForm] = useState(() => ({
    email: profile?.email || "",
    name: profile?.name || "",
    title: profile?.title || "",
    username: profile?.username || "",
    picture: profile?.picture || "",
  }));
  const [touched, setTouched] = useState(false);

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setTouched(true);
  };

  const picture =
    auth.user?.picture ||
    form.picture ||
    "https://api.dicebear.com/9.x/initials/svg?seed=" +
      encodeURIComponent(form.name || auth.user?.email || "A");

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[28px] font-semibold text-neutral-900 dark:text-neutral-100">
          Profile
        </h1>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
              <Check className="w-4 h-4" /> Saved
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1 text-[13px] font-medium text-red-500 dark:text-red-400">
              <AlertTriangle className="w-4 h-4" /> {error}
            </span>
          )}
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={saving || !touched}
            className="h-10 px-5 rounded-full bg-accent text-accent-foreground text-[14px] font-medium hover:bg-accent/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save changes
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <Row label="Profile picture">
          <img
            src={picture}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover bg-gradient-to-br from-fuchsia-500 via-purple-500 to-blue-500 shrink-0"
          />
        </Row>

        <Row label="Email">
          <div className="flex items-center gap-2">
            <input
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="you@example.com"
              className="w-[220px] h-10 px-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[14px] text-neutral-600 dark:text-neutral-200 outline-none focus:bg-white dark:focus:bg-neutral-800 focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600"
            />
            <button
              type="button"
              className="w-6 h-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <Pencil className="w-3 h-3 text-neutral-600 dark:text-neutral-300" />
            </button>
          </div>
        </Row>

        <Row label="Full name">
          <input
            type="text"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Your full name"
            className="w-[220px] h-10 px-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[14px] text-neutral-600 dark:text-neutral-200 outline-none focus:bg-white dark:focus:bg-neutral-800 focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600"
          />
        </Row>

        <Row label="Title" sublabel="Your job title or role">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="e.g. Designer"
            className="w-[220px] h-10 px-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[14px] text-neutral-600 dark:text-neutral-200 outline-none focus:bg-white dark:focus:bg-neutral-800 focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600"
          />
        </Row>

        <Row
          label="Username"
          sublabel="One word, like a nickname or first name"
          border={false}
        >
          <input
            type="text"
            value={form.username}
            onChange={(e) => setField("username", e.target.value)}
            placeholder="e.g. Dexuser"
            className="w-[220px] h-10 px-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-[14px] text-neutral-600 dark:text-neutral-200 outline-none focus:bg-white dark:focus:bg-neutral-800 focus:ring-1 focus:ring-neutral-300 dark:focus:ring-neutral-600"
          />
        </Row>
      </div>

      <h2 className="text-[20px] font-semibold text-neutral-900 dark:text-neutral-100 mt-12 mb-4">
        Workspace access
      </h2>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between py-6 px-8">
          <p className="text-[14px] text-neutral-400 dark:text-neutral-500">
            Remove yourself from the workspace
          </p>
          <button
            type="button"
            onClick={onLeave}
            className="h-9 px-4 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 dark:text-red-400 text-[14px] font-medium hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
          >
            Leave Workspace
          </button>
        </div>
      </div>
    </>
  );
}

export default function Profile() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { logout: auth0Logout } = useAuth0();
  const { profile, loading, saving, saved, error } = useSelector(
    (s) => s.profile,
  );
  const auth = useSelector((s) => s.auth);
  const ui = useSelector((s) => s.ui);

  // Which flyout submenu is open: null | "theme" | "color"
  const [activeMenu, setActiveMenu] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState(ui.theme);
  const [selectedColor, setSelectedColor] = useState(ui.accentId);

  const menuRef = useRef(null);

  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  useEffect(() => {
    if (auth.isLoading) return;
    if (!auth.isAuthenticated && !auth.isGuest) router.replace("/auth");
  }, [auth.isLoading, auth.isAuthenticated, auth.isGuest, router]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => dispatch(resetSaved()), 2500);
    return () => clearTimeout(t);
  }, [saved, dispatch]);

  // Close the flyout when clicking outside of it
  useEffect(() => {
    if (!activeMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenu]);

  const toggleMenu = (menu) => {
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const changeTheme = (id) => {
    setSelectedTheme(id);
    dispatch(setTheme(id));
  };

  const changeColor = (id) => {
    setSelectedColor(id);
    dispatch(setAccent(id));
  };

  const save = (formValues) => {
    dispatch(updateProfile(formValues));
  };

  const leave = () => {
    clearUserId();
    dispatch(deleteProfile()).then(() => {
      if (auth.isGuest) {
        dispatch(clearAuth());
        router.replace("/auth");
        return;
      }
      dispatch(clearAuth());
      auth0Logout({ logoutParams: { returnTo: window.location.origin } });
    });
  };

  const activeColorHex =
    COLOR_OPTIONS.find((c) => c.id === selectedColor)?.hex || "#171717";

  return (
    <div className="min-h-screen w-full bg-white dark:bg-neutral-950 flex">
      {/* Sidebar */}
      <aside className="w-[320px] shrink-0 bg-neutral-100 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 px-4 py-5 flex flex-col relative">
        <button
          type="button"
          onClick={() => router.push("/task")}
          className="flex items-center gap-2 text-[14px] text-neutral-900 dark:text-neutral-100 px-1 py-2 mb-4 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to app
        </button>

        <div className="relative mb-4">
          <Search className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search"
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 text-[14px] text-neutral-500 dark:text-neutral-400 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 outline-none"
          />
        </div>

        <nav className="flex flex-col gap-1" ref={menuRef}>
          <NavItem icon={User} label="Profile" active />

          {/* Theme nav item + flyout */}
          <div className="relative">
            <NavItem
              icon={THEME_ICONS[selectedTheme] || Sun}
              label="Change Theme"
              active={activeMenu === "theme"}
              hasSubmenu
              onClick={() => toggleMenu("theme")}
            />
            {activeMenu === "theme" && (
              <div className="absolute left-full top-0 ml-2 w-48 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-lg py-2 z-50">
                <p className="px-4 py-1.5 text-[12px] font-medium text-neutral-400 dark:text-neutral-500">
                  Theme
                </p>
                {THEME_OPTIONS.map(({ id, label }) => {
                  const Icon = THEME_ICONS[id] || Sun;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => changeTheme(id)}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-[14px] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
                      <span className="flex-1 text-left">{label}</span>
                      {selectedTheme === id && (
                        <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Color Mode nav item + flyout */}
          <div className="relative">
            <NavItem
              icon={Square}
              label="Color Mode"
              iconFilled
              iconColor={activeColorHex}
              active={activeMenu === "color"}
              hasSubmenu
              onClick={() => toggleMenu("color")}
            />
            {activeMenu === "color" && (
              <div className="absolute left-full top-0 ml-2 w-48 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-lg py-2 z-50">
                <p className="px-4 py-1.5 text-[12px] font-medium text-neutral-400 dark:text-neutral-500">
                  Color Mode
                </p>
                {COLOR_OPTIONS.map(({ id, label, hex }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => changeColor(id)}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[14px] text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    {hex ? (
                      <span
                        className="w-3.5 h-3.5 rounded-[4px] shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                    ) : (
                      <span className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="flex-1 text-left">{label}</span>
                    {selectedColor === id && (
                      <Check className="w-4 h-4 text-neutral-900 dark:text-neutral-100" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        <button
          type="button"
          onClick={leave}
          className="mt-auto w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Log out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex justify-center px-16 py-16">
        <div className="w-full max-w-[800px]">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-neutral-400 dark:text-neutral-500">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading profile…
            </div>
          ) : (
            <ProfileForm
              profile={profile}
              auth={auth}
              saving={saving}
              saved={saved}
              error={error}
              onSave={save}
              onLeave={leave}
            />
          )}
        </div>
      </main>
    </div>
  );
}
