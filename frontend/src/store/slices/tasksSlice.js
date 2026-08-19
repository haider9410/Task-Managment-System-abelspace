import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api, resolveOwnerId } from "@/lib/api";

export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (_, { getState }) => {
    const items = await api("/api/tasks", {
      ownerId: resolveOwnerId(getState()),
    });
    return Array.isArray(items) ? items : [];
  }
);

export const addTask = createAsyncThunk(
  "tasks/addTask",
  async (payload, { getState }) =>
    api("/api/tasks", {
      method: "POST",
      body: payload,
      ownerId: resolveOwnerId(getState()),
    })
);

export const updateTask = createAsyncThunk(
  "tasks/updateTask",
  async ({ id, changes }, { getState }) =>
    api(`/api/tasks/${id}`, {
      method: "PUT",
      body: changes,
      ownerId: resolveOwnerId(getState()),
    })
);

export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (id, { getState }) => {
    await api(`/api/tasks/${id}`, {
      method: "DELETE",
      ownerId: resolveOwnerId(getState()),
    });
    return id;
  }
);

const tasksSlice = createSlice({
  name: "tasks",
  initialState: { items: [], loading: false, error: null },
  reducers: {
    clearTasks(state) {
      state.items = [];
      state.error = null;
    },
    reorderTasks(state, action) {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load tasks";
      })
      .addCase(addTask.fulfilled, (state, action) => {
        const t = action.payload;
        if (t && !state.items.some((x) => x.id === t.id)) state.items.push(t);
      })
      .addCase(addTask.rejected, (state, action) => {
        state.error = action.error.message || "Failed to create task";
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const t = action.payload;
        const i = state.items.findIndex((x) => x.id === t.id);
        if (i !== -1) state.items[i] = t;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.error = action.error.message || "Failed to update task";
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.items = state.items.filter((x) => x.id !== action.payload);
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.error = action.error.message || "Failed to delete task";
      });
  },
});

export const { clearTasks, reorderTasks } = tasksSlice.actions;
export default tasksSlice.reducer;
