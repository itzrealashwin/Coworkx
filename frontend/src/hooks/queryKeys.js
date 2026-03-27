export const queryKeys = {
  auth: {
    me: ['auth', 'me'],
  },
  organizations: {
    all: ['orgs'],
    list: ['orgs', 'list'],
    detail: (orgSlug) => ['orgs', 'detail', orgSlug],
    members: (orgSlug, filters = {}) => ['orgs', 'members', orgSlug, filters],
    invitations: (orgSlug) => ['orgs', 'invitations', orgSlug],
  },
  roles: {
    list: (orgSlug) => ['roles', orgSlug],
  },
  projects: {
    list: (orgSlug, filters = {}) => ['projects', orgSlug, filters],
    detail: (orgSlug, projectSlug) => ['projects', orgSlug, projectSlug],
    members: (orgSlug, projectSlug) => ['projects', orgSlug, projectSlug, 'members'],
  },
};
