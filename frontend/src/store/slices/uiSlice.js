import { createSlice } from "@reduxjs/toolkit";
import { COLOR_OPTIONS, BLACK_ACCENT, STORAGE_KEY } from "@/lib/theme";

function loadInitial() {
  const fallback = {
    theme: "light",
    accentId: "black",
    accentHex: BLACK_ACCENT,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) || "{}"
    );
    const color = COLOR_OPTIONS.find((c) => c.id === saved.accentId);
    return {
      theme: saved.theme === "dark" ? "dark" : "light",
      accentId: color ? color.id : "black",
      accentHex: color?.hex ?? BLACK_ACCENT,
    };
  } catch {
    return fallback;
  }
}

const uiSlice = createSlice({
  name: "ui",
  initialState: loadInitial(),
  reducers: {
    setTheme(state, action) {
      state.theme = action.payload === "dark" ? "dark" : "light";
    },
    setAccent(state, action) {
      const color = COLOR_OPTIONS.find((c) => c.id === action.payload);
      if (!color) return;
      state.accentId = color.id;
      state.accentHex = color.hex ?? BLACK_ACCENT;
    },
  },
});

export const { setTheme, setAccent } = uiSlice.actions;
export default uiSlice.reducer;
