import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationService } from '@/services/api/organization.service.js';
import { queryKeys } from '@/hooks/queryKeys.js';
import { useAuth } from './useAuth.js';

export const useOrganizations = () => {
  const { user } = useAuth();

  return useQuery({
    // Add the user ID to the query key! 
    // This isolates the cache per user and forces a fresh fetch on login.
    queryKey: [...queryKeys.organizations.list, user?.id], 
    queryFn: organizationService.list,
    enabled: !!user,  
  });
};

export const useOrganization = (orgSlug) => {
  return useQuery({
    queryKey: queryKeys.organizations.detail(orgSlug),
    queryFn: () => organizationService.getBySlug(orgSlug),
    enabled: !!orgSlug,
  });
};

export const useOrganizationMembers = (orgSlug, filters = {}) => {
  return useQuery({
    queryKey: queryKeys.organizations.members(orgSlug, filters),
    queryFn: () => organizationService.listMembers({ orgSlug, ...filters }),
    enabled: !!orgSlug,
  });
};

export const useOrganizationInvitations = (orgSlug) => {
  return useQuery({
    queryKey: queryKeys.organizations.invitations(orgSlug),
    queryFn: () => organizationService.listInvitations(orgSlug),
    enabled: !!orgSlug,
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.list });
    },
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationService.updateBySlug,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.list });
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.detail(variables.orgSlug),
      });
    },
  });
};

export const useDeleteOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationService.deleteBySlug,
    onSuccess: (_, orgSlug) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations.list });
      queryClient.removeQueries({ queryKey: queryKeys.organizations.detail(orgSlug) });
    },
  });
};

export const useUpdateOrganizationMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationService.updateMemberRole,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.members(variables.orgSlug),
        exact: false,
      });
    },
  });
};

export const useRemoveOrganizationMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationService.removeMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.members(variables.orgSlug),
        exact: false,
      });
    },
  });
};

export const useSendOrganizationInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationService.sendInvitation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.invitations(variables.orgSlug),
      });
    },
  });
};

export const useResendOrganizationInvitation = () => {
  return useMutation({
    mutationFn: organizationService.resendInvitation,
  });
};

export const useRevokeOrganizationInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationService.revokeInvitation,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.organizations.invitations(variables.orgSlug),
      });
    },
  });
};
