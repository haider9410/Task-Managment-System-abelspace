import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import tasksReducer from "./slices/tasksSlice";
import profileReducer from "./slices/profileSlice";
import projectsReducer from "./slices/projectsSlice";
import uiReducer from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tasks: tasksReducer,
    profile: profileReducer,
    projects: projectsReducer,
    ui: uiReducer,
  },
});
