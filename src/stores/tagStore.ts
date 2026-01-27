import { create } from 'zustand';
import type {
  TagDefinition,
  CreateTagDefRequest,
  UpdateTagDefRequest,
  AssignTagRequest,
  TagCondition,
  TagStoreState,
} from '../types/tag';
import * as api from '../api/client';

interface TagStoreActions {
  // Tag definitions
  loadDefinitions: () => Promise<void>;
  createDefinition: (data: CreateTagDefRequest) => Promise<TagDefinition>;
  updateDefinition: (id: number, data: UpdateTagDefRequest) => Promise<void>;
  deleteDefinition: (id: number) => Promise<void>;
  selectDefinition: (def: TagDefinition | null) => void;

  // User tags
  loadUserTags: (userId: number, academicYear?: string) => Promise<void>;
  assignTag: (userId: number, data: AssignTagRequest) => Promise<void>;
  removeTag: (userId: number, tagName: string, academicYear?: string) => Promise<void>;

  // Query
  queryByTags: (condition: TagCondition, page?: number, limit?: number) => Promise<void>;
  setQueryPage: (page: number) => void;

  // Error handling
  clearError: () => void;
}

type TagStore = TagStoreState & TagStoreActions;

export const useTagStore = create<TagStore>((set, get) => ({
  // Initial state
  definitions: [],
  selectedDefinition: null,
  definitionsLoading: false,

  userTags: {},
  userTagsLoading: false,

  queryResults: [],
  queryTotal: 0,
  queryPage: 1,
  queryLimit: 20,
  queryLoading: false,

  error: null,

  // ========== Tag Definition Actions ==========

  loadDefinitions: async () => {
    set({ definitionsLoading: true, error: null });
    try {
      const definitions = await api.listTagDefinitions();
      set({ definitions, definitionsLoading: false });
    } catch (err) {
      set({
        definitionsLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load tag definitions',
      });
    }
  },

  createDefinition: async (data: CreateTagDefRequest) => {
    set({ error: null });
    try {
      const newDef = await api.createTagDefinition(data);
      set((state) => ({
        definitions: [...state.definitions, newDef],
      }));
      return newDef;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create tag definition';
      set({ error: message });
      throw err;
    }
  },

  updateDefinition: async (id: number, data: UpdateTagDefRequest) => {
    set({ error: null });
    try {
      const updated = await api.updateTagDefinition(id, data);
      set((state) => ({
        definitions: state.definitions.map((d) => (d.id === id ? updated : d)),
        selectedDefinition:
          state.selectedDefinition?.id === id ? updated : state.selectedDefinition,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update tag definition';
      set({ error: message });
      throw err;
    }
  },

  deleteDefinition: async (id: number) => {
    set({ error: null });
    try {
      await api.deleteTagDefinition(id);
      set((state) => ({
        definitions: state.definitions.filter((d) => d.id !== id),
        selectedDefinition: state.selectedDefinition?.id === id ? null : state.selectedDefinition,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete tag definition';
      set({ error: message });
      throw err;
    }
  },

  selectDefinition: (def: TagDefinition | null) => {
    set({ selectedDefinition: def });
  },

  // ========== User Tag Actions ==========

  loadUserTags: async (userId: number, academicYear?: string) => {
    set({ userTagsLoading: true, error: null });
    try {
      const tags = await api.getUserTags(userId, academicYear);
      set((state) => ({
        userTags: { ...state.userTags, [userId]: tags },
        userTagsLoading: false,
      }));
    } catch (err) {
      set({
        userTagsLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load user tags',
      });
    }
  },

  assignTag: async (userId: number, data: AssignTagRequest) => {
    set({ error: null });
    try {
      await api.assignUserTag(userId, data);
      // Reload user tags after assignment
      await get().loadUserTags(userId, data.academic_year);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to assign tag';
      set({ error: message });
      throw err;
    }
  },

  removeTag: async (userId: number, tagName: string, academicYear?: string) => {
    set({ error: null });
    try {
      await api.removeUserTag(userId, tagName, academicYear);
      // Reload user tags after removal
      await get().loadUserTags(userId, academicYear);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to remove tag';
      set({ error: message });
      throw err;
    }
  },

  // ========== Query Actions ==========

  queryByTags: async (condition: TagCondition, page = 1, limit = 20) => {
    set({ queryLoading: true, error: null });
    try {
      const result = await api.queryUsersByTags(condition, page, limit);
      set({
        queryResults: result.users,
        queryTotal: result.total,
        queryPage: result.page,
        queryLimit: result.limit,
        queryLoading: false,
      });
    } catch (err) {
      set({
        queryLoading: false,
        error: err instanceof Error ? err.message : 'Failed to query users by tags',
      });
    }
  },

  setQueryPage: (page: number) => {
    set({ queryPage: page });
  },

  // ========== Error Handling ==========

  clearError: () => {
    set({ error: null });
  },
}));

// ========== Selectors ==========

export const selectSystemTags = (state: TagStore) =>
  state.definitions.filter((d) => d.is_system);

export const selectCustomTags = (state: TagStore) =>
  state.definitions.filter((d) => !d.is_system);

export const selectUserTagsById = (state: TagStore, userId: number) =>
  state.userTags[userId] || {};
