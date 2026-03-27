import { api } from '@/lib/react-query.js';

export const projectService = {
  create: async ({ orgSlug, payload }) => {
    const response = await api.post(`/orgs/${orgSlug}/projects`, payload);
    return response.data;
  },

  list: async ({ orgSlug, status, search }) => {
    const response = await api.get(`/orgs/${orgSlug}/projects`, {
      params: { status, search },
    });
    return response.data;
  },

  getBySlug: async ({ orgSlug, projectSlug }) => {
    const response = await api.get(`/orgs/${orgSlug}/projects/${projectSlug}`);
    return response.data;
  },

  updateBySlug: async ({ orgSlug, projectSlug, payload }) => {
    const response = await api.patch(`/orgs/${orgSlug}/projects/${projectSlug}`, payload);
    return response.data;
  },

  deleteBySlug: async ({ orgSlug, projectSlug }) => {
    const response = await api.delete(`/orgs/${orgSlug}/projects/${projectSlug}`);
    return response.data;
  },

  addMember: async ({ orgSlug, projectSlug, payload }) => {
    const response = await api.post(`/orgs/${orgSlug}/projects/${projectSlug}/members`, payload);
    return response.data;
  },

  listMembers: async ({ orgSlug, projectSlug }) => {
    const response = await api.get(`/orgs/${orgSlug}/projects/${projectSlug}/members`);
    return response.data;
  },

  updateMemberRole: async ({ orgSlug, projectSlug, userId, roleId }) => {
    const response = await api.patch(`/orgs/${orgSlug}/projects/${projectSlug}/members/${userId}`, {
      roleId,
    });
    return response.data;
  },

  removeMember: async ({ orgSlug, projectSlug, userId }) => {
    const response = await api.delete(`/orgs/${orgSlug}/projects/${projectSlug}/members/${userId}`);
    return response.data;
  },
};
