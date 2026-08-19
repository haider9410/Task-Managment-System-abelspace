import { createSlice } from "@reduxjs/toolkit";
import { resolveOwnerId } from "@/lib/api";

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isGuest: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthState(state, action) {
      const { user, isAuthenticated, isLoading, error } = action.payload;
      state.user = user || null;
      state.isAuthenticated = !!isAuthenticated;
      state.isLoading = !!isLoading;
      state.isGuest = false;
      state.error = error || null;
    },
    setGuest(state) {
      const sub = resolveOwnerId(state);
      state.user = { sub, name: "Guest", email: "" };
      state.isAuthenticated = false;
      state.isLoading = false;
      state.isGuest = true;
      state.error = null;
    },
    clearAuth(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.isGuest = false;
      state.error = null;
    },
  },
});

export const { setAuthState, setGuest, clearAuth } = authSlice.actions;
export default authSlice.reducer;
