import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, resolveOwnerId } from "@/lib/api";

export const fetchProjects = createAsyncThunk(
  "projects/fetchProjects",
  async (_, { getState }) => {
    const items = await api("/api/projects", {
      ownerId: resolveOwnerId(getState()),
    });
    return Array.isArray(items) ? items : [];
  }
);

export const addProject = createAsyncThunk(
  "projects/addProject",
  async (payload, { getState }) =>
    api("/api/projects", {
      method: "POST",
      body: payload,
      ownerId: resolveOwnerId(getState()),
    })
);

export const updateProject = createAsyncThunk(
  "projects/updateProject",
  async ({ id, changes }, { getState }) =>
    api(`/api/projects/${id}`, {
      method: "PUT",
      body: changes,
      ownerId: resolveOwnerId(getState()),
    })
);

export const deleteProject = createAsyncThunk(
  "projects/deleteProject",
  async (id, { getState }) => {
    await api(`/api/projects/${id}`, {
      method: "DELETE",
      ownerId: resolveOwnerId(getState()),
    });
    return id;
  }
);

const projectsSlice = createSlice({
  name: "projects",
  initialState: { items: [], loading: false, error: null },
  reducers: {
    clearProjects(state) {
      state.items = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load projects";
      })
      .addCase(addProject.fulfilled, (state, action) => {
        const p = action.payload;
        if (p && !state.items.some((x) => x.id === p.id)) state.items.push(p);
      })
      .addCase(addProject.rejected, (state, action) => {
        state.error = action.error.message || "Failed to create project";
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        const p = action.payload;
        const i = state.items.findIndex((x) => x.id === p.id);
        if (i !== -1) state.items[i] = p;
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.error = action.error.message || "Failed to update project";
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.items = state.items.filter((x) => x.id !== action.payload);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete project";
      });
  },
});

export const { clearProjects } = projectsSlice.actions;
export default projectsSlice.reducer;
