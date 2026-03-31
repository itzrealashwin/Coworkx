import { api } from '@/lib/react-query.js';

export const sprintService = {
  create: async ({ orgSlug, projectSlug, payload }) => {
    const response = await api.post(`/sprints/${orgSlug}/projects/${projectSlug}/sprints`, payload);
    return response.data;
  },

  list: async ({ orgSlug, projectSlug, status }) => {
    const response = await api.get(`/sprints/${orgSlug}/projects/${projectSlug}/sprints`, {
      params: { status },
    });
    return response.data;
  },

  getById: async ({ orgSlug, projectSlug, sprintId }) => {
    const response = await api.get(`/sprints/${orgSlug}/projects/${projectSlug}/sprints/${sprintId}`);
    return response.data;
  },

  update: async ({ orgSlug, projectSlug, sprintId, payload }) => {
    const response = await api.patch(`/sprints/${orgSlug}/projects/${projectSlug}/sprints/${sprintId}`, payload);
    return response.data;
  },

  start: async ({ orgSlug, projectSlug, sprintId }) => {
    const response = await api.post(`/sprints/${orgSlug}/projects/${projectSlug}/sprints/${sprintId}/start`);
    return response.data;
  },

  complete: async ({ orgSlug, projectSlug, sprintId, moveUnfinishedTo }) => {
    const response = await api.post(`/sprints/${orgSlug}/projects/${projectSlug}/sprints/${sprintId}/complete`, {
      moveUnfinishedTo,
    });
    return response.data;
  },

  remove: async ({ orgSlug, projectSlug, sprintId }) => {
    const response = await api.delete(`/sprints/${orgSlug}/projects/${projectSlug}/sprints/${sprintId}`);
    return response.data;
  },
};
