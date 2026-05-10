import { api } from '@/lib/react-query.js';

export const issueService = {
  listStatuses: async ({ orgSlug, projectSlug }) => {
    const response = await api.get(
      `/issues/${orgSlug}/projects/${projectSlug}/statuses`
    );
    return response.data;
  },

  createStatus: async ({ orgSlug, projectSlug, ...data }) => {
    const response = await api.post(
      `/issues/${orgSlug}/projects/${projectSlug}/statuses`,
      data
    );
    return response.data;
  },

  updateStatus: async ({ orgSlug, projectSlug, statusId, ...data }) => {
    const response = await api.patch(
      `/issues/${orgSlug}/projects/${projectSlug}/statuses/${statusId}`,
      data
    );
    return response.data;
  },

  create: async ({ orgSlug, projectSlug, ...data }) => {
    const response = await api.post(
      `/issues/${orgSlug}/projects/${projectSlug}/issues`,
      data
    );
    return response.data;
  },

  list: async ({ orgSlug, projectSlug, sprint, status, assignee, type }) => {
    const url = projectSlug
      ? `/issues/${orgSlug}/projects/${projectSlug}/issues`
      : `/issues/${orgSlug}/issues`;

    const response = await api.get(
      url,
      {
        params: { sprint, status, assignee, type },
      }
    );
    return response.data;
  },

  getByNumber: async ({ orgSlug, projectSlug, issueNumber }) => {
    const response = await api.get(
      `/issues/${orgSlug}/projects/${projectSlug}/issues/${issueNumber}`
    );
    return response.data;
  },

  update: async ({ orgSlug, projectSlug, issueNumber, ...data }) => {
    const response = await api.patch(
      `/issues/${orgSlug}/projects/${projectSlug}/issues/${issueNumber}`,
      data
    );
    return response.data;
  },

  remove: async ({ orgSlug, projectSlug, issueNumber }) => {
    const response = await api.delete(
      `/issues/${orgSlug}/projects/${projectSlug}/issues/${issueNumber}`
    );
    return response.data;
  },

  addComment: async ({ orgSlug, projectSlug, issueNumber, ...data }) => {
    const response = await api.post(
      `/issues/${orgSlug}/projects/${projectSlug}/issues/${issueNumber}/comments`,
      data
    );
    return response.data;
  },

  updateComment: async ({ orgSlug, projectSlug, issueNumber, commentId, ...data }) => {
    const response = await api.patch(
      `/issues/${orgSlug}/projects/${projectSlug}/issues/${issueNumber}/comments/${commentId}`,
      data
    );
    return response.data;
  },

  deleteComment: async ({ orgSlug, projectSlug, issueNumber, commentId }) => {
    const response = await api.delete(
      `/issues/${orgSlug}/projects/${projectSlug}/issues/${issueNumber}/comments/${commentId}`
    );
    return response.data;
  },

  createLink: async ({ orgSlug, projectSlug, issueNumber, ...data }) => {
    const response = await api.post(
      `/issues/${orgSlug}/projects/${projectSlug}/issues/${issueNumber}/links`,
      data
    );
    return response.data;
  },

  deleteLink: async ({ orgSlug, projectSlug, issueNumber, linkId }) => {
    const response = await api.delete(
      `/issues/${orgSlug}/projects/${projectSlug}/issues/${issueNumber}/links/${linkId}`
    );
    return response.data;
  },

  getHistory: async ({ orgSlug, projectSlug, issueNumber }) => {
    const response = await api.get(
      `/issues/${orgSlug}/projects/${projectSlug}/issues/${issueNumber}/history`
    );
    return response.data;
  },
};