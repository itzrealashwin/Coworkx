import { api } from '@/lib/react-query.js';

export const organizationService = {
  create: async (payload) => {
    const response = await api.post('/orgs', payload);
    return response.data;
  },

  list: async () => {
    const response = await api.get('/orgs');
    return response.data;
  },

  getBySlug: async (orgSlug) => {
    const response = await api.get(`/orgs/${orgSlug}`);
    return response.data;
  },

  updateBySlug: async ({ orgSlug, payload }) => {
    const response = await api.patch(`/orgs/${orgSlug}`, payload);
    return response.data;
  },

  deleteBySlug: async (orgSlug) => {
    const response = await api.delete(`/orgs/${orgSlug}`);
    return response.data;
  },

  listMembers: async ({ orgSlug, role, search }) => {
    const response = await api.get(`/orgs/${orgSlug}/members`, {
      params: { role, search },
    });
    return response.data;
  },

  updateMemberRole: async ({ orgSlug, userId, role }) => {
    const response = await api.patch(`/orgs/${orgSlug}/members/${userId}`, { role });
    return response.data;
  },

  removeMember: async ({ orgSlug, userId }) => {
    const response = await api.delete(`/orgs/${orgSlug}/members/${userId}`);
    return response.data;
  },

  sendInvitation: async ({ orgSlug, payload }) => {
    const response = await api.post(`/orgs/${orgSlug}/invitations`, payload);
    return response.data;
  },

  listInvitations: async (orgSlug) => {
    const response = await api.get(`/orgs/${orgSlug}/invitations`);
    return response.data;
  },

  resendInvitation: async ({ orgSlug, invitationId }) => {
    const response = await api.post(`/orgs/${orgSlug}/invitations/${invitationId}/resend`);
    return response.data;
  },

  revokeInvitation: async ({ orgSlug, invitationId }) => {
    const response = await api.delete(`/orgs/${orgSlug}/invitations/${invitationId}`);
    return response.data;
  },
};
