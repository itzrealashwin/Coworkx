import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sprintService } from '@/services/api/sprint.service.js';
import { queryKeys } from '@/hooks/queryKeys.js';

export const useSprints = (orgSlug, projectSlug, filters = {}, queryOptions = {}) => {
  const { enabled, ...restQueryOptions } = queryOptions;

  return useQuery({
    queryKey: queryKeys.sprints.list(orgSlug, projectSlug, filters),
    queryFn: () => sprintService.list({ orgSlug, projectSlug, ...filters }),
    enabled: enabled ?? (!!orgSlug && !!projectSlug),
    ...restQueryOptions,
  });
};

export const useSprint = (orgSlug, projectSlug, sprintId) => {
  return useQuery({
    queryKey: queryKeys.sprints.detail(orgSlug, projectSlug, sprintId),
    queryFn: () => sprintService.getById({ orgSlug, projectSlug, sprintId }),
    enabled: !!orgSlug && !!projectSlug && !!sprintId,
  });
};

export const useCreateSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sprintService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.list(variables.orgSlug, variables.projectSlug),
        exact: false,
      });
    },
  });
};

export const useUpdateSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sprintService.update,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.list(variables.orgSlug, variables.projectSlug),
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.detail(variables.orgSlug, variables.projectSlug, variables.sprintId),
      });
    },
  });
};

export const useStartSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sprintService.start,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.list(variables.orgSlug, variables.projectSlug),
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.detail(variables.orgSlug, variables.projectSlug, variables.sprintId),
      });
    },
  });
};

export const useCompleteSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sprintService.complete,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.list(variables.orgSlug, variables.projectSlug),
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.detail(variables.orgSlug, variables.projectSlug, variables.sprintId),
      });
    },
  });
};

export const useDeleteSprint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sprintService.remove,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.sprints.list(variables.orgSlug, variables.projectSlug),
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: queryKeys.sprints.detail(variables.orgSlug, variables.projectSlug, variables.sprintId),
      });
    },
  });
};
