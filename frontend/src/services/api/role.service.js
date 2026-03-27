import { api } from '@/lib/react-query.js';

export const roleService = {
  create: async ({ orgSlug, payload }) => {
    const response = await api.post(`/orgs/${orgSlug}/roles`, payload);
    return response.data;
  },

  list: async (orgSlug) => {
    const response = await api.get(`/orgs/${orgSlug}/roles`);
    return response.data;
  },

  update: async ({ orgSlug, roleId, payload }) => {
    const response = await api.patch(`/orgs/${orgSlug}/roles/${roleId}`, payload);
    return response.data;
  },

  remove: async ({ orgSlug, roleId }) => {
    const response = await api.delete(`/orgs/${orgSlug}/roles/${roleId}`);
    return response.data;
  },
};
