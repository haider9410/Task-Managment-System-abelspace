import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, resolveOwnerId } from "@/lib/api";

export const fetchProfile = createAsyncThunk(
  "profile/fetchProfile",
  async (_, { getState }) =>
    api("/api/profile", { ownerId: resolveOwnerId(getState()) })
);

export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async (payload, { getState }) =>
    api("/api/profile", {
      method: "PUT",
      body: payload,
      ownerId: resolveOwnerId(getState()),
    })
);

export const deleteProfile = createAsyncThunk(
  "profile/deleteProfile",
  async (_, { getState }) => {
    await api("/api/profile", {
      method: "DELETE",
      ownerId: resolveOwnerId(getState()),
    });
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState: {
    profile: null,
    loading: false,
    saving: false,
    saved: false,
    error: null,
  },
  reducers: {
    clearProfile(state) {
      state.profile = null;
      state.error = null;
      state.saved = false;
    },
    resetSaved(state) {
      state.saved = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load profile";
      })
      .addCase(updateProfile.pending, (state) => {
        state.saving = true;
        state.error = null;
        state.saved = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.saving = false;
        state.profile = action.payload;
        state.saved = true;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || "Failed to save profile";
      })
      .addCase(deleteProfile.fulfilled, (state) => {
        state.profile = null;
      });
  },
});

export const { clearProfile, resetSaved } = profileSlice.actions;
export default profileSlice.reducer;
