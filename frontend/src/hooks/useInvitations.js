import { useMutation } from '@tanstack/react-query';
import { invitationService } from '@/services/api/invitation.service.js';

export const useAcceptInvitation = () => {
  return useMutation({
    mutationFn: invitationService.accept,
  });
};
