import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { issueService } from '@/services/api/issue.service.js';
import { queryKeys } from '@/hooks/queryKeys.js';

export const useIssues = (orgSlug, projectSlug, filters = {}, queryOptions = {}) => {
  const { enabled, ...restQueryOptions } = queryOptions;

  return useQuery({
    queryKey: queryKeys.issues.list(orgSlug, projectSlug, filters),
    queryFn: () => issueService.list({ orgSlug, projectSlug, ...filters }),
    enabled: enabled ?? (!!orgSlug && !!projectSlug),
    ...restQueryOptions,
  });
};

export const useIssue = (orgSlug, projectSlug, issueNumber, queryOptions = {}) => {
  const { enabled, ...restQueryOptions } = queryOptions;

  return useQuery({
    queryKey: queryKeys.issues.detail(orgSlug, projectSlug, issueNumber),
    queryFn: () => issueService.getByNumber({ orgSlug, projectSlug, issueNumber }),
    enabled: enabled ?? (!!orgSlug && !!projectSlug && !!issueNumber),
    ...restQueryOptions,
  });
};

export const useIssueStatuses = (orgSlug, projectSlug, queryOptions = {}) => {
  const { enabled, ...restQueryOptions } = queryOptions;

  return useQuery({
    queryKey: queryKeys.issues.statuses(orgSlug, projectSlug),
    queryFn: () => issueService.listStatuses({ orgSlug, projectSlug }),
    enabled: enabled ?? (!!orgSlug && !!projectSlug),
    ...restQueryOptions,
  });
};

export const useCreateIssueStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueService.createStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.statuses(variables.orgSlug, variables.projectSlug),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.list(variables.orgSlug, variables.projectSlug),
        exact: false,
      });
    },
  });
};

export const useUpdateIssueStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueService.updateStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.statuses(variables.orgSlug, variables.projectSlug),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.list(variables.orgSlug, variables.projectSlug),
        exact: false,
      });
    },
  });
};

export const useIssueHistory = (orgSlug, projectSlug, issueNumber, queryOptions = {}) => {
  const { enabled, ...restQueryOptions } = queryOptions;

  return useQuery({
    queryKey: queryKeys.issues.history(orgSlug, projectSlug, issueNumber),
    queryFn: () => issueService.getHistory({ orgSlug, projectSlug, issueNumber }),
    enabled: enabled ?? (!!orgSlug && !!projectSlug && !!issueNumber),
    ...restQueryOptions,
  });
};

export const useCreateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.list(variables.orgSlug, variables.projectSlug),
        exact: false,
      });
    },
  });
};

export const useUpdateIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueService.update,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.list(variables.orgSlug, variables.projectSlug),
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.detail(variables.orgSlug, variables.projectSlug, variables.issueNumber),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.history(variables.orgSlug, variables.projectSlug, variables.issueNumber),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.statuses(variables.orgSlug, variables.projectSlug),
      });
    },
  });
};

export const useDeleteIssue = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueService.remove,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.list(variables.orgSlug, variables.projectSlug),
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: queryKeys.issues.detail(variables.orgSlug, variables.projectSlug, variables.issueNumber),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.issues.history(variables.orgSlug, variables.projectSlug, variables.issueNumber),
      });
    },
  });
};

export const useAddIssueComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueService.addComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.detail(variables.orgSlug, variables.projectSlug, variables.issueNumber),
      });
    },
  });
};

export const useCreateComment = () => useAddIssueComment();

export const useUpdateIssueComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueService.updateComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.detail(variables.orgSlug, variables.projectSlug, variables.issueNumber),
      });
    },
  });
};

export const useDeleteIssueComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueService.deleteComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.detail(variables.orgSlug, variables.projectSlug, variables.issueNumber),
      });
    },
  });
};

export const useCreateIssueLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueService.createLink,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.detail(variables.orgSlug, variables.projectSlug, variables.issueNumber),
      });
    },
  });
};

export const useDeleteIssueLink = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: issueService.deleteLink,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.detail(variables.orgSlug, variables.projectSlug, variables.issueNumber),
      });
    },
  });
};
