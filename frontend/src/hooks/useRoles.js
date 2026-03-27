import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { roleService } from '@/services/api/role.service.js';
import { queryKeys } from '@/hooks/queryKeys.js';

export const useRoles = (orgSlug) => {
  return useQuery({
    queryKey: queryKeys.roles.list(orgSlug),
    queryFn: () => roleService.list(orgSlug),
    enabled: !!orgSlug,
  });
};

export const useCreateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: roleService.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.list(variables.orgSlug) });
    },
  });
};

export const useUpdateRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: roleService.update,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.list(variables.orgSlug) });
    },
  });
};

export const useDeleteRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: roleService.remove,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.roles.list(variables.orgSlug) });
    },
  });
};
