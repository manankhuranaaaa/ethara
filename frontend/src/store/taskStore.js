import { create } from 'zustand';
import { tasksApi } from '../api';

const useTaskStore = create((set, get) => ({
  tasks: [],
  currentTask: null,
  pagination: null,
  isLoading: false,

  fetchTasks: async (projectId, params) => {
    set({ isLoading: true });
    try {
      const { data } = await tasksApi.list(projectId, params);
      set({ tasks: data.data.tasks, pagination: data.data.pagination, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchTask: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await tasksApi.getById(id);
      set({ currentTask: data.data, isLoading: false });
      return data.data;
    } catch {
      set({ isLoading: false });
    }
  },

  createTask: async (projectId, taskData) => {
    const { data } = await tasksApi.create(projectId, taskData);
    set((state) => ({ tasks: [data.data, ...state.tasks] }));
    return data.data;
  },

  updateTask: async (id, updates) => {
    const { data } = await tasksApi.update(id, updates);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data.data } : t)),
      currentTask: state.currentTask?.id === id ? { ...state.currentTask, ...data.data } : state.currentTask,
    }));
    return data.data;
  },

  // Optimistic status update
  updateTaskStatus: async (id, status) => {
    const previousTasks = get().tasks;
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
    try {
      const { data } = await tasksApi.updateStatus(id, status);
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...data.data } : t)),
      }));
      return data.data;
    } catch (error) {
      // Revert on failure
      set({ tasks: previousTasks });
      throw error;
    }
  },

  deleteTask: async (id) => {
    await tasksApi.delete(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  addComment: (comment) => {
    set((state) => ({
      currentTask: state.currentTask
        ? { ...state.currentTask, comments: [...(state.currentTask.comments || []), comment] }
        : state.currentTask,
    }));
  },

  updateComment: (commentId, content) => {
    set((state) => ({
      currentTask: state.currentTask
        ? {
            ...state.currentTask,
            comments: state.currentTask.comments.map((c) =>
              c.id === commentId ? { ...c, content } : c
            ),
          }
        : state.currentTask,
    }));
  },

  removeComment: (commentId) => {
    set((state) => ({
      currentTask: state.currentTask
        ? { ...state.currentTask, comments: state.currentTask.comments.filter((c) => c.id !== commentId) }
        : state.currentTask,
    }));
  },
}));

export default useTaskStore;
