import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/services/api/project.service.js';
import { queryKeys } from '@/hooks/queryKeys.js';

export const useProjects = (orgSlug, filters = {}) => {
  return useQuery({
    queryKey: queryKeys.projects.list(orgSlug, filters),
    queryFn: () => projectService.list({ orgSlug, ...filters }),
    enabled: !!orgSlug,
  });
};

export const useProject = (orgSlug, projectSlug) => {
  return useQuery({
    queryKey: queryKeys.projects.detail(orgSlug, projectSlug),
    queryFn: () => projectService.getBySlug({ orgSlug, projectSlug }),
    enabled: !!orgSlug && !!projectSlug,
  });
};

export const useProjectMembers = (orgSlug, projectSlug) => {
  return useQuery({
    queryKey: queryKeys.projects.members(orgSlug, projectSlug),
    queryFn: () => projectService.listMembers({ orgSlug, projectSlug }),
    enabled: !!orgSlug && !!projectSlug,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.list(variables.orgSlug),
        exact: false,
      });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.updateBySlug,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.list(variables.orgSlug),
        exact: false,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(variables.orgSlug, variables.projectSlug),
      });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.deleteBySlug,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.list(variables.orgSlug),
        exact: false,
      });
      queryClient.removeQueries({
        queryKey: queryKeys.projects.detail(variables.orgSlug, variables.projectSlug),
      });
    },
  });
};

export const useAddProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.addMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.members(variables.orgSlug, variables.projectSlug),
      });
    },
  });
};

export const useUpdateProjectMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.updateMemberRole,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.members(variables.orgSlug, variables.projectSlug),
      });
    },
  });
};

export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: projectService.removeMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.members(variables.orgSlug, variables.projectSlug),
      });
    },
  });
};
