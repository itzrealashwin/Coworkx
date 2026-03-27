import { api } from '@/lib/react-query.js';

export const invitationService = {
  accept: async (invitationToken) => {
    const response = await api.post(`/invitations/${invitationToken}/accept`);
    return response.data;
  },
};
