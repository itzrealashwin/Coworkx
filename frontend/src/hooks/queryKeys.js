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
  sprints: {
    list: (orgSlug, projectSlug, filters = {}) => ['sprints', orgSlug, projectSlug, filters],
    detail: (orgSlug, projectSlug, sprintId) => ['sprints', orgSlug, projectSlug, sprintId],
  },
  issues: {
    list: (orgSlug, projectSlug, filters = {}) => ['issues', orgSlug, projectSlug, filters],
    statuses: (orgSlug, projectSlug) => ['issues', orgSlug, projectSlug, 'statuses'],
    detail: (orgSlug, projectSlug, issueNumber) => ['issues', orgSlug, projectSlug, issueNumber],
    history: (orgSlug, projectSlug, issueNumber) => ['issues', orgSlug, projectSlug, issueNumber, 'history'],
  },
};
