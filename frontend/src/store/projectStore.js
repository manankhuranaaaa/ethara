import { create } from 'zustand';
import { projectsApi } from '../api';

const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  pagination: null,
  isLoading: false,

  fetchProjects: async (params) => {
    set({ isLoading: true });
    try {
      const { data } = await projectsApi.list(params);
      set({ projects: data.data.projects, pagination: data.data.pagination, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchProject: async (id) => {
    set({ isLoading: true });
    try {
      const { data } = await projectsApi.getById(id);
      set({ currentProject: data.data, isLoading: false });
      return data.data;
    } catch {
      set({ isLoading: false });
    }
  },

  createProject: async (projectData) => {
    const { data } = await projectsApi.create(projectData);
    set((state) => ({ projects: [data.data, ...state.projects] }));
    return data.data;
  },

  updateProject: async (id, updates) => {
    const { data } = await projectsApi.update(id, updates);
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? data.data : p)),
      currentProject: state.currentProject?.id === id ? data.data : state.currentProject,
    }));
    return data.data;
  },

  addMember: async (projectId, memberData) => {
    const { data } = await projectsApi.addMember(projectId, memberData);
    return data.data;
  },

  removeMember: async (projectId, userId) => {
    await projectsApi.removeMember(projectId, userId);
    if (get().currentProject?.id === projectId) {
      const updated = { ...get().currentProject };
      updated.members = updated.members.filter((m) => m.user_id !== userId);
      set({ currentProject: updated });
    }
  },
}));

export default useProjectStore;
